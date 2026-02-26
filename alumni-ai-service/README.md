# AlumniAI Service - AI Microservice

A comprehensive AI microservice built with FastAPI for the AlumniAI Portal, providing career prediction, mentor compatibility analysis, resume processing, and sentiment analysis.

## 🚀 Features

### 1. Career Prediction Module
- **Input**: User skills, experience, education level
- **Output**: Predicted career paths with probabilities, skill gaps, recommendations
- **Algorithm**: Skill matching with experience and education weighting

### 2. Mentor Compatibility Index (MCI)
- **Formula**: `MCI = (SkillSimilarity × 0.4) + (IndustryMatch × 0.25) + (ExperienceAlignment × 0.2) + (BehaviorScore × 0.15)`
- **Components**: 
  - Skill similarity between mentor and student
  - Industry alignment
  - Optimal experience gap (3-8 years ideal)
  - Behavioral compatibility (communication styles, availability)

### 3. Resume Analyzer
- **File Support**: PDF, DOC, DOCX, TXT (up to 10MB)
- **Text Extraction**: Multi-method PDF parsing with fallbacks
- **Skill Extraction**: NLP-based technical and soft skill identification
- **ATS Score**: Applicant Tracking System compatibility scoring
- **Job Matching**: Compare resume against job descriptions

### 4. Sentiment Analysis Engine
- **Dual Analysis**: TextBlob + VADER sentiment analysis
- **Engagement Metrics**: Enthusiasm, communication quality, professionalism
- **Context-Aware**: Specialized analysis for mentorship messages
- **Emotion Detection**: Identifies dominant emotions in text

## 📁 Project Structure

```
alumni-ai-service/
├── app/
│   ├── main.py                 # FastAPI application entry point
│   ├── core/
│   │   ├── config.py          # Configuration settings
│   │   ├── logging.py         # Logging setup
│   │   └── exceptions.py      # Custom exceptions
│   ├── models/
│   │   └── schemas.py         # Pydantic models
│   ├── services/
│   │   ├── model_manager.py   # ML model management
│   │   ├── career_prediction.py
│   │   ├── mentor_compatibility.py
│   │   ├── resume_analyzer.py
│   │   └── sentiment_analysis.py
│   └── api/
│       └── v1/
│           ├── api.py          # API router
│           └── endpoints/      # API endpoints
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## 🛠️ Installation & Setup

### Local Development

1. **Clone and setup**:
```bash
git clone <repository>
cd alumni-ai-service
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. **Install dependencies**:
```bash
pip install -r requirements.txt
python -m spacy download en_core_web_sm
```

3. **Environment setup**:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Run the service**:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

### Docker Deployment

1. **Using Docker Compose** (Recommended):
```bash
docker-compose up -d
```

2. **Using Docker directly**:
```bash
docker build -t alumni-ai-service .
docker run -p 8001:8001 alumni-ai-service
```

## 📚 API Documentation

Once running, access the interactive API documentation:
- **Swagger UI**: http://localhost:8001/api/v1/docs
- **ReDoc**: http://localhost:8001/api/v1/redoc

## 🔧 API Endpoints

### Career Prediction

#### Predict Career Paths
```http
POST /api/v1/career/predict
Content-Type: application/json

{
  "skills": ["python", "machine learning", "data analysis"],
  "experience_years": 2,
  "education_level": "bachelor",
  "current_role": "junior developer",
  "industry_preference": "technology"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Career prediction completed successfully",
  "predicted_paths": [
    {
      "role": "Data Scientist",
      "probability": 0.85,
      "required_skills": ["python", "machine learning", "statistics"],
      "salary_range": {"min": 80000, "max": 180000},
      "growth_potential": "very high",
      "time_to_achieve": "1-2 years"
    }
  ],
  "skill_gaps": ["statistics", "deep learning"],
  "recommendations": [
    "Focus on building statistical analysis skills",
    "Consider pursuing advanced machine learning courses"
  ]
}
```

### Mentor Compatibility

#### Calculate MCI
```http
POST /api/v1/compatibility/calculate
Content-Type: application/json

{
  "mentor": {
    "skills": ["python", "leadership", "project management"],
    "industry": "technology",
    "experience_years": 8,
    "current_role": "senior software engineer",
    "mentorship_style": "hands-on"
  },
  "student": {
    "skills": ["python", "javascript"],
    "target_industry": "technology",
    "experience_years": 1,
    "career_goals": ["become a full-stack developer"],
    "learning_style": "practical"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "skill_similarity": 0.75,
    "industry_match": 1.0,
    "experience_alignment": 0.9,
    "behavior_score": 0.85,
    "overall_mci": 0.825
  },
  "explanation": {
    "skill_similarity": "Good skill overlap with room for learning new skills",
    "industry_match": "Strong industry alignment - mentor has direct relevant experience"
  },
  "recommendations": [
    "Excellent match! This mentorship has high potential for success",
    "Focus on setting clear goals and regular check-ins"
  ]
}
```

### Resume Analysis

#### Analyze Resume
```http
POST /api/v1/resume/analyze
Content-Type: multipart/form-data

file: [resume.pdf]
target_role: "software engineer"
```

**Response:**
```json
{
  "success": true,
  "extracted_text": "John Doe\nSoftware Engineer...",
  "skills": {
    "technical_skills": ["Python", "JavaScript", "React"],
    "soft_skills": ["Communication", "Leadership"],
    "certifications": ["AWS Certified Developer"],
    "tools": ["Git", "Docker"]
  },
  "ats_score": {
    "overall_score": 85,
    "keyword_density": 0.045,
    "format_score": 90,
    "content_score": 80,
    "suggestions": ["Add more quantifiable achievements"]
  },
  "job_match_score": 0.78,
  "improvements": [
    "Consider adding these skills for Software Engineer: Node.js, SQL",
    "Add more detailed descriptions of your experience"
  ]
}
```

### Sentiment Analysis

#### Analyze Sentiment
```http
POST /api/v1/sentiment/analyze
Content-Type: application/json

{
  "text": "I'm really excited about this mentorship opportunity! Thank you so much for your guidance.",
  "context": "mentorship"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "polarity": 0.8,
    "subjectivity": 0.6,
    "compound": 0.7717,
    "positive": 0.8,
    "neutral": 0.2,
    "negative": 0.0
  },
  "engagement": {
    "engagement_score": 0.85,
    "enthusiasm_level": "high",
    "communication_quality": 0.9,
    "professionalism": 0.8
  },
  "insights": [
    "The message conveys strong positive sentiment",
    "High engagement level detected - the person seems very involved"
  ],
  "recommendations": [
    "Great mentorship dynamic - continue current approach"
  ]
}
```

## 🧠 Model Explanations

### Career Prediction Algorithm

1. **Skill Matching**: Calculates Jaccard similarity between user skills and career requirements
2. **Experience Weighting**: Adjusts scores based on experience requirements for each career
3. **Education Bonus**: Provides bonuses for education levels relevant to specific careers
4. **Time Estimation**: Calculates time to achieve based on skill gaps and experience

### MCI Formula Breakdown

```
MCI = (SkillSimilarity × 0.4) + (IndustryMatch × 0.25) + (ExperienceAlignment × 0.2) + (BehaviorScore × 0.15)
```

- **Skill Similarity (40%)**: Most important factor, includes current skills + career goal skills
- **Industry Match (25%)**: Direct industry match gets 1.0, related industries get 0.7
- **Experience Alignment (20%)**: Optimal gap is 3-8 years, scores decrease outside this range
- **Behavior Score (15%)**: Communication styles, availability, mentorship preferences

### Resume ATS Scoring

- **Keyword Density (40%)**: Ratio of relevant skills to total words
- **Format Score (30%)**: Section headers, contact info, proper structure
- **Content Score (30%)**: Action verbs, quantifiable achievements, education

### Sentiment Analysis Components

- **TextBlob**: Polarity (-1 to 1) and subjectivity (0 to 1)
- **VADER**: Compound score with positive/neutral/negative breakdown
- **Engagement**: Custom algorithm considering enthusiasm indicators, question marks, text length
- **Professionalism**: Professional language indicators vs. casual/inappropriate language

## 🔧 Configuration

### Environment Variables

```env
# Server
HOST=0.0.0.0
PORT=8001
ENVIRONMENT=development
DEBUG=True

# Models
MODEL_CACHE_DIR=./models
MAX_FILE_SIZE_MB=10
ENABLE_GPU=False

# Performance
MAX_WORKERS=4
BATCH_SIZE=32
CACHE_TTL=3600
```

### Model Configuration

The service automatically downloads and initializes:
- spaCy English model (`en_core_web_sm`)
- Sentence Transformers (`all-MiniLM-L6-v2`)
- NLTK data (punkt, stopwords, vader_lexicon)

## 🚀 Performance & Scaling

### Batch Processing
- **Career Predictions**: Up to 100 requests, 10 concurrent
- **Sentiment Analysis**: Up to 100 requests, 20 concurrent
- **Mixed Batches**: Combined processing with statistics

### Caching
- Model caching for faster subsequent requests
- Redis support for result caching (optional)
- Configurable TTL for cached results

### Monitoring
- Health check endpoint (`/health`)
- Prometheus metrics support (optional)
- Structured logging with Loguru

## 🧪 Testing

```bash
# Run tests
pytest

# Run with coverage
pytest --cov=app

# Test specific module
pytest tests/test_career_prediction.py
```

## 🐳 Production Deployment

### Docker Compose (Recommended)
```yaml
version: '3.8'
services:
  alumni-ai-service:
    image: alumni-ai-service:latest
    ports:
      - "8001:8001"
    environment:
      - ENVIRONMENT=production
      - DEBUG=False
    volumes:
      - ./logs:/app/logs
      - ./models:/app/models
```

### Kubernetes
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: alumni-ai-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: alumni-ai-service
  template:
    metadata:
      labels:
        app: alumni-ai-service
    spec:
      containers:
      - name: alumni-ai-service
        image: alumni-ai-service:latest
        ports:
        - containerPort: 8001
```

## 📊 Monitoring & Observability

### Health Checks
- `/health`: Service health status
- `/api/v1/batch/status`: Batch processing capabilities
- Model loading status in health response

### Logging
- Structured JSON logging
- Request/response logging
- Error tracking with stack traces
- Performance metrics

### Metrics (Optional)
- Request count and latency
- Model inference time
- Error rates by endpoint
- Resource utilization

## 🤝 Integration with Backend

The AI service integrates with the Node.js backend through HTTP APIs:

```javascript
// Example integration in Node.js backend
const aiServiceUrl = 'http://alumni-ai-service:8001/api/v1';

// Career prediction
const careerPrediction = await fetch(`${aiServiceUrl}/career/predict`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    skills: user.profile.skills,
    experience_years: user.experienceYears,
    education_level: user.profile.educationLevel
  })
});

// Mentor compatibility
const compatibility = await fetch(`${aiServiceUrl}/compatibility/calculate`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    mentor: mentorProfile,
    student: studentProfile
  })
});
```

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For issues and questions:
1. Check the API documentation at `/api/v1/docs`
2. Review logs in the `logs/` directory
3. Check health status at `/health`
4. Verify model loading in the startup logs