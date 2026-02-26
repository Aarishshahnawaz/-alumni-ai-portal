"""
Model Manager for AlumniAI Service
Handles loading and managing ML models
"""

import asyncio
import pickle
import joblib
from pathlib import Path
from typing import Dict, Any, Optional
from loguru import logger
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer
import nltk
import spacy

from app.core.config import settings
from app.core.exceptions import ModelNotLoadedException


class ModelManager:
    """Manages all ML models for the AI service"""
    
    def __init__(self):
        self.models: Dict[str, Any] = {}
        self.vectorizers: Dict[str, Any] = {}
        self.models_loaded = False
        self.model_cache_dir = Path(settings.MODEL_CACHE_DIR)
        
    async def initialize_models(self):
        """Initialize all models asynchronously"""
        try:
            logger.info("Initializing AI models...")
            
            # Download required NLTK data
            await self._download_nltk_data()
            
            # Load spaCy model
            await self._load_spacy_model()
            
            # Load sentence transformer
            await self._load_sentence_transformer()
            
            # Initialize career prediction model
            await self._initialize_career_model()
            
            # Initialize skill extraction model
            await self._initialize_skill_extraction()
            
            # Initialize sentiment models
            await self._initialize_sentiment_models()
            
            self.models_loaded = True
            logger.info("All models initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize models: {e}")
            raise
    
    async def _download_nltk_data(self):
        """Download required NLTK data"""
        try:
            nltk.download('punkt', quiet=True)
            nltk.download('stopwords', quiet=True)
            nltk.download('wordnet', quiet=True)
            nltk.download('vader_lexicon', quiet=True)
            logger.info("NLTK data downloaded")
        except Exception as e:
            logger.warning(f"Failed to download NLTK data: {e}")
    
    async def _load_spacy_model(self):
        """Load spaCy model for NLP tasks"""
        try:
            # Try to load the model, download if not available
            try:
                nlp = spacy.load("en_core_web_sm")
            except OSError:
                logger.info("Downloading spaCy model...")
                spacy.cli.download("en_core_web_sm")
                nlp = spacy.load("en_core_web_sm")
            
            self.models['spacy'] = nlp
            logger.info("spaCy model loaded")
        except Exception as e:
            logger.error(f"Failed to load spaCy model: {e}")
            # Create a mock model for development
            self.models['spacy'] = None
    
    async def _load_sentence_transformer(self):
        """Load sentence transformer for embeddings"""
        try:
            model = SentenceTransformer('all-MiniLM-L6-v2')
            self.models['sentence_transformer'] = model
            logger.info("Sentence transformer loaded")
        except Exception as e:
            logger.error(f"Failed to load sentence transformer: {e}")
            self.models['sentence_transformer'] = None
    
    async def _initialize_career_model(self):
        """Initialize career prediction model"""
        try:
            # For demo purposes, create a simple model
            # In production, this would load a pre-trained model
            
            # Sample career data for training
            career_data = {
                'software_engineer': {
                    'skills': ['python', 'javascript', 'react', 'node.js', 'sql'],
                    'salary_range': {'min': 70000, 'max': 150000},
                    'growth_potential': 'high'
                },
                'data_scientist': {
                    'skills': ['python', 'machine learning', 'statistics', 'pandas', 'numpy'],
                    'salary_range': {'min': 80000, 'max': 180000},
                    'growth_potential': 'very high'
                },
                'product_manager': {
                    'skills': ['project management', 'analytics', 'communication', 'strategy'],
                    'salary_range': {'min': 90000, 'max': 200000},
                    'growth_potential': 'high'
                },
                'devops_engineer': {
                    'skills': ['docker', 'kubernetes', 'aws', 'linux', 'ci/cd'],
                    'salary_range': {'min': 85000, 'max': 170000},
                    'growth_potential': 'high'
                },
                'ui_ux_designer': {
                    'skills': ['figma', 'adobe creative suite', 'user research', 'prototyping'],
                    'salary_range': {'min': 60000, 'max': 130000},
                    'growth_potential': 'medium'
                }
            }
            
            self.models['career_data'] = career_data
            
            # Create skill vectorizer
            all_skills = []
            for career in career_data.values():
                all_skills.extend(career['skills'])
            
            vectorizer = TfidfVectorizer()
            skill_matrix = vectorizer.fit_transform(all_skills)
            
            self.vectorizers['skills'] = vectorizer
            self.models['skill_matrix'] = skill_matrix
            
            logger.info("Career prediction model initialized")
        except Exception as e:
            logger.error(f"Failed to initialize career model: {e}")
    
    async def _initialize_skill_extraction(self):
        """Initialize skill extraction model"""
        try:
            # Common technical skills database
            technical_skills = [
                'python', 'javascript', 'java', 'c++', 'react', 'angular', 'vue',
                'node.js', 'express', 'django', 'flask', 'spring', 'sql', 'mongodb',
                'postgresql', 'mysql', 'redis', 'docker', 'kubernetes', 'aws',
                'azure', 'gcp', 'git', 'jenkins', 'ci/cd', 'machine learning',
                'deep learning', 'tensorflow', 'pytorch', 'pandas', 'numpy',
                'scikit-learn', 'html', 'css', 'bootstrap', 'sass', 'webpack',
                'rest api', 'graphql', 'microservices', 'agile', 'scrum'
            ]
            
            soft_skills = [
                'communication', 'leadership', 'teamwork', 'problem solving',
                'critical thinking', 'project management', 'time management',
                'adaptability', 'creativity', 'analytical thinking'
            ]
            
            self.models['technical_skills'] = set(technical_skills)
            self.models['soft_skills'] = set(soft_skills)
            
            logger.info("Skill extraction model initialized")
        except Exception as e:
            logger.error(f"Failed to initialize skill extraction: {e}")
    
    async def _initialize_sentiment_models(self):
        """Initialize sentiment analysis models"""
        try:
            from textblob import TextBlob
            from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
            
            # Initialize VADER sentiment analyzer
            vader_analyzer = SentimentIntensityAnalyzer()
            self.models['vader'] = vader_analyzer
            
            # TextBlob is imported as needed
            self.models['textblob'] = TextBlob
            
            logger.info("Sentiment analysis models initialized")
        except Exception as e:
            logger.error(f"Failed to initialize sentiment models: {e}")
    
    def get_model(self, model_name: str):
        """Get a specific model"""
        if not self.models_loaded:
            raise ModelNotLoadedException(model_name)
        
        if model_name not in self.models:
            raise ModelNotLoadedException(model_name)
        
        return self.models[model_name]
    
    def get_vectorizer(self, vectorizer_name: str):
        """Get a specific vectorizer"""
        if vectorizer_name not in self.vectorizers:
            raise ModelNotLoadedException(f"vectorizer_{vectorizer_name}")
        
        return self.vectorizers[vectorizer_name]
    
    async def cleanup(self):
        """Cleanup models and free memory"""
        try:
            self.models.clear()
            self.vectorizers.clear()
            self.models_loaded = False
            logger.info("Models cleaned up")
        except Exception as e:
            logger.error(f"Error during cleanup: {e}")
    
    def calculate_skill_similarity(self, skills1: list, skills2: list) -> float:
        """Calculate similarity between two skill sets"""
        try:
            if not skills1 or not skills2:
                return 0.0
            
            # Convert to sets for intersection calculation
            set1 = set(skill.lower().strip() for skill in skills1)
            set2 = set(skill.lower().strip() for skill in skills2)
            
            # Calculate Jaccard similarity
            intersection = len(set1.intersection(set2))
            union = len(set1.union(set2))
            
            return intersection / union if union > 0 else 0.0
            
        except Exception as e:
            logger.error(f"Error calculating skill similarity: {e}")
            return 0.0
    
    def calculate_text_similarity(self, text1: str, text2: str) -> float:
        """Calculate similarity between two texts using sentence transformers"""
        try:
            model = self.get_model('sentence_transformer')
            if model is None:
                # Fallback to simple word overlap
                words1 = set(text1.lower().split())
                words2 = set(text2.lower().split())
                intersection = len(words1.intersection(words2))
                union = len(words1.union(words2))
                return intersection / union if union > 0 else 0.0
            
            embeddings = model.encode([text1, text2])
            similarity = cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]
            return float(similarity)
            
        except Exception as e:
            logger.error(f"Error calculating text similarity: {e}")
            return 0.0