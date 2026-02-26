"""
AlumniAI Service - FastAPI Application
Main entry point for the AI microservice
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
import uvicorn
from contextlib import asynccontextmanager
import asyncio
from loguru import logger

from app.core.config import settings
from app.core.logging import setup_logging
from app.api.v1.api import api_router
from app.services.model_manager import ModelManager
from app.core.exceptions import setup_exception_handlers


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    logger.info("Starting AlumniAI Service...")
    
    # Initialize models
    model_manager = ModelManager()
    await model_manager.initialize_models()
    app.state.model_manager = model_manager
    
    logger.info("AlumniAI Service started successfully")
    
    yield
    
    # Shutdown
    logger.info("Shutting down AlumniAI Service...")
    if hasattr(app.state, 'model_manager'):
        await app.state.model_manager.cleanup()
    logger.info("AlumniAI Service shutdown complete")


# Create FastAPI application
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AI-powered career prediction and analysis service for AlumniAI Portal",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan
)

# Setup logging
setup_logging()

# Setup exception handlers
setup_exception_handlers(app)

# Add middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*"]  # Configure appropriately for production
)

# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "AlumniAI Service",
        "version": settings.VERSION,
        "status": "running",
        "docs": f"{settings.API_V1_STR}/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Check if models are loaded
        model_status = "unknown"
        if hasattr(app.state, 'model_manager'):
            model_status = "loaded" if app.state.model_manager.models_loaded else "loading"
        
        return {
            "status": "healthy",
            "version": settings.VERSION,
            "environment": settings.ENVIRONMENT,
            "models": model_status,
            "timestamp": asyncio.get_event_loop().time()
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=503, detail="Service unhealthy")


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower()
    )