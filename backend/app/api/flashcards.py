from fastapi import APIRouter, HTTPException
from app.models.schemas import FlashcardsResponse, Flashcard
from app.services.vector_store import VectorStoreService
from app.services.llm import LLMService

router = APIRouter()

vector_store_service = VectorStoreService()
llm_service = LLMService()


@router.post("/generate", response_model=FlashcardsResponse)
async def generate_flashcards(document_id: str, count: int = 5):
    """Generate study flashcards from an uploaded document's indexed content."""
    chunks = vector_store_service.get_all_chunks_for_document(document_id)
    if not chunks:
        raise HTTPException(
            status_code=404,
            detail=f"No content found for document '{document_id}'. Please upload and index a document first."
        )

    # Combine first few chunks up to 4000 characters for flashcard generation
    full_text = "\n\n".join([c["content"] for c in chunks])

    cards_data = await llm_service.generate_flashcards(context_text=full_text, count=count)

    flashcards = [
        Flashcard(
            front=card.get("front", "Question"),
            back=card.get("back", "Answer"),
            tag=card.get("tag", "General")
        )
        for card in cards_data
    ]

    return FlashcardsResponse(
        document_id=document_id,
        flashcards=flashcards
    )
