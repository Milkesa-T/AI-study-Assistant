from fastapi import APIRouter, HTTPException
from app.models.schemas import ChatRequest, ChatResponse, SourceChunk
from app.services.embedding import EmbeddingService
from app.services.vector_store import VectorStoreService
from app.services.llm import LLMService

router = APIRouter()

embedding_service = EmbeddingService()
vector_store_service = VectorStoreService()
llm_service = LLMService()


@router.post("/", response_model=ChatResponse)
async def chat_with_study_materials(request: ChatRequest):
    """Ask a question and receive a context-aware answer from your study materials (RAG Pipeline).

    Pipeline:
    1. Embed the user's query into vector space.
    2. Query ChromaDB to find the top-K semantically closest chunks.
    3. Pass the chunks as grounding context to the LLM.
    4. Return the generated answer along with cited sources.
    """
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    # Step 1: Embed Query
    query_embedding = embedding_service.get_embedding(
        request.query,
        task_type="retrieval_query"
    )

    # Step 2: Retrieve Top-K relevant chunks from ChromaDB
    matched_chunks = vector_store_service.similarity_search(
        query_embedding=query_embedding,
        top_k=request.top_k,
        filter_document_id=request.document_id
    )

    context_texts = [c["content"] for c in matched_chunks]

    # Step 3: Call LLM with RAG Context
    history_dicts = [{"role": m.role, "content": m.content} for m in request.history]
    answer = await llm_service.answer_study_query(
        query=request.query,
        context_chunks=context_texts,
        history=history_dicts
    )

    # Step 4: Format Sources
    sources = [
        SourceChunk(
            content=c["content"],
            document_id=c["document_id"],
            chunk_index=c["chunk_index"],
            score=c.get("score")
        )
        for c in matched_chunks
    ]

    return ChatResponse(
        answer=answer,
        sources=sources
    )
