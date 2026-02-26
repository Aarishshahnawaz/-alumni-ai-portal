# Testing Guide - Session Persistence & Settings

## Quick Test Commands

### Start Backend
```bash
cd alumni-portal-backend
npm start
```

### Start Frontend
```bash
cd alumni-portal-frontend
npm start
```

---

## Test 1: Session Persistence

### Steps
1. Open browser to `http://localhost:3000`
2. Login with valid credentials
3. Navigate to any protected page (e.g., Dashboard)
4. **Press F5 to refresh the page**
5. **Expected**: User stays logged in, no redirect to login page
6. Check browser DevTools → Application → Local Storage
7. **Expected**: `token` and `refreshToken` keys present

### Success Criteria
✅ User remains logged in after refresh
✅ Dashboard loads without redirect
✅ Tokens present in localStorage
✅ User data displayed correctly

---

## Test 2: Settings Page Access

### Steps
1. Login to the application
2. Click on "Settings" in the sidebar (bottom section)
3. **Expected**: Settings page loads at `/settings`
4. **Expected**: No 404 error

### Success Criteria
✅ Settings page loads successfully
✅ All sections visible:
   - Appearance
   - Account Settings
   - Notifications
   - Privacy
   - Security
   - Danger Zone

---

## Test 3: Dark Mode

### Steps
1. Navigate to Settings page
2. Find "Dark Mode" toggle in Appearance section
3. Click the toggle switch
4. **Expected**: Page immediately switches to dark theme
5. **Expected**: Toast notification: "Dark mode enabled"
6. Refresh the page (F5)
7. **Expected**: Dark mode persists after refresh
8. Toggle dark mode off
9. **Expected**: Returns to light theme

### Success Criteria
✅ Dark mode applies instantly
✅ All components styled correctly in dark mode
✅ Theme persists after page refresh
✅ Toast notification appears
✅ Can toggle back to light mode

---

## Test 4: Change Password

### Steps
1. Go to Settings → Account Settings
2. Click "Change Password" button
3. Password form appears
4. Fill in:
   - Current Password: (your current password)
   - New Password: `newpass123`
   - Confirm New Password: `newpass123`
5. Click "Change Password" button
6. **Expected**: Success toast: "Password changed successfully"
7. **Expected**: Form closes
8. Logout and try logging in with new password
9. **Expected**: Login successful

### Success Criteria
✅ Password form shows/hides correctly
✅ Password visibility toggles work
✅ Validation works (min 6 chars, passwords match)
✅ Success toast appears
✅ Can login with new password

---

## Test 5: Notification Preferences

### Steps
1. Go to Settings → Notifications section
2. Toggle "Email Notifications" OFF
3. Toggle "Mentorship Alerts" OFF
4. Toggle "Job Alerts" ON
5. Scroll to bottom and click "Save Settings"
6. **Expected**: Toast: "Settings saved successfully"
7. Refresh the page
8. **Expected**: Toggle states persist

### Success Criteria
✅ Toggles work smoothly
✅ Save button shows loading state
✅ Success toast appears
✅ Settings persist after refresh

---

## Test 6: Privacy Settings

### Steps
1. Go to Settings → Privacy section
2. Change "Profile Visibility" dropdown to "Alumni Only"
3. Toggle "Allow Mentor Requests" OFF
4. Click "Save Settings"
5. **Expected**: Success toast
6. Refresh page
7. **Expected**: Settings persist

### Success Criteria
✅ Dropdown changes work
✅ Toggle works
✅ Settings save successfully
✅ Settings persist after refresh

---

## Test 7: Security Features

### Steps
1. Go to Settings → Security section
2. Check "Last Login" displays a date/time
3. Click "Logout from all devices"
4. Confirm the action
5. **Expected**: Redirected to login page
6. **Expected**: Must login again

### Success Criteria
✅ Last login displays correctly
✅ Logout all devices works
✅ Redirected to login
✅ Must re-authenticate

---

## Test 8: Multiple Browser Sessions

### Steps
1. Login in Chrome
2. Login in Firefox (or Incognito)
3. In Chrome, go to Settings → Security
4. Click "Logout from all devices"
5. Check Firefox window
6. Try to navigate or refresh
7. **Expected**: Firefox session also logged out

### Success Criteria
✅ Both sessions logged out
✅ Both redirect to login page

---

## Test 9: Token Expiration Handling

### Steps
1. Login to the application
2. Open DevTools → Application → Local Storage
3. Delete the `token` key (keep `refreshToken`)
4. Try to navigate to a protected page
5. **Expected**: Token refresh attempt
6. **Expected**: Either stays logged in (if refresh works) or redirects to login

### Success Criteria
✅ Token refresh mechanism works
✅ Graceful handling of expired tokens
✅ User experience not disrupted

---

## Test 10: Settings Navigation

### Steps
1. Login as Student
2. Check sidebar has "Settings" link
3. Login as Alumni
4. Check sidebar has "Settings" link
5. Login as Admin
6. Check sidebar has "Settings" link

### Success Criteria
✅ All roles can access Settings
✅ Settings link visible in sidebar
✅ Settings page loads for all roles

---

## Browser Console Checks

### Expected Console Logs (Development Mode)
```
🚀 API Request: GET /api/auth/profile
✅ API Response: GET /api/auth/profile
📝 Profile update request received
✅ Profile update successful
```

### No Errors Expected
- No 404 errors
- No authentication errors after refresh
- No CORS errors
- No undefined variable errors

---

## Database Verification

### Check MongoDB
```javascript
// Connect to MongoDB
use alumniai

// Check user preferences
db.users.findOne({ email: "test@example.com" }, { preferences: 1 })

// Expected output:
{
  preferences: {
    emailNotifications: true,
    mentorshipAlerts: true,
    jobAlerts: true,
    profileVisibility: "public",
    allowMentorRequests: true,
    theme: "dark"
  }
}
```

---

## Common Issues & Solutions

### Issue: 404 on /settings
**Solution**: Ensure frontend is running and route is added to App.js

### Issue: Dark mode not persisting
**Solution**: Check localStorage has `theme` key, check Tailwind config has `darkMode: 'class'`

### Issue: User logged out after refresh
**Solution**: Check tokens in localStorage, check `checkAuthStatus` is called in App.js

### Issue: Settings not saving
**Solution**: Check backend is running, check network tab for API errors

### Issue: Password change fails
**Solution**: Verify current password is correct, check backend logs

---

## Performance Checks

### Page Load Time
- Settings page should load in < 500ms
- Dark mode toggle should be instant
- Save settings should complete in < 1s

### Network Requests
- Initial load: 1 request (GET /api/auth/profile)
- Save settings: 1 request (PUT /api/auth/profile)
- Change password: 1 request (PUT /api/auth/change-password)

---

## Accessibility Checks

### Keyboard Navigation
- Tab through all form fields
- Toggle switches accessible via keyboard
- Buttons focusable and clickable with Enter

### Screen Reader
- Labels properly associated with inputs
- Toggle states announced
- Error messages announced

---

## Mobile Responsiveness

### Test on Mobile Viewport
1. Open DevTools → Toggle device toolbar
2. Select iPhone or Android device
3. Navigate to Settings page
4. **Expected**: Layout adapts to mobile
5. **Expected**: All features work on mobile

---

## Final Checklist

Before marking as complete:

- [ ] Session persists after refresh
- [ ] Settings page loads without 404
- [ ] Dark mode works and persists
- [ ] Change password works
- [ ] All toggles save correctly
- [ ] Privacy settings save
- [ ] Security features work
- [ ] No console errors
- [ ] Database updates correctly
- [ ] Works on all user roles
- [ ] Mobile responsive
- [ ] Keyboard accessible

---

## Success! 🎉

If all tests pass, the implementation is complete and working correctly.
