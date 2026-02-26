# Test Profile System Upgrade

## Quick Test Steps

### 1. Hard Refresh Browser
```
Ctrl + Shift + R (Windows)
Cmd + Shift + R (Mac)
```

### 2. Check Avatar in Navbar
- Look at top-right corner
- Should show your profile image (if uploaded)
- Or show your initials (if no image)

### 3. Check Avatar in Sidebar
- Look at bottom of sidebar
- Should show same avatar as navbar
- Should sync automatically

### 4. Open Profile Page
Navigate to: `http://localhost:3000/profile`

### 5. Test Profile Completion Ring
- Look at avatar
- Should have colored ring around it
- Blue ring if < 100% complete
- Green ring if 100% complete
- Percentage text below avatar

### 6. Test View Mode (Default)
- Avatar visible
- NO upload button
- Click on avatar does nothing
- All info displayed

### 7. Test Edit Mode
Click "Edit Profile" button

**Should see:**
- ✅ Input fields for all info
- ✅ "Upload Photo" / "Change Photo" button
- ✅ Click avatar opens file picker
- ✅ LinkedIn input field
- ✅ GitHub input field
- ✅ Skills add/remove
- ✅ Bio textarea

### 8. Test Image Upload
1. Click "Edit Profile"
2. Click on avatar or "Upload Photo"
3. Select an image
4. Wait for upload
5. Check:
   - ✅ Spinner shows during upload
   - ✅ Success toast appears
   - ✅ Avatar updates in profile
   - ✅ Avatar updates in navbar
   - ✅ Avatar updates in sidebar
   - ✅ Progress ring updates

### 9. Test LinkedIn & GitHub
1. Click "Edit Profile"
2. Add LinkedIn URL: `https://linkedin.com/in/yourname`
3. Add GitHub URL: `https://github.com/yourname`
4. Click "Save Changes"
5. Check:
   - ✅ Links are clickable
   - ✅ Open in new tab
   - ✅ Icons display correctly

### 10. Test Profile Completion
Fill in these fields and watch percentage increase:
- [ ] First Name
- [ ] Last Name
- [ ] Email (already filled)
- [ ] Location
- [ ] Graduation Year
- [ ] Current Company
- [ ] At least one skill
- [ ] Bio
- [ ] Avatar
- [ ] LinkedIn
- [ ] GitHub

**At 100%:**
- ✅ Ring turns green
- ✅ Green checkmark badge appears
- ✅ Shows "100% Complete"

### 11. Test Cancel
1. Click "Edit Profile"
2. Make some changes
3. Click "Cancel"
4. Check:
   - ✅ Changes reverted
   - ✅ Back to view mode
   - ✅ Original data shown

### 12. Test Save
1. Click "Edit Profile"
2. Make changes
3. Click "Save Changes"
4. Check:
   - ✅ Success toast appears
   - ✅ Changes saved
   - ✅ Back to view mode
   - ✅ New data displayed

## Expected Results

### ✅ SUCCESS:
- Avatar shows everywhere (navbar, sidebar, profile)
- Progress ring displays with correct percentage
- Upload only works in edit mode
- LinkedIn & GitHub links work
- All changes save correctly
- Global state syncs immediately

### ❌ FAILURE:
If any of these fail, check:
1. Browser console for errors
2. Network tab for failed requests
3. Redux DevTools for state updates

## Visual Checklist

### Navbar (Top Right):
```
[Avatar] [Theme Toggle] [Bell] [User Info]
  ^
  Should show your image or initials
```

### Sidebar (Bottom):
```
[Avatar] [Name]
         [Role]
  ^
  Should show your image or initials
```

### Profile Page:
```
[Progress Ring]
    [Avatar]
  XX% Complete
```

### Edit Mode:
```
[Progress Ring]
    [Avatar] <- Click to upload
  [Upload Photo]
```

## Common Issues

### Avatar not showing:
- Check if image uploaded successfully
- Check Network tab for CORS errors
- Verify backend is running

### Progress ring not showing:
- Check console for errors
- Verify SVG rendering
- Check CSS conflicts

### Upload not working:
- Must be in Edit Mode
- Check file type (JPG, PNG, JPEG only)
- Check file size (max 5MB)
- Check backend logs

### Links not clickable:
- Must be in View Mode (not Edit Mode)
- Must have valid URL format
- Must start with https://

## Browser Console

Should see:
```
✅ No errors
✅ No CORS errors
✅ No 404 errors
```

Should NOT see:
```
❌ net::ERR_BLOCKED_BY_RESPONSE
❌ Failed to load resource
❌ Uncaught TypeError
```

## Network Tab

Image request should show:
```
GET /uploads/avatars/avatar-xxxxx.jpg
Status: 200 OK
Type: image/jpeg
Headers:
  access-control-allow-origin: http://localhost:3000
  cross-origin-resource-policy: cross-origin
```

## Redux DevTools

After upload, user state should update:
```javascript
{
  user: {
    profile: {
      avatar: "/uploads/avatars/avatar-xxxxx.jpg",
      // ... other fields
    }
  }
}
```

## Final Verification

All 4 features working:
- [x] Feature 1: Avatar shows everywhere
- [x] Feature 2: Progress ring displays
- [x] Feature 3: LinkedIn & GitHub work
- [x] Feature 4: Upload only in edit mode

If all checked → **SUCCESS! 🎉**
