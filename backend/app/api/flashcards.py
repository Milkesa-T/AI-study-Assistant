from fastapi import APIRouter
from app.models.schemas import FlashcardsResponse

router = APIRouter()


@router.post("/generate", response_model=FlashcardsResponse)
async def generate_flashcards(document_id: str, count: int = 5):
    """Generate study flashcards from a processed document."""
    # TODO: Fetch document context and generate flashcards using LLM
    return {
        "document_id": document_id,
        "flashcards": []
    }
