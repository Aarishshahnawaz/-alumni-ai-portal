# AlumniAI Portal Backend

A production-ready Node.js backend service for the AlumniAI Portal - Intelligent Alumni Networking & Career Prediction Platform.

## Features

- **Authentication & Authorization**: JWT-based auth with refresh tokens
- **Role-Based Access Control**: Student, Alumni, and Admin roles
- **Activity Logging**: Comprehensive logging of all user activities
- **Security**: Rate limiting, CORS, Helmet, input validation
- **Database**: MongoDB with Mongoose ODM
- **Password Security**: bcrypt hashing with configurable rounds
- **Error Handling**: Centralized error handling with logging
- **Validation**: Express-validator for input validation
- **Monitoring**: Request logging and health checks

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd alumni-portal-backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start MongoDB service

5. Run the application:
```bash
# Development
npm run dev

# Production
npm start
```

## Environment Variables

Create a `.env` file based on `.env.example`:

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
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | User login | No |
| POST | `/api/auth/logout` | User logout | Yes |
| POST | `/api/auth/refresh-token` | Refresh access token | No |
| GET | `/api/auth/profile` | Get user profile | Yes |
| PUT | `/api/auth/profile` | Update user profile | Yes |
| PUT | `/api/auth/change-password` | Change password | Yes |

### System

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api` | API information |

## Request/Response Examples

### Register User

**POST** `/api/auth/register`

```json
{
  "email": "john.doe@example.com",
  "password": "SecurePass123",
  "confirmPassword": "SecurePass123",
  "role": "student",
  "profile": {
    "firstName": "John",
    "lastName": "Doe",
    "graduationYear": 2024,
    "degree": "Computer Science",
    "major": "Software Engineering"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "...",
      "email": "john.doe@example.com",
      "role": "student",
      "profile": {
        "firstName": "John",
        "lastName": "Doe",
        "fullName": "John Doe"
      }
    },
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### Login User

**POST** `/api/auth/login`

```json
{
  "email": "john.doe@example.com",
  "password": "SecurePass123"
}
```

### Update Profile

**PUT** `/api/auth/profile`

```json
{
  "profile": {
    "bio": "Passionate software developer",
    "skills": ["JavaScript", "Node.js", "React"],
    "interests": ["AI", "Machine Learning"],
    "socialLinks": {
      "linkedin": "https://linkedin.com/in/johndoe",
      "github": "https://github.com/johndoe"
    }
  },
  "preferences": {
    "emailNotifications": true,
    "profileVisibility": "public"
  }
}
```

## Database Schema

### User Model

```javascript
{
  email: String (unique, required),
  password: String (hashed, required),
  role: Enum['student', 'alumni', 'admin'],
  profile: {
    firstName: String (required),
    lastName: String (required),
    avatar: String,
    bio: String,
    phone: String,
    graduationYear: Number,
    degree: String,
    major: String,
    currentPosition: String,
    company: String,
    location: Object,
    skills: [String],
    interests: [String],
    socialLinks: Object
  },
  preferences: {
    emailNotifications: Boolean,
    profileVisibility: Enum,
    mentorshipAvailable: Boolean
  },
  isActive: Boolean,
  isEmailVerified: Boolean,
  lastLogin: Date,
  refreshTokens: [Object]
}
```

### Activity Log Model

```javascript
{
  userId: ObjectId (ref: User),
  action: Enum (user_register, user_login, etc.),
  resource: String,
  resourceId: ObjectId,
  details: Object,
  metadata: {
    ipAddress: String,
    userAgent: String,
    requestId: String,
    duration: Number,
    statusCode: Number,
    method: String,
    endpoint: String
  },
  level: Enum['info', 'warn', 'error', 'debug'],
  category: Enum,
  success: Boolean,
  errorMessage: String
}
```

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with configurable salt rounds
- **Rate Limiting**: Configurable rate limits for different endpoints
- **CORS Protection**: Configurable CORS policies
- **Helmet Security**: Security headers and protections
- **Input Validation**: Comprehensive request validation
- **Activity Logging**: All actions are logged for audit trails
- **Error Handling**: Secure error responses without sensitive data leaks

## Activity Logging

The system automatically logs the following activities:

- User registration and login/logout
- Profile updates and password changes
- API access and errors
- Security violations and failed authentication attempts
- All user actions with metadata (IP, user agent, etc.)

## Development

### Project Structure

```
src/
├── config/
│   └── database.js          # Database connection
├── controllers/
│   └── authController.js    # Authentication logic
├── middleware/
│   ├── auth.js             # JWT authentication
│   ├── activityLogger.js   # Activity logging
│   ├── validation.js       # Input validation
│   ├── errorHandler.js     # Error handling
│   └── security.js         # Security middleware
├── models/
│   ├── User.js             # User model
│   └── ActivityLog.js      # Activity log model
├── routes/
│   └── authRoutes.js       # Authentication routes
└── app.js                  # Main application file
```

### Running Tests

```bash
npm test
```

### Code Style

The project follows standard Node.js conventions with:
- ESLint for code linting
- Prettier for code formatting
- Consistent error handling patterns
- Comprehensive input validation
- Detailed logging and monitoring

## Production Deployment

1. Set `NODE_ENV=production`
2. Use strong JWT secrets
3. Configure proper CORS origins
4. Set up MongoDB with authentication
5. Use process managers (PM2, Docker)
6. Set up monitoring and logging
7. Configure reverse proxy (nginx)
8. Enable SSL/TLS certificates

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.