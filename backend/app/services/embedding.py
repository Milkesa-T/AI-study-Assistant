"""Embedding generation service."""
from typing import List


class EmbeddingService:
    """Generates vector embeddings for text chunks and queries."""

    def __init__(self):
        pass

    def get_embedding(self, text: str) -> List[float]:
        """Generate embedding vector for a single string."""
        # TODO: Implement embedding generation (Gemini / OpenAI / FastEmbed)
        pass

    def get_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        """Generate embedding vectors for a batch of strings."""
        # TODO: Implement batch embedding generation
        pass
