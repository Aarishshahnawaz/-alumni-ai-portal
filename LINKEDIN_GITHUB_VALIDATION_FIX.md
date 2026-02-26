# LinkedIn and GitHub URL Validation Fix

## Problem
- Any text typed in LinkedIn or GitHub fields was automatically treated as a link
- No validation was performed before saving
- Auto-conversion behavior was confusing

## Solution Implemented

### Frontend Changes (ProfilePage.js)

#### 1. Added Validation State
```javascript
const [validationErrors, setValidationErrors] = useState({
  linkedin: '',
  github: ''
});
```

#### 2. Created Validation Function
```javascript
const validateSocialLink = (field, value) => {
  // If empty, clear error and return true
  if (!value || value.trim() === '') {
    setValidationErrors(prev => ({ ...prev, [field]: '' }));
    return true;
  }

  const linkedinRegex = /^https:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-_%]+\/?$/;
  const githubRegex = /^https:\/\/(www\.)?github\.com\/[a-zA-Z0-9-]+\/?$/;

  let isValid = false;
  let errorMessage = '';

  if (field === 'linkedin') {
    isValid = linkedinRegex.test(value);
    if (!isValid) {
      errorMessage = 'Invalid LinkedIn URL. Format: https://linkedin.com/in/username';
    }
  } else if (field === 'github') {
    isValid = githubRegex.test(value);
    if (!isValid) {
      errorMessage = 'Invalid GitHub URL. Format: https://github.com/username';
    }
  }

  setValidationErrors(prev => ({ ...prev, [field]: errorMessage }));
  return isValid;
};
```

#### 3. Real-time Validation on Input Change
- Validates as user types
- Shows error message immediately below input
- Red border on invalid input

#### 4. Pre-save Validation
```javascript
const handleSave = async () => {
  // Validate social links before saving
  const linkedinUrl = editedProfile.linkedin?.trim() || '';
  const githubUrl = editedProfile.github?.trim() || '';

  // Validate LinkedIn if provided
  if (linkedinUrl && !validateSocialLink('linkedin', linkedinUrl)) {
    toast.error('Please fix LinkedIn URL before saving');
    return;
  }

  // Validate GitHub if provided
  if (githubUrl && !validateSocialLink('github', githubUrl)) {
    toast.error('Please fix GitHub URL before saving');
    return;
  }
  
  // ... rest of save logic
};
```

#### 5. Updated Input Fields
- Changed from `type="url"` to `type="text"` to prevent browser auto-validation
- Added conditional styling for error states
- Show error messages below inputs
- Only render as clickable link in view mode (not edit mode)

### Backend Changes (User.js Model)

#### Updated Validation Regex
```javascript
linkedin: {
  type: String,
  trim: true,
  default: '',
  validate: {
    validator: function(v) {
      if (!v || v === '') return true;
      return /^https:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-_%]+\/?$/.test(v);
    },
    message: 'Invalid LinkedIn URL. Format: https://linkedin.com/in/username'
  }
},
github: {
  type: String,
  trim: true,
  default: '',
  validate: {
    validator: function(v) {
      if (!v || v === '') return true;
      return /^https:\/\/(www\.)?github\.com\/[a-zA-Z0-9-]+\/?$/.test(v);
    },
    message: 'Invalid GitHub URL. Format: https://github.com/username'
  }
}
```

## Validation Rules

### LinkedIn URL Format
- **Required format:** `https://linkedin.com/in/username` or `https://www.linkedin.com/in/username`
- **Regex:** `^https:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-_%]+\/?$`
- **Allowed characters in username:** Letters, numbers, hyphens, underscores, percent signs
- **Optional trailing slash:** Yes

### GitHub URL Format
- **Required format:** `https://github.com/username` or `https://www.github.com/username`
- **Regex:** `^https:\/\/(www\.)?github\.com\/[a-zA-Z0-9-]+\/?$`
- **Allowed characters in username:** Letters, numbers, hyphens
- **Optional trailing slash:** Yes

## User Experience

### Edit Mode
1. User enters URL in input field
2. Real-time validation occurs on every keystroke
3. If invalid:
   - Red border appears around input
   - Error message shows below input
   - Cannot save until fixed
4. If valid:
   - Normal border (gray/primary)
   - No error message
   - Can save successfully

### View Mode
- Only valid URLs are rendered as clickable links
- Shows "View Profile" link text
- Opens in new tab with `target="_blank"`
- If no URL provided, shows "Not added"

### Empty Values
- Empty fields are allowed (optional)
- No validation error for empty fields
- User can clear the field completely

## Benefits

1. **Clear Validation:** Users know exactly what format is required
2. **Immediate Feedback:** Errors shown in real-time as they type
3. **Prevents Invalid Data:** Cannot save until URLs are valid
4. **No Auto-conversion:** Text is not automatically converted to links
5. **Consistent UX:** Same validation on frontend and backend
6. **Security:** Only allows HTTPS URLs from specific domains

## Testing Checklist

- [ ] Empty LinkedIn field saves successfully
- [ ] Empty GitHub field saves successfully
- [ ] Valid LinkedIn URL saves and displays as link
- [ ] Valid GitHub URL saves and displays as link
- [ ] Invalid LinkedIn URL shows error and prevents save
- [ ] Invalid GitHub URL shows error and prevents save
- [ ] Error messages are clear and helpful
- [ ] Links only appear in view mode, not edit mode
- [ ] Cancel button clears validation errors
- [ ] Backend rejects invalid URLs with proper error message
