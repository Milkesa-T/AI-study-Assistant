"""LLM Client for Q&A, Flashcards, and Quiz Generation.

This service coordinates:
1. RAG Query Answering: Combining user questions with retrieved context chunks.
2. Structured Flashcard Generation: Producing JSON-formatted Q&A study cards.
3. Quiz Generation: Producing JSON-formatted multiple-choice questions with answer keys & explanations.
"""

import json
import logging
import re
from typing import List, Dict, Any, Optional
from app.core.config import settings
from app.core.prompts import RAG_SYSTEM_PROMPT, FLASHCARD_SYSTEM_PROMPT, QUIZ_SYSTEM_PROMPT

logger = logging.getLogger(__name__)

try:
    import google.generativeai as genai
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False


class LLMService:
    """Manages prompting and inference with Google Gemini."""

    def __init__(self, model_name: str = "gemini-1.5-flash"):
        self.model_name = model_name
        self.api_key = settings.GEMINI_API_KEY
        self.is_gemini_configured = False

        if GENAI_AVAILABLE and self.api_key and self.api_key != "your_gemini_api_key_here":
            try:
                genai.configure(api_key=self.api_key)
                self.model = genai.GenerativeModel(
                    model_name=self.model_name,
                    system_instruction=RAG_SYSTEM_PROMPT
                )
                self.json_model = genai.GenerativeModel(
                    model_name=self.model_name,
                    generation_config={"response_mime_type": "application/json"}
                )
                self.is_gemini_configured = True
                logger.info(f"Initialized LLMService with model '{self.model_name}'.")
            except Exception as e:
                logger.warning(f"Failed to initialize Gemini GenerativeModel: {e}")
        else:
            logger.info("Gemini API key not found. Using fallback mock responses.")

    async def answer_study_query(
        self,
        query: str,
        context_chunks: List[str],
        history: Optional[List[Dict[str, str]]] = None
    ) -> str:
        """Generate a grounded study answer using retrieved RAG context chunks."""
        # Assemble context string
        context_block = "\n\n---\n\n".join(context_chunks) if context_chunks else "No relevant documents found."

        prompt = f"""Use the following study materials context to answer the student's question accurately.
If the answer cannot be found in the context, say so clearly and provide a helpful general answer.

--- STUDY MATERIAL CONTEXT ---
{context_block}
------------------------------

Student Question: {query}
"""
        if self.is_gemini_configured:
            try:
                response = self.model.generate_content(prompt)
                return response.text
            except Exception as e:
                logger.error(f"Gemini generation error: {e}")
                return f"Error communicating with AI model: {e}"
        else:
            return (
                f"**[Demo / Fallback Mode]**\n\n"
                f"I received your question: *'{query}'*.\n\n"
                f"Found **{len(context_chunks)}** relevant study excerpts in your uploaded documents. "
                f"To enable full AI generation with Gemini, please set `GEMINI_API_KEY` in `backend/.env`."
            )

    async def generate_flashcards(self, context_text: str, count: int = 5) -> List[Dict[str, str]]:
        """Generate structured flashcards from study text."""
        prompt = f"""{FLASHCARD_SYSTEM_PROMPT}

Create {count} high-yield study flashcards from the text below.
Format your output as a JSON array of objects with keys 'front' (question/term), 'back' (answer/definition), and 'tag' (topic).

Example JSON:
[
  {{"front": "What is Mitochondria?", "back": "The powerhouse of the cell responsible for generating ATP.", "tag": "Biology"}}
]

Study Text:
{context_text[:4000]}
"""
        if self.is_gemini_configured:
            try:
                response = self.json_model.generate_content(prompt)
                cards = json.loads(response.text)
                return cards if isinstance(cards, list) else []
            except Exception as e:
                logger.error(f"Flashcard generation failed: {e}")
                return self._fallback_flashcards()
        else:
            return self._fallback_flashcards()

    async def generate_quiz(self, context_text: str, num_questions: int = 5) -> Dict[str, Any]:
        """Generate multiple-choice quiz questions with explanations."""
        prompt = f"""{QUIZ_SYSTEM_PROMPT}

Create a {num_questions}-question multiple-choice practice quiz based on the study text below.
Format your output as a JSON object with keys:
- 'title': String title for the quiz
- 'questions': Array of objects with 'id' (int), 'question' (str), 'options' (array of {{'id': 'A'|'B'|'C'|'D', 'text': str}}), 'correct_option_id' ('A'|'B'|'C'|'D'), and 'explanation' (str).

Study Text:
{context_text[:4000]}
"""
        if self.is_gemini_configured:
            try:
                response = self.json_model.generate_content(prompt)
                quiz_data = json.loads(response.text)
                return quiz_data
            except Exception as e:
                logger.error(f"Quiz generation failed: {e}")
                return self._fallback_quiz()
        else:
            return self._fallback_quiz()

    def _fallback_flashcards(self) -> List[Dict[str, str]]:
        return [
            {
                "front": "What is Retrieval-Augmented Generation (RAG)?",
                "back": "A technique that enhances LLMs by retrieving relevant facts from an external knowledge base (like ChromaDB) before generating an answer.",
                "tag": "AI Architecture"
            },
            {
                "front": "What is an Embedding Vector?",
                "back": "A numerical array representing the semantic meaning of text in a high-dimensional space.",
                "tag": "Machine Learning"
            }
        ]

    def _fallback_quiz(self) -> Dict[str, Any]:
        return {
            "title": "Sample AI Study Quiz",
            "questions": [
                {
                    "id": 1,
                    "question": "What is the primary role of ChromaDB in our architecture?",
                    "options": [
                        {"id": "A", "text": "Rendering frontend UI components"},
                        {"id": "B", "text": "Storing and querying semantic vector embeddings"},
                        {"id": "C", "text": "Compiling Python into JavaScript"},
                        {"id": "D", "text": "Managing user authentication passwords"}
                    ],
                    "correct_option_id": "B",
                    "explanation": "ChromaDB is a vector database used to store document chunk embeddings and run fast cosine similarity searches."
                }
            ]
        }
