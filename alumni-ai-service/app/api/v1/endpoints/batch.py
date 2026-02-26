"""
Batch Processing API endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks
from loguru import logger
from typing import List
import asyncio

from app.models.schemas import (
    BatchCareerPredictionInput, BatchSentimentInput, BatchResponse,
    CareerPredictionInput, SentimentInput
)
from app.services.career_prediction import CareerPredictionService
from app.services.sentiment_analysis import SentimentAnalysisService
from app.services.model_manager import ModelManager

router = APIRouter()


def get_career_service(request: Request) -> CareerPredictionService:
    """Dependency to get career prediction service"""
    model_manager = request.app.state.model_manager
    return CareerPredictionService(model_manager)


def get_sentiment_service(request: Request) -> SentimentAnalysisService:
    """Dependency to get sentiment analysis service"""
    model_manager = request.app.state.model_manager
    return SentimentAnalysisService(model_manager)


@router.post("/career-predictions", response_model=BatchResponse)
async def batch_career_predictions(
    input_data: BatchCareerPredictionInput,
    career_service: CareerPredictionService = Depends(get_career_service)
):
    """
    Process multiple career prediction requests in batch
    
    **Input:**
    - requests: List of career prediction inputs (max 100)
    
    **Output:**
    - List of career prediction results
    - Processing statistics
    """
    try:
        logger.info(f"Processing batch career predictions for {len(input_data.requests)} requests")
        
        if len(input_data.requests) > 100:
            raise HTTPException(status_code=400, detail="Maximum 100 requests allowed per batch")
        
        results = []
        processed_count = 0
        failed_count = 0
        errors = []
        
        # Process requests concurrently with semaphore to limit concurrency
        semaphore = asyncio.Semaphore(10)  # Limit to 10 concurrent requests
        
        async def process_single_request(index: int, request: CareerPredictionInput):
            async with semaphore:
                try:
                    result = await career_service.predict_career_paths(request)
                    return {
                        "index": index,
                        "success": True,
                        "data": {
                            "predicted_paths": result.get('predicted_paths', []),
                            "skill_gaps": result.get('skill_gaps', []),
                            "recommendations": result.get('recommendations', []),
                            "analysis": result.get('analysis', {})
                        }
                    }
                except Exception as e:
                    logger.warning(f"Failed to process career prediction {index}: {e}")
                    return {
                        "index": index,
                        "success": False,
                        "error": str(e)
                    }
        
        # Execute all requests concurrently
        tasks = [
            process_single_request(i, request) 
            for i, request in enumerate(input_data.requests)
        ]
        
        results = await asyncio.gather(*tasks)
        
        # Count successes and failures
        for result in results:
            if result["success"]:
                processed_count += 1
            else:
                failed_count += 1
                errors.append(f"Request {result['index']}: {result['error']}")
        
        return BatchResponse(
            success=True,
            message=f"Batch processing completed: {processed_count} successful, {failed_count} failed",
            data=results,
            processed_count=processed_count,
            failed_count=failed_count,
            errors=errors[:10]  # Limit error messages
        )
        
    except Exception as e:
        logger.error(f"Error in batch career predictions: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/sentiment-analysis", response_model=BatchResponse)
async def batch_sentiment_analysis(
    input_data: BatchSentimentInput,
    sentiment_service: SentimentAnalysisService = Depends(get_sentiment_service)
):
    """
    Process multiple sentiment analysis requests in batch
    
    **Input:**
    - requests: List of sentiment analysis inputs (max 100)
    
    **Output:**
    - List of sentiment analysis results
    - Processing statistics
    """
    try:
        logger.info(f"Processing batch sentiment analysis for {len(input_data.requests)} requests")
        
        if len(input_data.requests) > 100:
            raise HTTPException(status_code=400, detail="Maximum 100 requests allowed per batch")
        
        results = []
        processed_count = 0
        failed_count = 0
        errors = []
        
        # Process requests concurrently
        semaphore = asyncio.Semaphore(20)  # Higher concurrency for sentiment analysis
        
        async def process_single_request(index: int, request: SentimentInput):
            async with semaphore:
                try:
                    result = await sentiment_service.analyze_sentiment(request)
                    return {
                        "index": index,
                        "success": True,
                        "data": {
                            "sentiment_score": result['sentiment_score'],
                            "engagement_metrics": result['engagement_metrics'],
                            "insights": result.get('insights', []),
                            "recommendations": result.get('recommendations', []),
                            "analysis": result.get('analysis', {})
                        }
                    }
                except Exception as e:
                    logger.warning(f"Failed to process sentiment analysis {index}: {e}")
                    return {
                        "index": index,
                        "success": False,
                        "error": str(e)
                    }
        
        # Execute all requests concurrently
        tasks = [
            process_single_request(i, request) 
            for i, request in enumerate(input_data.requests)
        ]
        
        results = await asyncio.gather(*tasks)
        
        # Count successes and failures
        for result in results:
            if result["success"]:
                processed_count += 1
            else:
                failed_count += 1
                errors.append(f"Request {result['index']}: {result['error']}")
        
        # Calculate batch statistics for successful results
        successful_results = [r for r in results if r["success"]]
        batch_stats = {}
        
        if successful_results:
            avg_polarity = sum(
                r["data"]["sentiment_score"].polarity for r in successful_results
            ) / len(successful_results)
            
            avg_engagement = sum(
                r["data"]["engagement_metrics"].engagement_score for r in successful_results
            ) / len(successful_results)
            
            batch_stats = {
                "average_polarity": round(avg_polarity, 3),
                "average_engagement": round(avg_engagement, 3),
                "positive_sentiment_count": sum(
                    1 for r in successful_results 
                    if r["data"]["sentiment_score"].compound > 0.1
                ),
                "negative_sentiment_count": sum(
                    1 for r in successful_results 
                    if r["data"]["sentiment_score"].compound < -0.1
                ),
                "high_engagement_count": sum(
                    1 for r in successful_results 
                    if r["data"]["engagement_metrics"].engagement_score > 0.7
                )
            }
        
        return BatchResponse(
            success=True,
            message=f"Batch processing completed: {processed_count} successful, {failed_count} failed",
            data=results,
            processed_count=processed_count,
            failed_count=failed_count,
            errors=errors[:10]
        )
        
    except Exception as e:
        logger.error(f"Error in batch sentiment analysis: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/mixed-analysis")
async def mixed_batch_analysis(
    career_requests: List[CareerPredictionInput] = [],
    sentiment_requests: List[SentimentInput] = [],
    background_tasks: BackgroundTasks = BackgroundTasks(),
    career_service: CareerPredictionService = Depends(get_career_service),
    sentiment_service: SentimentAnalysisService = Depends(get_sentiment_service)
):
    """
    Process mixed batch of career predictions and sentiment analysis
    
    **Input:**
    - career_requests: List of career prediction inputs (optional)
    - sentiment_requests: List of sentiment analysis inputs (optional)
    
    **Output:**
    - Combined results from both types of analysis
    """
    try:
        total_requests = len(career_requests) + len(sentiment_requests)
        
        if total_requests == 0:
            raise HTTPException(status_code=400, detail="At least one request is required")
        
        if total_requests > 100:
            raise HTTPException(status_code=400, detail="Maximum 100 total requests allowed")
        
        logger.info(f"Processing mixed batch: {len(career_requests)} career, {len(sentiment_requests)} sentiment")
        
        # Process career predictions
        career_results = []
        if career_requests:
            career_batch = BatchCareerPredictionInput(requests=career_requests)
            career_response = await batch_career_predictions(career_batch, career_service)
            career_results = career_response.data
        
        # Process sentiment analysis
        sentiment_results = []
        if sentiment_requests:
            sentiment_batch = BatchSentimentInput(requests=sentiment_requests)
            sentiment_response = await batch_sentiment_analysis(sentiment_batch, sentiment_service)
            sentiment_results = sentiment_response.data
        
        # Combine results
        all_results = []
        
        # Add career results with type indicator
        for result in career_results:
            result["analysis_type"] = "career_prediction"
            all_results.append(result)
        
        # Add sentiment results with type indicator
        for result in sentiment_results:
            result["analysis_type"] = "sentiment_analysis"
            # Adjust index to continue from career results
            result["index"] = result["index"] + len(career_requests)
            all_results.append(result)
        
        # Calculate overall statistics
        total_successful = sum(1 for r in all_results if r["success"])
        total_failed = len(all_results) - total_successful
        
        return {
            "success": True,
            "message": f"Mixed batch processing completed",
            "data": {
                "results": all_results,
                "statistics": {
                    "total_requests": total_requests,
                    "career_requests": len(career_requests),
                    "sentiment_requests": len(sentiment_requests),
                    "total_successful": total_successful,
                    "total_failed": total_failed,
                    "success_rate": round(total_successful / total_requests * 100, 2) if total_requests > 0 else 0
                }
            }
        }
        
    except Exception as e:
        logger.error(f"Error in mixed batch analysis: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/status")
async def get_batch_processing_status():
    """
    Get current batch processing capabilities and limits
    
    **Output:**
    - Current processing limits and capabilities
    """
    return {
        "success": True,
        "data": {
            "limits": {
                "max_requests_per_batch": 100,
                "max_concurrent_career_predictions": 10,
                "max_concurrent_sentiment_analysis": 20,
                "supported_analysis_types": [
                    "career_prediction",
                    "sentiment_analysis",
                    "mixed_analysis"
                ]
            },
            "capabilities": {
                "concurrent_processing": True,
                "error_handling": True,
                "partial_success_support": True,
                "batch_statistics": True
            },
            "recommendations": [
                "Use batch processing for multiple similar requests",
                "Monitor failed requests and retry if necessary",
                "Consider breaking very large batches into smaller chunks",
                "Use mixed analysis for diverse processing needs"
            ]
        }
    }