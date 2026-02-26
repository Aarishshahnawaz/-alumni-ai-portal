# Test LinkedIn & GitHub Saving

## Quick Test Steps

### 1. Hard Refresh Browser
```
Ctrl + Shift + R (Windows)
Cmd + Shift + R (Mac)
```

### 2. Open Browser Console
Press F12 → Console tab

### 3. Open Backend Terminal
Check backend logs in terminal

### 4. Test Adding LinkedIn

1. Go to Profile page
2. Click "Edit Profile"
3. Find LinkedIn input field
4. Enter: `https://linkedin.com/in/yourname`
5. Click "Save Changes"

**Check Browser Console:**
```
💾 Saving profile with data: {...}
💼 LinkedIn: https://linkedin.com/in/yourname
💻 GitHub: 
```

**Check Backend Logs:**
```
📝 Profile update request received
Updating profile.linkedin: https://linkedin.com/in/yourname
💼 LinkedIn value: https://linkedin.com/in/yourname
💾 Saving user to database...
✅ User saved successfully
```

**Check Profile Page:**
- Should show clickable LinkedIn link
- Click link → Opens LinkedIn in new tab

### 5. Test Adding GitHub

1. Click "Edit Profile"
2. Find GitHub input field
3. Enter: `https://github.com/yourname`
4. Click "Save Changes"

**Check Console Logs** (same as above)

**Check Profile Page:**
- Should show clickable GitHub link
- Click link → Opens GitHub in new tab

### 6. Test Empty Values

1. Click "Edit Profile"
2. Clear LinkedIn URL (delete all text)
3. Click "Save Changes"

**Should:**
- ✅ Save successfully
- ✅ Show "Not added" for LinkedIn
- ✅ No errors in console

### 7. Test Invalid URLs

1. Click "Edit Profile"
2. Enter invalid URL: `not-a-url`
3. Click "Save Changes"

**Should:**
- ❌ Show validation error
- ❌ NOT save to database
- ❌ Error message in console

---

## Expected Results

### Valid LinkedIn URLs:
```
✅ https://linkedin.com/in/johndoe
✅ https://www.linkedin.com/in/johndoe
✅ http://linkedin.com/company/example
```

### Valid GitHub URLs:
```
✅ https://github.com/johndoe
✅ https://www.github.com/johndoe
✅ http://github.com/johndoe/repo
```

### Invalid URLs:
```
❌ linkedin.com/in/johndoe          (missing protocol)
❌ https://facebook.com/johndoe     (wrong domain)
❌ not-a-url                        (invalid format)
```

---

## Visual Check

### Profile Page - View Mode:

**With Links:**
```
┌─────────────────────────────┐
│ Social Links                │
├─────────────────────────────┤
│ 💼 LinkedIn                 │
│    View Profile →           │  <- Clickable link
│                             │
│ 💻 GitHub                   │
│    View Profile →           │  <- Clickable link
└─────────────────────────────┘
```

**Without Links:**
```
┌─────────────────────────────┐
│ Social Links                │
├─────────────────────────────┤
│ 💼 LinkedIn                 │
│    Not added                │  <- Gray text
│                             │
│ 💻 GitHub                   │
│    Not added                │  <- Gray text
└─────────────────────────────┘
```

### Profile Page - Edit Mode:

```
┌─────────────────────────────┐
│ Social Links                │
├─────────────────────────────┤
│ 💼 LinkedIn                 │
│    [https://linkedin.com/...] │  <- Input field
│                             │
│ 💻 GitHub                   │
│    [https://github.com/...] │  <- Input field
└─────────────────────────────┘
```

---

## Console Logs

### Frontend (Browser):
```javascript
💾 Saving profile with data: {
  firstName: "John",
  lastName: "Doe",
  linkedin: "https://linkedin.com/in/johndoe",
  github: "https://github.com/johndoe",
  location: "New York",
  currentCompany: "Google",
  graduationYear: 2020,
  bio: "Software Engineer",
  skills: ["React", "Node.js"]
}
💼 LinkedIn: https://linkedin.com/in/johndoe
💻 GitHub: https://github.com/johndoe
```

### Backend (Terminal):
```
📝 Profile update request received
User ID: 699ecd054c1649dbac35a749
Update data: {
  "profile": {
    "firstName": "John",
    "lastName": "Doe",
    "linkedin": "https://linkedin.com/in/johndoe",
    "github": "https://github.com/johndoe",
    ...
  }
}
Updating profile.firstName: John
Updating profile.lastName: Doe
Updating profile.linkedin: https://linkedin.com/in/johndoe
Updating profile.github: https://github.com/johndoe
💼 LinkedIn value: https://linkedin.com/in/johndoe
💻 GitHub value: https://github.com/johndoe
💾 Saving user to database...
✅ User saved successfully
✅ Profile update successful
```

---

## Database Verification

### Using MongoDB Compass:

1. Open MongoDB Compass
2. Connect to: `mongodb://localhost:27017/alumniai`
3. Go to `users` collection
4. Find your user document
5. Check `profile` object:

```json
{
  "_id": "699ecd054c1649dbac35a749",
  "email": "user@example.com",
  "profile": {
    "firstName": "John",
    "lastName": "Doe",
    "linkedin": "https://linkedin.com/in/johndoe",  // ✅ Should be here
    "github": "https://github.com/johndoe",         // ✅ Should be here
    ...
  }
}
```

---

## Troubleshooting

### Issue: "Not added" still showing

**Check:**
1. Browser console - Are values being sent?
2. Backend logs - Are values being saved?
3. Database - Are values in document?

**Fix:**
- Hard refresh browser (Ctrl + Shift + R)
- Check Redux state in React DevTools
- Verify `checkAuthStatus()` is called after save

### Issue: Validation error

**Check:**
- URL format correct?
- Starts with `http://` or `https://`?
- Contains correct domain?

**Fix:**
- Use full URL: `https://linkedin.com/in/yourname`
- Don't use: `linkedin.com/in/yourname`

### Issue: Values disappear after save

**Check:**
- Is `checkAuthStatus()` called?
- Is Redux state updating?
- Are values in database?

**Fix:**
- Verify `handleSave` function
- Check network tab for response
- Verify backend returns updated user

---

## Success Checklist

All must pass:
- [ ] LinkedIn URL saves to database
- [ ] GitHub URL saves to database
- [ ] Links display as clickable
- [ ] Links open in new tab
- [ ] Empty values save as "Not added"
- [ ] Invalid URLs show error
- [ ] Console logs show values
- [ ] Backend logs show values
- [ ] Database has values
- [ ] No errors in console

If all checked → **SUCCESS! 🎉**

---

## Report Results

Please confirm:
1. **LinkedIn saves?** (YES/NO)
2. **GitHub saves?** (YES/NO)
3. **Links clickable?** (YES/NO)
4. **Empty values work?** (YES/NO)
5. **Invalid URLs rejected?** (YES/NO)
6. **Console logs correct?** (YES/NO)
7. **Database has values?** (YES/NO)

If YES to all → Perfect! ✅
