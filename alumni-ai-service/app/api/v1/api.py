"""
API Router for AlumniAI Service v1
"""

from fastapi import APIRouter
from app.api.v1.endpoints import career, compatibility, resume, sentiment, batch

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(career.router, prefix="/career", tags=["career-prediction"])
api_router.include_router(compatibility.router, prefix="/compatibility", tags=["mentor-compatibility"])
api_router.include_router(resume.router, prefix="/resume", tags=["resume-analysis"])
api_router.include_router(sentiment.router, prefix="/sentiment", tags=["sentiment-analysis"])
api_router.include_router(batch.router, prefix="/batch", tags=["batch-processing"])