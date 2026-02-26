import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Mail, MapPin, Building, Calendar, Edit, Save, X, Plus, CheckCircle, Upload, Linkedin, Github } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Avatar from '../components/common/Avatar';
import { useSelector, useDispatch } from 'react-redux';
import { updateProfile, checkAuthStatus, selectProfileCompletion } from '../store/slices/authSlice';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const { user, loading } = useSelector((state) => state.auth);
  const profileCompletion = useSelector(selectProfileCompletion);
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editedProfile, setEditedProfile] = useState({
    firstName: user?.profile?.firstName || '',
    lastName: user?.profile?.lastName || '',
    location: user?.profile?.location || '',
    currentCompany: user?.profile?.currentCompany || '',
    currentPosition: user?.profile?.currentPosition || '',
    graduationYear: user?.profile?.graduationYear || '',
    bio: user?.profile?.bio || '',
    linkedin: user?.profile?.linkedin || '',
    github: user?.profile?.github || '',
    skills: user?.profile?.skills || []
  });
  const [newSkill, setNewSkill] = useState('');

  // Calculate profile completion percentage

  const handleAvatarClick = () => {
    if (isEditing) {
      fileInputRef.current?.click();
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (JPG, PNG, JPEG)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    try {
      setUploadingImage(true);
      
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await authAPI.uploadProfileImage(formData);
      
      if (response && response.success) {
        // Refresh profile to get updated avatar everywhere
        await dispatch(checkAuthStatus());
        toast.success('Profile image updated successfully!');
      } else {
        throw new Error(response?.message || 'Upload failed');
      }
    } catch (error) {
      console.error('❌ Failed to upload image:', error);
      toast.error(error.response?.data?.message || 'Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Reset to original values if canceling
      setEditedProfile({
        firstName: user?.profile?.firstName || '',
        lastName: user?.profile?.lastName || '',
        location: user?.profile?.location || '',
        currentCompany: user?.profile?.currentCompany || '',
        currentPosition: user?.profile?.currentPosition || '',
        graduationYear: user?.profile?.graduationYear || '',
        bio: user?.profile?.bio || '',
        linkedin: user?.profile?.linkedin || '',
        github: user?.profile?.github || '',
        skills: user?.profile?.skills || []
      });
    }
    setIsEditing(!isEditing);
  };

  const handleInputChange = (field, value) => {
    console.log(`📝 Field changed: ${field} = "${value}"`);
    setEditedProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !editedProfile.skills.includes(newSkill.trim())) {
      setEditedProfile(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setEditedProfile(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const handleSave = async () => {
    try {
      // Sanitize and validate URLs before sending
      let linkedinUrl = editedProfile.linkedin?.trim() || '';
      let githubUrl = editedProfile.github?.trim() || '';
      
      // Auto-prepend https:// if user enters just the domain/path
      if (linkedinUrl && !linkedinUrl.startsWith('http')) {
        linkedinUrl = 'https://linkedin.com/in/' + linkedinUrl.replace(/^(www\.)?linkedin\.com\/(in\/)?/, '');
      }
      
      if (githubUrl && !githubUrl.startsWith('http')) {
        githubUrl = 'https://github.com/' + githubUrl.replace(/^(www\.)?github\.com\//, '');
      }
      
      const payload = {
        profile: {
          firstName: editedProfile.firstName,
          lastName: editedProfile.lastName,
          location: editedProfile.location,
          currentCompany: editedProfile.currentCompany,
          currentPosition: editedProfile.currentPosition,
          graduationYear: editedProfile.graduationYear,
          bio: editedProfile.bio,
          linkedin: linkedinUrl,
          github: githubUrl,
          skills: editedProfile.skills
        }
      };
      
      console.log('💾 Submitting payload:', JSON.stringify(payload, null, 2));
      console.log('💼 LinkedIn value:', payload.profile.linkedin);
      console.log('💻 GitHub value:', payload.profile.github);
      
      const result = await dispatch(updateProfile(payload));
      
      if (updateProfile.fulfilled.match(result)) {
        setIsEditing(false);
        // Refresh profile to sync everywhere
        await dispatch(checkAuthStatus());
        toast.success('Profile updated successfully!');
      } else if (updateProfile.rejected.match(result)) {
        const errorMessage = result.payload || 'Failed to update profile';
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to update profile');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage your personal information and preferences
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            {isEditing ? (
              <>
                <button
                  onClick={handleEditToggle}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            ) : (
              <button
                onClick={handleEditToggle}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white shadow rounded-lg"
        >
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Personal Information</h2>
          </div>
          <div className="p-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
              {/* Avatar with Circular Progress Ring */}
              <div className="flex-shrink-0 relative">
                <div 
                  className={`${isEditing ? 'cursor-pointer' : ''}`}
                  onClick={handleAvatarClick}
                >
                  {uploadingImage ? (
                    <div 
                      className="flex items-center justify-center rounded-full bg-gray-200"
                      style={{ width: 140, height: 140 }}
                    >
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                    </div>
                  ) : (
                    <Avatar user={user} size={140} variant="profile" />
                  )}
                </div>

                {/* Completion Badge */}
                {profileCompletion === 100 && (
                  <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1.5 border-4 border-white">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                )}

                {/* Hidden File Input - Only in Edit Mode */}
                {isEditing && (
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                )}

                {/* Profile Completion Text */}
                <div className="text-center mt-3">
                  <p className="text-sm font-semibold text-gray-900">
                    {profileCompletion}% Complete
                  </p>
                  {profileCompletion < 100 && (
                    <p className="text-xs text-gray-500 mt-1">
                      Complete your profile
                    </p>
                  )}
                </div>
              </div>

              {/* Profile Info */}
              <div className="flex-1 text-center sm:text-left">
                {isEditing ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={editedProfile.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        placeholder="First Name"
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <input
                        type="text"
                        value={editedProfile.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        placeholder="Last Name"
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <input
                      type="text"
                      value={editedProfile.currentPosition}
                      onChange={(e) => handleInputChange('currentPosition', e.target.value)}
                      placeholder="Current Position"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <button
                      onClick={handleAvatarClick}
                      className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      {user?.profile?.avatar ? 'Change Photo' : 'Upload Photo'}
                    </button>
                  </div>
                ) : (
                  <>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {user?.profile?.firstName} {user?.profile?.lastName}
                    </h3>
                    <p className="text-sm text-gray-500 capitalize mt-1">{user?.role}</p>
                    {user?.profile?.currentPosition && (
                      <p className="text-base text-gray-700 mt-2">
                        {user.profile.currentPosition}
                        {user?.profile?.currentCompany && ` at ${user.profile.currentCompany}`}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Email</p>
                    <p className="text-sm text-gray-600">{user?.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Location</p>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedProfile.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        placeholder="City, Country"
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    ) : (
                      <p className="text-sm text-gray-600">{user?.profile?.location || 'Not specified'}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Building className="h-5 w-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.role === 'student' ? 'College / University' : 'Company'}
                    </p>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedProfile.currentCompany}
                        onChange={(e) => handleInputChange('currentCompany', e.target.value)}
                        placeholder={user?.role === 'student' ? 'College / University Name' : 'Company Name'}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    ) : (
                      <p className="text-sm text-gray-600">{user?.profile?.currentCompany || 'Not specified'}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Graduation Year</p>
                    {isEditing ? (
                      <input
                        type="number"
                        value={editedProfile.graduationYear}
                        onChange={(e) => handleInputChange('graduationYear', e.target.value)}
                        placeholder="2024"
                        min="1950"
                        max={new Date().getFullYear() + 10}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    ) : (
                      <p className="text-sm text-gray-600">{user?.profile?.graduationYear || 'Not specified'}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Social Links Section */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-4">Social Links</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <Linkedin className="h-5 w-5 text-blue-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">LinkedIn</p>
                    {isEditing ? (
                      <input
                        type="url"
                        value={editedProfile.linkedin}
                        onChange={(e) => handleInputChange('linkedin', e.target.value)}
                        placeholder="https://linkedin.com/in/username"
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    ) : user?.profile?.linkedin ? (
                      <a
                        href={user.profile.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary-600 hover:text-primary-700"
                      >
                        View Profile
                      </a>
                    ) : (
                      <p className="text-sm text-gray-500">Not added</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Github className="h-5 w-5 text-gray-900" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">GitHub</p>
                    {isEditing ? (
                      <input
                        type="url"
                        value={editedProfile.github}
                        onChange={(e) => {
                          console.log('🔧 GitHub input onChange triggered:', e.target.value);
                          handleInputChange('github', e.target.value);
                        }}
                        onFocus={() => console.log('🎯 GitHub input focused')}
                        onBlur={() => console.log('👋 GitHub input blurred, value:', editedProfile.github)}
                        placeholder="https://github.com/username"
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    ) : user?.profile?.github ? (
                      <a
                        href={user.profile.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary-600 hover:text-primary-700"
                      >
                        View Profile
                      </a>
                    ) : (
                      <p className="text-sm text-gray-500">Not added</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Skills Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white shadow rounded-lg"
        >
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Skills</h2>
          </div>
          <div className="p-6">
            {isEditing ? (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                    placeholder="Add a skill (e.g., React, Node.js)"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <button
                    onClick={handleAddSkill}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </button>
                </div>
                {editedProfile.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {editedProfile.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800"
                      >
                        {skill}
                        <button
                          onClick={() => handleRemoveSkill(skill)}
                          className="ml-2 hover:text-primary-900"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No skills added yet. Add your first skill above.</p>
                )}
              </div>
            ) : (
              <>
                {user?.profile?.skills && user.profile.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {user.profile.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-sm text-gray-500">No skills added yet</p>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="mt-2 text-sm text-primary-600 hover:text-primary-500"
                    >
                      Add skills
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>

        {/* Bio Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white shadow rounded-lg"
        >
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">About</h2>
          </div>
          <div className="p-6">
            {isEditing ? (
              <textarea
                value={editedProfile.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Tell us about yourself, your experience, and what you're passionate about..."
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            ) : (
              <>
                {user?.profile?.bio ? (
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{user.profile.bio}</p>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-sm text-gray-500">No bio added yet</p>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="mt-2 text-sm text-primary-600 hover:text-primary-500"
                    >
                      Add bio
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;
