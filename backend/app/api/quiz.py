from fastapi import APIRouter
from app.models.schemas import QuizResponse

router = APIRouter()


@router.post("/generate", response_model=QuizResponse)
async def generate_quiz(document_id: str, num_questions: int = 5):
    """Generate a multiple-choice practice quiz from a processed document."""
    # TODO: Fetch document context and generate quiz using LLM
    return {
        "document_id": document_id,
        "title": "Practice Quiz",
        "questions": []
    }
