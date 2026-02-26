import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import {
  Users,
  Briefcase,
  MessageCircle,
  TrendingUp,
  Calendar,
  Award,
  Target,
  ArrowRight,
  Building
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';

const AlumniDashboard = () => {
  const { user } = useSelector((state) => state.auth);

  const stats = [
    {
      name: 'Mentorship Requests',
      value: '5',
      icon: MessageCircle,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      name: 'Network Connections',
      value: '48',
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      name: 'Jobs Posted',
      value: '3',
      icon: Briefcase,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      name: 'Profile Views',
      value: '127',
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  const quickActions = [
    {
      name: 'Post a Job',
      description: 'Share opportunities with students',
      icon: Briefcase,
      href: '/jobs/create',
      color: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      name: 'Mentor Students',
      description: 'Review pending mentorship requests',
      icon: Users,
      href: '/mentorship',
      color: 'bg-green-600 hover:bg-green-700',
    },
    {
      name: 'Update Profile',
      description: 'Keep your information current',
      icon: Target,
      href: '/profile',
      color: 'bg-purple-600 hover:bg-purple-700',
    },
    {
      name: 'Network',
      description: 'Connect with other alumni',
      icon: Users,
      href: '/alumni',
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
                Welcome back, {user?.profile?.firstName}! 🎓
              </h1>
              <p className="mt-2 text-primary-100">
                Thank you for giving back to the community and helping students succeed.
              </p>
            </div>
            <div className="hidden md:block">
              <Building className="h-16 w-16 text-primary-200" />
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
          {/* Pending Mentorship Requests */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white shadow rounded-lg"
          >
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">Pending Requests</h2>
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
              <div className="space-y-4">
                {[1, 2, 3].map((_, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700">
                          JS
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        John Smith
                      </p>
                      <p className="text-sm text-gray-500">
                        Computer Science • Class of 2025
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button className="text-sm text-green-600 hover:text-green-500">
                        Accept
                      </button>
                      <button className="text-sm text-red-600 hover:text-red-500">
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
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
                            <MessageCircle className="h-5 w-5 text-white" />
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p className="text-sm text-gray-500">
                              New mentorship request from <span className="font-medium text-gray-900">Alex Chen</span>
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
                            <Briefcase className="h-5 w-5 text-white" />
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p className="text-sm text-gray-500">
                              Job posting received 5 new applications
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
                            <Users className="h-5 w-5 text-white" />
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p className="text-sm text-gray-500">
                              Connected with <span className="font-medium text-gray-900">Maria Rodriguez</span>
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
      </div>
    </DashboardLayout>
  );
};

export default AlumniDashboard;