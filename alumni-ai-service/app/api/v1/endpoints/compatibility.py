"""
Mentor Compatibility API endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from loguru import logger

from app.models.schemas import CompatibilityInput, CompatibilityResponse
from app.services.mentor_compatibility import MentorCompatibilityService
from app.services.model_manager import ModelManager
from app.core.exceptions import PredictionException

router = APIRouter()


def get_compatibility_service(request: Request) -> MentorCompatibilityService:
    """Dependency to get mentor compatibility service"""
    model_manager = request.app.state.model_manager
    return MentorCompatibilityService(model_manager)


@router.post("/calculate", response_model=CompatibilityResponse)
async def calculate_mentor_compatibility(
    input_data: CompatibilityInput,
    compatibility_service: MentorCompatibilityService = Depends(get_compatibility_service)
):
    """
    Calculate Mentor Compatibility Index (MCI) between mentor and student
    
    **Formula:**
    MCI = (SkillSimilarity × 0.4) + (IndustryMatch × 0.25) + (ExperienceAlignment × 0.2) + (BehaviorScore × 0.15)
    
    **Input:**
    - mentor: Mentor profile with skills, industry, experience, etc.
    - student: Student profile with skills, goals, preferences, etc.
    
    **Output:**
    - compatibility_score: Detailed MCI breakdown
    - explanation: Explanations for each component
    - recommendations: Suggestions for improving compatibility
    """
    try:
        logger.info("Calculating mentor-student compatibility")
        
        result = await compatibility_service.calculate_compatibility(input_data)
        
        return CompatibilityResponse(
            success=True,
            message="Compatibility analysis completed successfully",
            data=result['compatibility_score'],
            explanation=result.get('explanation', {}),
            recommendations=result.get('recommendations', [])
        )
        
    except PredictionException as e:
        logger.error(f"Compatibility calculation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error in compatibility calculation: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/batch-calculate")
async def batch_calculate_compatibility(
    mentor_profiles: list,
    student_profile: dict,
    compatibility_service: MentorCompatibilityService = Depends(get_compatibility_service)
):
    """
    Calculate compatibility between one student and multiple mentors
    
    **Input:**
    - mentor_profiles: List of mentor profiles
    - student_profile: Single student profile
    
    **Output:**
    - List of compatibility scores sorted by MCI
    """
    try:
        logger.info(f"Batch compatibility calculation for {len(mentor_profiles)} mentors")
        
        results = []
        
        for i, mentor_data in enumerate(mentor_profiles):
            try:
                # Create compatibility input
                compatibility_input = CompatibilityInput(
                    mentor=mentor_data,
                    student=student_profile
                )
                
                # Calculate compatibility
                result = await compatibility_service.calculate_compatibility(compatibility_input)
                
                results.append({
                    "mentor_index": i,
                    "mentor_id": mentor_data.get("id"),
                    "compatibility_score": result['compatibility_score'],
                    "match_quality": result['analysis']['match_quality'],
                    "strongest_factor": result['analysis']['strongest_factor']
                })
                
            except Exception as e:
                logger.warning(f"Failed to calculate compatibility for mentor {i}: {e}")
                results.append({
                    "mentor_index": i,
                    "mentor_id": mentor_data.get("id"),
                    "error": str(e)
                })
        
        # Sort by overall MCI score (descending)
        successful_results = [r for r in results if 'compatibility_score' in r]
        failed_results = [r for r in results if 'error' in r]
        
        successful_results.sort(
            key=lambda x: x['compatibility_score'].overall_mci, 
            reverse=True
        )
        
        return {
            "success": True,
            "message": f"Batch compatibility calculation completed",
            "data": {
                "results": successful_results + failed_results,
                "successful_calculations": len(successful_results),
                "failed_calculations": len(failed_results),
                "total_mentors": len(mentor_profiles)
            }
        }
        
    except Exception as e:
        logger.error(f"Error in batch compatibility calculation: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/factors/weights")
async def get_compatibility_factors():
    """
    Get the weights used in MCI calculation
    
    **Output:**
    - Factor weights and their descriptions
    """
    return {
        "success": True,
        "data": {
            "formula": "MCI = (SkillSimilarity × 0.4) + (IndustryMatch × 0.25) + (ExperienceAlignment × 0.2) + (BehaviorScore × 0.15)",
            "factors": {
                "skill_similarity": {
                    "weight": 0.4,
                    "description": "Overlap between mentor and student skills, including career goals"
                },
                "industry_match": {
                    "weight": 0.25,
                    "description": "Alignment between mentor's industry and student's target industry"
                },
                "experience_alignment": {
                    "weight": 0.2,
                    "description": "Optimal experience gap for effective mentoring (3-8 years ideal)"
                },
                "behavior_score": {
                    "weight": 0.15,
                    "description": "Compatibility of mentoring/learning styles and availability"
                }
            },
            "score_interpretation": {
                "0.8-1.0": "Excellent match",
                "0.6-0.8": "Good match",
                "0.4-0.6": "Fair match",
                "0.0-0.4": "Poor match"
            }
        }
    }


@router.post("/analyze-factors")
async def analyze_compatibility_factors(
    input_data: CompatibilityInput,
    compatibility_service: MentorCompatibilityService = Depends(get_compatibility_service)
):
    """
    Detailed analysis of individual compatibility factors
    
    **Input:**
    - mentor: Mentor profile
    - student: Student profile
    
    **Output:**
    - Detailed breakdown of each factor with explanations
    """
    try:
        result = await compatibility_service.calculate_compatibility(input_data)
        compatibility_score = result['compatibility_score']
        
        # Calculate individual factor contributions
        factor_contributions = {
            "skill_similarity": {
                "score": compatibility_score.skill_similarity,
                "weighted_contribution": compatibility_score.skill_similarity * 0.4,
                "percentage_of_total": (compatibility_score.skill_similarity * 0.4) / compatibility_score.overall_mci * 100 if compatibility_score.overall_mci > 0 else 0
            },
            "industry_match": {
                "score": compatibility_score.industry_match,
                "weighted_contribution": compatibility_score.industry_match * 0.25,
                "percentage_of_total": (compatibility_score.industry_match * 0.25) / compatibility_score.overall_mci * 100 if compatibility_score.overall_mci > 0 else 0
            },
            "experience_alignment": {
                "score": compatibility_score.experience_alignment,
                "weighted_contribution": compatibility_score.experience_alignment * 0.2,
                "percentage_of_total": (compatibility_score.experience_alignment * 0.2) / compatibility_score.overall_mci * 100 if compatibility_score.overall_mci > 0 else 0
            },
            "behavior_score": {
                "score": compatibility_score.behavior_score,
                "weighted_contribution": compatibility_score.behavior_score * 0.15,
                "percentage_of_total": (compatibility_score.behavior_score * 0.15) / compatibility_score.overall_mci * 100 if compatibility_score.overall_mci > 0 else 0
            }
        }
        
        return {
            "success": True,
            "data": {
                "overall_mci": compatibility_score.overall_mci,
                "factor_analysis": factor_contributions,
                "explanations": result.get('explanation', {}),
                "strongest_factor": result['analysis']['strongest_factor'],
                "improvement_areas": result['analysis']['improvement_areas']
            }
        }
        
    except Exception as e:
        logger.error(f"Error analyzing compatibility factors: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")