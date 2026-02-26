"""
Exception handlers for AlumniAI Service
"""

from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from loguru import logger
import traceback


class AIServiceException(Exception):
    """Base exception for AI Service"""
    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class ModelNotLoadedException(AIServiceException):
    """Exception raised when model is not loaded"""
    def __init__(self, model_name: str):
        super().__init__(f"Model '{model_name}' is not loaded", 503)


class FileProcessingException(AIServiceException):
    """Exception raised during file processing"""
    def __init__(self, message: str):
        super().__init__(f"File processing error: {message}", 400)


class PredictionException(AIServiceException):
    """Exception raised during prediction"""
    def __init__(self, message: str):
        super().__init__(f"Prediction error: {message}", 500)


def setup_exception_handlers(app: FastAPI):
    """Setup exception handlers for the FastAPI app"""
    
    @app.exception_handler(AIServiceException)
    async def ai_service_exception_handler(request: Request, exc: AIServiceException):
        logger.error(f"AI Service Exception: {exc.message}")
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "error": exc.message,
                "type": exc.__class__.__name__
            }
        )
    
    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        logger.error(f"HTTP Exception: {exc.detail}")
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "error": exc.detail,
                "type": "HTTPException"
            }
        )
    
    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        logger.error(f"Unhandled exception: {str(exc)}\n{traceback.format_exc()}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": "Internal server error",
                "type": "InternalServerError"
            }
        )