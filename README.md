# 🎓 AlumniAI Portal

A comprehensive alumni management and networking platform with AI-powered features.

---

## 🚀 Quick Start

### Servers are Running!
- **Backend**: http://localhost:5000
- **Frontend**: http://localhost:3000
- **MongoDB**: localhost:27017

### First Time Here?
👉 **[Start Here: docs/00_START_HERE.md](docs/00_START_HERE.md)**

---

## 📚 Documentation

All documentation is organized in the **[docs](docs/)** folder.

**Quick Links:**
- 📖 [Complete Documentation Index](docs/README.md)
- 🚀 [Quick Start Guide](docs/QUICK_START_OTP.md)
- ✅ [System Status](docs/SERVERS_RUNNING.md)
- 🔐 [OTP System Guide](docs/PRODUCTION_OTP_SYSTEM_COMPLETE.md)
- 🧪 [Testing Guide](docs/TESTING_GUIDE.md)

---

## ✨ Features

### 🔐 Authentication
- ✅ OTP-based email verification
- ✅ Secure registration with JWT tokens
- ✅ Login without OTP (email + password)
- ✅ Session persistence
- ✅ Forgot password with OTP

### 👤 User Profile
- ✅ Complete profile management
- ✅ Avatar with progress ring
- ✅ LinkedIn/GitHub integration
- ✅ Profile image upload
- ✅ Dynamic profile completion

### 🎨 UI/UX
- ✅ Dark/Light mode toggle
- ✅ Auto-save settings
- ✅ Responsive design
- ✅ Toast notifications
- ✅ Smooth animations

### 📄 Additional Features
- ✅ Resume upload & analysis
- ✅ Activity logging
- ✅ Mentorship system
- ✅ Job postings
- ✅ Admin dashboard

---

## 🛠️ Tech Stack

### Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- Nodemailer (Gmail SMTP)
- bcrypt for password hashing

### Frontend
- React 18
- Redux Toolkit
- React Router v6
- Tailwind CSS
- Framer Motion
- Axios

---

## 📁 Project Structure

```
alumini-lpu/
├── alumni-portal-backend/     # Backend API
│   ├── src/
│   │   ├── controllers/       # Route controllers
│   │   ├── models/           # Database models
│   │   ├── routes/           # API routes
│   │   ├── middleware/       # Custom middleware
│   │   ├── utils/            # Utility functions
│   │   └── app.js            # Main application
│   └── package.json
│
├── alumni-portal-frontend/    # Frontend React app
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── pages/            # Page components
│   │   ├── store/            # Redux store
│   │   ├── contexts/         # React contexts
│   │   └── App.js            # Main app component
│   └── package.json
│
├── alumni-ai-service/         # AI service (Python)
│   └── app/
│
└── docs/                      # 📚 All documentation (75 files)
    ├── 00_START_HERE.md      # Start here!
    ├── README.md             # Documentation index
    └── ...                   # All other docs
```

---

## 🧪 Testing

### Test Registration Flow
```
1. Open: http://localhost:3000/register
2. Enter email (any email works in dev mode)
3. Select role (Student or Alumni)
4. Click "Send OTP"
5. Check email inbox for OTP
6. Enter OTP
7. Complete registration form
8. Auto-login to dashboard
```

### Test Login
```
1. Open: http://localhost:3000/login
2. Enter email + password
3. Login (NO OTP required)
```

---

## 🔧 Configuration

### Environment Variables
Backend `.env` file is configured with:
- ✅ MongoDB connection
- ✅ JWT secrets
- ✅ Gmail SMTP (iitianaarish@gmail.com)
- ✅ CORS settings
- ✅ Port configuration

### Email System
- Gmail SMTP configured
- App Password set
- OTP delivery working
- 5-minute expiry
- Max 5 attempts

---

## 📊 Current Status

### ✅ Completed Features
- Complete OTP verification system
- Full registration with all fields
- Alumni-specific fields (company + experience)
- Student-specific fields (college)
- Profile system with avatar
- Dark/Light mode
- Auto-save settings
- Session persistence
- Duplicate email prevention

### 🚀 Ready for Production
- All features implemented
- Security measures in place
- Error handling complete
- Documentation complete

---

## 🎯 Next Steps

1. **Test the application** - Try all features
2. **Review documentation** - Check docs folder
3. **Deploy to production** - Follow deployment guide
4. **Monitor and optimize** - Track performance

---

## 📞 Support

For detailed information on any feature, check the **[docs](docs/)** folder.

**Key Documentation:**
- Setup & Configuration
- Testing Guides
- Troubleshooting
- Deployment Guide
- API Documentation

---

## 🎉 Project Status: COMPLETE & RUNNING

Both servers are running and ready for testing!

**Open http://localhost:3000 to get started!** 🚀

---

**Last Updated:** February 26, 2026
