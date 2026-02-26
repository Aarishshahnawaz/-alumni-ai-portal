"""
Sentiment Analysis Service
Analyzes sentiment and engagement in mentorship messages
"""

import asyncio
from typing import Dict, Any, List
from loguru import logger
import re
from textblob import TextBlob
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

from app.models.schemas import SentimentInput, SentimentScore, EngagementMetrics
from app.services.model_manager import ModelManager
from app.core.exceptions import PredictionException


class SentimentAnalysisService:
    """Service for analyzing sentiment and engagement in text"""
    
    def __init__(self, model_manager: ModelManager):
        self.model_manager = model_manager
        
        # Engagement indicators
        self.positive_indicators = [
            'excited', 'thrilled', 'amazing', 'fantastic', 'excellent', 'outstanding',
            'grateful', 'thankful', 'appreciate', 'love', 'enjoy', 'passionate',
            'motivated', 'inspired', 'eager', 'looking forward', 'can\'t wait'
        ]
        
        self.negative_indicators = [
            'frustrated', 'disappointed', 'confused', 'struggling', 'difficult',
            'challenging', 'overwhelmed', 'stressed', 'worried', 'concerned',
            'unsure', 'doubt', 'hesitant', 'reluctant'
        ]
        
        self.enthusiasm_indicators = [
            'wow', 'awesome', 'incredible', 'brilliant', 'perfect', 'exactly',
            'absolutely', 'definitely', 'certainly', 'totally', 'completely',
            '!', 'thank you so much', 'this is great', 'love this'
        ]
        
        self.professionalism_indicators = {
            'positive': [
                'thank you', 'please', 'appreciate', 'understand', 'respect',
                'professional', 'appropriate', 'formal', 'courteous', 'polite'
            ],
            'negative': [
                'whatever', 'don\'t care', 'stupid', 'dumb', 'hate', 'sucks',
                'terrible', 'awful', 'worst', 'ridiculous'
            ]
        }
    
    async def analyze_sentiment(self, input_data: SentimentInput) -> Dict[str, Any]:
        """Analyze sentiment and engagement in text"""
        try:
            logger.info(f"Analyzing sentiment for {input_data.context} context")
            
            text = input_data.text.strip()
            if not text:
                raise PredictionException("Empty text provided for analysis")
            
            # Get sentiment scores using multiple methods
            sentiment_score = await self._calculate_sentiment_scores(text)
            
            # Calculate engagement metrics
            engagement_metrics = await self._calculate_engagement_metrics(text, input_data.context)
            
            # Generate insights
            insights = await self._generate_insights(text, sentiment_score, engagement_metrics)
            
            # Generate recommendations
            recommendations = await self._generate_recommendations(
                sentiment_score, engagement_metrics, input_data.context
            )
            
            return {
                'sentiment_score': sentiment_score,
                'engagement_metrics': engagement_metrics,
                'insights': insights,
                'recommendations': recommendations,
                'analysis': {
                    'text_length': len(text),
                    'word_count': len(text.split()),
                    'sentence_count': len(re.split(r'[.!?]+', text)),
                    'context': input_data.context,
                    'dominant_emotion': await self._identify_dominant_emotion(text)
                }
            }
            
        except Exception as e:
            logger.error(f"Error in sentiment analysis: {e}")
            if isinstance(e, PredictionException):
                raise
            raise PredictionException(str(e))
    
    async def _calculate_sentiment_scores(self, text: str) -> SentimentScore:
        """Calculate sentiment scores using multiple methods"""
        try:
            # TextBlob analysis
            blob = TextBlob(text)
            textblob_polarity = blob.sentiment.polarity
            textblob_subjectivity = blob.sentiment.subjectivity
            
            # VADER analysis
            vader_analyzer = self.model_manager.get_model('vader')
            vader_scores = vader_analyzer.polarity_scores(text)
            
            return SentimentScore(
                polarity=round(textblob_polarity, 3),
                subjectivity=round(textblob_subjectivity, 3),
                compound=round(vader_scores['compound'], 3),
                positive=round(vader_scores['pos'], 3),
                neutral=round(vader_scores['neu'], 3),
                negative=round(vader_scores['neg'], 3)
            )
            
        except Exception as e:
            logger.error(f"Error calculating sentiment scores: {e}")
            # Return neutral scores on error
            return SentimentScore(
                polarity=0.0,
                subjectivity=0.5,
                compound=0.0,
                positive=0.33,
                neutral=0.34,
                negative=0.33
            )
    
    async def _calculate_engagement_metrics(self, text: str, context: str) -> EngagementMetrics:
        """Calculate engagement metrics specific to the context"""
        try:
            text_lower = text.lower()
            
            # Base engagement score
            engagement_score = 0.5
            
            # Positive indicators boost engagement
            positive_count = sum(1 for indicator in self.positive_indicators if indicator in text_lower)
            engagement_score += min(0.3, positive_count * 0.05)
            
            # Negative indicators reduce engagement
            negative_count = sum(1 for indicator in self.negative_indicators if indicator in text_lower)
            engagement_score -= min(0.2, negative_count * 0.05)
            
            # Question marks indicate engagement
            question_count = text.count('?')
            engagement_score += min(0.1, question_count * 0.02)
            
            # Exclamation marks indicate enthusiasm
            exclamation_count = text.count('!')
            engagement_score += min(0.1, exclamation_count * 0.02)
            
            # Length factor (too short or too long reduces engagement)
            word_count = len(text.split())
            if 10 <= word_count <= 200:
                engagement_score += 0.1
            elif word_count < 5:
                engagement_score -= 0.2
            elif word_count > 500:
                engagement_score -= 0.1
            
            # Calculate enthusiasm level
            enthusiasm_level = await self._calculate_enthusiasm_level(text)
            
            # Calculate communication quality
            communication_quality = await self._calculate_communication_quality(text)
            
            # Calculate professionalism
            professionalism = await self._calculate_professionalism(text, context)
            
            # Ensure engagement score is within bounds
            engagement_score = max(0.0, min(1.0, engagement_score))
            
            return EngagementMetrics(
                engagement_score=round(engagement_score, 3),
                enthusiasm_level=enthusiasm_level,
                communication_quality=round(communication_quality, 3),
                professionalism=round(professionalism, 3)
            )
            
        except Exception as e:
            logger.error(f"Error calculating engagement metrics: {e}")
            return EngagementMetrics(
                engagement_score=0.5,
                enthusiasm_level="medium",
                communication_quality=0.5,
                professionalism=0.5
            )
    
    async def _calculate_enthusiasm_level(self, text: str) -> str:
        """Calculate enthusiasm level from text"""
        text_lower = text.lower()
        enthusiasm_score = 0
        
        # Count enthusiasm indicators
        for indicator in self.enthusiasm_indicators:
            if indicator in text_lower:
                enthusiasm_score += 1
        
        # Count exclamation marks
        enthusiasm_score += text.count('!')
        
        # Count capital letters (but not if the whole text is caps)
        if not text.isupper():
            caps_ratio = sum(1 for c in text if c.isupper()) / len(text) if text else 0
            if 0.1 <= caps_ratio <= 0.3:  # Moderate use of caps
                enthusiasm_score += 1
        
        # Determine level
        if enthusiasm_score >= 4:
            return "high"
        elif enthusiasm_score >= 2:
            return "medium"
        else:
            return "low"
    
    async def _calculate_communication_quality(self, text: str) -> float:
        """Calculate communication quality score"""
        score = 0.5  # Base score
        
        # Grammar and spelling (simplified check)
        blob = TextBlob(text)
        try:
            # Check if TextBlob can correct the text (indicates errors)
            corrected = str(blob.correct())
            if corrected == text:
                score += 0.2  # No corrections needed
            else:
                # Count differences
                differences = sum(1 for a, b in zip(text.split(), corrected.split()) if a != b)
                error_ratio = differences / len(text.split()) if text.split() else 0
                score -= min(0.3, error_ratio * 0.5)
        except:
            pass  # Skip if correction fails
        
        # Sentence structure
        sentences = re.split(r'[.!?]+', text)
        valid_sentences = [s.strip() for s in sentences if s.strip()]
        
        if valid_sentences:
            avg_sentence_length = sum(len(s.split()) for s in valid_sentences) / len(valid_sentences)
            # Ideal sentence length is 10-25 words
            if 10 <= avg_sentence_length <= 25:
                score += 0.1
            elif avg_sentence_length < 5 or avg_sentence_length > 40:
                score -= 0.1
        
        # Punctuation usage
        if any(p in text for p in '.!?'):
            score += 0.1
        
        # Capitalization at sentence beginnings
        proper_caps = sum(1 for s in valid_sentences if s and s[0].isupper())
        if proper_caps == len(valid_sentences) and valid_sentences:
            score += 0.1
        
        return max(0.0, min(1.0, score))
    
    async def _calculate_professionalism(self, text: str, context: str) -> float:
        """Calculate professionalism score"""
        text_lower = text.lower()
        score = 0.7  # Base professional score
        
        # Positive professional indicators
        positive_count = sum(1 for indicator in self.professionalism_indicators['positive'] 
                           if indicator in text_lower)
        score += min(0.2, positive_count * 0.05)
        
        # Negative professional indicators
        negative_count = sum(1 for indicator in self.professionalism_indicators['negative'] 
                           if indicator in text_lower)
        score -= min(0.4, negative_count * 0.1)
        
        # Context-specific adjustments
        if context == 'mentorship':
            # Mentorship should be more formal
            if any(word in text_lower for word in ['please', 'thank you', 'appreciate']):
                score += 0.1
            if any(word in text_lower for word in ['hey', 'sup', 'yo']):
                score -= 0.2
        
        # Excessive punctuation reduces professionalism
        excessive_punct = text.count('!') > 3 or text.count('?') > 5
        if excessive_punct:
            score -= 0.1
        
        # All caps reduces professionalism
        if text.isupper() and len(text) > 10:
            score -= 0.3
        
        return max(0.0, min(1.0, score))
    
    async def _identify_dominant_emotion(self, text: str) -> str:
        """Identify the dominant emotion in the text"""
        text_lower = text.lower()
        
        emotion_indicators = {
            'joy': ['happy', 'excited', 'thrilled', 'delighted', 'pleased', 'glad'],
            'gratitude': ['thank', 'grateful', 'appreciate', 'thankful'],
            'enthusiasm': ['amazing', 'awesome', 'fantastic', 'incredible', 'brilliant'],
            'concern': ['worried', 'concerned', 'anxious', 'nervous'],
            'frustration': ['frustrated', 'annoyed', 'disappointed', 'upset'],
            'confusion': ['confused', 'unclear', 'don\'t understand', 'puzzled'],
            'determination': ['determined', 'committed', 'focused', 'dedicated'],
            'curiosity': ['curious', 'interested', 'wondering', 'question']
        }
        
        emotion_scores = {}
        for emotion, indicators in emotion_indicators.items():
            score = sum(1 for indicator in indicators if indicator in text_lower)
            if score > 0:
                emotion_scores[emotion] = score
        
        if emotion_scores:
            return max(emotion_scores, key=emotion_scores.get)
        else:
            return 'neutral'
    
    async def _generate_insights(self, text: str, sentiment_score: SentimentScore, 
                               engagement_metrics: EngagementMetrics) -> List[str]:
        """Generate insights based on the analysis"""
        insights = []
        
        # Sentiment insights
        if sentiment_score.compound > 0.5:
            insights.append("The message conveys strong positive sentiment")
        elif sentiment_score.compound < -0.5:
            insights.append("The message contains negative sentiment that may need attention")
        else:
            insights.append("The message has neutral to mild sentiment")
        
        # Engagement insights
        if engagement_metrics.engagement_score > 0.7:
            insights.append("High engagement level detected - the person seems very involved")
        elif engagement_metrics.engagement_score < 0.4:
            insights.append("Low engagement detected - may indicate disinterest or formality")
        
        # Enthusiasm insights
        if engagement_metrics.enthusiasm_level == "high":
            insights.append("Strong enthusiasm and excitement expressed")
        elif engagement_metrics.enthusiasm_level == "low":
            insights.append("Limited enthusiasm - consider ways to increase motivation")
        
        # Communication quality insights
        if engagement_metrics.communication_quality > 0.8:
            insights.append("Excellent communication quality with clear expression")
        elif engagement_metrics.communication_quality < 0.5:
            insights.append("Communication could be improved for better clarity")
        
        # Professionalism insights
        if engagement_metrics.professionalism > 0.8:
            insights.append("Highly professional tone maintained throughout")
        elif engagement_metrics.professionalism < 0.5:
            insights.append("Consider adopting a more professional tone")
        
        return insights
    
    async def _generate_recommendations(self, sentiment_score: SentimentScore, 
                                     engagement_metrics: EngagementMetrics, 
                                     context: str) -> List[str]:
        """Generate recommendations based on the analysis"""
        recommendations = []
        
        # Sentiment-based recommendations
        if sentiment_score.compound < -0.3:
            recommendations.append("Address any concerns or negative feelings expressed")
            recommendations.append("Consider scheduling a follow-up conversation")
        
        # Engagement-based recommendations
        if engagement_metrics.engagement_score < 0.5:
            recommendations.append("Try to increase engagement with more interactive questions")
            recommendations.append("Share relevant examples or experiences to spark interest")
        
        if engagement_metrics.enthusiasm_level == "low":
            recommendations.append("Look for ways to motivate and inspire more enthusiasm")
            recommendations.append("Celebrate small wins and progress made")
        
        # Communication quality recommendations
        if engagement_metrics.communication_quality < 0.6:
            recommendations.append("Encourage clearer and more structured communication")
            recommendations.append("Provide feedback on communication style if appropriate")
        
        # Context-specific recommendations
        if context == "mentorship":
            if engagement_metrics.professionalism < 0.6:
                recommendations.append("Gently guide towards more professional communication")
            
            if sentiment_score.compound > 0.5 and engagement_metrics.engagement_score > 0.7:
                recommendations.append("Great mentorship dynamic - continue current approach")
                recommendations.append("Consider increasing meeting frequency or depth of topics")
        
        # General recommendations
        if not recommendations:
            recommendations.append("Communication appears balanced and appropriate")
            recommendations.append("Continue fostering open and honest dialogue")
        
        return recommendations[:5]  # Limit to top 5 recommendations