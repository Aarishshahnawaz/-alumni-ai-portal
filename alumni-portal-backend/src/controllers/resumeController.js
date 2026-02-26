const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const Resume = require('../models/Resume');
const { autoLogActivity } = require('../middleware/activityLogger');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'resumes');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `resume-${req.user._id}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, DOC, and DOCX files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Upload resume
const uploadResume = async (req, res) => {
  try {
    const userId = req.user._id;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Check if user already has a resume
    const existingResume = await Resume.findByUser(userId);
    if (existingResume) {
      // Delete old file
      try {
        await fs.unlink(existingResume.filePath);
      } catch (error) {
        console.warn('Failed to delete old resume file:', error);
      }
      
      // Remove old resume record
      existingResume.isActive = false;
      await existingResume.save();
    }

    // Create new resume record
    const resume = new Resume({
      user: userId,
      fileName: file.filename,
      originalName: file.originalname,
      filePath: file.path,
      fileSize: file.size,
      mimeType: file.mimetype,
      processingStatus: 'pending'
    });

    await resume.save();

    // Log activity
    await autoLogActivity(
      userId,
      'file_upload',
      'resume',
      {
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype
      },
      req
    );

    // TODO: Trigger resume processing (text extraction, parsing)
    // This would typically be done by a background job or separate service
    processResumeAsync(resume._id);

    res.status(201).json({
      success: true,
      message: 'Resume uploaded successfully',
      data: {
        resume: {
          _id: resume._id,
          fileName: resume.originalName,
          fileSize: resume.fileSize,
          processingStatus: resume.processingStatus,
          uploadedAt: resume.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Upload resume error:', error);
    
    // Clean up uploaded file if there was an error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.warn('Failed to clean up uploaded file:', unlinkError);
      }
    }

    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 10MB.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to upload resume'
    });
  }
};

// Get user's resume
const getMyResume = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const resume = await Resume.findByUser(userId);
    
    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'No resume found'
      });
    }

    res.json({
      success: true,
      data: {
        resume
      }
    });

  } catch (error) {
    console.error('Get resume error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch resume'
    });
  }
};

// Download resume
const downloadResume = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const resume = await Resume.findById(id);
    
    if (!resume || !resume.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    // Check permissions
    const canDownload = 
      resume.user.toString() === userId.toString() ||
      req.user.role === 'admin' ||
      (req.user.role === 'alumni' && resume.user.toString() !== userId.toString());

    if (!canDownload) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if file exists
    try {
      await fs.access(resume.filePath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: 'Resume file not found'
      });
    }

    // Increment download count
    await resume.incrementDownload();

    // Log download activity
    await autoLogActivity(
      userId,
      'file_download',
      'resume',
      {
        resumeId: resume._id,
        fileName: resume.originalName,
        resumeOwner: resume.user
      },
      req
    );

    // Set headers and send file
    res.setHeader('Content-Disposition', `attachment; filename="${resume.originalName}"`);
    res.setHeader('Content-Type', resume.mimeType);
    
    res.sendFile(path.resolve(resume.filePath));

  } catch (error) {
    console.error('Download resume error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download resume'
    });
  }
};

// Delete resume
const deleteResume = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const resume = await Resume.findByUser(userId);
    
    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'No resume found'
      });
    }

    // Delete file
    try {
      await fs.unlink(resume.filePath);
    } catch (error) {
      console.warn('Failed to delete resume file:', error);
    }

    // Soft delete resume record
    resume.isActive = false;
    await resume.save();

    res.json({
      success: true,
      message: 'Resume deleted successfully'
    });

  } catch (error) {
    console.error('Delete resume error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete resume'
    });
  }
};

// Search resumes by skills (for alumni/admin)
const searchResumesBySkills = async (req, res) => {
  try {
    if (req.user.role !== 'alumni' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only alumni and admins can search resumes'
      });
    }

    const { skills, page = 1, limit = 20 } = req.query;
    
    if (!skills) {
      return res.status(400).json({
        success: false,
        message: 'Skills parameter is required'
      });
    }

    const skillsArray = skills.split(',').map(skill => skill.trim());
    
    const resumes = await Resume.searchBySkills(skillsArray);

    // Pagination
    const skip = (page - 1) * limit;
    const paginatedResumes = resumes.slice(skip, skip + parseInt(limit));
    const total = resumes.length;

    res.json({
      success: true,
      data: {
        resumes: paginatedResumes,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          count: paginatedResumes.length,
          totalRecords: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        },
        searchedSkills: skillsArray
      }
    });

  } catch (error) {
    console.error('Search resumes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search resumes'
    });
  }
};

// Get resume processing statistics
const getResumeStatistics = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can view resume statistics'
      });
    }

    const processingStats = await Resume.getProcessingStatistics();
    const skillsDistribution = await Resume.getSkillsDistribution();

    // Get additional statistics
    const additionalStats = await Resume.aggregate([
      {
        $group: {
          _id: null,
          totalResumes: { $sum: 1 },
          totalDownloads: { $sum: '$downloadCount' },
          avgFileSize: { $avg: '$fileSize' },
          totalFileSize: { $sum: '$fileSize' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        processingStats,
        skillsDistribution,
        overview: additionalStats[0] || {}
      }
    });

  } catch (error) {
    console.error('Resume statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch resume statistics'
    });
  }
};

// Mock resume processing function (would be replaced with actual implementation)
const processResumeAsync = async (resumeId) => {
  try {
    console.log(`📄 Starting resume processing for ID: ${resumeId}`);
    
    const resume = await Resume.findById(resumeId);
    if (!resume) {
      console.error(`❌ Resume not found: ${resumeId}`);
      return;
    }

    // Update status to processing
    await resume.updateProcessingStatus('processing');
    console.log(`🔄 Resume status updated to 'processing'`);

    // Simulate processing delay with proper async handling
    setTimeout(async () => {
      try {
        console.log(`⚙️  Processing resume: ${resumeId}`);
        
        // Refetch resume to ensure we have the latest data
        const resumeToUpdate = await Resume.findById(resumeId);
        if (!resumeToUpdate) {
          console.error(`❌ Resume not found during processing: ${resumeId}`);
          return;
        }

        // Mock extracted data (in real implementation, this would use PDF parsing libraries)
        const mockParsedData = {
          personalInfo: {
            name: 'John Doe',
            email: 'john.doe@example.com',
            phone: '+1-555-0123'
          },
          skills: [
            { name: 'JavaScript', category: 'technical', proficiency: 'advanced' },
            { name: 'React', category: 'technical', proficiency: 'intermediate' },
            { name: 'Node.js', category: 'technical', proficiency: 'intermediate' }
          ],
          experience: [
            {
              company: 'Tech Corp',
              position: 'Software Developer',
              startDate: new Date('2022-01-01'),
              current: true,
              description: 'Developed web applications using React and Node.js'
            }
          ]
        };

        const mockAnalysisResults = {
          skillsExtracted: ['JavaScript', 'React', 'Node.js', 'HTML', 'CSS', 'MongoDB', 'Express'],
          experienceYears: 2,
          educationLevel: 'bachelor',
          atsScore: 85,
          suggestions: [
            'Add more quantifiable achievements with metrics',
            'Include relevant certifications (AWS, Azure, etc.)',
            'Optimize keywords for ATS systems',
            'Add a professional summary section',
            'Include links to portfolio or GitHub projects'
          ]
        };

        // Update resume with parsed data
        resumeToUpdate.parsedData = mockParsedData;
        resumeToUpdate.analysisResults = mockAnalysisResults;
        await resumeToUpdate.updateProcessingStatus('completed');
        
        console.log(`✅ Resume processing completed successfully: ${resumeId}`);
        console.log(`📊 ATS Score: ${mockAnalysisResults.atsScore}`);

      } catch (error) {
        console.error(`❌ Resume processing error for ${resumeId}:`, error);
        
        // Refetch resume to update error status
        const resumeToUpdate = await Resume.findById(resumeId);
        if (resumeToUpdate) {
          await resumeToUpdate.updateProcessingStatus('failed', error.message);
        }
      }
    }, 3000); // 3 second delay to simulate processing (reduced from 5s)

  } catch (error) {
    console.error('❌ Resume processing setup error:', error);
  }
};

module.exports = {
  upload,
  uploadResume,
  getMyResume,
  downloadResume,
  deleteResume,
  searchResumesBySkills,
  getResumeStatistics
};