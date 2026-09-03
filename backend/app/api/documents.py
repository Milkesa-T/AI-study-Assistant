from fastapi import APIRouter, UploadFile, File, HTTPException
from app.models.schemas import DocumentUploadResponse

router = APIRouter()


@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(file: UploadFile = File(...)):
    """Upload and process a study document (PDF / TXT / MD)."""
    # TODO: Save file, extract text, chunk, embed, and store in ChromaDB
    return {
        "success": True,
        "message": f"File {file.filename} received",
        "metadata": {
            "document_id": "temp-id",
            "filename": file.filename or "unknown",
            "file_type": file.content_type or "unknown",
            "total_chunks": 0
        }
    }
