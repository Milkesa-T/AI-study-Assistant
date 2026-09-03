from pydantic import BaseModel, Field
from typing import List, Optional


# Document Models
class DocumentMetadata(BaseModel):
    document_id: str
    filename: str
    file_type: str
    total_chunks: int
    created_at: Optional[str] = None


class DocumentUploadResponse(BaseModel):
    success: bool
    message: str
    metadata: DocumentMetadata


# Chat & RAG Models
class ChatMessage(BaseModel):
    role: str = Field(..., description="'user' or 'assistant'")
    content: str


class ChatRequest(BaseModel):
    query: str
    document_id: Optional[str] = None
    history: List[ChatMessage] = []
    top_k: int = 4


class SourceChunk(BaseModel):
    content: str
    document_id: str
    chunk_index: int
    score: Optional[float] = None


class ChatResponse(BaseModel):
    answer: str
    sources: List[SourceChunk] = []


# Flashcard Models
class Flashcard(BaseModel):
    front: str = Field(..., description="Concept / Question / Term")
    back: str = Field(..., description="Explanation / Answer / Definition")
    tag: Optional[str] = None


class FlashcardsResponse(BaseModel):
    document_id: Optional[str] = None
    flashcards: List[Flashcard]


# Quiz Models
class QuizOption(BaseModel):
    id: str
    text: str


class QuizQuestion(BaseModel):
    id: int
    question: str
    options: List[QuizOption]
    correct_option_id: str
    explanation: str


class QuizResponse(BaseModel):
    document_id: Optional[str] = None
    title: str
    questions: List[QuizQuestion]
