# Theme Behavior Fix - Dark/Light Mode Scoping

## Problem
Dark/Light mode was being applied globally to the entire application, including:
- Landing Page
- Login Page
- Register Page
- All public routes

This caused unwanted dark mode styling on public pages that should always remain light.

## Solution Implemented

### 1. Created ThemeLayout Component
**File:** `alumni-portal-frontend/src/components/layout/ThemeLayout.js`

A new wrapper component that applies theme only to its children:

```javascript
import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const ThemeLayout = ({ children }) => {
  const { theme } = useTheme();

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        {children}
      </div>
    </div>
  );
};

export default ThemeLayout;
```

**Key Features:**
- Applies `dark` class only to its container
- Sets background and text colors based on theme
- Does NOT affect parent or sibling elements

### 2. Updated ThemeContext
**File:** `alumni-portal-frontend/src/contexts/ThemeContext.js`

**Before:**
```javascript
useEffect(() => {
  // Applied theme globally to document.documentElement
  document.documentElement.classList.remove('light', 'dark');
  document.documentElement.classList.add(theme);
  localStorage.setItem('theme', theme);
}, [theme]);
```

**After:**
```javascript
useEffect(() => {
  // Only save to localStorage, do NOT apply to document.documentElement
  // Theme will be applied locally by ThemeLayout component
  localStorage.setItem('theme', theme);
}, [theme]);
```

**Changes:**
- Removed global class manipulation on `document.documentElement`
- Theme is now only stored in localStorage
- Theme application is delegated to ThemeLayout component

### 3. Updated App.js Routes
**File:** `alumni-portal-frontend/src/App.js`

Wrapped all protected routes with ThemeLayout:

```javascript
// Public Routes - NO ThemeLayout
<Route path="/" element={<LandingPage />} />
<Route path="/login" element={<LoginPage />} />
<Route path="/register" element={<MultiStepRegisterPage />} />

// Protected Routes - WITH ThemeLayout
<Route
  path="/dashboard/student"
  element={
    <ProtectedRoute allowedRoles={['student']}>
      <ThemeLayout>
        <StudentDashboard />
      </ThemeLayout>
    </ProtectedRoute>
  }
/>
<Route
  path="/profile"
  element={
    <ProtectedRoute allowedRoles={['student', 'alumni', 'admin']}>
      <ThemeLayout>
        <ProfilePage />
      </ThemeLayout>
    </ProtectedRoute>
  }
/>
// ... all other protected routes wrapped similarly
```

**Routes Wrapped with ThemeLayout:**
- `/dashboard/student`
- `/dashboard/alumni`
- `/dashboard/admin`
- `/admin/activity-logs`
- `/alumni`
- `/resume`
- `/mentorship`
- `/jobs`
- `/profile`
- `/settings`

**Routes WITHOUT ThemeLayout (Always Light):**
- `/` (Landing Page)
- `/login`
- `/register`
- `/forgot-password`
- `/verify-otp`
- `/reset-password`
- `/verify-email/:token`
- `/resend-verification`

### 4. Removed Dark Mode Classes from Public Pages

#### LoginPage.js
Removed all `dark:` classes from input fields:
- `dark:bg-gray-800`
- `dark:text-white`
- `dark:placeholder-gray-400`
- `dark:border-gray-600`

#### MultiStepRegisterPage.js
Removed all `dark:` classes from:
- All input fields
- All labels
- All form elements

**Result:** Public pages now always use light theme styling.

## Application Structure

```
App
├── Public Routes (Always Light)
│   ├── LandingPage
│   ├── LoginPage
│   └── RegisterPage
│
└── Protected Routes (Theme Support)
    └── ThemeLayout (dark class applied here)
        ├── Dashboard
        ├── Profile
        ├── Settings
        └── Other authenticated pages
```

## How It Works

### Theme Flow

1. **User toggles theme** in Dashboard/Settings
2. **ThemeContext updates** theme state
3. **localStorage saves** theme preference
4. **ThemeLayout component** reads theme from context
5. **Dark class applied** only to ThemeLayout container
6. **Child components** inherit dark mode via Tailwind's `dark:` classes

### CSS Cascade

```html
<!-- Public Page (No Theme) -->
<div class="App">
  <LandingPage />  <!-- Always light -->
</div>

<!-- Protected Page (With Theme) -->
<div class="App">
  <ThemeLayout>
    <div class="dark">  <!-- Applied when theme === 'dark' -->
      <div class="min-h-screen bg-gray-900 text-white">
        <Dashboard />  <!-- Can use dark: classes -->
      </div>
    </div>
  </ThemeLayout>
</div>
```

## Benefits

1. **Scoped Theme Application**
   - Theme only affects authenticated pages
   - Public pages remain consistently light

2. **No Global Side Effects**
   - No manipulation of `document.documentElement`
   - No theme flashing on page load
   - No unintended styling on public pages

3. **Clean Separation**
   - Public routes: Always light
   - Protected routes: Theme support
   - Clear component boundaries

4. **Maintainable**
   - Single ThemeLayout component manages theme application
   - Easy to add new protected routes
   - Consistent pattern across the app

5. **Performance**
   - No unnecessary re-renders
   - Theme changes only affect ThemeLayout children
   - Efficient CSS class application

## Testing Checklist

- [ ] Landing page always shows light theme
- [ ] Login page always shows light theme
- [ ] Register page always shows light theme
- [ ] Dashboard respects theme toggle
- [ ] Profile page respects theme toggle
- [ ] Settings page respects theme toggle
- [ ] Theme persists after page reload
- [ ] No theme flashing on initial load
- [ ] Theme toggle only visible in authenticated pages
- [ ] Switching between public and protected routes maintains correct theme
- [ ] Dark mode inputs visible in protected pages
- [ ] Light mode inputs visible in public pages

## Migration Notes

If you need to add a new protected route:

```javascript
// Add ThemeLayout wrapper
<Route
  path="/new-protected-page"
  element={
    <ProtectedRoute allowedRoles={['student', 'alumni']}>
      <ThemeLayout>
        <NewProtectedPage />
      </ThemeLayout>
    </ProtectedRoute>
  }
/>
```

If you need to add a new public route:

```javascript
// NO ThemeLayout wrapper
<Route
  path="/new-public-page"
  element={<NewPublicPage />}
/>
```

## Technical Details

### Tailwind Dark Mode Configuration
Ensure `tailwind.config.js` has:

```javascript
module.exports = {
  darkMode: 'class', // Uses class-based dark mode
  // ... rest of config
}
```

### Theme Context Provider
Must wrap entire app in `index.js`:

```javascript
<ThemeProvider>
  <App />
</ThemeProvider>
```

### Component Requirements
Protected pages can use `dark:` classes:
```javascript
<div className="bg-white dark:bg-gray-800">
  <p className="text-gray-900 dark:text-white">Content</p>
</div>
```

Public pages should NOT use `dark:` classes:
```javascript
<div className="bg-white">
  <p className="text-gray-900">Content</p>
</div>
```

## Troubleshooting

### Issue: Theme not applying to protected pages
**Solution:** Ensure route is wrapped with ThemeLayout

### Issue: Public pages showing dark mode
**Solution:** Remove ThemeLayout wrapper and all `dark:` classes from component

### Issue: Theme not persisting
**Solution:** Check localStorage is enabled and ThemeContext is properly initialized

### Issue: Theme flashing on load
**Solution:** Ensure theme is read from localStorage in ThemeContext initial state

## Summary

The theme system now properly scopes dark/light mode to authenticated pages only, keeping public pages consistently light. This provides a better user experience and cleaner code architecture.
