"""
Career Prediction API endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from loguru import logger

from app.models.schemas import CareerPredictionInput, CareerPredictionResponse
from app.services.career_prediction import CareerPredictionService
from app.services.model_manager import ModelManager
from app.core.exceptions import PredictionException

router = APIRouter()


def get_career_service(request: Request) -> CareerPredictionService:
    """Dependency to get career prediction service"""
    model_manager = request.app.state.model_manager
    return CareerPredictionService(model_manager)


@router.post("/predict", response_model=CareerPredictionResponse)
async def predict_career_paths(
    input_data: CareerPredictionInput,
    career_service: CareerPredictionService = Depends(get_career_service)
):
    """
    Predict career paths based on user skills and experience
    
    **Input:**
    - skills: List of user skills (required)
    - experience_years: Years of experience (optional, default: 0)
    - education_level: Education level (optional, default: "bachelor")
    - current_role: Current job role (optional)
    - industry_preference: Preferred industry (optional)
    
    **Output:**
    - predicted_paths: List of career paths with probabilities
    - skill_gaps: Skills that would improve career prospects
    - recommendations: Personalized career advice
    """
    try:
        logger.info(f"Career prediction request for skills: {input_data.skills}")
        
        result = await career_service.predict_career_paths(input_data)
        
        return CareerPredictionResponse(
            success=True,
            message="Career prediction completed successfully",
            data=result.get('analysis', {}),
            predicted_paths=result.get('predicted_paths', []),
            skill_gaps=result.get('skill_gaps', []),
            recommendations=result.get('recommendations', [])
        )
        
    except PredictionException as e:
        logger.error(f"Career prediction error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error in career prediction: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/skills/popular")
async def get_popular_skills(
    limit: int = 20,
    career_service: CareerPredictionService = Depends(get_career_service)
):
    """
    Get list of popular skills across different career paths
    
    **Parameters:**
    - limit: Maximum number of skills to return (default: 20)
    
    **Output:**
    - List of popular skills with their frequency across careers
    """
    try:
        # Get career data from model manager
        career_data = career_service.model_manager.get_model('career_data')
        
        # Count skill frequency
        skill_frequency = {}
        for career_info in career_data.values():
            for skill in career_info['skills']:
                skill_frequency[skill] = skill_frequency.get(skill, 0) + 1
        
        # Sort by frequency and return top skills
        popular_skills = sorted(
            skill_frequency.items(), 
            key=lambda x: x[1], 
            reverse=True
        )[:limit]
        
        return {
            "success": True,
            "data": {
                "skills": [
                    {"skill": skill, "frequency": freq} 
                    for skill, freq in popular_skills
                ],
                "total_careers": len(career_data),
                "total_unique_skills": len(skill_frequency)
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting popular skills: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/paths/available")
async def get_available_career_paths(
    career_service: CareerPredictionService = Depends(get_career_service)
):
    """
    Get list of all available career paths in the system
    
    **Output:**
    - List of career paths with their details
    """
    try:
        career_data = career_service.model_manager.get_model('career_data')
        
        paths = []
        for career_name, career_info in career_data.items():
            paths.append({
                "name": career_name.replace('_', ' ').title(),
                "key": career_name,
                "required_skills": career_info['skills'],
                "salary_range": career_info['salary_range'],
                "growth_potential": career_info['growth_potential']
            })
        
        return {
            "success": True,
            "data": {
                "career_paths": paths,
                "total_paths": len(paths)
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting career paths: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")