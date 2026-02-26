import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import {
  Users,
  Briefcase,
  MessageCircle,
  TrendingUp,
  Shield,
  Activity,
  BarChart3,
  Settings,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Eye,
  UserCheck,
  Brain,
  Clock,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import DashboardLayout from '../../components/layout/DashboardLayout';
import MetricCard from '../../components/charts/MetricCard';
import SkillsHeatmap from '../../components/charts/SkillsHeatmap';
import ActivityTable from '../../components/charts/ActivityTable';
import { adminAPI } from '../../services/api';
import {
  fetchDashboardStats,
  fetchUserStats,
  fetchMentorshipStats,
  fetchSkillsDistribution,
  fetchActivityLogs,
  setFilters
} from '../../store/slices/adminSlice';

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { 
    dashboard, 
    userStats, 
    mentorshipStats, 
    skillsDistribution, 
    activityLogs,
    filters 
  } = useSelector((state) => state.admin);
  
  const [refreshing, setRefreshing] = useState(false);
  const [mentorCount, setMentorCount] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);

  useEffect(() => {
    fetchAllData();
  }, [dispatch, filters.timeRange]);

  const fetchAllData = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        dispatch(fetchDashboardStats()),
        dispatch(fetchUserStats({ timeRange: filters.timeRange })),
        dispatch(fetchMentorshipStats({ timeRange: filters.timeRange })),
        dispatch(fetchSkillsDistribution({ timeRange: filters.timeRange })),
        dispatch(fetchActivityLogs({ limit: 10 }))
      ]);
      
      // Fetch mentor count and earnings
      const mentorData = await adminAPI.getMentorCount();
      setMentorCount(mentorData.mentorCount);
      
      const earningsData = await adminAPI.getTotalEarnings();
      setTotalEarnings(earningsData.totalEarnings);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleTimeRangeChange = (timeRange) => {
    dispatch(setFilters({ timeRange }));
  };

  const stats = [
    {
      title: 'Total Users',
      value: dashboard.stats.totalUsers?.toLocaleString() || '2,847',
      change: dashboard.stats.userGrowth || '+12%',
      changeType: 'increase',
      icon: Users,
      color: 'blue',
    },
    {
      title: 'Total Mentors',
      value: mentorCount?.toLocaleString() || '0',
      change: '+5%',
      changeType: 'increase',
      icon: UserCheck,
      color: 'indigo',
    },
    {
      title: 'Active Users (30d)',
      value: dashboard.stats.activeUsers?.toLocaleString() || '1,923',
      change: dashboard.stats.activeGrowth || '+8%',
      changeType: 'increase',
      icon: UserCheck,
      color: 'green',
    },
    {
      title: 'Total Earnings',
      value: `₹${totalEarnings?.toLocaleString() || '0'}`,
      change: '+15%',
      changeType: 'increase',
      icon: TrendingUp,
      color: 'emerald',
    },
    {
      title: 'Mentorship Matches',
      value: dashboard.stats.mentorshipMatches?.toLocaleString() || '89',
      change: dashboard.stats.mentorshipGrowth || '+23%',
      changeType: 'increase',
      icon: MessageCircle,
      color: 'purple',
    },
    {
      title: 'AI Predictions Made',
      value: dashboard.stats.aiPredictions?.toLocaleString() || '1,245',
      change: dashboard.stats.aiGrowth || '+45%',
      changeType: 'increase',
      icon: Brain,
      color: 'orange',
    },
  ];

  // Mock data for charts (replace with real data from Redux store)
  const userGrowthData = userStats.growth.length > 0 ? userStats.growth : [
    { date: '2024-01-01', students: 120, alumni: 80, total: 200 },
    { date: '2024-01-08', students: 135, alumni: 85, total: 220 },
    { date: '2024-01-15', students: 150, alumni: 90, total: 240 },
    { date: '2024-01-22', students: 165, alumni: 95, total: 260 },
    { date: '2024-01-29', students: 180, alumni: 100, total: 280 },
    { date: '2024-02-05', students: 195, alumni: 105, total: 300 },
    { date: '2024-02-12', students: 210, alumni: 110, total: 320 },
  ];

  const skillsHeatmapData = skillsDistribution.skills.length > 0 ? skillsDistribution.skills : [
    { name: 'JavaScript', value: 450, category: 'Programming' },
    { name: 'Python', value: 380, category: 'Programming' },
    { name: 'React', value: 320, category: 'Frontend' },
    { name: 'Node.js', value: 280, category: 'Backend' },
    { name: 'AWS', value: 250, category: 'Cloud' },
    { name: 'Machine Learning', value: 220, category: 'AI/ML' },
    { name: 'SQL', value: 200, category: 'Database' },
    { name: 'Docker', value: 180, category: 'DevOps' },
    { name: 'TypeScript', value: 160, category: 'Programming' },
    { name: 'MongoDB', value: 140, category: 'Database' },
  ];

  const mentorshipTrendsData = mentorshipStats.trends.length > 0 ? mentorshipStats.trends : [
    { month: 'Jan', requests: 45, matches: 38, completion: 85 },
    { month: 'Feb', requests: 52, matches: 44, completion: 88 },
    { month: 'Mar', requests: 48, matches: 41, completion: 82 },
    { month: 'Apr', requests: 61, matches: 55, completion: 90 },
    { month: 'May', requests: 58, matches: 52, completion: 87 },
    { month: 'Jun', requests: 67, matches: 61, completion: 91 },
  ];

  const aiPredictionStats = [
    { name: 'Career Predictions', value: 65, color: '#3b82f6' },
    { name: 'Resume Analysis', value: 25, color: '#10b981' },
    { name: 'Compatibility Scores', value: 10, color: '#f59e0b' },
  ];

  const mockActivityLogs = [
    {
      id: 1,
      user: { 
        profile: { firstName: 'John', lastName: 'Doe' }, 
        email: 'john@example.com' 
      },
      action: 'LOGIN',
      resource: '/auth/login',
      ipAddress: '192.168.1.100',
      timestamp: new Date().toISOString(),
      status: 'success',
      description: 'User logged in successfully'
    },
    {
      id: 2,
      user: { 
        profile: { firstName: 'Jane', lastName: 'Smith' }, 
        email: 'jane@example.com' 
      },
      action: 'CREATE_JOB',
      resource: '/jobs',
      ipAddress: '192.168.1.101',
      timestamp: new Date(Date.now() - 300000).toISOString(),
      status: 'success',
      description: 'New job posting created'
    },
    {
      id: 3,
      user: { 
        profile: { firstName: 'Bob', lastName: 'Wilson' }, 
        email: 'bob@example.com' 
      },
      action: 'UPLOAD_RESUME',
      resource: '/resumes/upload',
      ipAddress: '192.168.1.102',
      timestamp: new Date(Date.now() - 600000).toISOString(),
      status: 'error',
      description: 'Resume upload failed - file too large'
    },
    {
      id: 4,
      user: { 
        profile: { firstName: 'Alice', lastName: 'Johnson' }, 
        email: 'alice@example.com' 
      },
      action: 'MENTORSHIP_REQUEST',
      resource: '/mentorship',
      ipAddress: '192.168.1.103',
      timestamp: new Date(Date.now() - 900000).toISOString(),
      status: 'success',
      description: 'Mentorship request submitted'
    },
    {
      id: 5,
      user: { 
        profile: { firstName: 'Charlie', lastName: 'Brown' }, 
        email: 'charlie@example.com' 
      },
      action: 'AI_PREDICTION',
      resource: '/ai/career-predict',
      ipAddress: '192.168.1.104',
      timestamp: new Date(Date.now() - 1200000).toISOString(),
      status: 'success',
      description: 'Career prediction generated'
    }
  ];

  const activityData = activityLogs.logs.length > 0 ? activityLogs.logs : mockActivityLogs;

  const quickActions = [
    {
      name: 'User Management',
      description: 'Manage user accounts and permissions',
      icon: Users,
      href: '/admin/users',
      color: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      name: 'Content Moderation',
      description: 'Review flagged content and reports',
      icon: Shield,
      href: '/admin/moderation',
      color: 'bg-red-600 hover:bg-red-700',
    },
    {
      name: 'Analytics',
      description: 'View detailed platform analytics',
      icon: BarChart3,
      href: '/admin/analytics',
      color: 'bg-green-600 hover:bg-green-700',
    },
    {
      name: 'System Settings',
      description: 'Configure platform settings',
      icon: Settings,
      href: '/admin/settings',
      color: 'bg-purple-600 hover:bg-purple-700',
    },
  ];

  const recentAlerts = [
    {
      id: 1,
      type: 'warning',
      message: 'High server load detected on API gateway',
      time: '5 minutes ago',
      status: 'active',
    },
    {
      id: 2,
      type: 'info',
      message: 'Weekly backup completed successfully',
      time: '2 hours ago',
      status: 'resolved',
    },
    {
      id: 3,
      type: 'success',
      message: 'New feature deployment completed',
      time: '1 day ago',
      status: 'resolved',
    },
  ];

  const getAlertIcon = (type) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <Activity className="h-5 w-5 text-blue-500" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header with Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">
              Monitor and manage the AlumniAI platform
            </p>
          </div>
          <div className="mt-4 lg:mt-0 flex items-center space-x-3">
            <select
              value={filters.timeRange}
              onChange={(e) => handleTimeRangeChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <button
              onClick={fetchAllData}
              disabled={refreshing}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button className="inline-flex items-center px-3 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-primary-600 hover:bg-primary-700">
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <MetricCard
              key={stat.title}
              title={stat.title}
              value={stat.value}
              change={stat.change}
              changeType={stat.changeType}
              icon={stat.icon}
              color={stat.color}
              loading={dashboard.loading}
              className="transform transition-all duration-200 hover:scale-105"
            />
          ))}
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Growth Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white shadow rounded-lg"
          >
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">User Growth</h2>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-600">Students</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-600">Alumni</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={userGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatDate}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="students"
                    stackId="1"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="alumni"
                    stackId="1"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Mentorship Trends */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white shadow rounded-lg"
          >
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Mentorship Trends</h2>
            </div>
            <div className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={mentorshipTrendsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="requests"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="matches"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="completion"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Skills Heatmap */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-2 bg-white shadow rounded-lg"
          >
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Skills Distribution</h2>
            </div>
            <div className="p-6">
              <SkillsHeatmap data={skillsHeatmapData} height={300} />
            </div>
          </motion.div>

          {/* AI Prediction Statistics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white shadow rounded-lg"
          >
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">AI Usage</h2>
            </div>
            <div className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={aiPredictionStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {aiPredictionStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* Activity Logs Table */}
        <ActivityTable
          data={activityData}
          loading={activityLogs.loading}
          totalCount={activityLogs.totalCount || activityData.length}
          onPageChange={(page) => console.log('Page changed:', page)}
          onSearch={(term) => console.log('Search:', term)}
          onFilter={(status) => console.log('Filter:', status)}
        />

        {/* Quick Actions and System Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-white shadow rounded-lg"
          >
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          {/* System Alerts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="bg-white shadow rounded-lg"
          >
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">System Alerts</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getAlertIcon(alert.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{alert.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{alert.time}</p>
                    </div>
                    <div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        alert.status === 'active' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {alert.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;