"""API routers package."""
from fastapi import APIRouter
from app.api.documents import router as documents_router
from app.api.chat import router as chat_router
from app.api.flashcards import router as flashcards_router
from app.api.quiz import router as quiz_router

api_router = APIRouter()

api_router.include_router(documents_router, prefix="/documents", tags=["Documents"])
api_router.include_router(chat_router, prefix="/chat", tags=["Chat & RAG"])
api_router.include_router(flashcards_router, prefix="/flashcards", tags=["Flashcards"])
api_router.include_router(quiz_router, prefix="/quiz", tags=["Quiz"])
