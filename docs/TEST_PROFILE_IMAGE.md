# Profile Image Upload - Testing Guide

## Quick Test Steps

### 1. Open the Application
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

### 2. Login to Your Account
- Use your existing credentials
- Navigate to Profile page

### 3. Upload Profile Image

#### Step-by-Step:
1. Click on the circular avatar area (or "Upload Photo" button)
2. Select an image file (JPG, PNG, JPEG)
3. Wait for upload (spinner will show)
4. Success toast should appear
5. Image should display immediately

#### What to Check:
- ✅ Loading spinner appears during upload
- ✅ Success toast: "Profile image updated successfully!"
- ✅ Image displays in circular frame
- ✅ Progress ring shows around image
- ✅ Completion percentage updates

### 4. Verify in Browser DevTools

#### Console Tab:
```
📤 Uploading profile image...
✅ Upload response: {success: true, ...}
✅ Updated user from response: {...}
✅ Avatar path: /uploads/avatars/avatar-...jpg
=== AVATAR DEBUG ===
Full user: {...}
Avatar path: /uploads/avatars/avatar-...jpg
Image URL: http://localhost:5000/uploads/avatars/avatar-...jpg
===================
✅ Image loaded successfully
Avatar path: /uploads/avatars/avatar-...jpg
```

#### Network Tab:
1. Find request: `PUT /api/auth/profile-image`
   - Status: 200 OK
   - Response includes updated user object

2. Find request: `GET /uploads/avatars/avatar-...jpg`
   - Status: 200 OK
   - Preview shows your image

### 5. Test Persistence
1. Hard refresh page (Ctrl+Shift+R)
2. Image should still be visible
3. Navigate away and come back
4. Image should persist

### 6. Test Image Change
1. Upload a different image
2. Old image should be replaced
3. New image should display immediately

## Troubleshooting

### Image Not Showing?

#### Check Console:
- Look for "Image failed to load" error
- Check the avatar path and full URL
- Verify URL format: `http://localhost:5000/uploads/avatars/...`

#### Check Network Tab:
- Is the image request returning 200?
- Is the image request going to correct URL?
- Is the image file actually loading?

#### Check Backend:
- Is backend running on port 5000?
- Check backend logs for upload confirmation
- Verify file exists in `uploads/avatars/` folder

#### Common Issues:

**White circle showing:**
- Background is now gray, so you'll see gray circle
- This means image failed to load
- Check console for error details

**Initials showing:**
- This means `user.profile.avatar` is null/undefined
- Check Redux state in React DevTools
- Verify upload response structure

**404 on image request:**
- Backend not serving static files
- Check `app.use('/uploads', express.static(...))` in app.js
- Verify file exists in uploads folder

**Image not updating after upload:**
- Redux state not updating
- Check upload handler is using response.data.user
- Verify dispatch(updateProfile()) is called

### Force Refresh
If image is cached:
1. Open DevTools
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"

## Expected Behavior

### On Upload:
1. File input opens
2. User selects image
3. Validation checks (type, size)
4. Loading spinner shows
5. Upload to backend
6. Backend saves file
7. Backend returns updated user
8. Redux state updates
9. React re-renders
10. Image displays
11. Success toast shows

### On Page Load:
1. Redux loads user from state
2. Avatar path exists in user.profile.avatar
3. Image URL constructed: `http://localhost:5000${avatar}`
4. Image element renders
5. Browser requests image
6. Backend serves image
7. Image displays

## Success Indicators

✅ **Upload Works:**
- Spinner shows during upload
- Success toast appears
- Console shows upload logs
- Network shows 200 responses

✅ **Display Works:**
- Image visible in circular frame
- Progress ring around image
- Completion percentage correct
- No console errors

✅ **Persistence Works:**
- Image survives page refresh
- Image survives navigation
- Image survives browser restart (if logged in)

## Test Different Scenarios

### Valid Images:
- Small JPG (< 1MB)
- Large JPG (< 5MB)
- PNG with transparency
- JPEG format

### Invalid Files:
- PDF file → Should show error
- File > 5MB → Should show error
- Non-image file → Should show error

### Edge Cases:
- Upload same image twice
- Upload different image
- Delete and re-upload
- Multiple rapid uploads

## Current Test Results

**Last Tested:** 2026-02-26

**Test Image:**
- File: `avatar-699ecd054c1649dbac35a749-1772050380521-373490348.jpg`
- Location: `alumni-portal-backend/uploads/avatars/`
- URL: `http://localhost:5000/uploads/avatars/avatar-699ecd054c1649dbac35a749-1772050380521-373490348.jpg`
- Status: ✅ Working

**Test Results:**
- ✅ Upload successful
- ✅ Image displays correctly
- ✅ Progress ring shows
- ✅ Completion updates
- ✅ Persists after refresh
- ✅ No console errors
- ✅ No ESLint warnings

## Need Help?

If you're still having issues:

1. Check both backend and frontend are running
2. Clear browser cache completely
3. Check Redux state in React DevTools
4. Verify file exists in uploads folder
5. Test image URL directly in browser
6. Check backend logs for errors
7. Review console logs for clues

## Files Modified

- `alumni-portal-frontend/src/pages/ProfilePage.js`
  - Simplified upload handler
  - Improved avatar rendering
  - Added better logging
  - Removed unused code

No backend changes were needed!
