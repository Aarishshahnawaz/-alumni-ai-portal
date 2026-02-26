# AlumniAI Portal - Complete Project Structure & Integration Guide

## 🏗️ Project Overview

The AlumniAI Portal is a comprehensive platform consisting of three main services:
- **Frontend**: React.js application (Port 3000)
- **Backend**: Node.js/Express API (Port 5000)
- **AI Service**: Python/FastAPI microservice (Port 8001)

## 📁 Complete Folder Structure

```
alumni-ai-portal/
├── alumni-portal-frontend/          # React Frontend Application
│   ├── public/
│   │   ├── index.html
│   │   └── favicon.ico
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── LoadingSpinner.js
│   │   │   │   └── ProtectedRoute.js
│   │   │   ├── layout/
│   │   │   │   └── DashboardLayout.js
│   │   │   └── charts/
│   │   │       ├── MetricCard.js
│   │   │       ├── SkillsHeatmap.js
│   │   │       └── ActivityTable.js
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   │   ├── LoginPage.js
│   │   │   │   └── RegisterPage.js
│   │   │   ├── dashboard/
│   │   │   │   ├── StudentDashboard.js
│   │   │   │   ├── AlumniDashboard.js
│   │   │   │   └── AdminDashboard.js
│   │   │   ├── LandingPage.js
│   │   │   ├── AlumniDirectory.js
│   │   │   ├── JobListings.js
│   │   │   ├── MentorshipPage.js
│   │   │   ├── ResumeUpload.js
│   │   │   ├── ProfilePage.js
│   │   │   └── NotFoundPage.js
│   │   ├── store/
│   │   │   ├── slices/
│   │   │   │   ├── authSlice.js
│   │   │   │   ├── uiSlice.js
│   │   │   │   ├── alumniSlice.js
│   │   │   │   ├── jobSlice.js
│   │   │   │   ├── mentorshipSlice.js
│   │   │   │   └── adminSlice.js
│   │   │   └── store.js
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── utils/
│   │   │   └── auth.js
│   │   ├── App.js
│   │   ├── index.js
│   │   └── index.css
│   ├── package.json
│   ├── tailwind.config.js
│   ├── .env.example
│   └── README.md
│
├── alumni-portal-backend/           # Node.js Backend API
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js
│   │   │   └── indexes.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── alumniController.js
│   │   │   ├── jobController.js
│   │   │   ├── mentorshipController.js
│   │   │   ├── resumeController.js
│   │   │   └── adminController.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   ├── validation.js
│   │   │   ├── errorHandler.js
│   │   │   ├── security.js
│   │   │   └── activityLogger.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── ActivityLog.js
│   │   │   ├── JobPosting.js
│   │   │   ├── MentorshipRequest.js
│   │   │   └── Resume.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── alumniRoutes.js
│   │   │   ├── jobRoutes.js
│   │   │   ├── mentorshipRoutes.js
│   │   │   ├── resumeRoutes.js
│   │   │   └── adminRoutes.js
│   │   ├── utils/
│   │   │   └── aggregationExamples.js
│   │   └── app.js
│   ├── package.json
│   ├── .env.example
│   └── README.md
│
├── alumni-ai-service/               # Python AI Microservice
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── endpoints/
│   │   │       │   ├── career.py
│   │   │       │   ├── compatibility.py
│   │   │       │   ├── resume.py
│   │   │       │   ├── sentiment.py
│   │   │       │   └── batch.py
│   │   │       └── api.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── exceptions.py
│   │   │   └── logging.py
│   │   ├── models/
│   │   │   └── schemas.py
│   │   ├── services/
│   │   │   ├── career_prediction.py
│   │   │   ├── mentor_compatibility.py
│   │   │   ├── resume_analyzer.py
│   │   │   ├── sentiment_analysis.py
│   │   │   └── model_manager.py
│   │   └── main.py
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── .env.example
│   └── README.md
│
└── docs/                           # Documentation
    ├── PROJECT_STRUCTURE.md
    ├── ADMIN_DASHBOARD.md
    ├── API_DOCUMENTATION.md
    └── DEPLOYMENT_GUIDE.md
```

## 🔗 Service Integration Map

### Frontend ↔ Backend Integration
```
Frontend (React:3000) → Backend (Express:5000)
├── Authentication: /api/auth/*
├── Alumni Directory: /api/alumni/*
├── Job Management: /api/jobs/*
├── Mentorship: /api/mentorship/*
├── Resume Upload: /api/resumes/*
└── Admin Dashboard: /api/admin/*
```

### Backend ↔ AI Service Integration
```
Backend (Express:5000) → AI Service (FastAPI:8001)
├── Career Prediction: /api/v1/career/predict
├── Mentor Compatibility: /api/v1/compatibility/calculate
├── Resume Analysis: /api/v1/resume/analyze
├── Sentiment Analysis: /api/v1/sentiment/analyze
└── Batch Processing: /api/v1/batch/*
```

### Database Connections
```
Backend → MongoDB (Port 27017)
├── Database: alumni_portal
├── Collections: users, activitylogs, jobpostings, mentorshiprequests, resumes
└── Indexes: Optimized for search and aggregation

AI Service → MongoDB (Optional - Port 27017)
├── Database: alumni_ai (for caching)
└── Collections: predictions, analysis_cache
```

## 🔧 Environment Configuration

### Frontend (.env)
```env
# API Configuration
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_AI_SERVICE_URL=http://localhost:8001/api/v1

# Environment
REACT_APP_ENVIRONMENT=development

# Feature Flags
REACT_APP_ENABLE_ANALYTICS=false
REACT_APP_ENABLE_DEBUG=true

# Admin Configuration
REACT_APP_ADMIN_REFRESH_INTERVAL=30000

# File Upload Configuration
REACT_APP_MAX_FILE_SIZE=10485760
REACT_APP_SUPPORTED_FILE_TYPES=pdf,doc,docx
```

### Backend (.env)
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/alumni_portal

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your_refresh_token_secret_here
JWT_REFRESH_EXPIRE=30d

# Security
BCRYPT_ROUNDS=12
CORS_ORIGIN=http://localhost:3000

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=uploads/
```

### AI Service (.env)
```env
# Server Configuration
HOST=0.0.0.0
PORT=8001
ENVIRONMENT=development

# API Configuration
API_V1_STR=/api/v1
PROJECT_NAME=AlumniAI Service

# External APIs
OPENAI_API_KEY=your-openai-api-key-here
HUGGINGFACE_API_KEY=your-huggingface-api-key-here

# Database (optional)
MONGODB_URL=mongodb://localhost:27017/alumni_ai

# Model Configuration
MODEL_CACHE_DIR=./models
MAX_FILE_SIZE_MB=10
```

## 🔐 JWT Authentication Flow

### 1. User Registration/Login
```
Frontend → POST /api/auth/register|login
Backend → Validates credentials
Backend → Generates JWT + Refresh Token
Backend → Returns tokens + user data
Frontend → Stores tokens in localStorage
```

### 2. Protected Route Access
```
Frontend → Adds Bearer token to requests
Backend → Validates JWT in middleware
Backend → Attaches user to req.user
Backend → Proceeds to route handler
```

### 3. Token Refresh
```
Frontend → Detects 401 response
Frontend → POST /api/auth/refresh-token
Backend → Validates refresh token
Backend → Returns new JWT
Frontend → Updates stored token
Frontend → Retries original request
```

## 📡 API Endpoint Structure

### Authentication Endpoints
```
POST   /api/auth/register          # User registration
POST   /api/auth/login             # User login
POST   /api/auth/logout            # User logout
POST   /api/auth/refresh-token     # Token refresh
GET    /api/auth/profile           # Get user profile
PUT    /api/auth/profile           # Update profile
PUT    /api/auth/change-password   # Change password
```

### Alumni Directory Endpoints
```
GET    /api/alumni/directory       # Search alumni
GET    /api/alumni/profile/:id     # Get alumni profile
GET    /api/alumni/statistics      # Alumni statistics
GET    /api/alumni/suggestions     # Suggested connections
```

### Job Management Endpoints
```
GET    /api/jobs                   # List jobs
POST   /api/jobs                   # Create job (alumni/admin)
GET    /api/jobs/:id               # Get job details
PUT    /api/jobs/:id               # Update job
DELETE /api/jobs/:id               # Delete job
POST   /api/jobs/:id/apply         # Apply to job
GET    /api/jobs/applications/my   # My applications
```

### Mentorship Endpoints
```
POST   /api/mentorship             # Create request (students)
GET    /api/mentorship/my-requests # My requests
GET    /api/mentorship/pending     # Pending requests (alumni)
PUT    /api/mentorship/:id/respond # Respond to request
PUT    /api/mentorship/:id/status  # Update status
POST   /api/mentorship/:id/meetings # Add meeting
```

### Resume Management Endpoints
```
POST   /api/resumes/upload         # Upload resume
GET    /api/resumes/my             # Get my resume
GET    /api/resumes/:id/download   # Download resume
DELETE /api/resumes/my             # Delete resume
GET    /api/resumes/search         # Search resumes (alumni/admin)
```

### Admin Dashboard Endpoints
```
GET    /api/admin/dashboard        # Dashboard stats
GET    /api/admin/users/stats      # User statistics
GET    /api/admin/mentorship/stats # Mentorship stats
GET    /api/admin/skills/distribution # Skills data
GET    /api/admin/activity-logs    # Activity logs
GET    /api/admin/system/health    # System health
```

### AI Service Endpoints
```
POST   /api/v1/career/predict      # Career prediction
POST   /api/v1/compatibility/calculate # Mentor compatibility
POST   /api/v1/resume/analyze      # Resume analysis
POST   /api/v1/sentiment/analyze   # Sentiment analysis
POST   /api/v1/batch/process       # Batch processing
```

## 🚀 Startup Sequence

### 1. Database Setup
```bash
# Start MongoDB
mongod --dbpath /data/db

# Create indexes (automatic on first run)
```

### 2. Backend Service
```bash
cd alumni-portal-backend
npm install
cp .env.example .env
# Configure environment variables
npm start
# Server runs on http://localhost:5000
```

### 3. AI Service
```bash
cd alumni-ai-service
pip install -r requirements.txt
cp .env.example .env
# Configure environment variables
python -m app.main
# Service runs on http://localhost:8001
```

### 4. Frontend Application
```bash
cd alumni-portal-frontend
npm install
cp .env.example .env
# Configure environment variables
npm start
# Application runs on http://localhost:3000
```

## 🔍 Health Check Endpoints

### Backend Health Check
```
GET http://localhost:5000/health
Response: {
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-02-25T10:00:00.000Z",
  "environment": "development"
}
```

### AI Service Health Check
```
GET http://localhost:8001/health
Response: {
  "status": "healthy",
  "version": "1.0.0",
  "environment": "development",
  "models": "loaded"
}
```

## 🔒 Security Implementation

### JWT Token Security
- **Access Token**: 7 days expiry
- **Refresh Token**: 30 days expiry
- **Token Storage**: localStorage (frontend)
- **Token Validation**: Middleware on all protected routes

### Role-Based Access Control
```javascript
// Route Protection Examples
router.use(authenticate);                    // Requires valid JWT
router.use(authorize('admin'));              // Admin only
router.use(authorize('student', 'alumni'));  // Multiple roles
```

### Data Validation
- **Input Validation**: Joi schemas on all endpoints
- **File Upload**: Size and type restrictions
- **SQL Injection**: MongoDB parameterized queries
- **XSS Protection**: Input sanitization

## 📊 Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  email: String (unique),
  password: String (hashed),
  role: String (student|alumni|admin),
  profile: {
    firstName: String,
    lastName: String,
    graduationYear: Number,
    major: String,
    currentCompany: String,
    currentPosition: String,
    location: String,
    skills: [String],
    bio: String
  },
  isActive: Boolean,
  isEmailVerified: Boolean,
  refreshTokens: [{ token: String, createdAt: Date }],
  createdAt: Date,
  updatedAt: Date
}
```

### Activity Logs Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  action: String,
  resource: String,
  category: String,
  success: Boolean,
  details: Object,
  metadata: {
    ipAddress: String,
    userAgent: String,
    method: String,
    endpoint: String
  },
  timestamp: Date
}
```

## 🔄 Data Flow Examples

### User Registration Flow
```
1. Frontend: User fills registration form
2. Frontend: POST /api/auth/register
3. Backend: Validates input data
4. Backend: Hashes password with bcrypt
5. Backend: Creates user in MongoDB
6. Backend: Generates JWT tokens
7. Backend: Logs registration activity
8. Backend: Returns user data + tokens
9. Frontend: Stores tokens + redirects to dashboard
```

### Job Application Flow
```
1. Frontend: User clicks "Apply" on job
2. Frontend: POST /api/jobs/:id/apply
3. Backend: Validates JWT token
4. Backend: Checks if already applied
5. Backend: Creates application record
6. Backend: Logs application activity
7. Backend: Returns success response
8. Frontend: Shows success message
9. Frontend: Updates UI state
```

### AI Career Prediction Flow
```
1. Frontend: User submits skills data
2. Frontend: POST /api/v1/career/predict
3. AI Service: Validates input data
4. AI Service: Processes with ML model
5. AI Service: Generates predictions
6. AI Service: Returns career suggestions
7. Frontend: Displays predictions to user
```

## 🚨 Error Handling

### Frontend Error Handling
```javascript
// API Error Interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle token refresh
    } else if (error.response?.status >= 500) {
      toast.error('Server error. Please try again.');
    }
    return Promise.reject(error);
  }
);
```

### Backend Error Handling
```javascript
// Global Error Handler
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error(err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = new ErrorResponse(message, 404);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = new ErrorResponse(message, 400);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error'
  });
};
```

## 📈 Performance Optimizations

### Frontend Optimizations
- **Code Splitting**: React.lazy for route-based splitting
- **Memoization**: React.memo for expensive components
- **Virtual Scrolling**: Large list performance
- **Image Optimization**: Lazy loading and compression

### Backend Optimizations
- **Database Indexing**: Optimized queries
- **Caching**: Redis for frequent queries
- **Compression**: Gzip middleware
- **Rate Limiting**: Prevent API abuse

### AI Service Optimizations
- **Model Caching**: Pre-loaded models
- **Batch Processing**: Multiple predictions
- **Async Processing**: Non-blocking operations
- **Result Caching**: Avoid duplicate computations

This comprehensive structure ensures proper integration, security, and scalability across all services in the AlumniAI Portal ecosystem.