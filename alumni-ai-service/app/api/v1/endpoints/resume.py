"""
Resume Analysis API endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File, Form
from loguru import logger
from typing import Optional

from app.models.schemas import ResumeAnalysisInput, ResumeAnalysisResponse
from app.services.resume_analyzer import ResumeAnalyzerService
from app.services.model_manager import ModelManager
from app.core.exceptions import FileProcessingException, PredictionException
from app.core.config import settings

router = APIRouter()


def get_resume_service(request: Request) -> ResumeAnalyzerService:
    """Dependency to get resume analyzer service"""
    model_manager = request.app.state.model_manager
    return ResumeAnalyzerService(model_manager)


@router.post("/analyze", response_model=ResumeAnalysisResponse)
async def analyze_resume(
    file: UploadFile = File(...),
    target_role: Optional[str] = Form(None),
    target_company: Optional[str] = Form(None),
    resume_service: ResumeAnalyzerService = Depends(get_resume_service)
):
    """
    Analyze resume file and extract insights
    
    **Input:**
    - file: Resume file (PDF, DOC, DOCX, or TXT)
    - target_role: Target job role for matching (optional)
    - target_company: Target company (optional)
    
    **Output:**
    - extracted_text: Text content from resume
    - skills: Categorized skills (technical, soft, certifications, tools)
    - ats_score: ATS compatibility score with suggestions
    - job_match_score: Match score with target role (if provided)
    - improvements: List of improvement suggestions
    """
    try:
        logger.info(f"Analyzing resume file: {file.filename}")
        
        # Validate file type
        file_extension = file.filename.split('.')[-1].lower() if '.' in file.filename else ''
        if file_extension not in settings.SUPPORTED_FILE_TYPES:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported file type. Supported types: {', '.join(settings.SUPPORTED_FILE_TYPES)}"
            )
        
        # Validate file size
        file_content = await file.read()
        if len(file_content) > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
            raise HTTPException(
                status_code=400,
                detail=f"File size exceeds maximum limit of {settings.MAX_FILE_SIZE_MB}MB"
            )
        
        # Create input data
        input_data = ResumeAnalysisInput(
            file_type=file_extension,
            target_role=target_role,
            target_company=target_company
        )
        
        # Analyze resume
        result = await resume_service.analyze_resume(input_data, file_content)
        
        return ResumeAnalysisResponse(
            success=True,
            message="Resume analysis completed successfully",
            data=result.get('analysis', {}),
            extracted_text=result.get('extracted_text'),
            skills=result.get('skills'),
            ats_score=result.get('ats_score'),
            job_match_score=result.get('job_match_score'),
            improvements=result.get('improvements', [])
        )
        
    except FileProcessingException as e:
        logger.error(f"File processing error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except PredictionException as e:
        logger.error(f"Resume analysis error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error in resume analysis: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/extract-text")
async def extract_text_only(
    file: UploadFile = File(...),
    resume_service: ResumeAnalyzerService = Depends(get_resume_service)
):
    """
    Extract text content from resume file only
    
    **Input:**
    - file: Resume file (PDF, DOC, DOCX, or TXT)
    
    **Output:**
    - extracted_text: Raw text content
    - metadata: File information
    """
    try:
        logger.info(f"Extracting text from file: {file.filename}")
        
        # Validate file type
        file_extension = file.filename.split('.')[-1].lower() if '.' in file.filename else ''
        if file_extension not in settings.SUPPORTED_FILE_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type. Supported types: {', '.join(settings.SUPPORTED_FILE_TYPES)}"
            )
        
        # Read file content
        file_content = await file.read()
        
        # Extract text
        extracted_text = await resume_service._extract_text_from_file(file_content, file_extension)
        
        return {
            "success": True,
            "data": {
                "extracted_text": extracted_text,
                "metadata": {
                    "filename": file.filename,
                    "file_type": file_extension,
                    "file_size_bytes": len(file_content),
                    "text_length": len(extracted_text),
                    "word_count": len(extracted_text.split())
                }
            }
        }
        
    except FileProcessingException as e:
        logger.error(f"Text extraction error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error in text extraction: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/skills/extract")
async def extract_skills_from_text(
    text: str,
    resume_service: ResumeAnalyzerService = Depends(get_resume_service)
):
    """
    Extract skills from provided text
    
    **Input:**
    - text: Text content to analyze
    
    **Output:**
    - skills: Categorized skills found in the text
    """
    try:
        logger.info("Extracting skills from provided text")
        
        if not text or len(text.strip()) < 10:
            raise HTTPException(status_code=400, detail="Text is too short for analysis")
        
        # Extract skills
        skills = await resume_service._extract_skills(text)
        
        return {
            "success": True,
            "data": {
                "skills": skills,
                "analysis": {
                    "text_length": len(text),
                    "word_count": len(text.split()),
                    "total_skills_found": len(skills.technical_skills) + len(skills.soft_skills) + len(skills.certifications) + len(skills.tools)
                }
            }
        }
        
    except Exception as e:
        logger.error(f"Error extracting skills: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/ats-score")
async def calculate_ats_score(
    text: str,
    target_role: Optional[str] = None,
    resume_service: ResumeAnalyzerService = Depends(get_resume_service)
):
    """
    Calculate ATS score for provided text
    
    **Input:**
    - text: Resume text content
    - target_role: Target job role (optional)
    
    **Output:**
    - ats_score: Detailed ATS compatibility score
    """
    try:
        logger.info("Calculating ATS score for provided text")
        
        if not text or len(text.strip()) < 50:
            raise HTTPException(status_code=400, detail="Text is too short for ATS analysis")
        
        # Extract skills first
        skills = await resume_service._extract_skills(text)
        
        # Calculate ATS score
        ats_score = await resume_service._calculate_ats_score(text, skills, target_role)
        
        return {
            "success": True,
            "data": {
                "ats_score": ats_score,
                "analysis": {
                    "text_length": len(text),
                    "word_count": len(text.split()),
                    "skills_found": len(skills.technical_skills) + len(skills.soft_skills),
                    "target_role": target_role
                }
            }
        }
        
    except Exception as e:
        logger.error(f"Error calculating ATS score: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/supported-formats")
async def get_supported_formats():
    """
    Get list of supported file formats
    
    **Output:**
    - List of supported file formats and their descriptions
    """
    return {
        "success": True,
        "data": {
            "supported_formats": [
                {
                    "extension": "pdf",
                    "description": "Portable Document Format",
                    "mime_types": ["application/pdf"]
                },
                {
                    "extension": "doc",
                    "description": "Microsoft Word Document (Legacy)",
                    "mime_types": ["application/msword"]
                },
                {
                    "extension": "docx",
                    "description": "Microsoft Word Document",
                    "mime_types": ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
                },
                {
                    "extension": "txt",
                    "description": "Plain Text File",
                    "mime_types": ["text/plain"]
                }
            ],
            "max_file_size_mb": settings.MAX_FILE_SIZE_MB,
            "recommendations": [
                "PDF format is recommended for best text extraction",
                "Avoid image-based PDFs or scanned documents",
                "Use standard fonts and formatting for better parsing",
                "Keep file size under the maximum limit"
            ]
        }
    }


@router.post("/compare-with-job")
async def compare_resume_with_job(
    resume_text: str,
    job_description: str,
    resume_service: ResumeAnalyzerService = Depends(get_resume_service)
):
    """
    Compare resume with job description
    
    **Input:**
    - resume_text: Resume content
    - job_description: Job description text
    
    **Output:**
    - match_score: Compatibility score
    - skill_gaps: Missing skills
    - recommendations: Improvement suggestions
    """
    try:
        logger.info("Comparing resume with job description")
        
        if not resume_text or not job_description:
            raise HTTPException(status_code=400, detail="Both resume text and job description are required")
        
        # Extract skills from both texts
        resume_skills = await resume_service._extract_skills(resume_text)
        job_skills = await resume_service._extract_skills(job_description)
        
        # Calculate similarity
        resume_skill_list = resume_skills.technical_skills + resume_skills.soft_skills
        job_skill_list = job_skills.technical_skills + job_skills.soft_skills
        
        skill_similarity = resume_service.model_manager.calculate_skill_similarity(
            resume_skill_list, job_skill_list
        )
        
        # Find skill gaps
        resume_skills_lower = set(skill.lower() for skill in resume_skill_list)
        job_skills_lower = set(skill.lower() for skill in job_skill_list)
        skill_gaps = list(job_skills_lower - resume_skills_lower)
        
        # Generate recommendations
        recommendations = []
        if skill_gaps:
            recommendations.append(f"Consider adding these skills: {', '.join(skill_gaps[:5])}")
        if skill_similarity < 0.5:
            recommendations.append("Tailor your resume more closely to the job requirements")
        if skill_similarity > 0.8:
            recommendations.append("Excellent match! Highlight your relevant experience")
        
        return {
            "success": True,
            "data": {
                "match_score": round(skill_similarity, 3),
                "skill_gaps": skill_gaps[:10],  # Top 10 gaps
                "recommendations": recommendations,
                "analysis": {
                    "resume_skills_count": len(resume_skill_list),
                    "job_skills_count": len(job_skill_list),
                    "common_skills": len(resume_skills_lower.intersection(job_skills_lower)),
                    "match_quality": "excellent" if skill_similarity > 0.8 else "good" if skill_similarity > 0.6 else "fair" if skill_similarity > 0.4 else "poor"
                }
            }
        }
        
    except Exception as e:
        logger.error(f"Error comparing resume with job: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")