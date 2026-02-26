import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Users,
  Briefcase,
  FileText,
  MessageCircle,
  Calendar,
  Award,
  Target,
  ArrowRight,
  BookOpen
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { fetchAlumniSuggestions } from '../../store/slices/alumniSlice';
import { fetchJobs } from '../../store/slices/jobSlice';
import { fetchMyRequests } from '../../store/slices/mentorshipSlice';
import { selectProfileCompletion } from '../../store/slices/authSlice';

const StudentDashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const profileCompletion = useSelector(selectProfileCompletion);
  const { suggestions } = useSelector((state) => state.alumni);
  const { jobs } = useSelector((state) => state.jobs);
  const { myRequests } = useSelector((state) => state.mentorship);

  useEffect(() => {
    // Fetch dashboard data
    dispatch(fetchAlumniSuggestions({ limit: 3 }));
    dispatch(fetchJobs({ limit: 5, featured: true }));
    dispatch(fetchMyRequests({ limit: 5 }));
  }, [dispatch]);

  const stats = [
    {
      name: 'Profile Completion',
      value: `${profileCompletion}%`,
      icon: Target,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      name: 'Network Connections',
      value: '12',
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      name: 'Job Applications',
      value: '8',
      icon: Briefcase,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      name: 'Mentorship Requests',
      value: '3',
      icon: MessageCircle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  const quickActions = [
    {
      name: 'Upload Resume',
      description: 'Get AI-powered feedback on your resume',
      icon: FileText,
      href: '/resume',
      color: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      name: 'Find Mentors',
      description: 'Connect with experienced alumni',
      icon: Users,
      href: '/mentorship',
      color: 'bg-green-600 hover:bg-green-700',
    },
    {
      name: 'Browse Jobs',
      description: 'Discover opportunities from alumni companies',
      icon: Briefcase,
      href: '/jobs',
      color: 'bg-purple-600 hover:bg-purple-700',
    },
    {
      name: 'Career Prediction',
      description: 'Get AI insights on your career path',
      icon: TrendingUp,
      href: '/career-insights',
      color: 'bg-orange-600 hover:bg-orange-700',
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg shadow-lg p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                Welcome back, {user?.profile?.firstName}! 👋
              </h1>
              <p className="mt-2 text-primary-100">
                Ready to take the next step in your career journey?
              </p>
            </div>
            <div className="hidden md:block">
              <BookOpen className="h-16 w-16 text-primary-200" />
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white overflow-hidden shadow rounded-lg"
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`p-3 rounded-md ${stat.bgColor}`}>
                      <stat.icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {stat.name}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stat.value}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white shadow rounded-lg"
        >
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action, index) => (
                <motion.a
                  key={action.name}
                  href={action.href}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`${action.color} text-white p-4 rounded-lg block transition-colors`}
                >
                  <div className="flex items-center">
                    <action.icon className="h-6 w-6" />
                    <div className="ml-3">
                      <p className="text-sm font-medium">{action.name}</p>
                      <p className="text-xs opacity-90">{action.description}</p>
                    </div>
                  </div>
                </motion.a>
              ))}
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recommended Mentors */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white shadow rounded-lg"
          >
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">Recommended Mentors</h2>
                <a
                  href="/mentorship"
                  className="text-sm text-primary-600 hover:text-primary-500 flex items-center"
                >
                  View all
                  <ArrowRight className="ml-1 h-4 w-4" />
                </a>
              </div>
            </div>
            <div className="p-6">
              {suggestions.mentors?.length > 0 ? (
                <div className="space-y-4">
                  {suggestions.mentors.slice(0, 3).map((mentor, index) => (
                    <div key={index} className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center">
                          <span className="text-sm font-medium text-white">
                            {mentor.profile?.firstName?.[0]}{mentor.profile?.lastName?.[0]}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {mentor.profile?.firstName} {mentor.profile?.lastName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {mentor.profile?.currentPosition} at {mentor.profile?.currentCompany}
                        </p>
                      </div>
                      <div>
                        <button className="text-sm text-primary-600 hover:text-primary-500">
                          Connect
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No mentors yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Complete your profile to get personalized mentor recommendations.
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Recent Job Opportunities */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white shadow rounded-lg"
          >
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">Featured Jobs</h2>
                <a
                  href="/jobs"
                  className="text-sm text-primary-600 hover:text-primary-500 flex items-center"
                >
                  View all
                  <ArrowRight className="ml-1 h-4 w-4" />
                </a>
              </div>
            </div>
            <div className="p-6">
              {jobs.list?.length > 0 ? (
                <div className="space-y-4">
                  {jobs.list.slice(0, 3).map((job, index) => (
                    <div key={job._id} className="border-l-4 border-primary-500 pl-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {job.title}
                          </p>
                          <p className="text-sm text-gray-500">
                            {job.company} • {job.location}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Posted {new Date(job.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {job.jobType}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No jobs available</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Check back later for new opportunities.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white shadow rounded-lg"
        >
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
          </div>
          <div className="p-6">
            <div className="flow-root">
              <ul className="-mb-8">
                <li>
                  <div className="relative pb-8">
                    <div className="relative flex space-x-3">
                      <div>
                        <span className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center ring-8 ring-white">
                          <Award className="h-5 w-5 text-white" />
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm text-gray-500">
                            Profile completion increased to <span className="font-medium text-gray-900">{profileCompletion}%</span>
                          </p>
                        </div>
                        <div className="text-right text-sm whitespace-nowrap text-gray-500">
                          <time>2 hours ago</time>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
                <li>
                  <div className="relative pb-8">
                    <div className="relative flex space-x-3">
                      <div>
                        <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                          <FileText className="h-5 w-5 text-white" />
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm text-gray-500">
                            Resume uploaded and analyzed
                          </p>
                        </div>
                        <div className="text-right text-sm whitespace-nowrap text-gray-500">
                          <time>1 day ago</time>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
                <li>
                  <div className="relative">
                    <div className="relative flex space-x-3">
                      <div>
                        <span className="h-8 w-8 rounded-full bg-purple-500 flex items-center justify-center ring-8 ring-white">
                          <MessageCircle className="h-5 w-5 text-white" />
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm text-gray-500">
                            Mentorship request sent to <span className="font-medium text-gray-900">Sarah Johnson</span>
                          </p>
                        </div>
                        <div className="text-right text-sm whitespace-nowrap text-gray-500">
                          <time>3 days ago</time>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;