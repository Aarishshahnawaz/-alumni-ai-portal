const express = require('express');
const router = express.Router();

// Import controllers
const {
  upload,
  uploadResume,
  getMyResume,
  downloadResume,
  deleteResume,
  searchResumesBySkills,
  getResumeStatistics
} = require('../controllers/resumeController');

// Import middleware
const { authenticate, authorize } = require('../middleware/auth');
const { logActivity } = require('../middleware/activityLogger');
const { validatePagination, validateObjectId } = require('../middleware/validation');

// All routes require authentication
router.use(authenticate);

// Upload resume
router.post('/upload',
  upload.single('resume'),
  logActivity('file_upload', 'resume', 'file_management', {
    getDetails: (req) => ({
      fileName: req.file?.originalname,
      fileSize: req.file?.size,
      mimeType: req.file?.mimetype
    })
  }),
  uploadResume
);

// Get my resume
router.get('/my',
  getMyResume
);

// Download resume
router.get('/:id/download',
  validateObjectId('id'),
  logActivity('file_download', 'resume', 'file_management', {
    getResourceId: (req) => req.params.id,
    getDetails: (req) => ({
      action: 'download',
      resumeId: req.params.id
    })
  }),
  downloadResume
);

// Delete my resume
router.delete('/my',
  deleteResume
);

// Search resumes by skills (alumni and admin only)
router.get('/search',
  authorize('alumni', 'admin'),
  validatePagination,
  searchResumesBySkills
);

// Get resume statistics (admin only)
router.get('/statistics',
  authorize('admin'),
  getResumeStatistics
);

module.exports = router;