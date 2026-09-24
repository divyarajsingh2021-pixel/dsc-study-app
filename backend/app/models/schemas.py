from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class DocumentInfo(BaseModel):
    id: str
    filename: str
    upload_date: str
    file_size: int
    page_count: int
    chunk_count: int
    summary: Optional[str] = ""

class DocumentListResponse(BaseModel):
    documents: List[DocumentInfo]
    total_count: int

class StatsResponse(BaseModel):
    documents_uploaded: int
    tests_taken: int
    avg_score: float
    topics_revised: int

class QuestionOption(BaseModel):
    id: str  # "A", "B", "C", "D"
    text: str

class QuizQuestion(BaseModel):
    id: int
    question: str
    options: List[str]
    correct_answer: int  # 0, 1, 2, 3
    explanation: str
    source_snippet: Optional[str] = None

class GenerateQuizRequest(BaseModel):
    document_id: str
    topic: Optional[str] = None
    num_questions: int = Field(default=5, ge=1, le=20)

class QuizResponse(BaseModel):
    quiz_id: str
    document_id: str
    document_name: str
    topic: Optional[str] = "General"
    questions: List[QuizQuestion]

class SubmitQuizRequest(BaseModel):
    quiz_id: str
    document_id: str
    score: int
    total_questions: int

class GenerateRevisionRequest(BaseModel):
    document_id: str
    topic: Optional[str] = None

class RevisionQA(BaseModel):
    question: str
    answer: str

class RevisionResponse(BaseModel):
    document_id: str
    document_name: str
    topic: str
    key_definitions: List[Dict[str, str]]
    key_points: List[str]
    example_qas: List[RevisionQA]
    raw_markdown: Optional[str] = ""

class Citation(BaseModel):
    document_id: str
    document_name: str
    page: int
    snippet: str
    similarity_score: Optional[float] = None

class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str
    citations: Optional[List[Citation]] = None

class ChatRequest(BaseModel):
    question: str
    document_id: Optional[str] = None  # Specific doc or None for all
    history: Optional[List[ChatMessage]] = []

class ChatResponse(BaseModel):
    answer: str
    citations: List[Citation]
    provider_used: str

class SettingsUpdateRequest(BaseModel):
    ollama_base_url: Optional[str] = None
    ollama_model: Optional[str] = None
    ollama_embed_model: Optional[str] = None
    groq_api_key: Optional[str] = None
    groq_model: Optional[str] = None
    preferred_provider: Optional[str] = None

class HealthResponse(BaseModel):
    status: str
    ollama_connected: bool
    ollama_model_available: bool
    groq_configured: bool
    active_provider: str
    document_count: int

# Authentication Schemas
class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    id: str
    username: str
    name: str
    role: str
    email: str
    created_at: str
    token: str

class ChangePasswordRequest(BaseModel):
    username: str
    current_password: str
    new_password: str

class ForgotPasswordRequest(BaseModel):
    username: str
    recovery_input: str  # email or recovery code
    new_password: str

class RegisterUserRequest(BaseModel):
    username: str
    password: str
    name: str
    email: Optional[str] = ""
    role: Optional[str] = "Student"
    recovery_code: Optional[str] = ""

class UserItem(BaseModel):
    id: str
    username: str
    name: str
    role: str
    email: str
    created_at: str
    recovery_code: Optional[str] = None

class AdminResetPasswordRequest(BaseModel):
    target_username: str
    new_password: str

