# AI Study Assistant Web App

A full-stack, responsive AI Study Assistant web application built with **FastAPI**, **ChromaDB**, **React (Vite)**, and **Tailwind CSS**. Users can upload lecture notes/PDFs and generate mock tests with instant feedback, produce condensed one-shot revision sheets, and ask grounded questions (RAG) with exact document and page citations.

Designed to faithfully mirror the **Manas IT ERP** design system with a dark navy sidebar (`#0f172a`), royal blue primary accents (`#2563eb`), slate light-gray canvas (`#f8fafc`), colored left-bordered stat cards, and an Instagram-style bottom tab bar for mobile devices.

---

## Key Features

1. **Document Management & PDF Ingestion**:
   - Drag-and-drop & file picker PDF upload.
   - Text extraction page-by-page using `pypdf`.
   - Semantic chunking with overlap and metadata indexing into **ChromaDB**.
   - Original PDF download & file management.

2. **Interactive Mock Test Generator**:
   - Select document, focus topic, and question count (3, 5, 10, 15).
   - Generates structured MCQs with 4 options and explanations.
   - Interactive quiz UI: select answers, receive immediate right/wrong visual feedback, and view grounded explanations.
   - Final score celebration with confetti (`canvas-confetti`), accuracy calculation, and comprehensive question review mode.
   - Global statistics tracking (Tests Taken, Average Score).

3. **One-Shot Revision Sheets**:
   - Select document and chapter/topic to synthesize a condensed revision sheet.
   - Scannable three-part layout:
     - **Key Definitions & Terminology**: Essential vocabulary with clear definitions.
     - **Core Principles & Takeaways**: High-yield bullet points.
     - **Exam-Style Practice Q&As**: Practical model questions and concise answers.
   - **Download as PDF / Print**: One-click formatted print/PDF export for offline revision.
   - **Copy Markdown**: One-click clipboard copy.

4. **Grounded Question & Answer (RAG Chat)**:
   - Grounded conversational assistant based strictly on uploaded materials.
   - Interactive **RAG Source Citation Cards**: displays source document name, page number, and clickable text snippet previews.
   - Search across all uploaded documents or filter to a single document.
   - Session history preservation with quick-starter suggestions.

5. **Multi-Tier Resilient LLM Engine**:
   - **Local Open-Source (Ollama)**: `llama3.1:latest`, `mistral:7b`, with `nomic-embed-text`.
   - **Cloud Fallback (Groq)**: Free tier, high speed (`llama-3.1-8b-instant`, `llama-3.3-70b-versatile`, `mixtral-8x7b-32768`).
   - **Local Heuristic Engine**: Built-in offline fallback that extracts definitions, questions, and grounded answers directly from ChromaDB chunks so the app works immediately out-of-the-box.
   - Live **Settings & Diagnostic Modal** in the UI to toggle providers and test connectivity.

---

## Tech Stack

- **Backend:** FastAPI (Python 3.11), Uvicorn, Pydantic v2, PyPDF, HTTPX
- **Vector DB & Embeddings:** ChromaDB (`all-MiniLM-L6-v2` local fallback + Ollama `nomic-embed-text`)
- **Frontend:** React 18, Vite, Tailwind CSS, Lucide Icons, Canvas Confetti
- **Deployment Ready:** Render / Railway (Backend), Vercel / Netlify (Frontend)

---

## Project Structure

```
ai-study-assistant/
├── backend/
│   ├── app/
│   │   ├── config.py             # App & provider configuration
│   │   ├── main.py               # FastAPI endpoints
│   │   ├── models/
│   │   │   └── schemas.py        # Pydantic data schemas
│   │   ├── services/
│   │   │   ├── pdf_service.py    # PDF text & page extraction
│   │   │   ├── vector_service.py # ChromaDB & chunking
│   │   │   ├── llm_service.py    # Ollama -> Groq -> Local fallback
│   │   │   ├── quiz_service.py   # MCQ generation & validation
│   │   │   ├── revision_service.py # Revision sheet generation
│   │   │   └── rag_service.py    # RAG retrieval & citations
│   │   └── data/                 # ChromaDB vectors & file storage
│   ├── sample_docs/              # Sample generated study PDFs
│   ├── test_backend.py           # Comprehensive integration test suite
│   ├── create_sample_pdf.py      # Sample PDF generator
│   ├── requirements.txt
│   └── run.py                    # Server startup script
├── frontend/
│   ├── src/
│   │   ├── App.jsx               # Main responsive app layout & router
│   │   ├── api.js                # REST client
│   │   ├── index.css             # ERP design system styling
│   │   ├── components/
│   │   │   ├── Sidebar.jsx       # Fixed desktop dark navy sidebar
│   │   │   ├── Topbar.jsx        # Sticky topbar with date & status
│   │   │   ├── MobileNav.jsx     # Instagram-style bottom tab bar
│   │   │   ├── StatCard.jsx      # ERP left-border metric cards
│   │   │   ├── DocumentUpload.jsx # Drag-and-drop PDF dropzone
│   │   │   ├── DocumentList.jsx  # Clean table with PDF download
│   │   │   ├── MockTestView.jsx  # Quiz engine & review
│   │   │   ├── RevisionView.jsx  # Revision sheet & PDF export
│   │   │   ├── QAChatView.jsx    # RAG chat with citations
│   │   │   └── SettingsModal.jsx # LLM configuration
│   │   └── utils/
│   │       └── pdfExport.js      # Print-to-PDF utility
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
└── README.md
```

---

## Running the Application

### 1. Start the Backend

```bash
cd backend
python -m pip install -r requirements.txt
python run.py
```
Backend API will be live at: `http://127.0.0.1:8000` (API documentation at `http://127.0.0.1:8000/docs`).

### 2. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```
Frontend web application will be live at: `http://localhost:5173`.

### 3. LLM Configuration (Optional)
- By default, the application runs with the **Local Heuristic Engine** out-of-the-box.
- To use local Ollama:
  1. Install Ollama: `ollama run llama3.1` and `ollama pull nomic-embed-text`.
  2. The app will automatically connect to `http://localhost:11434`.
- To use Groq:
  1. Open **LLM & Settings** in the app.
  2. Paste your free Groq API key (`gsk_...`) and click **Save Settings**.
