# MongoDB Compass Connection Guide

## ✅ Connection Successfully Configured!

Your backend is now properly connected to MongoDB with the database name **`alumniai`**.

---

## 📋 Connection Details

### Connection String for MongoDB Compass:
```
mongodb://localhost:27017/alumniai
```

### Database Information:
- **Database Name**: `alumniai`
- **Host**: `localhost`
- **Port**: `27017`
- **Connection Type**: Local MongoDB Instance

---

## 🔌 How to Connect in MongoDB Compass

### Method 1: Using Connection String (Recommended)

1. **Open MongoDB Compass**
2. **Click "New Connection"** (or the green "Connect" button)
3. **Paste this connection string**:
   ```
   mongodb://localhost:27017/alumniai
   ```
4. **Click "Connect"**
5. **You should see the `alumniai` database** in the left sidebar

### Method 2: Using Connection Form

1. **Open MongoDB Compass**
2. **Click "Fill in connection fields individually"**
3. **Enter the following**:
   - **Hostname**: `localhost`
   - **Port**: `27017`
   - **Authentication**: None (leave as "None")
   - **Database Name**: `alumniai` (optional, but helps)
4. **Click "Connect"**

---

## 📊 What You'll See in MongoDB Compass

Once connected, you should see the **`alumniai`** database with the following collections:

### Collections:
1. **users** - User accounts (students, alumni, admins)
2. **activitylogs** - System activity logs
3. **mentorshiprequests** - Mentorship requests and matches
4. **jobpostings** - Job postings and applications
5. **resumes** - Uploaded resumes and analysis results

### Sample Data Structure:

#### Users Collection:
```json
{
  "_id": ObjectId("..."),
  "email": "user@example.com",
  "role": "student",
  "profile": {
    "firstName": "John",
    "lastName": "Doe",
    "skills": ["JavaScript", "React"],
    "graduationYear": 2024
  },
  "isActive": true,
  "createdAt": ISODate("..."),
  "updatedAt": ISODate("...")
}
```

#### Resumes Collection:
```json
{
  "_id": ObjectId("..."),
  "user": ObjectId("..."),
  "fileName": "resume-xxx-timestamp.pdf",
  "originalName": "My_Resume.pdf",
  "processingStatus": "completed",
  "analysisResults": {
    "atsScore": 85,
    "skillsExtracted": ["JavaScript", "React", "Node.js"],
    "experienceYears": 2
  },
  "isActive": true,
  "createdAt": ISODate("..."),
  "updatedAt": ISODate("...")
}
```

---

## 🔍 Verifying the Connection

### Backend Logs Confirmation:
When your backend starts, you should see:
```
✅ MongoDB Connected Successfully!
📊 Database Host: localhost
📁 Database Name: alumniai
🔌 Connection Port: 27017
📍 Full Connection String for Compass: mongodb://localhost:27017/alumniai
```

### Check MongoDB Service Status:
```powershell
# Windows PowerShell
Get-Service -Name MongoDB

# Expected Output:
# Status: Running
```

### Test Connection from Command Line:
```bash
# Using MongoDB Shell (mongosh)
mongosh mongodb://localhost:27017/alumniai

# You should see:
# Connected to: mongodb://localhost:27017/alumniai
```

---

## 📁 Backend Configuration Files

### 1. `.env` File
Location: `alumni-portal-backend/.env`

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/alumniai
MONGODB_TEST_URI=mongodb://localhost:27017/alumniai_test
```

### 2. Database Configuration
Location: `alumni-portal-backend/src/config/database.js`

```javascript
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/alumniai';
    
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ MongoDB Connected Successfully!');
    console.log(`📁 Database Name: ${conn.connection.name}`);
    // ... more configuration
  } catch (error) {
    console.error('❌ Database connection failed!');
  }
};

module.exports = connectDB;
```

---

## 🛠️ Troubleshooting

### Issue 1: "Cannot connect to MongoDB"

**Solution:**
1. Check if MongoDB service is running:
   ```powershell
   Get-Service -Name MongoDB
   ```
2. If not running, start it:
   ```powershell
   Start-Service -Name MongoDB
   ```
3. Or use:
   ```powershell
   net start MongoDB
   ```

### Issue 2: "Database not showing in Compass"

**Solution:**
1. Make sure backend is running and connected
2. Create some data by:
   - Registering a user on the frontend
   - Uploading a resume
   - Creating a job posting
3. Refresh MongoDB Compass (click the refresh icon)
4. The database only appears after first document is created

### Issue 3: "Connection timeout"

**Solution:**
1. Verify MongoDB is listening on port 27017:
   ```powershell
   Get-NetTCPConnection -LocalPort 27017
   ```
2. Check firewall settings
3. Try connecting without database name:
   ```
   mongodb://localhost:27017
   ```
4. Then navigate to `alumniai` database manually

### Issue 4: "Authentication failed"

**Solution:**
- Local MongoDB typically doesn't require authentication
- If you set up authentication, update connection string:
  ```
  mongodb://username:password@localhost:27017/alumniai
  ```
- Or disable authentication in MongoDB config

### Issue 5: "Database name is different"

**Solution:**
- Check backend logs for actual database name
- Look for this line:
  ```
  📁 Database Name: alumniai
  ```
- Use that exact name in Compass

---

## 📊 Useful MongoDB Compass Features

### 1. View Documents
- Click on a collection (e.g., `users`)
- See all documents in that collection
- Use filters to search: `{ "role": "alumni" }`

### 2. Create Indexes
- Click on "Indexes" tab in a collection
- View existing indexes
- Create new indexes for better performance

### 3. Run Aggregations
- Click on "Aggregations" tab
- Build aggregation pipelines visually
- Export results as JSON

### 4. Schema Analysis
- Click on "Schema" tab
- See field types and distributions
- Identify data patterns

### 5. Export Data
- Click on a collection
- Click "Export Collection"
- Choose format (JSON, CSV)
- Save to file

### 6. Import Data
- Click on a collection
- Click "Add Data" → "Import File"
- Select JSON or CSV file
- Import documents

---

## 🔐 Security Notes

### Current Configuration (Development):
- ✅ No authentication required (local development)
- ✅ Accessible only from localhost
- ✅ Not exposed to internet

### For Production:
- ⚠️ Enable MongoDB authentication
- ⚠️ Use strong passwords
- ⚠️ Enable SSL/TLS
- ⚠️ Restrict network access
- ⚠️ Use environment variables for credentials
- ⚠️ Consider MongoDB Atlas for cloud hosting

---

## 📈 Monitoring Database Activity

### View Real-Time Operations:
1. Open MongoDB Compass
2. Click on "Performance" tab
3. See real-time operations
4. Monitor slow queries

### Check Database Size:
1. Click on database name
2. See "Data Size" and "Storage Size"
3. Monitor growth over time

### View Collection Stats:
1. Click on a collection
2. Click on "Indexes" tab
3. See document count, size, and index usage

---

## 🎯 Quick Actions in Compass

### Create a New Document:
1. Click on a collection
2. Click "Add Data" → "Insert Document"
3. Enter JSON data
4. Click "Insert"

### Update a Document:
1. Find the document
2. Click on it to expand
3. Click "Edit Document"
4. Make changes
5. Click "Update"

### Delete a Document:
1. Find the document
2. Hover over it
3. Click the trash icon
4. Confirm deletion

### Run a Query:
1. Click on a collection
2. Use the filter bar at top
3. Enter query: `{ "email": "user@example.com" }`
4. Press Enter

---

## 📚 Useful Queries for Your Project

### Find all alumni:
```json
{ "role": "alumni" }
```

### Find users by graduation year:
```json
{ "profile.graduationYear": 2024 }
```

### Find completed resumes:
```json
{ "processingStatus": "completed" }
```

### Find active job postings:
```json
{ "status": "active", "isActive": true }
```

### Find mentorship requests by status:
```json
{ "status": "accepted" }
```

### Find users with specific skills:
```json
{ "profile.skills": { "$in": ["JavaScript", "React"] } }
```

---

## ✅ Connection Checklist

- [x] MongoDB service is running
- [x] Backend is connected to `alumniai` database
- [x] Connection string is `mongodb://localhost:27017/alumniai`
- [x] `.env` file has correct `MONGODB_URI`
- [x] Backend logs show successful connection
- [x] MongoDB Compass can connect using the connection string
- [x] Collections are visible in Compass (after creating data)

---

## 🎉 Success Indicators

You'll know everything is working when:

1. ✅ Backend logs show:
   ```
   ✅ MongoDB Connected Successfully!
   📁 Database Name: alumniai
   ```

2. ✅ MongoDB Compass shows:
   - Database: `alumniai`
   - Collections: users, activitylogs, mentorshiprequests, jobpostings, resumes

3. ✅ You can:
   - View documents in collections
   - Create new documents
   - Update existing documents
   - Run queries and aggregations

---

## 📞 Need Help?

If you're still having issues:

1. Check backend logs for errors
2. Verify MongoDB service status
3. Try restarting MongoDB service
4. Try restarting backend server
5. Check `.env` file for typos
6. Ensure port 27017 is not blocked by firewall

---

## 🔄 Quick Restart Commands

### Restart MongoDB Service:
```powershell
Restart-Service -Name MongoDB
```

### Restart Backend:
```bash
# Stop current process (Ctrl+C)
# Then start again:
cd alumni-portal-backend
npm start
```

### Check Everything:
```powershell
# Check MongoDB
Get-Service -Name MongoDB

# Check port 27017
Get-NetTCPConnection -LocalPort 27017

# Check backend logs
# Look for "MongoDB Connected Successfully!"
```

---

## 📝 Summary

**Connection String**: `mongodb://localhost:27017/alumniai`

**Database Name**: `alumniai`

**Collections**:
- users
- activitylogs
- mentorshiprequests
- jobpostings
- resumes

**Status**: ✅ Connected and Ready!

You can now view all your data in MongoDB Compass using the connection string above.
