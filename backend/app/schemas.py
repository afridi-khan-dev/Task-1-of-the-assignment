from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, date

# ----------------- JWT & Auth Schemas -----------------
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    username: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: str = "Sales Representative"  # Admin, Sales Representative, Manager

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True


# ----------------- HCP Schemas -----------------
class HcpBase(BaseModel):
    name: str
    specialty: str
    hospital: str
    city: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    priority: str = "Medium"  # High, Medium, Low
    status: str = "Active"  # Active, Inactive

class HcpCreate(HcpBase):
    pass

class HcpUpdate(BaseModel):
    name: Optional[str] = None
    specialty: Optional[str] = None
    hospital: Optional[str] = None
    city: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None

class HcpResponse(HcpBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ----------------- Product Schemas -----------------
class ProductBase(BaseModel):
    name: str
    category: str
    description: Optional[str] = None
    indication: Optional[str] = None

class ProductCreate(ProductBase):
    pass

class ProductResponse(ProductBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ----------------- Interaction Schemas -----------------
class InteractionBase(BaseModel):
    hcp_id: int
    raw_input: str
    summary: str
    interaction_type: str = "In-Person"  # In-Person, Video Call, Email, Phone
    products_discussed: Optional[List[str]] = []
    sentiment: str = "Neutral"  # Positive, Neutral, Negative
    interaction_date: date
    follow_up_date: Optional[date] = None

class InteractionCreate(BaseModel):
    hcp_id: int
    raw_input: str
    interaction_type: str = "In-Person"
    interaction_date: date
    products_discussed: Optional[List[str]] = []
    manual_summary: Optional[str] = None
    sentiment: Optional[str] = None
    follow_up_date: Optional[date] = None

class InteractionUpdate(BaseModel):
    hcp_id: Optional[int] = None
    raw_input: Optional[str] = None
    summary: Optional[str] = None
    interaction_type: Optional[str] = None
    products_discussed: Optional[List[str]] = None
    sentiment: Optional[str] = None
    interaction_date: Optional[date] = None
    follow_up_date: Optional[date] = None

class InteractionResponse(InteractionBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    hcp: Optional[HcpResponse] = None

    class Config:
        from_attributes = True


# ----------------- Followup Schemas -----------------
class FollowupBase(BaseModel):
    hcp_id: int
    description: str
    status: str = "Pending"  # Pending, Completed, Overdue
    due_date: date
    priority: str = "Medium"  # High, Medium, Low

class FollowupCreate(FollowupBase):
    interaction_id: Optional[int] = None

class FollowupUpdate(BaseModel):
    description: Optional[str] = None
    status: Optional[str] = None
    due_date: Optional[date] = None
    priority: Optional[str] = None

class FollowupResponse(FollowupBase):
    id: int
    interaction_id: Optional[int] = None
    user_id: int
    created_at: datetime
    updated_at: datetime
    hcp: Optional[HcpResponse] = None

    class Config:
        from_attributes = True


# ----------------- AI Logging & Chat Schemas -----------------
class AIChatRequest(BaseModel):
    text: str
    hcp_id: Optional[int] = None  # context
    chat_history: Optional[List[Dict[str, str]]] = []

class AIChatResponse(BaseModel):
    response_type: str  # "logged_interaction", "general_answer", "error"
    content: str
    extracted_entities: Optional[Dict[str, Any]] = None
    compliance_status: Optional[Dict[str, Any]] = None
    follow_up_recommendation: Optional[Dict[str, Any]] = None
    sentiment: Optional[str] = None
    interaction_id: Optional[int] = None
    hcp_details: Optional[HcpResponse] = None

# ----------------- Dashboard Metrics Schemas -----------------
class HighPriorityHcp(BaseModel):
    id: int
    name: str
    specialty: str
    hospital: str
    last_interaction: Optional[date] = None
    priority: str

class UpcomingFollowUp(BaseModel):
    id: int
    hcp_name: str
    specialty: str
    description: str
    due_date: date
    priority: str

class EngagementTrendPoint(BaseModel):
    date: str
    count: int

class DashboardMetricsResponse(BaseModel):
    total_interactions: int
    total_hcps: int
    pending_followups: int
    compliance_score: float  # Percentage of interactions with 0 compliance issues
    high_priority_hcps: List[HighPriorityHcp]
    upcoming_followups: List[UpcomingFollowUp]
    engagement_trends: List[EngagementTrendPoint]
    specialty_distribution: Dict[str, int]
    ai_insights: List[str]


# ----------------- Voice Scheduling Schemas -----------------
class VoiceScheduleRequest(BaseModel):
    text: str

class VoiceScheduleResponse(BaseModel):
    success: bool
    speech_response: str
    followup: Optional[FollowupResponse] = None

