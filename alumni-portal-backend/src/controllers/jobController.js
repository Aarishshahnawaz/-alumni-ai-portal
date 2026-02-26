const JobPosting = require('../models/JobPosting');
const { autoLogActivity } = require('../middleware/activityLogger');

// Create job posting
const createJobPosting = async (req, res) => {
  try {
    if (req.user.role !== 'alumni' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only alumni and admins can create job postings'
      });
    }

    const jobData = {
      ...req.body,
      postedBy: req.user._id
    };

    const jobPosting = new JobPosting(jobData);
    await jobPosting.save();

    // Populate postedBy for response
    await jobPosting.populate('postedBy', 'profile.firstName profile.lastName profile.currentPosition profile.company email');

    // Log activity
    await autoLogActivity(
      req.user._id,
      'job_post_create',
      'job_posting',
      {
        jobId: jobPosting._id,
        title: jobPosting.title,
        company: jobPosting.company.name,
        employmentType: jobPosting.employment.type
      },
      req
    );

    res.status(201).json({
      success: true,
      message: 'Job posting created successfully',
      data: {
        job: jobPosting
      }
    });

  } catch (error) {
    console.error('Create job posting error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create job posting'
    });
  }
};

// Get all job postings with search and filters
const getJobPostings = async (req, res) => {
  try {
    const {
      query,
      location,
      employmentType,
      experienceLevel,
      skills,
      salaryMin,
      salaryMax,
      company,
      remote,
      featured,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const searchParams = {
      query,
      location,
      employmentType,
      experienceLevel,
      skills: skills ? skills.split(',') : null,
      salaryMin: salaryMin ? parseInt(salaryMin) : null,
      salaryMax: salaryMax ? parseInt(salaryMax) : null,
      company,
      remote: remote === 'true',
      page: parseInt(page),
      limit: parseInt(limit)
    };

    let jobs;
    
    if (Object.values(searchParams).some(param => param !== null && param !== undefined)) {
      // Use search method for filtered results
      jobs = await JobPosting.searchJobs(searchParams);
    } else {
      // Simple query for all active jobs
      const query = JobPosting.findActive();
      
      if (featured === 'true') {
        query.where({ featured: true });
      }

      // Sorting
      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
      
      const skip = (page - 1) * limit;
      jobs = await query
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('postedBy', 'profile.firstName profile.lastName profile.currentPosition profile.company email');
    }

    // Get total count for pagination
    const totalQuery = { status: 'active', isActive: true };
    if (featured === 'true') {
      totalQuery.featured = true;
    }
    const total = await JobPosting.countDocuments(totalQuery);

    // Log search activity
    if (req.user) {
      await autoLogActivity(
        req.user._id,
        'job_post_view',
        'job_search',
        {
          searchParams: { query, location, employmentType, skills },
          resultsCount: jobs.length,
          page: parseInt(page)
        },
        req
      );
    }

    res.json({
      success: true,
      data: {
        jobs,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          count: jobs.length,
          totalRecords: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        },
        filters: searchParams
      }
    });

  } catch (error) {
    console.error('Get job postings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch job postings'
    });
  }
};

// Get single job posting
const getJobPosting = async (req, res) => {
  try {
    const { id } = req.params;
    
    const job = await JobPosting.findById(id)
      .populate('postedBy', 'profile.firstName profile.lastName profile.currentPosition profile.company email')
      .populate('applications.user', 'profile.firstName profile.lastName email');
    
    if (!job || !job.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Job posting not found'
      });
    }

    // Increment view count
    job.views += 1;
    await job.save();

    // Log job view activity
    if (req.user) {
      await autoLogActivity(
        req.user._id,
        'job_post_view',
        'job_posting',
        {
          jobId: job._id,
          title: job.title,
          company: job.company.name
        },
        req
      );
    }

    res.json({
      success: true,
      data: {
        job
      }
    });

  } catch (error) {
    console.error('Get job posting error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch job posting'
    });
  }
};

// Update job posting
const updateJobPosting = async (req, res) => {
  try {
    const { id } = req.params;
    
    const job = await JobPosting.findById(id);
    
    if (!job || !job.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Job posting not found'
      });
    }

    // Check permissions
    if (job.postedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own job postings'
      });
    }

    // Update job posting
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        job[key] = req.body[key];
      }
    });

    await job.save();

    // Populate for response
    await job.populate('postedBy', 'profile.firstName profile.lastName profile.currentPosition profile.company email');

    res.json({
      success: true,
      message: 'Job posting updated successfully',
      data: {
        job
      }
    });

  } catch (error) {
    console.error('Update job posting error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update job posting'
    });
  }
};

// Delete job posting
const deleteJobPosting = async (req, res) => {
  try {
    const { id } = req.params;
    
    const job = await JobPosting.findById(id);
    
    if (!job || !job.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Job posting not found'
      });
    }

    // Check permissions
    if (job.postedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own job postings'
      });
    }

    // Soft delete
    job.isActive = false;
    job.status = 'closed';
    await job.save();

    res.json({
      success: true,
      message: 'Job posting deleted successfully'
    });

  } catch (error) {
    console.error('Delete job posting error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete job posting'
    });
  }
};

// Apply to job posting
const applyToJob = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (req.user.role !== 'student' && req.user.role !== 'alumni') {
      return res.status(403).json({
        success: false,
        message: 'Only students and alumni can apply to jobs'
      });
    }

    const job = await JobPosting.findById(id);
    
    if (!job || !job.isActive || job.status !== 'active') {
      return res.status(404).json({
        success: false,
        message: 'Job posting not found or not accepting applications'
      });
    }

    // Check if application deadline has passed
    if (job.applicationDeadline && job.applicationDeadline < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Application deadline has passed'
      });
    }

    // Check if user has already applied
    const existingApplication = job.applications.find(
      app => app.user.toString() === userId.toString()
    );

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied to this job'
      });
    }

    // Add application
    job.applications.push({
      user: userId,
      appliedAt: new Date(),
      status: 'applied'
    });

    await job.save();

    // Log activity
    await autoLogActivity(
      userId,
      'job_post_view',
      'job_application',
      {
        action: 'apply',
        jobId: job._id,
        title: job.title,
        company: job.company.name
      },
      req
    );

    res.json({
      success: true,
      message: 'Application submitted successfully'
    });

  } catch (error) {
    console.error('Apply to job error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit application'
    });
  }
};

// Get user's job applications
const getMyApplications = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const userId = req.user._id;

    const matchStage = {
      isActive: true,
      'applications.user': userId
    };

    if (status) {
      matchStage['applications.status'] = status;
    }

    const pipeline = [
      { $match: matchStage },
      { $unwind: '$applications' },
      { $match: { 'applications.user': userId } },
      {
        $lookup: {
          from: 'users',
          localField: 'postedBy',
          foreignField: '_id',
          as: 'postedBy'
        }
      },
      { $unwind: '$postedBy' },
      {
        $project: {
          title: 1,
          company: 1,
          'employment.type': 1,
          'location.type': 1,
          'location.city': 1,
          status: 1,
          applicationDeadline: 1,
          createdAt: 1,
          'postedBy.profile.firstName': 1,
          'postedBy.profile.lastName': 1,
          'postedBy.profile.company': 1,
          application: '$applications'
        }
      },
      { $sort: { 'application.appliedAt': -1 } }
    ];

    // Add pagination
    const skip = (page - 1) * limit;
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: parseInt(limit) });

    const applications = await JobPosting.aggregate(pipeline);

    // Get total count
    const countPipeline = [
      { $match: matchStage },
      { $unwind: '$applications' },
      { $match: { 'applications.user': userId } },
      { $count: 'total' }
    ];
    
    const countResult = await JobPosting.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;

    res.json({
      success: true,
      data: {
        applications,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          count: applications.length,
          totalRecords: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get my applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications'
    });
  }
};

// Get applications for job poster
const getJobApplications = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.query;

    const job = await JobPosting.findById(id);
    
    if (!job || !job.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Job posting not found'
      });
    }

    // Check permissions
    if (job.postedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You can only view applications for your own job postings'
      });
    }

    // Filter applications by status if provided
    let applications = job.applications;
    if (status) {
      applications = applications.filter(app => app.status === status);
    }

    // Populate user details
    await job.populate('applications.user', 'profile.firstName profile.lastName profile.graduationYear profile.major profile.skills email');

    res.json({
      success: true,
      data: {
        job: {
          _id: job._id,
          title: job.title,
          company: job.company
        },
        applications: applications
      }
    });

  } catch (error) {
    console.error('Get job applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch job applications'
    });
  }
};

// Update application status
const updateApplicationStatus = async (req, res) => {
  try {
    const { id, applicationId } = req.params;
    const { status, notes } = req.body;

    const job = await JobPosting.findById(id);
    
    if (!job || !job.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Job posting not found'
      });
    }

    // Check permissions
    if (job.postedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You can only update applications for your own job postings'
      });
    }

    // Find and update application
    const application = job.applications.id(applicationId);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    application.status = status;
    if (notes) {
      application.notes = notes;
    }

    await job.save();

    res.json({
      success: true,
      message: 'Application status updated successfully',
      data: {
        application
      }
    });

  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update application status'
    });
  }
};

// Get job posting statistics
const getJobStatistics = async (req, res) => {
  try {
    const stats = await JobPosting.getJobStatistics();
    
    // Get additional statistics
    const additionalStats = await JobPosting.aggregate([
      {
        $group: {
          _id: null,
          totalJobs: { $sum: 1 },
          totalApplications: { $sum: { $size: '$applications' } },
          avgSalaryMin: { $avg: '$salary.min' },
          avgSalaryMax: { $avg: '$salary.max' }
        }
      }
    ]);

    // Get top skills in demand
    const topSkills = await JobPosting.aggregate([
      { $match: { status: 'active', isActive: true } },
      { $unwind: '$skills' },
      {
        $group: {
          _id: { $toLower: '$skills.name' },
          count: { $sum: 1 },
          avgLevel: { $avg: { $indexOfArray: [['beginner', 'intermediate', 'advanced', 'expert'], '$skills.level'] } }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 20 },
      {
        $project: {
          skill: '$_id',
          count: 1,
          avgLevel: 1,
          _id: 0
        }
      }
    ]);

    // Get employment type distribution
    const employmentTypes = await JobPosting.aggregate([
      { $match: { status: 'active', isActive: true } },
      {
        $group: {
          _id: '$employment.type',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        statusDistribution: stats,
        overview: additionalStats[0] || {},
        topSkills,
        employmentTypes
      }
    });

  } catch (error) {
    console.error('Job statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch job statistics'
    });
  }
};

module.exports = {
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
};