from fastapi import APIRouter
from app.models.schemas import ChatRequest, ChatResponse

router = APIRouter()


@router.post("/", response_model=ChatResponse)
async def chat_with_study_materials(request: ChatRequest):
    """Ask a question and receive a context-aware answer from your study materials."""
    # TODO: Embed query, search ChromaDB, construct prompt, call LLM
    return {
        "answer": f"Echo: received query '{request.query}'. Backend under construction.",
        "sources": []
    }
