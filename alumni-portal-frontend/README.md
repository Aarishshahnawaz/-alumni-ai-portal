# AlumniAI Portal - Frontend

A modern React frontend for the AlumniAI Portal, providing intelligent alumni networking and career prediction capabilities.

## Features

- **Role-based Authentication**: Student, Alumni, and Admin dashboards
- **Alumni Directory**: Search and connect with alumni by skills, company, graduation year
- **Job Board**: Browse and apply to jobs posted by alumni companies
- **Mentorship System**: Request mentorship and manage mentoring relationships
- **Resume Analysis**: AI-powered resume feedback and ATS scoring
- **Career Prediction**: AI insights on career paths based on skills
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Real-time Updates**: Live notifications and updates

## Tech Stack

- **React 18** - Modern React with hooks
- **Redux Toolkit** - State management
- **React Router v6** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Smooth animations
- **React Hook Form** - Form handling
- **React Query** - Server state management
- **Axios** - HTTP client
- **Lucide React** - Modern icons

## Project Structure

```
src/
├── components/
│   ├── common/          # Reusable components
│   └── layout/          # Layout components
├── pages/
│   ├── auth/           # Authentication pages
│   ├── dashboard/      # Role-specific dashboards
│   └── *.js           # Main pages
├── store/
│   └── slices/        # Redux slices
├── services/          # API services
├── utils/            # Utility functions
└── App.js           # Main app component
```

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- Backend API running on port 5000
- AI Service running on port 8001

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Configure environment variables:
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_AI_SERVICE_URL=http://localhost:8001
```

4. Start development server:
```bash
npm start
```

The app will be available at `http://localhost:3000`

## Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Key Features

### Authentication & Authorization
- JWT-based authentication with automatic token refresh
- Role-based access control (Student/Alumni/Admin)
- Protected routes and components

### Dashboard Views
- **Student Dashboard**: Profile completion, mentor suggestions, job recommendations
- **Alumni Dashboard**: Mentorship requests, job postings, network activity
- **Admin Dashboard**: User management, system analytics, content moderation

### Alumni Directory
- Advanced search and filtering
- Skills-based matching
- Company and graduation year filters
- Connection requests

### Job Board
- Job posting and application system
- Advanced filtering (location, salary, type)
- Alumni company integration
- Application tracking

### Mentorship System
- Mentor-mentee matching
- Request management
- Meeting scheduling
- Feedback system

### Resume Management
- File upload with drag-and-drop
- AI-powered analysis
- ATS scoring
- Improvement suggestions

## API Integration

The frontend integrates with two backend services:

1. **Main API** (`/api`) - User management, jobs, mentorship
2. **AI Service** (`/api/v1`) - Career prediction, resume analysis, sentiment analysis

## State Management

Uses Redux Toolkit with the following slices:
- `authSlice` - Authentication state
- `alumniSlice` - Alumni directory and suggestions
- `jobSlice` - Job listings and applications
- `mentorshipSlice` - Mentorship requests and connections
- `uiSlice` - UI state and notifications

## Styling

- **Tailwind CSS** for utility-first styling
- **Custom color palette** with primary/secondary themes
- **Responsive design** with mobile-first approach
- **Dark mode support** (configurable)

## Performance

- **Code splitting** with React.lazy
- **Image optimization** with lazy loading
- **Bundle optimization** with Webpack
- **Caching strategies** with React Query

## Deployment

### Production Build

```bash
npm run build
```

### Environment Variables

Required for production:
- `REACT_APP_API_URL` - Backend API URL
- `REACT_APP_AI_SERVICE_URL` - AI service URL

### Deployment Options

- **Vercel/Netlify** - Static hosting
- **AWS S3 + CloudFront** - CDN deployment
- **Docker** - Containerized deployment

## Contributing

1. Follow the existing code structure
2. Use TypeScript for new components
3. Add proper error handling
4. Include responsive design
5. Test on multiple devices

## License

MIT License - see LICENSE file for details