"""ChromaDB Vector Store integration service.

ChromaDB stores our text chunks alongside their numerical embeddings.
When a user asks a question, ChromaDB compares the query vector with all stored vectors
using Cosine Distance to return the top-K most relevant study excerpts in milliseconds.
"""

import os
import logging
from typing import List, Dict, Any, Optional
import chromadb
from chromadb.config import Settings as ChromaSettings
from app.core.config import settings

logger = logging.getLogger(__name__)


class VectorStoreService:
    """Manages document chunk indexing, retrieval, and persistence with ChromaDB."""

    def __init__(self, persist_dir: Optional[str] = None, collection_name: Optional[str] = None):
        self.persist_dir = persist_dir or settings.CHROMA_PERSIST_DIR
        self.collection_name = collection_name or settings.COLLECTION_NAME

        # Ensure persist directory exists
        os.makedirs(self.persist_dir, exist_ok=True)

        # Initialize persistent ChromaDB client
        self.client = chromadb.PersistentClient(path=self.persist_dir)

        # Get or create the study documents collection
        self.collection = self.client.get_or_create_collection(
            name=self.collection_name,
            metadata={"hnsw:space": "cosine"}  # Use cosine similarity for text embeddings
        )
        logger.info(f"Initialized ChromaDB at '{self.persist_dir}' with collection '{self.collection_name}'.")

    def add_document_chunks(
        self,
        document_id: str,
        chunks: List[str],
        embeddings: List[List[float]],
        metadatas: Optional[List[Dict[str, Any]]] = None
    ) -> bool:
        """Store chunk vectors, text content, and metadata in ChromaDB.

        Args:
            document_id: Unique identifier for the parent document.
            chunks: List of plain text chunk strings.
            embeddings: List of embedding vectors corresponding to each chunk.
            metadatas: Additional metadata per chunk (filename, chunk_index, etc.).
        """
        if not chunks or not embeddings:
            return False

        ids = [f"{document_id}_chunk_{i}" for i in range(len(chunks))]

        # Ensure metadatas contain document_id and chunk_index
        formatted_metadatas = []
        for i in range(len(chunks)):
            meta = metadatas[i].copy() if metadatas and i < len(metadatas) else {}
            meta["document_id"] = document_id
            meta["chunk_index"] = i
            formatted_metadatas.append(meta)

        self.collection.add(
            ids=ids,
            embeddings=embeddings,
            documents=chunks,
            metadatas=formatted_metadatas
        )
        logger.info(f"Successfully added {len(chunks)} chunks for document '{document_id}' to ChromaDB.")
        return True

    def similarity_search(
        self,
        query_embedding: List[float],
        top_k: int = 4,
        filter_document_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Search ChromaDB for the most semantically relevant text chunks.

        Args:
            query_embedding: The vector of the user's search query.
            top_k: Number of most relevant context chunks to retrieve.
            filter_document_id: Optional document_id filter to scope search to a specific file.

        Returns:
            List of matching chunks with document text, score, and metadata.
        """
        where_filter = {"document_id": filter_document_id} if filter_document_id else None

        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            where=where_filter,
            include=["documents", "metadatas", "distances"]
        )

        matched_chunks: List[Dict[str, Any]] = []

        if results and results["documents"] and len(results["documents"]) > 0:
            docs = results["documents"][0]
            metas = results["metadatas"][0] if results["metadatas"] else [{}] * len(docs)
            distances = results["distances"][0] if results["distances"] else [0.0] * len(docs)

            for doc, meta, dist in zip(docs, metas, distances):
                # Convert cosine distance to a similarity score (0.0 to 1.0)
                # Cosine distance = 1 - cosine_similarity
                similarity_score = max(0.0, min(1.0, 1.0 - dist))
                matched_chunks.append({
                    "content": doc,
                    "document_id": meta.get("document_id", "unknown"),
                    "chunk_index": meta.get("chunk_index", 0),
                    "score": round(similarity_score, 4),
                    "metadata": meta
                })

        return matched_chunks

    def get_all_chunks_for_document(self, document_id: str) -> List[Dict[str, Any]]:
        """Retrieve all text chunks for a document (used for full-document flashcards/quiz generation)."""
        results = self.collection.get(
            where={"document_id": document_id},
            include=["documents", "metadatas"]
        )

        chunks = []
        if results and results["documents"]:
            for doc, meta in zip(results["documents"], results["metadatas"]):
                chunks.append({
                    "content": doc,
                    "metadata": meta
                })

        # Sort by chunk_index to keep original document order
        chunks.sort(key=lambda x: x["metadata"].get("chunk_index", 0))
        return chunks

    def delete_document(self, document_id: str) -> bool:
        """Remove all chunks associated with a document_id."""
        try:
            self.collection.delete(where={"document_id": document_id})
            logger.info(f"Deleted document '{document_id}' from ChromaDB.")
            return True
        except Exception as e:
            logger.error(f"Failed to delete document '{document_id}': {e}")
            return False
