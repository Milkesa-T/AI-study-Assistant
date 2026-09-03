# 🎓 AI Study Assistant

An intelligent study companion powered by **FastAPI**, **ChromaDB**, and **Next.js**. Upload your study materials (PDFs, notes, markdown), ask questions with context-aware RAG, generate interactive flashcards, and take customized practice quizzes.

---

## 🏗️ Project Architecture

```
AI-study-Assistant/
├── backend/                        # FastAPI Backend
│   ├── app/
│   │   ├── api/                    # Route handlers (documents, chat, flashcards, quiz)
│   │   ├── core/                   # App configurations & prompts
│   │   ├── services/               # Vector store, document parser, embedding, LLM
│   │   ├── models/                 # Pydantic schemas
│   │   └── main.py                 # FastAPI entry point
│   ├── data/
│   │   ├── chroma_db/              # Persistent ChromaDB vector data
│   │   └── uploads/                # Uploaded documents
│   ├── requirements.txt            # Python dependencies
│   └── .env.example                # Backend environment template
│
└── frontend/                       # Next.js Frontend
    ├── src/
    │   ├── app/                    # Next.js App Router pages
    │   ├── components/             # Reusable UI components
    │   ├── lib/                    # API client & helpers
    │   └── types/                  # TypeScript interfaces
    └── .env.local.example          # Frontend environment template
```

---

## 🚀 Tech Stack

- **Backend**: Python 3.10+, FastAPI, Uvicorn, Pydantic
- **Vector Database**: ChromaDB
- **Embeddings & LLM**: Google Gemini / OpenAI
- **Frontend**: Next.js (App Router), TypeScript, React
- **Document Parsing**: PyPDF, python-multipart

---

## 🛠️ Getting Started

### 1. Backend Setup
```bash
cd backend
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
