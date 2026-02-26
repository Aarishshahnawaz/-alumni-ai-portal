const express = require('express');
const router = express.Router();

// Import controllers
const {
  getDashboardStats,
  getTotalUsers,
  getMentorshipRequestsStats,
  getSkillsDistribution,
  getRecentActivityLogs,
  getSystemHealth,
  getMentorCount,
  getTotalEarnings
} = require('../controllers/adminController');

// Import middleware
const { authenticate, authorize } = require('../middleware/auth');
const { validatePagination, validateDateRange } = require('../middleware/validation');

// All routes require admin authentication
router.use(authenticate);
router.use(authorize('admin'));

// Dashboard overview
router.get('/dashboard',
  getDashboardStats
);

// User statistics
router.get('/users/stats',
  validateDateRange,
  getTotalUsers
);

// Mentorship statistics
router.get('/mentorship/stats',
  validateDateRange,
  getMentorshipRequestsStats
);

// Skills distribution
router.get('/skills/distribution',
  getSkillsDistribution
);

// Activity logs
router.get('/activity-logs',
  validatePagination,
  validateDateRange,
  getRecentActivityLogs
);

// System health
router.get('/system/health',
  getSystemHealth
);

// Mentor count
router.get('/mentor-count',
  getMentorCount
);

// Total earnings
router.get('/total-earnings',
  getTotalEarnings
);

module.exports = router;