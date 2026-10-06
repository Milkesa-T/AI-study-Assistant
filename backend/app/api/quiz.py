from fastapi import APIRouter, HTTPException
from app.models.schemas import QuizResponse, QuizQuestion, QuizOption
from app.services.vector_store import VectorStoreService
from app.services.llm import LLMService

router = APIRouter()

vector_store_service = VectorStoreService()
llm_service = LLMService()


@router.post("/generate", response_model=QuizResponse)
async def generate_quiz(document_id: str, num_questions: int = 5):
    """Generate a multiple-choice practice quiz from an uploaded document's indexed content."""
    chunks = vector_store_service.get_all_chunks_for_document(document_id)
    if not chunks:
        raise HTTPException(
            status_code=404,
            detail=f"No content found for document '{document_id}'. Please upload and index a document first."
        )

    # Combine text
    full_text = "\n\n".join([c["content"] for c in chunks])

    quiz_data = await llm_service.generate_quiz(context_text=full_text, num_questions=num_questions)

    questions = []
    for q in quiz_data.get("questions", []):
        options = [
            QuizOption(id=opt["id"], text=opt["text"])
            for opt in q.get("options", [])
        ]
        questions.append(
            QuizQuestion(
                id=q.get("id", 1),
                question=q.get("question", ""),
                options=options,
                correct_option_id=q.get("correct_option_id", "A"),
                explanation=q.get("explanation", "")
            )
        )

    return QuizResponse(
        document_id=document_id,
        title=quiz_data.get("title", "Study Quiz"),
        questions=questions
    )
