import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, Download, Trash2, Eye, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { resumeAPI } from '../services/api';
import toast from 'react-hot-toast';

const ResumeUpload = () => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentResume, setCurrentResume] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch current resume on mount
  useEffect(() => {
    fetchCurrentResume();
  }, []);

  // Poll for resume status updates when processing
  useEffect(() => {
    let pollInterval;
    
    if (currentResume && currentResume.processingStatus === 'processing') {
      console.log('📊 Resume is processing, starting polling...');
      
      // Poll every 2 seconds
      pollInterval = setInterval(async () => {
        try {
          const data = await resumeAPI.getMyResume();
          setCurrentResume(data.resume);
          
          // Stop polling if status changed
          if (data.resume.processingStatus !== 'processing') {
            console.log(`✅ Processing complete with status: ${data.resume.processingStatus}`);
            clearInterval(pollInterval);
            
            if (data.resume.processingStatus === 'completed') {
              toast.success('Resume analysis completed!');
            } else if (data.resume.processingStatus === 'failed') {
              toast.error('Resume analysis failed');
            }
          }
        } catch (error) {
          console.error('Polling error:', error);
          clearInterval(pollInterval);
        }
      }, 2000); // Poll every 2 seconds
    }
    
    // Cleanup on unmount or when status changes
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [currentResume?.processingStatus]);

  const fetchCurrentResume = async () => {
    try {
      setLoading(true);
      const data = await resumeAPI.getMyResume();
      setCurrentResume(data.resume);
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error('Failed to fetch resume:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file) => {
    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only PDF, DOC, and DOCX files are allowed');
      return;
    }

    // Validate file size (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setUploadedFile(file);
  };

  const handleUpload = async () => {
    if (!uploadedFile) {
      toast.error('Please select a file first');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      // Create FormData
      const formData = new FormData();
      formData.append('resume', uploadedFile);

      // Upload with progress tracking
      const data = await resumeAPI.uploadResume(formData, (progressEvent) => {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(progress);
      });

      toast.success('Resume uploaded successfully! AI analysis in progress...');
      
      // Clear selected file
      setUploadedFile(null);
      setUploadProgress(0);

      // Refresh current resume
      await fetchCurrentResume();

    } catch (error) {
      console.error('Upload error:', error);
      const message = error.response?.data?.message || 'Failed to upload resume';
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete your resume?')) {
      return;
    }

    try {
      await resumeAPI.deleteResume();
      toast.success('Resume deleted successfully');
      setCurrentResume(null);
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete resume');
    }
  };

  const handleDownload = async () => {
    try {
      const blob = await resumeAPI.downloadResume(currentResume._id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = currentResume.originalName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Resume downloaded');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download resume');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'processing':
        return <Loader className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Loader className="h-5 w-5 text-gray-400 animate-spin" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Analysis Complete';
      case 'processing':
        return 'Analyzing...';
      case 'failed':
        return 'Analysis Failed';
      default:
        return 'Pending Analysis';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Resume Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Upload your resume to get AI-powered feedback and ATS scoring
          </p>
        </div>

        {/* Upload Section */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Upload Resume</h2>
          </div>
          <div className="p-6">
            <div
              className={`relative border-2 border-dashed rounded-lg p-6 ${
                dragActive
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-gray-900">
                      Drop your resume here, or{' '}
                      <span className="text-primary-600 hover:text-primary-500">browse</span>
                    </span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileSelect}
                    />
                  </label>
                  <p className="mt-1 text-xs text-gray-500">
                    PDF, DOC, DOCX up to 10MB
                  </p>
                </div>
              </div>
            </div>

            {uploadedFile && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="h-8 w-8 text-primary-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        {uploadedFile.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setUploadedFile(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
                <div className="mt-4">
                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="w-full bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {uploading ? (
                      <>
                        <Loader className="animate-spin h-5 w-5 mr-2" />
                        Uploading... {uploadProgress}%
                      </>
                    ) : (
                      'Upload & Analyze Resume'
                    )}
                  </button>
                </div>
                {uploading && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>

        {/* Current Resume */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Current Resume</h2>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <Loader className="mx-auto h-12 w-12 text-gray-400 animate-spin" />
                <p className="mt-2 text-sm text-gray-500">Loading...</p>
              </div>
            ) : currentResume ? (
              <div className="space-y-6">
                {/* Resume Info */}
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <FileText className="h-12 w-12 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {currentResume.originalName}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Uploaded {new Date(currentResume.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-500">
                        Size: {(currentResume.fileSize / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <div className="mt-2 flex items-center space-x-2">
                        {getStatusIcon(currentResume.processingStatus)}
                        <span className="text-sm font-medium text-gray-700">
                          {getStatusText(currentResume.processingStatus)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleDownload}
                      className="p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded-md transition-colors"
                      title="Download"
                    >
                      <Download className="h-5 w-5" />
                    </button>
                    <button
                      onClick={handleDelete}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Analysis Results */}
                {currentResume.processingStatus === 'completed' && currentResume.analysisResults && (
                  <div className="border-t pt-6">
                    <h4 className="text-md font-medium text-gray-900 mb-4">AI Analysis Results</h4>
                    
                    {/* ATS Score */}
                    {currentResume.analysisResults.atsScore && (
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">ATS Score</span>
                          <span className="text-2xl font-bold text-primary-600">
                            {currentResume.analysisResults.atsScore}/100
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full ${
                              currentResume.analysisResults.atsScore >= 80
                                ? 'bg-green-500'
                                : currentResume.analysisResults.atsScore >= 60
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${currentResume.analysisResults.atsScore}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* Skills Extracted */}
                    {currentResume.analysisResults.skillsExtracted && currentResume.analysisResults.skillsExtracted.length > 0 && (
                      <div className="mb-6">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Extracted Skills</h5>
                        <div className="flex flex-wrap gap-2">
                          {currentResume.analysisResults.skillsExtracted.map((skill, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-primary-100 text-primary-800 text-sm rounded-full"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Experience Years */}
                    {currentResume.analysisResults.experienceYears !== undefined && (
                      <div className="mb-6">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Experience</h5>
                        <p className="text-sm text-gray-600">
                          {currentResume.analysisResults.experienceYears} years of professional experience
                        </p>
                      </div>
                    )}

                    {/* Suggestions */}
                    {currentResume.analysisResults.suggestions && currentResume.analysisResults.suggestions.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Improvement Suggestions</h5>
                        <ul className="space-y-2">
                          {currentResume.analysisResults.suggestions.map((suggestion, index) => (
                            <li key={index} className="flex items-start">
                              <span className="flex-shrink-0 h-5 w-5 text-primary-600 mr-2">•</span>
                              <span className="text-sm text-gray-600">{suggestion}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Processing Error */}
                {currentResume.processingStatus === 'failed' && currentResume.processingError && (
                  <div className="border-t pt-6">
                    <div className="bg-red-50 border border-red-200 rounded-md p-4">
                      <div className="flex">
                        <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                        <div>
                          <h5 className="text-sm font-medium text-red-800">Analysis Failed</h5>
                          <p className="text-sm text-red-700 mt-1">{currentResume.processingError}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No resume uploaded</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Upload your resume to get started with AI analysis
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ResumeUpload;