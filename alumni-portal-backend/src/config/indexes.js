const mongoose = require('mongoose');

// MongoDB Indexing Strategy for AlumniAI Portal
// This file contains all the indexes needed for optimal query performance

const createIndexes = async () => {
  try {
    console.log('Creating additional custom indexes...');

    // Get database connection
    const db = mongoose.connection.db;

    // Users Collection Indexes
    // Note: email index is created by schema (unique: true), so we skip it here
    try {
      await db.collection('users').createIndexes([
        // Basic lookup indexes (skip email - already created by schema)
        { key: { role: 1 }, name: 'role_index' },
        { key: { isActive: 1 }, name: 'isActive_index' },
        { key: { isEmailVerified: 1 }, name: 'isEmailVerified_index' },
      
      // Profile search indexes
      { key: { 'profile.graduationYear': 1 }, name: 'graduationYear_index' },
      { key: { 'profile.skills': 1 }, name: 'skills_index' },
      { key: { 'profile.company': 1 }, name: 'company_index' },
      { key: { 'profile.major': 1 }, name: 'major_index' },
      { key: { 'profile.currentPosition': 1 }, name: 'currentPosition_index' },
      
      // Location search indexes
      { key: { 'profile.location.city': 1 }, name: 'location_city_index' },
      { key: { 'profile.location.state': 1 }, name: 'location_state_index' },
      { key: { 'profile.location.country': 1 }, name: 'location_country_index' },
      
      // Preferences indexes
      { key: { 'preferences.mentorshipAvailable': 1 }, name: 'mentorshipAvailable_index' },
      { key: { 'preferences.profileVisibility': 1 }, name: 'profileVisibility_index' },
      
      // Compound indexes for common queries
      { 
        key: { role: 1, isActive: 1, isEmailVerified: 1 }, 
        name: 'role_active_verified_compound' 
      },
      { 
        key: { role: 1, 'profile.graduationYear': -1 }, 
        name: 'role_graduationYear_compound' 
      },
      { 
        key: { role: 1, 'preferences.mentorshipAvailable': 1 }, 
        name: 'role_mentorship_compound' 
      },
      { 
        key: { role: 1, 'profile.skills': 1, isActive: 1 }, 
        name: 'role_skills_active_compound' 
      },
      
      // Text search index for alumni directory
      {
        key: {
          'profile.firstName': 'text',
          'profile.lastName': 'text',
          'profile.bio': 'text',
          'profile.currentPosition': 'text',
          'profile.company': 'text',
          'profile.skills': 'text',
          'profile.interests': 'text'
        },
        name: 'user_text_search',
        weights: {
          'profile.firstName': 10,
          'profile.lastName': 10,
          'profile.currentPosition': 8,
          'profile.company': 8,
          'profile.skills': 6,
          'profile.bio': 4,
          'profile.interests': 2
        }
      },
      
      // Time-based indexes
      { key: { createdAt: -1 }, name: 'createdAt_desc' },
      { key: { lastLogin: -1 }, name: 'lastLogin_desc' }
      ]);
      console.log('  ✓ Users indexes created');
    } catch (error) {
      if (error.code === 85 || error.code === 86) {
        console.log('  ⚠ Users indexes already exist');
      } else {
        console.log('  ⚠ Users indexes error:', error.message);
      }
    }

    // Activity Logs Collection Indexes
    try {
      await db.collection('activitylogs').createIndexes([
      // Basic lookup indexes
      { key: { userId: 1 }, name: 'userId_index' },
      { key: { action: 1 }, name: 'action_index' },
      { key: { category: 1 }, name: 'category_index' },
      { key: { level: 1 }, name: 'level_index' },
      { key: { success: 1 }, name: 'success_index' },
      
      // Metadata indexes
      { key: { 'metadata.ipAddress': 1 }, name: 'ipAddress_index' },
      { key: { 'metadata.statusCode': 1 }, name: 'statusCode_index' },
      
      // Compound indexes for common queries
      { 
        key: { userId: 1, createdAt: -1 }, 
        name: 'userId_createdAt_compound' 
      },
      { 
        key: { action: 1, createdAt: -1 }, 
        name: 'action_createdAt_compound' 
      },
      { 
        key: { category: 1, createdAt: -1 }, 
        name: 'category_createdAt_compound' 
      },
      { 
        key: { level: 1, createdAt: -1 }, 
        name: 'level_createdAt_compound' 
      },
      { 
        key: { success: 1, createdAt: -1 }, 
        name: 'success_createdAt_compound' 
      },
      
      // Security monitoring indexes
      { 
        key: { category: 1, level: 1, createdAt: -1 }, 
        name: 'security_monitoring_compound' 
      },
      
      // TTL index for automatic cleanup (90 days)
      { 
        key: { createdAt: 1 }, 
        expireAfterSeconds: 7776000, 
        name: 'activitylog_ttl' 
      }
      ]);
      console.log('  ✓ Activity logs indexes created');
    } catch (error) {
      if (error.code === 85 || error.code === 86) {
        console.log('  ⚠ Activity logs indexes already exist');
      } else {
        console.log('  ⚠ Activity logs indexes error:', error.message);
      }
    }

    // Mentorship Requests Collection Indexes
    try {
      await db.collection('mentorshiprequests').createIndexes([
      // Basic lookup indexes
      { key: { student: 1 }, name: 'student_index' },
      { key: { mentor: 1 }, name: 'mentor_index' },
      { key: { status: 1 }, name: 'status_index' },
      { key: { urgency: 1 }, name: 'urgency_index' },
      { key: { isActive: 1 }, name: 'isActive_index' },
      
      // Areas of interest index
      { key: { areasOfInterest: 1 }, name: 'areasOfInterest_index' },
      
      // Compound indexes for common queries
      { 
        key: { student: 1, status: 1 }, 
        name: 'student_status_compound' 
      },
      { 
        key: { mentor: 1, status: 1 }, 
        name: 'mentor_status_compound' 
      },
      { 
        key: { status: 1, createdAt: -1 }, 
        name: 'status_createdAt_compound' 
      },
      { 
        key: { mentor: 1, status: 1, createdAt: -1 }, 
        name: 'mentor_status_createdAt_compound' 
      },
      { 
        key: { urgency: 1, createdAt: 1 }, 
        name: 'urgency_createdAt_compound' 
      },
      { 
        key: { isActive: 1, status: 1 }, 
        name: 'isActive_status_compound' 
      },
      
      // Time-based indexes
      { key: { createdAt: -1 }, name: 'createdAt_desc' },
      { key: { respondedAt: -1 }, name: 'respondedAt_desc' },
      { key: { completedAt: -1 }, name: 'completedAt_desc' }
      ]);
      console.log('  ✓ Mentorship requests indexes created');
    } catch (error) {
      if (error.code === 85 || error.code === 86) {
        console.log('  ⚠ Mentorship requests indexes already exist');
      } else {
        console.log('  ⚠ Mentorship requests indexes error:', error.message);
      }
    }

    // Job Postings Collection Indexes
    try {
      await db.collection('jobpostings').createIndexes([
      // Basic lookup indexes
      { key: { postedBy: 1 }, name: 'postedBy_index' },
      { key: { status: 1 }, name: 'status_index' },
      { key: { featured: 1 }, name: 'featured_index' },
      { key: { isActive: 1 }, name: 'isActive_index' },
      
      // Job details indexes
      { key: { 'company.name': 1 }, name: 'company_name_index' },
      { key: { 'employment.type': 1 }, name: 'employment_type_index' },
      { key: { 'location.type': 1 }, name: 'location_type_index' },
      { key: { 'experience.level': 1 }, name: 'experience_level_index' },
      { key: { tags: 1 }, name: 'tags_index' },
      
      // Salary range indexes
      { key: { 'salary.min': 1 }, name: 'salary_min_index' },
      { key: { 'salary.max': 1 }, name: 'salary_max_index' },
      
      // Skills indexes
      { key: { 'skills.name': 1 }, name: 'skills_name_index' },
      { key: { 'skills.level': 1 }, name: 'skills_level_index' },
      
      // Application deadline index
      { key: { applicationDeadline: 1 }, name: 'applicationDeadline_index' },
      
      // Compound indexes for common queries
      { 
        key: { status: 1, createdAt: -1 }, 
        name: 'status_createdAt_compound' 
      },
      { 
        key: { 'employment.type': 1, status: 1 }, 
        name: 'employment_status_compound' 
      },
      { 
        key: { 'location.type': 1, status: 1 }, 
        name: 'location_status_compound' 
      },
      { 
        key: { featured: 1, status: 1, createdAt: -1 }, 
        name: 'featured_status_createdAt_compound' 
      },
      { 
        key: { postedBy: 1, status: 1 }, 
        name: 'postedBy_status_compound' 
      },
      { 
        key: { applicationDeadline: 1, status: 1 }, 
        name: 'deadline_status_compound' 
      },
      
      // Text search index
      {
        key: {
          title: 'text',
          'company.name': 'text',
          description: 'text',
          'skills.name': 'text',
          tags: 'text'
        },
        name: 'job_text_search',
        weights: {
          title: 10,
          'company.name': 8,
          'skills.name': 6,
          tags: 4,
          description: 2
        }
      },
      
      // TTL index for automatic expiry
      { 
        key: { expiresAt: 1 }, 
        expireAfterSeconds: 0, 
        name: 'job_expiry_ttl' 
      }
      ]);
      console.log('  ✓ Job postings indexes created');
    } catch (error) {
      if (error.code === 85 || error.code === 86) {
        console.log('  ⚠ Job postings indexes already exist');
      } else {
        console.log('  ⚠ Job postings indexes error:', error.message);
      }
    }

    // Resumes Collection Indexes
    try {
      await db.collection('resumes').createIndexes([
      // Basic lookup indexes
      { key: { user: 1 }, unique: true, name: 'user_unique' },
      { key: { processingStatus: 1 }, name: 'processingStatus_index' },
      { key: { isActive: 1 }, name: 'isActive_index' },
      
      // File metadata indexes
      { key: { mimeType: 1 }, name: 'mimeType_index' },
      { key: { fileSize: 1 }, name: 'fileSize_index' },
      
      // Parsed data indexes
      { key: { 'parsedData.skills.name': 1 }, name: 'parsed_skills_index' },
      { key: { 'parsedData.skills.category': 1 }, name: 'skills_category_index' },
      { key: { 'parsedData.experience.company': 1 }, name: 'experience_company_index' },
      { key: { 'parsedData.education.degree': 1 }, name: 'education_degree_index' },
      
      // Analysis results indexes
      { key: { 'analysisResults.skillsExtracted': 1 }, name: 'extracted_skills_index' },
      { key: { 'analysisResults.experienceYears': 1 }, name: 'experience_years_index' },
      { key: { 'analysisResults.educationLevel': 1 }, name: 'education_level_index' },
      { key: { 'analysisResults.atsScore': 1 }, name: 'ats_score_index' },
      
      // Compound indexes for common queries
      { 
        key: { user: 1, isActive: 1 }, 
        name: 'user_isActive_compound' 
      },
      { 
        key: { processingStatus: 1, createdAt: -1 }, 
        name: 'processing_createdAt_compound' 
      },
      { 
        key: { isActive: 1, processingStatus: 1 }, 
        name: 'active_processing_compound' 
      },
      
      // Time-based indexes
      { key: { createdAt: -1 }, name: 'createdAt_desc' },
      { key: { lastDownloaded: -1 }, name: 'lastDownloaded_desc' }
      ]);
      console.log('  ✓ Resumes indexes created');
    } catch (error) {
      if (error.code === 85 || error.code === 86) {
        console.log('  ⚠ Resumes indexes already exist');
      } else {
        console.log('  ⚠ Resumes indexes error:', error.message);
      }
    }

    console.log('✅ All MongoDB indexes synchronized successfully');

    // Log index statistics
    const collections = ['users', 'activitylogs', 'mentorshiprequests', 'jobpostings', 'resumes'];
    
    for (const collectionName of collections) {
      const indexes = await db.collection(collectionName).indexes();
      console.log(`📊 ${collectionName}: ${indexes.length} indexes`);
    }

  } catch (error) {
    console.error('❌ Error creating indexes:', error.message);
    // Don't throw - indexes might already exist, which is fine
    console.log('⚠️  Some indexes may already exist - continuing...');
  }
};

// Function to drop all custom indexes (useful for development)
const dropCustomIndexes = async () => {
  try {
    console.log('Dropping custom MongoDB indexes...');

    const db = mongoose.connection.db;
    const collections = ['users', 'activitylogs', 'mentorshiprequests', 'jobpostings', 'resumes'];
    
    for (const collectionName of collections) {
      const indexes = await db.collection(collectionName).indexes();
      
      for (const index of indexes) {
        // Don't drop the default _id index
        if (index.name !== '_id_') {
          try {
            await db.collection(collectionName).dropIndex(index.name);
            console.log(`Dropped index: ${collectionName}.${index.name}`);
          } catch (error) {
            console.warn(`Failed to drop index ${index.name}:`, error.message);
          }
        }
      }
    }

    console.log('✅ Custom indexes dropped successfully');
  } catch (error) {
    console.error('❌ Error dropping indexes:', error);
    throw error;
  }
};

// Function to analyze query performance
const analyzeQueryPerformance = async () => {
  try {
    console.log('Analyzing query performance...');

    const db = mongoose.connection.db;
    
    // Sample queries to test
    const testQueries = [
      {
        collection: 'users',
        query: { role: 'alumni', isActive: true },
        description: 'Find active alumni'
      },
      {
        collection: 'users',
        query: { 
          role: 'alumni', 
          'profile.skills': { $in: ['JavaScript', 'React'] },
          isActive: true 
        },
        description: 'Find alumni with specific skills'
      },
      {
        collection: 'jobpostings',
        query: { 
          status: 'active', 
          'employment.type': 'full-time',
          'location.type': 'remote'
        },
        description: 'Find remote full-time jobs'
      },
      {
        collection: 'mentorshiprequests',
        query: { 
          status: 'pending',
          urgency: 'high'
        },
        description: 'Find high-priority pending mentorship requests'
      }
    ];

    for (const test of testQueries) {
      const explain = await db.collection(test.collection)
        .find(test.query)
        .explain('executionStats');
      
      console.log(`\n📈 Query: ${test.description}`);
      console.log(`   Collection: ${test.collection}`);
      console.log(`   Execution time: ${explain.executionStats.executionTimeMillis}ms`);
      console.log(`   Documents examined: ${explain.executionStats.totalDocsExamined}`);
      console.log(`   Documents returned: ${explain.executionStats.totalDocsReturned}`);
      console.log(`   Index used: ${explain.executionStats.winningPlan.inputStage?.indexName || 'COLLSCAN'}`);
    }

  } catch (error) {
    console.error('❌ Error analyzing query performance:', error);
    throw error;
  }
};

module.exports = {
  createIndexes,
  dropCustomIndexes,
  analyzeQueryPerformance
};