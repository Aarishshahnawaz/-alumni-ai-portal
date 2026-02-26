const express = require('express');
const router = express.Router();

// Import controllers
const {
  getAlumniDirectory,
  getAlumniProfile,
  getAlumniStatistics,
  getSuggestedAlumni
} = require('../controllers/alumniController');

// Import middleware
const { authenticate, optionalAuth } = require('../middleware/auth');
const { logActivity } = require('../middleware/activityLogger');
const { validatePagination, validateAlumniSearch, validateObjectId } = require('../middleware/validation');

// Public routes (with optional authentication)
router.get('/directory',
  authenticate,
  validatePagination,
  validateAlumniSearch,
  getAlumniDirectory
);

router.get('/statistics',
  optionalAuth,
  getAlumniStatistics
);

// Protected routes (require authentication)
router.use(authenticate);

router.get('/profile/:id',
  validateObjectId('id'),
  logActivity('profile_view', 'alumni_profile', 'profile_management', {
    getResourceId: (req) => req.params.id,
    getDetails: (req) => ({
      viewedProfileId: req.params.id
    })
  }),
  getAlumniProfile
);

router.get('/suggestions',
  validatePagination,
  getSuggestedAlumni
);

module.exports = router;