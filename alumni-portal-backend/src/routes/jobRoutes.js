const express = require('express');
const router = express.Router();

// Import controllers
const {
  createJobPosting,
  getJobPostings,
  getJobPosting,
  updateJobPosting,
  deleteJobPosting,
  applyToJob,
  getMyApplications,
  getJobApplications,
  updateApplicationStatus,
  getJobStatistics
} = require('../controllers/jobController');

// Import middleware
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');
const { logActivity } = require('../middleware/activityLogger');
const {
  validateJobPosting,
  validatePagination,
  validateJobSearch,
  validateObjectId
} = require('../middleware/validation');

// Public routes (with optional authentication)
router.get('/',
  optionalAuth,
  validatePagination,
  validateJobSearch,
  logActivity('job_post_view', 'job_search', 'business_logic', {
    getDetails: (req, res, responseData) => ({
      searchParams: req.query,
      resultsCount: responseData?.data?.jobs?.length || 0
    })
  }),
  getJobPostings
);

router.get('/:id',
  validateObjectId('id'),
  optionalAuth,
  logActivity('job_post_view', 'job_posting', 'business_logic', {
    getResourceId: (req) => req.params.id,
    getDetails: (req) => ({
      action: 'view',
      jobId: req.params.id
    })
  }),
  getJobPosting
);

// Protected routes (require authentication)
router.use(authenticate);

// Create job posting (alumni and admin only)
router.post('/',
  authorize('alumni', 'admin'),
  validateJobPosting,
  logActivity('job_post_create', 'job_posting', 'business_logic', {
    logRequestBody: true,
    getDetails: (req) => ({
      title: req.body.title,
      company: req.body.company?.name,
      employmentType: req.body.employment?.type
    })
  }),
  createJobPosting
);

// Update job posting
router.put('/:id',
  validateObjectId('id'),
  authorize('alumni', 'admin'),
  validateJobPosting,
  updateJobPosting
);

// Delete job posting
router.delete('/:id',
  validateObjectId('id'),
  authorize('alumni', 'admin'),
  deleteJobPosting
);

// Apply to job (students and alumni)
router.post('/:id/apply',
  validateObjectId('id'),
  authorize('student', 'alumni'),
  logActivity('job_post_view', 'job_application', 'business_logic', {
    getResourceId: (req) => req.params.id,
    getDetails: (req) => ({
      action: 'apply',
      jobId: req.params.id
    })
  }),
  applyToJob
);

// Get my applications
router.get('/applications/my',
  authorize('student', 'alumni'),
  validatePagination,
  getMyApplications
);

// Get applications for a job (job poster only)
router.get('/:id/applications',
  validateObjectId('id'),
  authorize('alumni', 'admin'),
  getJobApplications
);

// Update application status (job poster only)
router.put('/:id/applications/:applicationId',
  validateObjectId('id'),
  validateObjectId('applicationId'),
  authorize('alumni', 'admin'),
  updateApplicationStatus
);

// Get job statistics (admin only)
router.get('/statistics/overview',
  authorize('admin'),
  getJobStatistics
);

module.exports = router;