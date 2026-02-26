"""
Sentiment Analysis API endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from loguru import logger
from typing import List

from app.models.schemas import SentimentInput, SentimentResponse
from app.services.sentiment_analysis import SentimentAnalysisService
from app.services.model_manager import ModelManager
from app.core.exceptions import PredictionException

router = APIRouter()


def get_sentiment_service(request: Request) -> SentimentAnalysisService:
    """Dependency to get sentiment analysis service"""
    model_manager = request.app.state.model_manager
    return SentimentAnalysisService(model_manager)


@router.post("/analyze", response_model=SentimentResponse)
async def analyze_sentiment(
    input_data: SentimentInput,
    sentiment_service: SentimentAnalysisService = Depends(get_sentiment_service)
):
    """
    Analyze sentiment and engagement in text
    
    **Input:**
    - text: Text content to analyze (required)
    - context: Context of the text (optional, default: "general")
    
    **Output:**
    - sentiment_score: Detailed sentiment analysis (polarity, subjectivity, compound, etc.)
    - engagement: Engagement metrics (engagement_score, enthusiasm_level, etc.)
    - insights: Key insights from the analysis
    - recommendations: Actionable recommendations
    """
    try:
        logger.info(f"Analyzing sentiment for {input_data.context} context")
        
        result = await sentiment_service.analyze_sentiment(input_data)
        
        return SentimentResponse(
            success=True,
            message="Sentiment analysis completed successfully",
            data=result['sentiment_score'],
            engagement=result['engagement_metrics'],
            insights=result.get('insights', []),
            recommendations=result.get('recommendations', [])
        )
        
    except PredictionException as e:
        logger.error(f"Sentiment analysis error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error in sentiment analysis: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/batch-analyze")
async def batch_analyze_sentiment(
    texts: List[str],
    context: str = "general",
    sentiment_service: SentimentAnalysisService = Depends(get_sentiment_service)
):
    """
    Analyze sentiment for multiple texts
    
    **Input:**
    - texts: List of text strings to analyze
    - context: Context for all texts (default: "general")
    
    **Output:**
    - List of sentiment analysis results
    """
    try:
        logger.info(f"Batch sentiment analysis for {len(texts)} texts")
        
        if len(texts) > 100:
            raise HTTPException(status_code=400, detail="Maximum 100 texts allowed per batch")
        
        results = []
        
        for i, text in enumerate(texts):
            try:
                input_data = SentimentInput(text=text, context=context)
                result = await sentiment_service.analyze_sentiment(input_data)
                
                results.append({
                    "index": i,
                    "text_preview": text[:100] + "..." if len(text) > 100 else text,
                    "sentiment_score": result['sentiment_score'],
                    "engagement_metrics": result['engagement_metrics'],
                    "dominant_emotion": result['analysis']['dominant_emotion']
                })
                
            except Exception as e:
                logger.warning(f"Failed to analyze text {i}: {e}")
                results.append({
                    "index": i,
                    "text_preview": text[:100] + "..." if len(text) > 100 else text,
                    "error": str(e)
                })
        
        # Calculate batch statistics
        successful_results = [r for r in results if 'sentiment_score' in r]
        
        batch_stats = {}
        if successful_results:
            avg_polarity = sum(r['sentiment_score'].polarity for r in successful_results) / len(successful_results)
            avg_engagement = sum(r['engagement_metrics'].engagement_score for r in successful_results) / len(successful_results)
            
            batch_stats = {
                "average_polarity": round(avg_polarity, 3),
                "average_engagement": round(avg_engagement, 3),
                "successful_analyses": len(successful_results),
                "failed_analyses": len(results) - len(successful_results)
            }
        
        return {
            "success": True,
            "message": f"Batch sentiment analysis completed",
            "data": {
                "results": results,
                "batch_statistics": batch_stats,
                "total_texts": len(texts)
            }
        }
        
    except Exception as e:
        logger.error(f"Error in batch sentiment analysis: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/engagement-score")
async def calculate_engagement_score(
    text: str,
    context: str = "general",
    sentiment_service: SentimentAnalysisService = Depends(get_sentiment_service)
):
    """
    Calculate engagement score only (faster than full analysis)
    
    **Input:**
    - text: Text content to analyze
    - context: Context of the text (default: "general")
    
    **Output:**
    - engagement_score: Numerical engagement score (0-1)
    - engagement_level: Categorical level (low/medium/high)
    """
    try:
        logger.info("Calculating engagement score")
        
        if not text or len(text.strip()) < 1:
            raise HTTPException(status_code=400, detail="Text is required")
        
        # Calculate engagement metrics only
        engagement_metrics = await sentiment_service._calculate_engagement_metrics(text, context)
        
        return {
            "success": True,
            "data": {
                "engagement_score": engagement_metrics.engagement_score,
                "enthusiasm_level": engagement_metrics.enthusiasm_level,
                "communication_quality": engagement_metrics.communication_quality,
                "professionalism": engagement_metrics.professionalism,
                "engagement_level": "high" if engagement_metrics.engagement_score > 0.7 else "medium" if engagement_metrics.engagement_score > 0.4 else "low",
                "text_stats": {
                    "length": len(text),
                    "word_count": len(text.split()),
                    "context": context
                }
            }
        }
        
    except Exception as e:
        logger.error(f"Error calculating engagement score: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/mentorship-analysis")
async def analyze_mentorship_message(
    message: str,
    sender_role: str,  # "mentor" or "student"
    sentiment_service: SentimentAnalysisService = Depends(get_sentiment_service)
):
    """
    Specialized analysis for mentorship messages
    
    **Input:**
    - message: Mentorship message content
    - sender_role: Role of sender ("mentor" or "student")
    
    **Output:**
    - Detailed analysis with mentorship-specific insights
    """
    try:
        logger.info(f"Analyzing mentorship message from {sender_role}")
        
        if sender_role not in ["mentor", "student"]:
            raise HTTPException(status_code=400, detail="sender_role must be 'mentor' or 'student'")
        
        # Analyze with mentorship context
        input_data = SentimentInput(text=message, context="mentorship")
        result = await sentiment_service.analyze_sentiment(input_data)
        
        # Add role-specific insights
        role_insights = []
        
        if sender_role == "student":
            if result['engagement_metrics'].engagement_score > 0.7:
                role_insights.append("Student shows high engagement and motivation")
            if result['sentiment_score'].compound > 0.5:
                role_insights.append("Positive attitude towards mentorship")
            if result['engagement_metrics'].enthusiasm_level == "low":
                role_insights.append("Consider ways to increase student enthusiasm")
        
        elif sender_role == "mentor":
            if result['engagement_metrics'].professionalism > 0.8:
                role_insights.append("Mentor maintains excellent professional tone")
            if result['sentiment_score'].compound > 0.3:
                role_insights.append("Supportive and encouraging mentoring style")
            if result['engagement_metrics'].communication_quality > 0.8:
                role_insights.append("Clear and effective communication")
        
        # Mentorship relationship health score
        relationship_health = (
            result['sentiment_score'].compound * 0.3 +
            result['engagement_metrics'].engagement_score * 0.4 +
            result['engagement_metrics'].communication_quality * 0.2 +
            result['engagement_metrics'].professionalism * 0.1
        )
        
        return {
            "success": True,
            "data": {
                "sentiment_analysis": result['sentiment_score'],
                "engagement_metrics": result['engagement_metrics'],
                "insights": result['insights'] + role_insights,
                "recommendations": result['recommendations'],
                "mentorship_specific": {
                    "sender_role": sender_role,
                    "relationship_health_score": round(max(0, relationship_health), 3),
                    "communication_effectiveness": "excellent" if result['engagement_metrics'].communication_quality > 0.8 else "good" if result['engagement_metrics'].communication_quality > 0.6 else "needs_improvement",
                    "suggested_response_tone": "encouraging" if result['sentiment_score'].compound < 0 else "supportive" if result['engagement_metrics'].engagement_score < 0.5 else "collaborative"
                }
            }
        }
        
    except Exception as e:
        logger.error(f"Error in mentorship message analysis: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/emotion-indicators")
async def get_emotion_indicators():
    """
    Get lists of emotion indicators used in analysis
    
    **Output:**
    - Lists of positive, negative, and enthusiasm indicators
    """
    sentiment_service = SentimentAnalysisService(None)  # Just for accessing indicators
    
    return {
        "success": True,
        "data": {
            "positive_indicators": sentiment_service.positive_indicators,
            "negative_indicators": sentiment_service.negative_indicators,
            "enthusiasm_indicators": sentiment_service.enthusiasm_indicators,
            "professionalism_indicators": sentiment_service.professionalism_indicators,
            "usage_note": "These indicators are used to calculate engagement and sentiment scores"
        }
    }