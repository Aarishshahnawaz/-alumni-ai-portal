const express = require('express');
const router = express.Router();

// Import controllers
const {
  createMentorshipRequest,
  getMyMentorshipRequests,
  getPendingRequests,
  respondToMentorshipRequest,
  updateMentorshipStatus,
  addMeeting,
  submitFeedback,
  getMentorshipStatistics
} = require('../controllers/mentorshipController');

// Import middleware
const { authenticate, authorize } = require('../middleware/auth');
const { logActivity } = require('../middleware/activityLogger');
const {
  validateMentorshipRequest,
  validateMentorshipResponse,
  validateMeeting,
  validateFeedback,
  validatePagination,
  validateObjectId
} = require('../middleware/validation');

// All routes require authentication
router.use(authenticate);

// Create mentorship request (students only)
router.post('/',
  authorize('student'),
  validateMentorshipRequest,
  logActivity('mentorship_request', 'mentorship_system', 'business_logic', {
    logRequestBody: true,
    getDetails: (req) => ({
      action: 'create',
      mentorId: req.body.mentorId,
      areasOfInterest: req.body.areasOfInterest
    })
  }),
  createMentorshipRequest
);

// Get my mentorship requests (students and alumni)
router.get('/my-requests',
  authorize('student', 'alumni'),
  validatePagination,
  getMyMentorshipRequests
);

// Get pending requests (alumni only)
router.get('/pending',
  authorize('alumni'),
  getPendingRequests
);

// Respond to mentorship request (alumni only)
router.put('/:requestId/respond',
  authorize('alumni'),
  validateObjectId('requestId'),
  validateMentorshipResponse,
  logActivity('mentorship_request', 'mentorship_system', 'business_logic', {
    getResourceId: (req) => req.params.requestId,
    getDetails: (req) => ({
      action: 'respond',
      status: req.body.status
    })
  }),
  respondToMentorshipRequest
);

// Update mentorship status
router.put('/:requestId/status',
  validateObjectId('requestId'),
  logActivity('mentorship_request', 'mentorship_system', 'business_logic', {
    getResourceId: (req) => req.params.requestId,
    getDetails: (req) => ({
      action: 'status_update',
      newStatus: req.body.status
    })
  }),
  updateMentorshipStatus
);

// Add meeting to mentorship
router.post('/:requestId/meetings',
  validateObjectId('requestId'),
  validateMeeting,
  addMeeting
);

// Submit feedback
router.post('/:requestId/feedback',
  validateObjectId('requestId'),
  validateFeedback,
  submitFeedback
);

// Get mentorship statistics (admin only)
router.get('/statistics',
  authorize('admin'),
  getMentorshipStatistics
);

module.exports = router;