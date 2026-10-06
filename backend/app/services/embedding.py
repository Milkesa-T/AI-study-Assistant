"""Embedding generation service.

This module converts text chunks and user queries into numerical vector representations.
Semantic similarity between vectors (via cosine distance) enables ChromaDB to find the most
relevant parts of a study document when answering a user question.
"""

import logging
from typing import List
from app.core.config import settings

logger = logging.getLogger(__name__)

# Try importing google.generativeai
try:
    import google.generativeai as genai
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False


class EmbeddingService:
    """Generates vector embeddings for text chunks and queries."""

    def __init__(self, model_name: str = "models/text-embedding-004"):
        self.model_name = model_name
        self.api_key = settings.GEMINI_API_KEY
        self.is_gemini_configured = False

        if GENAI_AVAILABLE and self.api_key and self.api_key != "your_gemini_api_key_here":
            try:
                genai.configure(api_key=self.api_key)
                self.is_gemini_configured = True
                logger.info("Configured Google Gemini Embedding Service.")
            except Exception as e:
                logger.warning(f"Failed to configure Gemini Embeddings: {e}")
        else:
            logger.info("Gemini API key not provided or placeholder. Using fallback local embeddings.")

    def get_embedding(self, text: str, task_type: str = "retrieval_document") -> List[float]:
        """Generate embedding vector for a single text string.

        Args:
            text: The text content to embed.
            task_type: 'retrieval_document' (for document chunks) or 'retrieval_query' (for user search queries).
        """
        if not text or not text.strip():
            return [0.0] * 768

        if self.is_gemini_configured:
            try:
                result = genai.embed_content(
                    model=self.model_name,
                    content=text,
                    task_type=task_type
                )
                return result["embedding"]
            except Exception as e:
                logger.error(f"Gemini embedding generation failed: {e}. Using fallback.")
                return self._fallback_embedding(text)
        else:
            return self._fallback_embedding(text)

    def get_embeddings_batch(self, texts: List[str], task_type: str = "retrieval_document") -> List[List[float]]:
        """Generate embedding vectors for a list of text strings in batch."""
        if not texts:
            return []

        if self.is_gemini_configured:
            try:
                result = genai.embed_content(
                    model=self.model_name,
                    content=texts,
                    task_type=task_type
                )
                return result["embedding"]
            except Exception as e:
                logger.error(f"Gemini batch embedding generation failed: {e}. Using fallback.")
                return [self._fallback_embedding(t) for t in texts]
        else:
            return [self._fallback_embedding(t) for t in texts]

    def _fallback_embedding(self, text: str, dimension: int = 768) -> List[float]:
        """Deterministic hashing-based fallback vector when no external API key is present.
        Ensures local testing and development workflows never crash.
        """
        import hashlib
        vector = []
        for i in range(dimension):
            # Generate deterministic pseudo-random float between -1.0 and 1.0 based on text hash
            h = hashlib.sha256(f"{text}_{i}".encode("utf-8")).hexdigest()
            val = (int(h[:8], 16) / 0xFFFFFFFF) * 2.0 - 1.0
            vector.append(val)

        # Normalize vector to unit length
        norm = sum(x * x for x in vector) ** 0.5
        return [x / norm for x in vector] if norm > 0 else vector
