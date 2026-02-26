"""
Mentor Compatibility Index (MCI) Service
Calculates compatibility between mentors and students
"""

import asyncio
from typing import Dict, Any, List
from loguru import logger
import numpy as np

from app.models.schemas import CompatibilityInput, CompatibilityScore, MentorProfile, StudentProfile
from app.services.model_manager import ModelManager
from app.core.exceptions import PredictionException


class MentorCompatibilityService:
    """Service for calculating mentor-student compatibility"""
    
    def __init__(self, model_manager: ModelManager):
        self.model_manager = model_manager
    
    async def calculate_compatibility(self, input_data: CompatibilityInput) -> Dict[str, Any]:
        """
        Calculate Mentor Compatibility Index (MCI)
        MCI = (SkillSimilarity * 0.4) + (IndustryMatch * 0.25) + (ExperienceAlignment * 0.2) + (BehaviorScore * 0.15)
        """
        try:
            logger.info("Calculating mentor-student compatibility")
            
            mentor = input_data.mentor
            student = input_data.student
            
            # Calculate individual components
            skill_similarity = await self._calculate_skill_similarity(mentor, student)
            industry_match = await self._calculate_industry_match(mentor, student)
            experience_alignment = await self._calculate_experience_alignment(mentor, student)
            behavior_score = await self._calculate_behavior_score(mentor, student)
            
            # Calculate overall MCI using the specified formula
            overall_mci = (
                skill_similarity * 0.4 +
                industry_match * 0.25 +
                experience_alignment * 0.2 +
                behavior_score * 0.15
            )
            
            # Create compatibility score object
            compatibility_score = CompatibilityScore(
                skill_similarity=round(skill_similarity, 3),
                industry_match=round(industry_match, 3),
                experience_alignment=round(experience_alignment, 3),
                behavior_score=round(behavior_score, 3),
                overall_mci=round(overall_mci, 3)
            )
            
            # Generate explanations
            explanation = await self._generate_explanation(
                mentor, student, compatibility_score
            )
            
            # Generate recommendations
            recommendations = await self._generate_recommendations(
                mentor, student, compatibility_score
            )
            
            return {
                'compatibility_score': compatibility_score,
                'explanation': explanation,
                'recommendations': recommendations,
                'analysis': {
                    'match_quality': self._categorize_match_quality(overall_mci),
                    'strongest_factor': self._identify_strongest_factor(compatibility_score),
                    'improvement_areas': self._identify_improvement_areas(compatibility_score)
                }
            }
            
        except Exception as e:
            logger.error(f"Error calculating compatibility: {e}")
            raise PredictionException(str(e))
    
    async def _calculate_skill_similarity(self, mentor: MentorProfile, student: StudentProfile) -> float:
        """Calculate skill similarity between mentor and student (40% weight)"""
        try:
            # Use model manager's skill similarity calculation
            similarity = self.model_manager.calculate_skill_similarity(
                mentor.skills, student.skills
            )
            
            # Boost similarity if mentor has skills student wants to learn
            student_goals_skills = []
            for goal in student.career_goals:
                # Extract potential skills from career goals
                goal_words = goal.lower().split()
                technical_skills = self.model_manager.get_model('technical_skills')
                for word in goal_words:
                    if word in technical_skills:
                        student_goals_skills.append(word)
            
            if student_goals_skills:
                goal_similarity = self.model_manager.calculate_skill_similarity(
                    mentor.skills, student_goals_skills
                )
                # Weighted average: current skills (70%) + goal skills (30%)
                similarity = similarity * 0.7 + goal_similarity * 0.3
            
            return min(1.0, similarity)
            
        except Exception as e:
            logger.error(f"Error calculating skill similarity: {e}")
            return 0.0
    
    async def _calculate_industry_match(self, mentor: MentorProfile, student: StudentProfile) -> float:
        """Calculate industry match score (25% weight)"""
        try:
            # Direct industry match
            if mentor.industry.lower() == student.target_industry.lower():
                base_score = 1.0
            else:
                # Calculate semantic similarity between industries
                industry_similarity = self.model_manager.calculate_text_similarity(
                    mentor.industry, student.target_industry
                )
                base_score = industry_similarity
            
            # Consider related industries
            related_industries = {
                'technology': ['software', 'fintech', 'edtech', 'healthtech'],
                'finance': ['fintech', 'banking', 'investment', 'insurance'],
                'healthcare': ['healthtech', 'biotech', 'pharmaceuticals', 'medical'],
                'education': ['edtech', 'training', 'academic', 'research']
            }
            
            mentor_industry_lower = mentor.industry.lower()
            student_industry_lower = student.target_industry.lower()
            
            # Check if industries are related
            for main_industry, related in related_industries.items():
                if (main_industry in mentor_industry_lower and student_industry_lower in related) or \
                   (main_industry in student_industry_lower and mentor_industry_lower in related):
                    base_score = max(base_score, 0.7)
            
            return min(1.0, base_score)
            
        except Exception as e:
            logger.error(f"Error calculating industry match: {e}")
            return 0.0
    
    async def _calculate_experience_alignment(self, mentor: MentorProfile, student: StudentProfile) -> float:
        """Calculate experience alignment score (20% weight)"""
        try:
            experience_gap = mentor.experience_years - student.experience_years
            
            # Optimal experience gap is 3-8 years
            if 3 <= experience_gap <= 8:
                base_score = 1.0
            elif 2 <= experience_gap <= 10:
                base_score = 0.8
            elif 1 <= experience_gap <= 12:
                base_score = 0.6
            elif experience_gap > 0:
                base_score = 0.4
            else:
                # Mentor has less experience than student
                base_score = 0.2
            
            # Adjust based on mentor's current role seniority
            senior_roles = ['senior', 'lead', 'principal', 'director', 'manager', 'vp', 'cto', 'ceo']
            mentor_role_lower = mentor.current_role.lower()
            
            if any(role in mentor_role_lower for role in senior_roles):
                base_score = min(1.0, base_score + 0.1)
            
            return base_score
            
        except Exception as e:
            logger.error(f"Error calculating experience alignment: {e}")
            return 0.0
    
    async def _calculate_behavior_score(self, mentor: MentorProfile, student: StudentProfile) -> float:
        """Calculate behavioral compatibility score (15% weight)"""
        try:
            score = 0.5  # Base score
            
            # Mentorship style compatibility
            if mentor.mentorship_style and student.learning_style:
                style_compatibility = {
                    ('hands-on', 'practical'): 0.9,
                    ('theoretical', 'academic'): 0.9,
                    ('collaborative', 'interactive'): 0.9,
                    ('structured', 'organized'): 0.8,
                    ('flexible', 'adaptive'): 0.8
                }
                
                mentor_style = mentor.mentorship_style.lower()
                student_style = student.learning_style.lower()
                
                for (m_style, s_style), compatibility in style_compatibility.items():
                    if m_style in mentor_style and s_style in student_style:
                        score = max(score, compatibility)
            
            # Availability alignment
            if mentor.availability and student.availability:
                if mentor.availability.lower() == student.availability.lower():
                    score = min(1.0, score + 0.2)
                elif 'flexible' in mentor.availability.lower() or 'flexible' in student.availability.lower():
                    score = min(1.0, score + 0.1)
            
            # Company size preference (if mentor works at preferred company size)
            if mentor.company_size:
                company_size_bonus = {
                    'startup': 0.1,
                    'small': 0.05,
                    'medium': 0.05,
                    'large': 0.1,
                    'enterprise': 0.1
                }
                score = min(1.0, score + company_size_bonus.get(mentor.company_size.lower(), 0))
            
            return score
            
        except Exception as e:
            logger.error(f"Error calculating behavior score: {e}")
            return 0.5
    
    async def _generate_explanation(self, mentor: MentorProfile, student: StudentProfile, 
                                  compatibility_score: CompatibilityScore) -> Dict[str, str]:
        """Generate explanations for each compatibility component"""
        explanations = {}
        
        # Skill similarity explanation
        if compatibility_score.skill_similarity > 0.8:
            explanations['skill_similarity'] = "Excellent skill alignment - mentor has most skills student wants to develop"
        elif compatibility_score.skill_similarity > 0.6:
            explanations['skill_similarity'] = "Good skill overlap with room for learning new skills"
        elif compatibility_score.skill_similarity > 0.4:
            explanations['skill_similarity'] = "Moderate skill alignment - some complementary skills present"
        else:
            explanations['skill_similarity'] = "Limited skill overlap - opportunity for diverse learning"
        
        # Industry match explanation
        if compatibility_score.industry_match > 0.8:
            explanations['industry_match'] = "Strong industry alignment - mentor has direct relevant experience"
        elif compatibility_score.industry_match > 0.5:
            explanations['industry_match'] = "Related industry experience that can provide valuable insights"
        else:
            explanations['industry_match'] = "Different industry - opportunity for cross-industry perspectives"
        
        # Experience alignment explanation
        experience_gap = mentor.experience_years - student.experience_years
        if compatibility_score.experience_alignment > 0.8:
            explanations['experience_alignment'] = f"Optimal experience gap ({experience_gap} years) for effective mentoring"
        elif compatibility_score.experience_alignment > 0.6:
            explanations['experience_alignment'] = f"Good experience difference ({experience_gap} years) for learning"
        else:
            explanations['experience_alignment'] = f"Experience gap ({experience_gap} years) may require adjusted expectations"
        
        # Behavior score explanation
        if compatibility_score.behavior_score > 0.7:
            explanations['behavior_score'] = "Strong behavioral compatibility - similar working and learning styles"
        elif compatibility_score.behavior_score > 0.5:
            explanations['behavior_score'] = "Good compatibility with some style differences to navigate"
        else:
            explanations['behavior_score'] = "Different styles - may require extra communication and flexibility"
        
        return explanations
    
    async def _generate_recommendations(self, mentor: MentorProfile, student: StudentProfile,
                                      compatibility_score: CompatibilityScore) -> List[str]:
        """Generate recommendations based on compatibility analysis"""
        recommendations = []
        
        # Overall compatibility recommendations
        if compatibility_score.overall_mci > 0.8:
            recommendations.append("Excellent match! This mentorship has high potential for success")
            recommendations.append("Focus on setting clear goals and regular check-ins")
        elif compatibility_score.overall_mci > 0.6:
            recommendations.append("Good compatibility with strong potential for mutual benefit")
            recommendations.append("Address any style differences early in the relationship")
        elif compatibility_score.overall_mci > 0.4:
            recommendations.append("Moderate match - success will depend on commitment from both parties")
            recommendations.append("Consider a trial period to assess working relationship")
        else:
            recommendations.append("Lower compatibility - consider if this is the best match")
            recommendations.append("May work better for specific, short-term learning goals")
        
        # Specific improvement recommendations
        if compatibility_score.skill_similarity < 0.5:
            recommendations.append("Consider focusing on transferable skills and general career advice")
        
        if compatibility_score.industry_match < 0.5:
            recommendations.append("Leverage cross-industry insights and focus on universal skills")
        
        if compatibility_score.experience_alignment < 0.5:
            recommendations.append("Adjust mentoring approach based on experience gap")
        
        if compatibility_score.behavior_score < 0.5:
            recommendations.append("Discuss communication preferences and working styles upfront")
        
        # Meeting frequency recommendations
        if compatibility_score.overall_mci > 0.7:
            recommendations.append("Consider bi-weekly meetings for optimal engagement")
        else:
            recommendations.append("Start with monthly meetings and adjust based on progress")
        
        return recommendations
    
    def _categorize_match_quality(self, mci_score: float) -> str:
        """Categorize the overall match quality"""
        if mci_score >= 0.8:
            return "Excellent"
        elif mci_score >= 0.6:
            return "Good"
        elif mci_score >= 0.4:
            return "Fair"
        else:
            return "Poor"
    
    def _identify_strongest_factor(self, compatibility_score: CompatibilityScore) -> str:
        """Identify the strongest compatibility factor"""
        factors = {
            'skill_similarity': compatibility_score.skill_similarity,
            'industry_match': compatibility_score.industry_match,
            'experience_alignment': compatibility_score.experience_alignment,
            'behavior_score': compatibility_score.behavior_score
        }
        
        return max(factors, key=factors.get)
    
    def _identify_improvement_areas(self, compatibility_score: CompatibilityScore) -> List[str]:
        """Identify areas that could be improved"""
        areas = []
        
        if compatibility_score.skill_similarity < 0.6:
            areas.append("skill_alignment")
        if compatibility_score.industry_match < 0.6:
            areas.append("industry_relevance")
        if compatibility_score.experience_alignment < 0.6:
            areas.append("experience_gap")
        if compatibility_score.behavior_score < 0.6:
            areas.append("communication_style")
        
        return areas