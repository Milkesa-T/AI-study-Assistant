import os
import uuid
import shutil
from datetime import datetime
from typing import List
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.core.config import settings
from app.models.schemas import DocumentUploadResponse, DocumentMetadata
from app.services.document_parser import DocumentParser
from app.services.embedding import EmbeddingService
from app.services.vector_store import VectorStoreService

router = APIRouter()

# Instantiate services
embedding_service = EmbeddingService()
vector_store_service = VectorStoreService()


@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(file: UploadFile = File(...)):
    """Upload and index a study document (PDF, TXT, MD).

    Workflow:
    1. Validate file extension and size.
    2. Save raw file to uploads directory.
    3. Extract text content page-by-page.
    4. Chunk text with overlapping sliding window.
    5. Generate vector embeddings for all chunks.
    6. Persist vectors and metadata in ChromaDB.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    # Validate file extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".pdf", ".txt", ".md"]:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Allowed types: .pdf, .txt, .md"
        )

    # Generate a unique document_id
    doc_id = str(uuid.uuid4())
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    saved_filename = f"{doc_id}_{file.filename}"
    saved_filepath = os.path.join(settings.UPLOAD_DIR, saved_filename)

    # Save file to disk
    try:
        with open(saved_filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {e}")

    # Extract text
    try:
        extracted_text = DocumentParser.extract_text(saved_filepath)
        if not extracted_text.strip():
            raise HTTPException(status_code=400, detail="Uploaded document contains no readable text.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Text extraction failed: {e}")

    # Chunk text
    chunk_dicts = DocumentParser.chunk_text(extracted_text, chunk_size=500, chunk_overlap=100)
    chunk_texts = [c["text"] for c in chunk_dicts]

    # Generate embeddings
    embeddings = embedding_service.get_embeddings_batch(chunk_texts, task_type="retrieval_document")

    # Store in ChromaDB
    metadatas = [
        {
            "filename": file.filename,
            "file_type": ext,
            "created_at": datetime.utcnow().isoformat()
        }
        for _ in chunk_texts
    ]
    vector_store_service.add_document_chunks(
        document_id=doc_id,
        chunks=chunk_texts,
        embeddings=embeddings,
        metadatas=metadatas
    )

    return {
        "success": True,
        "message": f"Successfully processed '{file.filename}' into {len(chunk_texts)} searchable chunks.",
        "metadata": {
            "document_id": doc_id,
            "filename": file.filename,
            "file_type": ext,
            "total_chunks": len(chunk_texts),
            "created_at": datetime.utcnow().isoformat()
        }
    }


@router.delete("/{document_id}")
async def delete_document(document_id: str):
    """Delete a document and all its indexed chunks from ChromaDB."""
    success = vector_store_service.delete_document(document_id)
    if not success:
        raise HTTPException(status_code=404, detail="Document not found or could not be deleted")
    return {"success": True, "message": f"Document '{document_id}' deleted successfully"}
