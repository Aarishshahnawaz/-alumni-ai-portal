# AlumniAI Portal - Integration Verification Checklist

## ✅ Service Integration Verification

### 1. Frontend → Backend Connection
- [ ] **API Base URL**: `http://localhost:5000/api` configured in frontend
- [ ] **CORS Configuration**: Backend allows frontend origin `http://localhost:3000`
- [ ] **Authentication Flow**: JWT tokens properly sent and received
- [ ] **Error Handling**: 401/403 responses trigger token refresh
- [ ] **Request Interceptors**: Authorization headers added automatically

### 2. Backend → Database Connection
- [ ] **MongoDB Connection**: `mongodb://localhost:27017/alumni_portal`
- [ ] **Database Models**: All models properly defined and indexed
- [ ] **Connection Pooling**: Proper connection management
- [ ] **Error Handling**: Database connection failures handled gracefully

### 3. Backend → AI Service Connection
- [ ] **AI Service URL**: `http://localhost:8001/api/v1` configured
- [ ] **Service Discovery**: Backend can reach AI service endpoints
- [ ] **Error Handling**: AI service failures don't crash backend
- [ ] **Timeout Configuration**: Proper timeout settings for AI calls

### 4. AI Service → Database Connection (Optional)
- [ ] **MongoDB Connection**: `mongodb://localhost:27017/alumni_ai` for caching
- [ ] **Model Storage**: ML models properly cached and loaded
- [ ] **Performance**: Efficient model inference and caching

## 🔧 Configuration Verification

### Frontend Environment Variables
```bash
# Check .env file exists and contains:
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_AI_SERVICE_URL=http://localhost:8001/api/v1
REACT_APP_ENVIRONMENT=development
```

### Backend Environment Variables
```bash
# Check .env file exists and contains:
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/alumni_portal
JWT_SECRET=your_super_secret_jwt_key_here
JWT_REFRESH_SECRET=your_refresh_token_secret_here
CORS_ORIGIN=http://localhost:3000
```

### AI Service Environment Variables
```bash
# Check .env file exists and contains:
HOST=0.0.0.0
PORT=8001
API_V1_STR=/api/v1
ENVIRONMENT=development
```

## 🔐 Authentication Integration Tests

### 1. User Registration Flow
```bash
# Test registration endpoint
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "role": "student",
    "profile": {
      "firstName": "Test",
      "lastName": "User",
      "graduationYear": 2024,
      "major": "Computer Science"
    }
  }'
```

### 2. User Login Flow
```bash
# Test login endpoint
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }'
```

### 3. Protected Route Access
```bash
# Test protected endpoint with JWT
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4. Token Refresh Flow
```bash
# Test token refresh
curl -X POST http://localhost:5000/api/auth/refresh-token \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

## 📡 API Endpoint Integration Tests

### Alumni Directory Integration
```bash
# Test alumni directory
curl -X GET "http://localhost:5000/api/alumni/directory?page=1&limit=10"

# Test alumni profile
curl -X GET http://localhost:5000/api/alumni/profile/USER_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Job Management Integration
```bash
# Test job listings
curl -X GET "http://localhost:5000/api/jobs?page=1&limit=10"

# Test job creation (alumni/admin only)
curl -X POST http://localhost:5000/api/jobs \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Software Engineer",
    "company": {"name": "Tech Corp"},
    "description": "Great opportunity",
    "requirements": ["JavaScript", "React"],
    "employment": {"type": "full-time"},
    "location": {"city": "San Francisco", "state": "CA"}
  }'
```

### Mentorship Integration
```bash
# Test mentorship request (students only)
curl -X POST http://localhost:5000/api/mentorship \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mentorId": "MENTOR_USER_ID",
    "message": "I would like mentorship in web development",
    "areasOfInterest": ["Web Development", "Career Guidance"]
  }'
```

### Admin Dashboard Integration
```bash
# Test admin dashboard (admin only)
curl -X GET http://localhost:5000/api/admin/dashboard \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"

# Test user statistics
curl -X GET "http://localhost:5000/api/admin/users/stats?timeRange=30d" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

## 🤖 AI Service Integration Tests

### Career Prediction
```bash
# Test career prediction
curl -X POST http://localhost:8001/api/v1/career/predict \
  -H "Content-Type: application/json" \
  -d '{
    "skills": ["JavaScript", "React", "Node.js"],
    "experience_level": "intermediate",
    "education": "Computer Science",
    "preferences": {
      "industry": "technology",
      "location": "remote"
    }
  }'
```

### Mentor Compatibility
```bash
# Test mentor compatibility
curl -X POST http://localhost:8001/api/v1/compatibility/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "student_profile": {
      "skills": ["Python", "Machine Learning"],
      "interests": ["AI", "Data Science"],
      "experience_level": "beginner"
    },
    "mentor_profile": {
      "skills": ["Python", "TensorFlow", "Data Science"],
      "experience_years": 5,
      "mentoring_areas": ["AI", "Career Development"]
    }
  }'
```

### Resume Analysis
```bash
# Test resume analysis (multipart form)
curl -X POST http://localhost:8001/api/v1/resume/analyze \
  -F "file=@/path/to/resume.pdf" \
  -F "job_description=Software Engineer position requiring Python and React skills"
```

### Sentiment Analysis
```bash
# Test sentiment analysis
curl -X POST http://localhost:8001/api/v1/sentiment/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "text": "I really enjoyed working with my mentor. The sessions were very helpful and insightful.",
    "context": "mentorship_feedback"
  }'
```

## 🔍 Health Check Verification

### Backend Health Check
```bash
curl -X GET http://localhost:5000/health
# Expected Response:
# {
#   "success": true,
#   "message": "Server is running",
#   "timestamp": "2024-02-25T10:00:00.000Z",
#   "environment": "development"
# }
```

### AI Service Health Check
```bash
curl -X GET http://localhost:8001/health
# Expected Response:
# {
#   "status": "healthy",
#   "version": "1.0.0",
#   "environment": "development",
#   "models": "loaded"
# }
```

### Frontend Health Check
```bash
# Check if frontend is accessible
curl -X GET http://localhost:3000
# Should return HTML content
```

## 🗄️ Database Integration Verification

### MongoDB Connection Test
```javascript
// Run in MongoDB shell
use alumni_portal

// Check collections exist
show collections
// Expected: users, activitylogs, jobpostings, mentorshiprequests, resumes

// Check indexes
db.users.getIndexes()
db.jobpostings.getIndexes()
db.mentorshiprequests.getIndexes()

// Test user creation
db.users.findOne()
```

### Database Indexes Verification
```javascript
// Verify critical indexes exist
db.users.getIndexes()
// Should include: email (unique), role, isActive

db.jobpostings.getIndexes()
// Should include: company.name, location, skills, createdAt

db.mentorshiprequests.getIndexes()
// Should include: studentId, mentorId, status, createdAt
```

## 🚀 Startup Sequence Verification

### 1. Start MongoDB
```bash
# Start MongoDB service
mongod --dbpath /data/db
# Verify: MongoDB running on port 27017
```

### 2. Start Backend Service
```bash
cd alumni-portal-backend
npm install
npm start
# Verify: Server running on http://localhost:5000
# Check: Health endpoint returns 200
```

### 3. Start AI Service
```bash
cd alumni-ai-service
pip install -r requirements.txt
python -m app.main
# Verify: Service running on http://localhost:8001
# Check: Health endpoint returns 200
```

### 4. Start Frontend
```bash
cd alumni-portal-frontend
npm install
npm start
# Verify: Application running on http://localhost:3000
# Check: Can access login page
```

## 🔒 Security Integration Tests

### JWT Token Validation
- [ ] **Valid Token**: Accepted by protected routes
- [ ] **Expired Token**: Returns 401 and triggers refresh
- [ ] **Invalid Token**: Returns 401 error
- [ ] **Missing Token**: Returns 401 error
- [ ] **Role Authorization**: Proper role-based access control

### CORS Configuration
- [ ] **Frontend Origin**: Allowed by backend CORS
- [ ] **Preflight Requests**: OPTIONS requests handled
- [ ] **Credentials**: Cookies/auth headers allowed
- [ ] **Methods**: All required HTTP methods allowed

### Input Validation
- [ ] **SQL Injection**: Parameterized queries prevent injection
- [ ] **XSS Protection**: Input sanitization works
- [ ] **File Upload**: Size and type restrictions enforced
- [ ] **Rate Limiting**: API abuse prevention active

## 📊 Performance Integration Tests

### Response Time Verification
```bash
# Test API response times
time curl -X GET http://localhost:5000/api/alumni/directory
# Should complete in < 2 seconds

time curl -X POST http://localhost:8001/api/v1/career/predict \
  -H "Content-Type: application/json" \
  -d '{"skills": ["JavaScript"]}'
# Should complete in < 5 seconds
```

### Concurrent Request Testing
```bash
# Test multiple simultaneous requests
for i in {1..10}; do
  curl -X GET http://localhost:5000/health &
done
wait
# All requests should succeed
```

### Memory Usage Monitoring
```bash
# Monitor service memory usage
ps aux | grep node  # Backend memory usage
ps aux | grep python  # AI service memory usage
```

## 🐛 Common Integration Issues & Solutions

### Issue: Frontend can't connect to Backend
**Solution**: 
- Check CORS configuration in backend
- Verify API_URL in frontend .env
- Ensure backend is running on correct port

### Issue: JWT tokens not working
**Solution**:
- Verify JWT_SECRET is set in backend .env
- Check token format in Authorization header
- Ensure token hasn't expired

### Issue: AI Service not responding
**Solution**:
- Check AI service is running on port 8001
- Verify AI_SERVICE_URL in frontend .env
- Check AI service logs for errors

### Issue: Database connection failed
**Solution**:
- Ensure MongoDB is running
- Check MONGODB_URI in backend .env
- Verify database permissions

### Issue: File uploads failing
**Solution**:
- Check MAX_FILE_SIZE configuration
- Verify upload directory permissions
- Ensure multer middleware is configured

## ✅ Final Integration Checklist

- [ ] All services start without errors
- [ ] Health checks pass for all services
- [ ] User can register and login successfully
- [ ] Protected routes require authentication
- [ ] Role-based access control works
- [ ] Alumni directory loads and searches work
- [ ] Job listings display and creation works
- [ ] Mentorship requests can be created
- [ ] Resume upload and analysis works
- [ ] Admin dashboard displays analytics
- [ ] AI predictions return valid results
- [ ] Error handling works across all services
- [ ] Performance meets requirements
- [ ] Security measures are active

## 🚀 Production Deployment Checklist

### Environment Configuration
- [ ] Production environment variables set
- [ ] Database connection strings updated
- [ ] JWT secrets are secure and unique
- [ ] CORS origins restricted to production domains
- [ ] File upload paths configured
- [ ] Logging levels set appropriately

### Security Hardening
- [ ] HTTPS enabled for all services
- [ ] Rate limiting configured
- [ ] Input validation active
- [ ] Error messages don't expose sensitive info
- [ ] Database access restricted
- [ ] API keys secured

### Performance Optimization
- [ ] Database indexes optimized
- [ ] Caching strategies implemented
- [ ] CDN configured for static assets
- [ ] Compression enabled
- [ ] Connection pooling configured

### Monitoring & Logging
- [ ] Application logging configured
- [ ] Error tracking setup (Sentry, etc.)
- [ ] Performance monitoring active
- [ ] Health check endpoints monitored
- [ ] Database performance monitored

This checklist ensures all services are properly integrated and ready for production deployment.