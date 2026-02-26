"""
Career Prediction Service
Predicts career paths based on user skills and experience
"""

import asyncio
from typing import List, Dict, Any, Tuple
from loguru import logger
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

from app.models.schemas import CareerPredictionInput, CareerPath
from app.services.model_manager import ModelManager
from app.core.exceptions import PredictionException


class CareerPredictionService:
    """Service for predicting career paths"""
    
    def __init__(self, model_manager: ModelManager):
        self.model_manager = model_manager
    
    async def predict_career_paths(self, input_data: CareerPredictionInput) -> Dict[str, Any]:
        """Predict career paths based on user skills and experience"""
        try:
            logger.info(f"Predicting career paths for skills: {input_data.skills}")
            
            # Get career data
            career_data = self.model_manager.get_model('career_data')
            
            # Calculate career matches
            career_matches = await self._calculate_career_matches(input_data, career_data)
            
            # Generate career paths
            predicted_paths = await self._generate_career_paths(career_matches, input_data)
            
            # Identify skill gaps
            skill_gaps = await self._identify_skill_gaps(input_data.skills, career_matches)
            
            # Generate recommendations
            recommendations = await self._generate_recommendations(input_data, predicted_paths, skill_gaps)
            
            return {
                'predicted_paths': predicted_paths,
                'skill_gaps': skill_gaps,
                'recommendations': recommendations,
                'analysis': {
                    'input_skills_count': len(input_data.skills),
                    'experience_level': self._categorize_experience(input_data.experience_years),
                    'top_match_score': predicted_paths[0].probability if predicted_paths else 0.0
                }
            }
            
        except Exception as e:
            logger.error(f"Error in career prediction: {e}")
            raise PredictionException(str(e))
    
    async def _calculate_career_matches(self, input_data: CareerPredictionInput, career_data: Dict) -> List[Tuple[str, float, Dict]]:
        """Calculate how well user skills match each career"""
        matches = []
        user_skills = set(skill.lower().strip() for skill in input_data.skills)
        
        for career_name, career_info in career_data.items():
            career_skills = set(skill.lower().strip() for skill in career_info['skills'])
            
            # Calculate skill overlap
            skill_overlap = len(user_skills.intersection(career_skills))
            total_career_skills = len(career_skills)
            
            # Base score from skill overlap
            base_score = skill_overlap / total_career_skills if total_career_skills > 0 else 0
            
            # Adjust score based on experience
            experience_bonus = self._calculate_experience_bonus(input_data.experience_years, career_name)
            
            # Adjust score based on education
            education_bonus = self._calculate_education_bonus(input_data.education_level, career_name)
            
            # Calculate final score
            final_score = min(1.0, base_score + experience_bonus + education_bonus)
            
            matches.append((career_name, final_score, career_info))
        
        # Sort by score descending
        matches.sort(key=lambda x: x[1], reverse=True)
        return matches
    
    def _calculate_experience_bonus(self, experience_years: int, career_name: str) -> float:
        """Calculate experience bonus for career match"""
        # Experience requirements by career (in years)
        experience_requirements = {
            'software_engineer': 2,
            'data_scientist': 3,
            'product_manager': 5,
            'devops_engineer': 3,
            'ui_ux_designer': 2
        }
        
        required_exp = experience_requirements.get(career_name, 2)
        
        if experience_years >= required_exp:
            return 0.1  # Bonus for meeting experience requirement
        elif experience_years >= required_exp * 0.5:
            return 0.05  # Partial bonus
        else:
            return -0.05  # Penalty for insufficient experience
    
    def _calculate_education_bonus(self, education_level: str, career_name: str) -> float:
        """Calculate education bonus for career match"""
        education_scores = {
            'high_school': 0.0,
            'associate': 0.02,
            'bachelor': 0.05,
            'master': 0.08,
            'doctorate': 0.1
        }
        
        # Some careers benefit more from higher education
        education_sensitive_careers = ['data_scientist', 'product_manager']
        
        base_bonus = education_scores.get(education_level, 0.05)
        
        if career_name in education_sensitive_careers:
            return base_bonus * 1.5
        
        return base_bonus
    
    async def _generate_career_paths(self, career_matches: List[Tuple[str, float, Dict]], input_data: CareerPredictionInput) -> List[CareerPath]:
        """Generate career path objects from matches"""
        paths = []
        
        # Take top 5 matches
        for career_name, score, career_info in career_matches[:5]:
            if score > 0.1:  # Only include reasonable matches
                
                # Calculate time to achieve based on current experience and requirements
                time_to_achieve = self._calculate_time_to_achieve(
                    input_data.experience_years, 
                    career_name,
                    score
                )
                
                # Identify missing skills
                user_skills = set(skill.lower() for skill in input_data.skills)
                career_skills = set(skill.lower() for skill in career_info['skills'])
                missing_skills = list(career_skills - user_skills)
                
                path = CareerPath(
                    role=career_name.replace('_', ' ').title(),
                    probability=round(score, 3),
                    required_skills=career_info['skills'],
                    salary_range=career_info['salary_range'],
                    growth_potential=career_info['growth_potential'],
                    time_to_achieve=time_to_achieve
                )
                
                paths.append(path)
        
        return paths
    
    def _calculate_time_to_achieve(self, current_experience: int, career_name: str, match_score: float) -> str:
        """Calculate estimated time to achieve career goal"""
        base_requirements = {
            'software_engineer': 1,
            'data_scientist': 2,
            'product_manager': 3,
            'devops_engineer': 2,
            'ui_ux_designer': 1
        }
        
        required_years = base_requirements.get(career_name, 2)
        
        # Adjust based on match score
        if match_score > 0.8:
            time_factor = 0.5  # Already well-matched
        elif match_score > 0.6:
            time_factor = 0.75
        elif match_score > 0.4:
            time_factor = 1.0
        else:
            time_factor = 1.5
        
        # Calculate additional years needed
        years_needed = max(0, required_years - current_experience) * time_factor
        
        if years_needed < 0.5:
            return "Immediately"
        elif years_needed < 1:
            return "6-12 months"
        elif years_needed < 2:
            return "1-2 years"
        elif years_needed < 3:
            return "2-3 years"
        else:
            return "3+ years"
    
    async def _identify_skill_gaps(self, user_skills: List[str], career_matches: List[Tuple[str, float, Dict]]) -> List[str]:
        """Identify skills that would improve career prospects"""
        skill_importance = {}
        user_skills_lower = set(skill.lower() for skill in user_skills)
        
        # Analyze top career matches to find important missing skills
        for career_name, score, career_info in career_matches[:3]:
            for skill in career_info['skills']:
                skill_lower = skill.lower()
                if skill_lower not in user_skills_lower:
                    # Weight by career match score
                    skill_importance[skill] = skill_importance.get(skill, 0) + score
        
        # Sort skills by importance and return top gaps
        sorted_gaps = sorted(skill_importance.items(), key=lambda x: x[1], reverse=True)
        return [skill for skill, importance in sorted_gaps[:10]]
    
    async def _generate_recommendations(self, input_data: CareerPredictionInput, 
                                      predicted_paths: List[CareerPath], 
                                      skill_gaps: List[str]) -> List[str]:
        """Generate personalized recommendations"""
        recommendations = []
        
        if not predicted_paths:
            recommendations.append("Consider developing more specific technical skills to improve career match scores")
            return recommendations
        
        top_path = predicted_paths[0]
        
        # Experience-based recommendations
        if input_data.experience_years < 2:
            recommendations.append(f"Focus on building foundational skills for {top_path.role}")
            recommendations.append("Consider internships or entry-level positions to gain practical experience")
        elif input_data.experience_years < 5:
            recommendations.append(f"Develop specialized skills to advance in {top_path.role}")
            recommendations.append("Look for mentorship opportunities with senior professionals")
        else:
            recommendations.append(f"Consider leadership roles or specialization in {top_path.role}")
            recommendations.append("Explore opportunities to mentor junior professionals")
        
        # Skill gap recommendations
        if skill_gaps:
            top_gaps = skill_gaps[:3]
            recommendations.append(f"Priority skills to develop: {', '.join(top_gaps)}")
            recommendations.append("Consider online courses or certifications in these areas")
        
        # Career-specific recommendations
        if top_path.role.lower().replace(' ', '_') == 'data_scientist':
            recommendations.append("Build a portfolio of data science projects on GitHub")
            recommendations.append("Consider pursuing advanced statistics or machine learning courses")
        elif top_path.role.lower().replace(' ', '_') == 'software_engineer':
            recommendations.append("Contribute to open-source projects to showcase your skills")
            recommendations.append("Practice coding problems and system design")
        
        return recommendations
    
    def _categorize_experience(self, years: int) -> str:
        """Categorize experience level"""
        if years == 0:
            return "Entry Level"
        elif years <= 2:
            return "Junior"
        elif years <= 5:
            return "Mid-Level"
        elif years <= 10:
            return "Senior"
        else:
            return "Executive"