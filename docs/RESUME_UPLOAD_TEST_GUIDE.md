# Resume Upload Feature - Testing Guide

## Prerequisites
- ✅ Backend running on http://localhost:5000
- ✅ Frontend running on http://localhost:3000
- ✅ MongoDB connected
- ✅ User logged in (student or alumni account)

## Test Scenarios

### Scenario 1: Upload a Resume

**Steps:**
1. Navigate to Resume Upload page (usually `/resume` or from dashboard menu)
2. Prepare a test file:
   - PDF file (recommended)
   - DOC or DOCX file
   - Size: Less than 10MB
3. Upload method A - Drag & Drop:
   - Drag file into the upload area
   - Drop file
4. Upload method B - File Browser:
   - Click "browse" link
   - Select file from file picker
5. Verify file appears in preview with:
   - File name
   - File size
   - Delete button
6. Click "Upload & Analyze Resume" button
7. Observe:
   - Button changes to "Uploading... X%"
   - Progress bar appears and fills
   - Success toast message appears
   - File preview clears
   - Current Resume section updates

**Expected Results:**
- ✅ Upload completes successfully
- ✅ Success message: "Resume uploaded successfully! AI analysis in progress..."
- ✅ Current Resume section shows uploaded file
- ✅ Processing status shows "Pending Analysis" or "Analyzing..."

### Scenario 2: View Resume Analysis

**Steps:**
1. After uploading, wait ~5 seconds
2. Refresh the page or wait for auto-update
3. Check Current Resume section

**Expected Results:**
- ✅ Processing status changes to "Analysis Complete" with green checkmark
- ✅ ATS Score displayed (e.g., 85/100)
- ✅ Progress bar shows score visually
- ✅ Extracted Skills shown as tags
- ✅ Experience years displayed
- ✅ Improvement suggestions listed

**Mock Data (Current Implementation):**
```
ATS Score: 85/100
Skills: JavaScript, React, Node.js, HTML, CSS
Experience: 2 years
Suggestions:
- Add more quantifiable achievements
- Include relevant certifications
- Optimize keywords for ATS systems
```

### Scenario 3: Download Resume

**Steps:**
1. Navigate to Resume Upload page
2. Locate Current Resume section
3. Click download icon (Download button)

**Expected Results:**
- ✅ File downloads to browser's download folder
- ✅ File name matches original upload name
- ✅ Success toast: "Resume downloaded"
- ✅ File opens correctly

### Scenario 4: Delete Resume

**Steps:**
1. Navigate to Resume Upload page
2. Locate Current Resume section
3. Click delete icon (Trash button)
4. Confirm deletion in popup

**Expected Results:**
- ✅ Confirmation dialog appears
- ✅ After confirming, success toast: "Resume deleted successfully"
- ✅ Current Resume section shows "No resume uploaded"
- ✅ File removed from server

### Scenario 5: File Validation - Invalid Type

**Steps:**
1. Try to upload an image file (JPG, PNG)
2. Or try to upload a text file (TXT)

**Expected Results:**
- ✅ Error toast: "Only PDF, DOC, and DOCX files are allowed"
- ✅ File not added to preview
- ✅ Upload button not enabled

### Scenario 6: File Validation - Too Large

**Steps:**
1. Try to upload a file larger than 10MB

**Expected Results:**
- ✅ Error toast: "File size must be less than 10MB"
- ✅ File not added to preview
- ✅ Upload button not enabled

### Scenario 7: Upload Without File

**Steps:**
1. Click "Upload & Analyze Resume" without selecting a file

**Expected Results:**
- ✅ Error toast: "Please select a file first"
- ✅ No upload attempt made

### Scenario 8: Replace Existing Resume

**Steps:**
1. Upload a resume (follow Scenario 1)
2. Upload another resume

**Expected Results:**
- ✅ New resume replaces old one
- ✅ Old resume file deleted from server
- ✅ Old resume record marked inactive
- ✅ New resume becomes current
- ✅ New analysis results displayed

### Scenario 9: Network Error Handling

**Steps:**
1. Stop backend server
2. Try to upload a resume

**Expected Results:**
- ✅ Error toast: "Network error. Please check your internet connection."
- ✅ Upload button re-enabled
- ✅ File remains in preview for retry

### Scenario 10: Processing Status Tracking

**Steps:**
1. Upload a resume
2. Immediately check processing status
3. Wait 5 seconds
4. Check status again

**Expected Results:**
- ✅ Initial status: "Pending Analysis" (gray icon)
- ✅ After ~1 second: "Analyzing..." (blue spinning icon)
- ✅ After ~5 seconds: "Analysis Complete" (green checkmark)

## Backend Verification

### Check Backend Logs

**Expected Log Entries:**
```
[http]: API Request [UserID: xxx] {"method":"POST","url":"/api/resumes/upload","statusCode":201}
[info]: Resume uploaded: resume-xxx-timestamp.pdf
[info]: Resume processing started for ID: xxx
[info]: Resume processing completed for ID: xxx
```

### Check Database

**MongoDB Query:**
```javascript
// Connect to MongoDB
use alumniportal

// Check resumes collection
db.resumes.find().pretty()

// Expected document structure:
{
  _id: ObjectId("..."),
  user: ObjectId("..."),
  fileName: "resume-xxx-timestamp.pdf",
  originalName: "My_Resume.pdf",
  filePath: "/path/to/uploads/resumes/resume-xxx-timestamp.pdf",
  fileSize: 123456,
  mimeType: "application/pdf",
  processingStatus: "completed",
  analysisResults: {
    atsScore: 85,
    skillsExtracted: ["JavaScript", "React", "Node.js"],
    experienceYears: 2,
    suggestions: [...]
  },
  isActive: true,
  createdAt: ISODate("..."),
  updatedAt: ISODate("...")
}
```

### Check File System

**Verify File Exists:**
```bash
# Windows
dir alumni-portal-backend\uploads\resumes

# Expected output:
# resume-{userId}-{timestamp}-{random}.pdf
```

## API Testing (Optional)

### Using cURL or Postman

**1. Upload Resume**
```bash
curl -X POST http://localhost:5000/api/resumes/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "resume=@/path/to/your/resume.pdf"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Resume uploaded successfully",
  "data": {
    "resume": {
      "_id": "...",
      "fileName": "My_Resume.pdf",
      "fileSize": 123456,
      "processingStatus": "pending",
      "uploadedAt": "2026-02-25T..."
    }
  }
}
```

**2. Get My Resume**
```bash
curl -X GET http://localhost:5000/api/resumes/my \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**3. Download Resume**
```bash
curl -X GET http://localhost:5000/api/resumes/{resumeId}/download \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -o downloaded_resume.pdf
```

**4. Delete Resume**
```bash
curl -X DELETE http://localhost:5000/api/resumes/my \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Troubleshooting

### Issue: Upload button doesn't work
**Solution:**
- Check browser console for errors
- Verify JWT token is valid
- Check backend is running
- Verify file meets validation criteria

### Issue: "No resume uploaded" always shows
**Solution:**
- Check backend logs for errors
- Verify MongoDB connection
- Check user is authenticated
- Try refreshing the page

### Issue: Processing stuck at "Analyzing..."
**Solution:**
- Check backend logs for processing errors
- Verify mock processing function is running
- Wait up to 10 seconds (mock delay is 5 seconds)
- Refresh page to check updated status

### Issue: Download doesn't work
**Solution:**
- Check file exists in uploads/resumes folder
- Verify file path in database matches actual file
- Check browser's download settings
- Try different browser

### Issue: File validation not working
**Solution:**
- Check file MIME type (not just extension)
- Verify file size calculation
- Check browser console for validation errors

## Success Criteria

✅ All 10 test scenarios pass
✅ No console errors in browser
✅ No errors in backend logs
✅ Files saved correctly in uploads folder
✅ Database records created correctly
✅ UI updates reflect backend state
✅ Error messages are user-friendly
✅ Progress tracking works smoothly

## Known Limitations (Current Implementation)

⚠️ **Mock AI Analysis**: Currently using mock data for analysis results
- Real implementation requires AI microservice integration
- See RESUME_UPLOAD_FIX_SUMMARY.md for integration steps

⚠️ **Processing Delay**: 5-second simulated delay
- Real processing time depends on file size and AI service
- May need to adjust timeout settings for production

⚠️ **Single Resume Per User**: Users can only have one active resume
- Uploading new resume replaces old one
- Consider implementing resume versioning for production

## Next Steps

1. ✅ Test all scenarios above
2. ⚠️ Integrate real AI microservice (see RESUME_UPLOAD_FIX_SUMMARY.md)
3. ⚠️ Add resume versioning (optional)
4. ⚠️ Add resume sharing features (optional)
5. ⚠️ Add bulk resume search for recruiters (optional)

## Support

If you encounter issues:
1. Check browser console (F12)
2. Check backend logs
3. Verify MongoDB connection
4. Check file permissions on uploads folder
5. Refer to RESUME_UPLOAD_FIX_SUMMARY.md for detailed implementation
