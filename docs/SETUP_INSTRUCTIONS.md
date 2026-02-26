# AlumniAI Portal - Setup Instructions

## Current Status

✅ **Frontend**: Running on http://localhost:3000
✅ **Backend**: Running on http://localhost:5000
✅ **MongoDB**: Installed (needs configuration)

## Complete Setup Steps

### 1. Start MongoDB

MongoDB was just installed. You need to:

**Option A: Restart your computer** (easiest)
- This will add MongoDB to your PATH
- After restart, open Command Prompt as Administrator and run:
  ```bash
  net start MongoDB
  ```

**Option B: Start MongoDB manually** (without restart)
- Open Command Prompt as Administrator
- Run:
  ```bash
  "C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe" --dbpath="C:\data\db"
  ```
- Create the data directory first if it doesn't exist:
  ```bash
  mkdir C:\data\db
  ```

### 2. Restart Backend Service

After MongoDB is running:
1. Stop the current backend (Ctrl+C in the terminal)
2. Start it again:
   ```bash
   cd alumni-portal-backend
   npm start
   ```

### 3. Test Registration

Go to http://localhost:3000 and try to register:
1. Select role (Student or Alumni)
2. Fill in all required fields
3. Click "Create account"

## What's Working Now

- ✅ Frontend UI loads correctly
- ✅ Backend API responds
- ✅ Role selection (Student/Alumni) works
- ✅ Form validation works
- ⏳ Registration (waiting for MongoDB)
- ⏳ Login (waiting for MongoDB)
- ⏳ All database features (waiting for MongoDB)

## Quick Test Commands

### Check if MongoDB is running:
```bash
mongosh
```

### Check backend health:
```bash
curl http://localhost:5000/health
```

### Check frontend:
Open browser: http://localhost:3000

## Troubleshooting

### MongoDB won't start
- Make sure you're running Command Prompt as Administrator
- Create the data directory: `mkdir C:\data\db`
- Check if port 27017 is available: `netstat -an | findstr :27017`

### Backend shows database error
- This is normal until MongoDB is running
- Backend will automatically connect once MongoDB starts

### Frontend shows "Registration failed"
- This means MongoDB is not connected yet
- Follow steps above to start MongoDB

## Next Steps After MongoDB is Running

1. Register a test user
2. Login with the test user
3. Explore the dashboard
4. Test all features:
   - Alumni directory
   - Job postings
   - Mentorship requests
   - Resume upload
   - Admin dashboard (if you register as admin)

## Important Notes

- MongoDB must be running for any database operations
- Backend will show "Database connection failed" until MongoDB starts
- This is normal and the backend will keep trying to connect
- Once MongoDB starts, everything will work automatically
