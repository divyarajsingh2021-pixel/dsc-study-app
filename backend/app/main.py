import os
import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, UploadFile, File, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from app.config import settings, UPLOADS_DIR
from app.models.schemas import (
    DocumentInfo, DocumentListResponse, StatsResponse,
    GenerateQuizRequest, QuizResponse, SubmitQuizRequest,
    GenerateRevisionRequest, RevisionResponse,
    ChatRequest, ChatResponse,
    SettingsUpdateRequest, HealthResponse,
    LoginRequest, LoginResponse, ChangePasswordRequest,
    ForgotPasswordRequest, RegisterUserRequest, UserItem, AdminResetPasswordRequest
)
from app.services.pdf_service import pdf_service
from app.services.vector_service import vector_service
from app.services.llm_service import llm_service
from app.services.rag_service import rag_service
from app.services.quiz_service import quiz_service
from app.services.revision_service import revision_service
from app.services.auth_service import auth_service

app = FastAPI(
    title="AI Study Assistant API",
    description="FastAPI backend for RAG study assistant, mock test generation, and one-shot revision",
    version="1.0.0"
)

# Enable CORS for frontend Vite dev server and production URLs
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
@app.head("/")
async def root():
    return {"status": "online", "name": "DSC AI Backend", "version": "1.0.0"}

@app.get("/api/health", response_model=HealthResponse)
async def get_health():
    provider_status = await llm_service.check_provider_status()
    docs = vector_service.get_all_documents()
    return HealthResponse(
        status="healthy",
        ollama_connected=provider_status["ollama_connected"],
        ollama_model_available=provider_status["ollama_model_available"],
        groq_configured=provider_status["groq_configured"],
        active_provider=provider_status["active_provider"],
        document_count=len(docs)
    )

@app.get("/api/stats", response_model=StatsResponse)
async def get_stats():
    return vector_service.get_stats()

@app.post("/api/settings")
async def update_settings(req: SettingsUpdateRequest):
    if req.ollama_base_url is not None:
        settings.ollama_base_url = req.ollama_base_url
    if req.ollama_model is not None:
        settings.ollama_model = req.ollama_model
    if req.ollama_embed_model is not None:
        settings.ollama_embed_model = req.ollama_embed_model
    if req.groq_api_key is not None:
        settings.groq_api_key = req.groq_api_key
    if req.groq_model is not None:
        settings.groq_model = req.groq_model
    if req.preferred_provider is not None:
        settings.preferred_provider = req.preferred_provider
        
    status_info = await llm_service.check_provider_status()
    return {"message": "Settings updated successfully", "status": status_info}

# ----------------- DOCUMENT MANAGEMENT -----------------

@app.get("/api/documents", response_model=DocumentListResponse)
async def list_documents():
    docs_data = vector_service.get_all_documents()
    docs = [DocumentInfo(**d) for d in docs_data]
    return DocumentListResponse(documents=docs, total_count=len(docs))

@app.post("/api/upload", response_model=DocumentInfo)
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files (.pdf) are supported."
        )

    doc_id = str(uuid.uuid4())[:12]
    safe_filename = file.filename.replace(" ", "_")
    target_path = UPLOADS_DIR / f"{doc_id}_{safe_filename}"

    try:
        # Save file to disk
        contents = await file.read()
        with open(target_path, "wb") as f:
            f.write(contents)

        # Parse pages & text
        pages_data = pdf_service.extract_text_and_pages(target_path)
        meta = pdf_service.get_document_meta(target_path)
        upload_date = datetime.now().strftime("%b %d, %Y %I:%M %p")

        if not pages_data:
            pages_data = [{"page": 1, "text": f"Document: {file.filename}"}]

        # Store in ChromaDB
        chunk_count = await vector_service.add_document(
            doc_id=doc_id,
            filename=file.filename,
            pages_data=pages_data,
            meta={
                "upload_date": upload_date,
                "file_size": meta["file_size"],
                "page_count": meta["page_count"],
                "summary": f"{meta['page_count']} pages parsed"
            }
        )

        return DocumentInfo(
            id=doc_id,
            filename=file.filename,
            upload_date=upload_date,
            file_size=meta["file_size"],
            page_count=meta["page_count"],
            chunk_count=chunk_count,
            summary=f"Successfully indexed {chunk_count} chunks across {meta['page_count']} pages."
        )

    except Exception as e:
        if target_path.exists():
            target_path.unlink(missing_ok=True)
        raise HTTPException(status_code=500, detail=f"Failed to process PDF: {str(e)}")

@app.get("/api/documents/{doc_id}/download")
async def download_document(doc_id: str):
    doc_meta = vector_service.get_document_by_id(doc_id)
    if not doc_meta:
        raise HTTPException(status_code=404, detail="Document not found")

    # Locate file in uploads dir
    for f in UPLOADS_DIR.glob(f"{doc_id}_*"):
        if f.is_file():
            return FileResponse(
                path=str(f),
                filename=doc_meta["filename"],
                media_type="application/pdf"
            )

    raise HTTPException(status_code=404, detail="Original PDF file is missing on server")

@app.delete("/api/documents/{doc_id}")
async def delete_document(doc_id: str):
    doc_meta = vector_service.get_document_by_id(doc_id)
    if not doc_meta:
        raise HTTPException(status_code=404, detail="Document not found")

    # Remove physical file
    for f in UPLOADS_DIR.glob(f"{doc_id}_*"):
        try:
            f.unlink(missing_ok=True)
        except Exception:
            pass

    # Remove from Chroma & metadata
    vector_service.delete_document(doc_id)
    return {"message": "Document deleted successfully", "document_id": doc_id}

# ----------------- MOCK TEST GENERATOR -----------------

@app.post("/api/quiz/generate", response_model=QuizResponse)
async def generate_mock_test(req: GenerateQuizRequest):
    doc = vector_service.get_document_by_id(req.document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Selected document not found")

    quiz = await quiz_service.generate_quiz(
        document_id=req.document_id,
        topic=req.topic,
        num_questions=req.num_questions
    )
    return quiz

@app.post("/api/quiz/submit")
async def submit_quiz(req: SubmitQuizRequest):
    vector_service.record_test_result(
        score=req.score,
        total_questions=req.total_questions
    )
    return {
        "message": "Quiz result recorded successfully",
        "score": req.score,
        "total": req.total_questions,
        "percentage": round((req.score / max(1, req.total_questions)) * 100, 1)
    }

# ----------------- ONE-SHOT REVISION -----------------

@app.post("/api/revision/generate", response_model=RevisionResponse)
async def generate_revision(req: GenerateRevisionRequest):
    doc = vector_service.get_document_by_id(req.document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Selected document not found")

    sheet = await revision_service.generate_revision_sheet(
        document_id=req.document_id,
        topic=req.topic
    )
    return sheet

# ----------------- GROUNDED RAG CHAT -----------------

@app.post("/api/chat", response_model=ChatResponse)
async def rag_chat(req: ChatRequest):
    response = await rag_service.answer_question(
        question=req.question,
        document_id=req.document_id,
        history=req.history
    )
    return response

# ----------------- AUTHENTICATION & ACCOUNT -----------------

@app.post("/api/auth/login", response_model=LoginResponse)
async def login(req: LoginRequest):
    user = auth_service.authenticate_user(req.username, req.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password. Please check your credentials."
        )
    return LoginResponse(**user)

@app.post("/api/auth/change-password")
async def change_password(req: ChangePasswordRequest):
    try:
        auth_service.change_password(req.username, req.current_password, req.new_password)
        return {"message": "Password changed successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/auth/forgot-password")
async def forgot_password(req: ForgotPasswordRequest):
    try:
        auth_service.forgot_password_recovery(req.username, req.recovery_input, req.new_password)
        return {"message": "Password has been successfully reset. You can now log in with your new password."}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/auth/register", response_model=UserItem)
async def register_account(req: RegisterUserRequest):
    try:
        new_u = auth_service.register_user(
            username=req.username,
            password=req.password,
            name=req.name,
            email=req.email,
            role=req.role,
            recovery_code=req.recovery_code
        )
        return UserItem(**new_u)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/auth/users")
async def list_users(requester: str = ""):
    users_data = auth_service.get_all_users()
    is_admin = requester.strip().lower() == "admin"
    result = []
    for u in users_data:
        item = {
            "id": u["id"],
            "username": u["username"],
            "name": u["name"],
            "role": u["role"],
            "email": u["email"],
            "created_at": u.get("created_at", "2026"),
            "recovery_code": u.get("recovery_code") if is_admin else None
        }
        result.append(item)
    return result

@app.delete("/api/auth/users/{username}")
async def delete_user(username: str, requester: str = ""):
    if requester.strip().lower() != "admin":
        raise HTTPException(status_code=403, detail="Only admin can delete accounts")
    try:
        auth_service.delete_user(username)
        return {"message": f"Account '{username}' deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/auth/admin-reset-password")
async def admin_reset_password(req: AdminResetPasswordRequest, requester: str = ""):
    if requester.strip().lower() != "admin":
        raise HTTPException(status_code=403, detail="Only admin can reset passwords")
    try:
        auth_service.admin_reset_password(req.target_username, req.new_password)
        return {"message": f"Password for '{req.target_username}' has been reset successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
