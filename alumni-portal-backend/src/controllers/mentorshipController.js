const MentorshipRequest = require('../models/MentorshipRequest');
const User = require('../models/User');
const { autoLogActivity } = require('../middleware/activityLogger');

// Create mentorship request
const createMentorshipRequest = async (req, res) => {
  try {
    const {
      mentorId,
      requestMessage,
      areasOfInterest,
      preferredMeetingType,
      duration,
      urgency
    } = req.body;

    const studentId = req.user._id;

    // Validate mentor exists and is available
    const mentor = await User.findById(mentorId);
    if (!mentor || mentor.role !== 'alumni' || !mentor.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Mentor not found or not available'
      });
    }

    if (!mentor.preferences.mentorshipAvailable) {
      return res.status(400).json({
        success: false,
        message: 'This mentor is not currently available for mentorship'
      });
    }

    // Check if there's already a pending request
    const existingRequest = await MentorshipRequest.findOne({
      student: studentId,
      mentor: mentorId,
      status: 'pending',
      isActive: true
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending request with this mentor'
      });
    }

    // Create mentorship request
    const mentorshipRequest = new MentorshipRequest({
      student: studentId,
      mentor: mentorId,
      requestMessage,
      areasOfInterest: areasOfInterest || [],
      preferredMeetingType: preferredMeetingType || 'flexible',
      duration: duration || 'one-time',
      urgency: urgency || 'medium'
    });

    await mentorshipRequest.save();

    // Populate the request for response
    await mentorshipRequest.populate([
      {
        path: 'student',
        select: 'profile.firstName profile.lastName profile.graduationYear profile.major email'
      },
      {
        path: 'mentor',
        select: 'profile.firstName profile.lastName profile.currentPosition profile.company email'
      }
    ]);

    // Log activity
    await autoLogActivity(
      studentId,
      'mentorship_request',
      'mentorship_system',
      {
        mentorId,
        mentorName: `${mentor.profile.firstName} ${mentor.profile.lastName}`,
        areasOfInterest,
        duration,
        urgency
      },
      req
    );

    res.status(201).json({
      success: true,
      message: 'Mentorship request sent successfully',
      data: {
        request: mentorshipRequest
      }
    });

  } catch (error) {
    console.error('Create mentorship request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create mentorship request'
    });
  }
};

// Get mentorship requests (for students - their requests)
const getMyMentorshipRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const userId = req.user._id;

    let requests;
    if (req.user.role === 'student') {
      requests = await MentorshipRequest.findByStudent(userId, status);
    } else if (req.user.role === 'alumni') {
      requests = await MentorshipRequest.findByMentor(userId, status);
    } else {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Pagination
    const skip = (page - 1) * limit;
    const paginatedRequests = requests.slice(skip, skip + parseInt(limit));
    const total = requests.length;

    res.json({
      success: true,
      data: {
        requests: paginatedRequests,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          count: paginatedRequests.length,
          totalRecords: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get mentorship requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch mentorship requests'
    });
  }
};

// Get pending mentorship requests (for mentors)
const getPendingRequests = async (req, res) => {
  try {
    if (req.user.role !== 'alumni') {
      return res.status(403).json({
        success: false,
        message: 'Only alumni can view pending mentorship requests'
      });
    }

    const requests = await MentorshipRequest.getPendingRequests(req.user._id);

    res.json({
      success: true,
      data: {
        requests
      }
    });

  } catch (error) {
    console.error('Get pending requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending requests'
    });
  }
};

// Respond to mentorship request
const respondToMentorshipRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, responseMessage } = req.body;
    const mentorId = req.user._id;

    if (req.user.role !== 'alumni') {
      return res.status(403).json({
        success: false,
        message: 'Only alumni can respond to mentorship requests'
      });
    }

    const request = await MentorshipRequest.findById(requestId);
    
    if (!request || !request.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Mentorship request not found'
      });
    }

    if (request.mentor.toString() !== mentorId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only respond to your own mentorship requests'
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'This request has already been responded to'
      });
    }

    // Update request
    request.status = status;
    request.responseMessage = responseMessage;
    await request.save();

    // Populate for response
    await request.populate([
      {
        path: 'student',
        select: 'profile.firstName profile.lastName profile.graduationYear profile.major email'
      },
      {
        path: 'mentor',
        select: 'profile.firstName profile.lastName profile.currentPosition profile.company email'
      }
    ]);

    // Log activity
    await autoLogActivity(
      mentorId,
      'mentorship_request',
      'mentorship_system',
      {
        action: 'respond',
        requestId,
        status,
        studentId: request.student._id,
        studentName: `${request.student.profile.firstName} ${request.student.profile.lastName}`
      },
      req
    );

    res.json({
      success: true,
      message: `Mentorship request ${status} successfully`,
      data: {
        request
      }
    });

  } catch (error) {
    console.error('Respond to mentorship request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to respond to mentorship request'
    });
  }
};

// Update mentorship request status
const updateMentorshipStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body;
    const userId = req.user._id;

    const request = await MentorshipRequest.findById(requestId);
    
    if (!request || !request.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Mentorship request not found'
      });
    }

    // Check permissions
    const isStudent = request.student.toString() === userId.toString();
    const isMentor = request.mentor.toString() === userId.toString();
    
    if (!isStudent && !isMentor && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Validate status transitions
    const validTransitions = {
      'pending': ['accepted', 'declined', 'cancelled'],
      'accepted': ['completed', 'cancelled'],
      'declined': [],
      'completed': [],
      'cancelled': []
    };

    if (!validTransitions[request.status].includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change status from ${request.status} to ${status}`
      });
    }

    // Only students can cancel, only mentors can accept/decline
    if (status === 'cancelled' && !isStudent) {
      return res.status(403).json({
        success: false,
        message: 'Only students can cancel requests'
      });
    }

    if ((status === 'accepted' || status === 'declined') && !isMentor) {
      return res.status(403).json({
        success: false,
        message: 'Only mentors can accept or decline requests'
      });
    }

    request.status = status;
    await request.save();

    // Log activity
    await autoLogActivity(
      userId,
      'mentorship_request',
      'mentorship_system',
      {
        action: 'status_update',
        requestId,
        newStatus: status,
        previousStatus: request.status
      },
      req
    );

    res.json({
      success: true,
      message: `Mentorship request status updated to ${status}`,
      data: {
        request
      }
    });

  } catch (error) {
    console.error('Update mentorship status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update mentorship status'
    });
  }
};

// Add meeting to mentorship request
const addMeeting = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { date, duration, type, notes } = req.body;
    const userId = req.user._id;

    const request = await MentorshipRequest.findById(requestId);
    
    if (!request || !request.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Mentorship request not found'
      });
    }

    // Check permissions
    const isParticipant = 
      request.student.toString() === userId.toString() || 
      request.mentor.toString() === userId.toString();
    
    if (!isParticipant && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (request.status !== 'accepted') {
      return res.status(400).json({
        success: false,
        message: 'Can only add meetings to accepted mentorship requests'
      });
    }

    // Add meeting
    request.scheduledMeetings.push({
      date: new Date(date),
      duration: parseInt(duration),
      type,
      notes: notes || ''
    });

    await request.save();

    res.json({
      success: true,
      message: 'Meeting added successfully',
      data: {
        request
      }
    });

  } catch (error) {
    console.error('Add meeting error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add meeting'
    });
  }
};

// Submit feedback for mentorship
const submitFeedback = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { rating, feedback } = req.body;
    const userId = req.user._id;

    const request = await MentorshipRequest.findById(requestId);
    
    if (!request || !request.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Mentorship request not found'
      });
    }

    // Check permissions and determine role
    const isStudent = request.student.toString() === userId.toString();
    const isMentor = request.mentor.toString() === userId.toString();
    
    if (!isStudent && !isMentor) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (request.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Can only submit feedback for completed mentorships'
      });
    }

    // Update feedback based on user role
    if (isStudent) {
      request.feedback.studentRating = rating;
      request.feedback.studentFeedback = feedback;
    } else {
      request.feedback.mentorRating = rating;
      request.feedback.mentorFeedback = feedback;
    }

    await request.save();

    res.json({
      success: true,
      message: 'Feedback submitted successfully',
      data: {
        request
      }
    });

  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit feedback'
    });
  }
};

// Get mentorship statistics
const getMentorshipStatistics = async (req, res) => {
  try {
    const stats = await MentorshipRequest.getStatistics();
    
    // Get additional statistics
    const additionalStats = await MentorshipRequest.aggregate([
      {
        $group: {
          _id: null,
          totalRequests: { $sum: 1 },
          avgMeetings: { $avg: { $size: '$scheduledMeetings' } },
          avgStudentRating: { $avg: '$feedback.studentRating' },
          avgMentorRating: { $avg: '$feedback.mentorRating' }
        }
      }
    ]);

    // Get top areas of interest
    const topAreas = await MentorshipRequest.aggregate([
      {
        $unwind: '$areasOfInterest'
      },
      {
        $group: {
          _id: { $toLower: '$areasOfInterest' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      },
      {
        $project: {
          area: '$_id',
          count: 1,
          _id: 0
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        statusDistribution: stats,
        overview: additionalStats[0] || {},
        topAreasOfInterest: topAreas
      }
    });

  } catch (error) {
    console.error('Mentorship statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch mentorship statistics'
    });
  }
};

module.exports = {
  createMentorshipRequest,
  getMyMentorshipRequests,
  getPendingRequests,
  respondToMentorshipRequest,
  updateMentorshipStatus,
  addMeeting,
  submitFeedback,
  getMentorshipStatistics
};