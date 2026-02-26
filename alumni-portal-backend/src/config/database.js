const mongoose = require('mongoose');
const { createIndexes } = require('./indexes');

const connectDB = async () => {
  try {
    // Get MongoDB URI from environment
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/alumniai';
    
    console.log('🔄 Connecting to MongoDB...');
    console.log(`📍 Database URI: ${mongoURI}`);
    
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ MongoDB Connected Successfully!');
    console.log(`📊 Database Host: ${conn.connection.host}`);
    console.log(`📁 Database Name: ${conn.connection.name}`);
    console.log(`🔌 Connection Port: ${conn.connection.port}`);
    console.log(`📍 Full Connection String for Compass: mongodb://localhost:27017/${conn.connection.name}`);
    
    // Sync indexes using Mongoose's built-in method (safer than manual creation)
    if (process.env.NODE_ENV !== 'test') {
      try {
        console.log('🔄 Synchronizing database indexes...');
        
        // Use syncIndexes for all models - this is production-safe
        const User = require('../models/User');
        const ActivityLog = require('../models/ActivityLog');
        const MentorshipRequest = require('../models/MentorshipRequest');
        const JobPosting = require('../models/JobPosting');
        const Resume = require('../models/Resume');
        
        await Promise.all([
          User.syncIndexes(),
          ActivityLog.syncIndexes(),
          MentorshipRequest.syncIndexes(),
          JobPosting.syncIndexes(),
          Resume.syncIndexes()
        ]);
        
        console.log('✅ Model indexes synchronized successfully');
        
        // Create additional custom indexes
        await createIndexes();
      } catch (indexError) {
        console.log('⚠️  Index synchronization had some issues, but database is connected');
        console.log('   This is normal if indexes already exist');
      }
    }
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('🔌 MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Database connection failed!');
    console.error('Error:', error.message);
    console.log('\n📋 Troubleshooting Steps:');
    console.log('1. Ensure MongoDB is running: net start MongoDB (Windows) or sudo systemctl start mongod (Linux)');
    console.log('2. Check MongoDB is listening on port 27017');
    console.log('3. Verify MONGODB_URI in .env file');
    console.log('4. Try connecting with MongoDB Compass: mongodb://localhost:27017/alumniai');
    console.log('\n⚠️  Running without database - some features will be limited\n');
    // Don't exit, allow server to run without database for testing
  }
};

module.exports = connectDB;