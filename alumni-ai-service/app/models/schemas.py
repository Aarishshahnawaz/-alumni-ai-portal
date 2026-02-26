"""
Pydantic schemas for AlumniAI Service
"""

from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any, Union
from enum import Enum


class ResponseStatus(str, Enum):
    SUCCESS = "success"
    ERROR = "error"


class BaseResponse(BaseModel):
    success: bool = True
    message: Optional[str] = None
    timestamp: Optional[str] = None


# Career Prediction Schemas
class CareerPredictionInput(BaseModel):
    skills: List[str] = Field(..., min_items=1, max_items=50, description="List of user skills")
    experience_years: Optional[int] = Field(0, ge=0, le=50, description="Years of experience")
    education_level: Optional[str] = Field("bachelor", description="Education level")
    current_role: Optional[str] = Field(None, description="Current job role")
    industry_preference: Optional[str] = Field(None, description="Preferred industry")
    
    @validator('skills')
    def validate_skills(cls, v):
        if not v:
            raise ValueError("At least one skill is required")
        return [skill.strip().lower() for skill in v if skill.strip()]


class CareerPath(BaseModel):
    role: str
    probability: float = Field(..., ge=0, le=1)
    required_skills: List[str]
    salary_range: Dict[str, int]
    growth_potential: str
    time_to_achieve: str


class CareerPredictionResponse(BaseResponse):
    data: Dict[str, Any] = Field(default_factory=dict)
    predicted_paths: List[CareerPath] = Field(default_factory=list)
    skill_gaps: List[str] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)


# Mentor Compatibility Schemas
class MentorProfile(BaseModel):
    skills: List[str]
    industry: str
    experience_years: int = Field(..., ge=0)
    current_role: str
    company_size: Optional[str] = None
    mentorship_style: Optional[str] = None
    availability: Optional[str] = None


class StudentProfile(BaseModel):
    skills: List[str]
    target_industry: str
    experience_years: int = Field(0, ge=0)
    career_goals: List[str]
    learning_style: Optional[str] = None
    availability: Optional[str] = None


class CompatibilityInput(BaseModel):
    mentor: MentorProfile
    student: StudentProfile


class CompatibilityScore(BaseModel):
    skill_similarity: float = Field(..., ge=0, le=1)
    industry_match: float = Field(..., ge=0, le=1)
    experience_alignment: float = Field(..., ge=0, le=1)
    behavior_score: float = Field(..., ge=0, le=1)
    overall_mci: float = Field(..., ge=0, le=1)


class CompatibilityResponse(BaseResponse):
    data: CompatibilityScore
    explanation: Dict[str, str] = Field(default_factory=dict)
    recommendations: List[str] = Field(default_factory=list)


# Resume Analysis Schemas
class ResumeAnalysisInput(BaseModel):
    file_content: Optional[str] = None
    file_type: str = Field(..., regex="^(pdf|doc|docx|txt)$")
    target_role: Optional[str] = None
    target_company: Optional[str] = None


class ExtractedSkills(BaseModel):
    technical_skills: List[str] = Field(default_factory=list)
    soft_skills: List[str] = Field(default_factory=list)
    certifications: List[str] = Field(default_factory=list)
    tools: List[str] = Field(default_factory=list)


class ATSScore(BaseModel):
    overall_score: int = Field(..., ge=0, le=100)
    keyword_density: float = Field(..., ge=0, le=1)
    format_score: int = Field(..., ge=0, le=100)
    content_score: int = Field(..., ge=0, le=100)
    suggestions: List[str] = Field(default_factory=list)


class ResumeAnalysisResponse(BaseResponse):
    data: Dict[str, Any] = Field(default_factory=dict)
    extracted_text: Optional[str] = None
    skills: ExtractedSkills = Field(default_factory=ExtractedSkills)
    ats_score: ATSScore = Field(default_factory=ATSScore)
    job_match_score: Optional[float] = None
    improvements: List[str] = Field(default_factory=list)


# Sentiment Analysis Schemas
class SentimentInput(BaseModel):
    text: str = Field(..., min_length=1, max_length=10000)
    context: Optional[str] = Field("general", description="Context of the text (mentorship, feedback, etc.)")


class SentimentScore(BaseModel):
    polarity: float = Field(..., ge=-1, le=1, description="Sentiment polarity (-1 to 1)")
    subjectivity: float = Field(..., ge=0, le=1, description="Subjectivity score (0 to 1)")
    compound: float = Field(..., ge=-1, le=1, description="Compound sentiment score")
    positive: float = Field(..., ge=0, le=1)
    neutral: float = Field(..., ge=0, le=1)
    negative: float = Field(..., ge=0, le=1)


class EngagementMetrics(BaseModel):
    engagement_score: float = Field(..., ge=0, le=1)
    enthusiasm_level: str = Field(..., regex="^(low|medium|high)$")
    communication_quality: float = Field(..., ge=0, le=1)
    professionalism: float = Field(..., ge=0, le=1)


class SentimentResponse(BaseResponse):
    data: SentimentScore
    engagement: EngagementMetrics
    insights: List[str] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)


# Batch Processing Schemas
class BatchCareerPredictionInput(BaseModel):
    requests: List[CareerPredictionInput] = Field(..., max_items=100)


class BatchSentimentInput(BaseModel):
    requests: List[SentimentInput] = Field(..., max_items=100)


class BatchResponse(BaseResponse):
    data: List[Dict[str, Any]] = Field(default_factory=list)
    processed_count: int = 0
    failed_count: int = 0
    errors: List[str] = Field(default_factory=list)


# Health Check Schema
class HealthResponse(BaseModel):
    status: str
    version: str
    environment: str
    models: str
    timestamp: float