import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap,
  Home,
  Users,
  Briefcase,
  MessageCircle,
  FileText,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  Shield,
  Sun,
  Moon
} from 'lucide-react';
import { logoutUser } from '../../store/slices/authSlice';
import { useTheme } from '../../contexts/ThemeContext';
import Avatar from '../common/Avatar';

const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { theme, toggleTheme } = useTheme();

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/');
  };

  const getNavigationItems = () => {
    const baseItems = [
      {
        name: 'Dashboard',
        href: `/dashboard/${user?.role}`,
        icon: Home,
        current: location.pathname === `/dashboard/${user?.role}`,
      },
      {
        name: 'Alumni Directory',
        href: '/alumni',
        icon: Users,
        current: location.pathname === '/alumni',
      },
      {
        name: 'Job Board',
        href: '/jobs',
        icon: Briefcase,
        current: location.pathname === '/jobs',
      },
      {
        name: 'Mentorship',
        href: '/mentorship',
        icon: MessageCircle,
        current: location.pathname === '/mentorship',
      },
    ];

    // Add role-specific items
    if (user?.role === 'student' || user?.role === 'alumni') {
      baseItems.push({
        name: 'Resume',
        href: '/resume',
        icon: FileText,
        current: location.pathname === '/resume',
      });
    }

    if (user?.role === 'admin') {
      baseItems.push({
        name: 'Admin Panel',
        href: '/admin',
        icon: Shield,
        current: location.pathname === '/admin',
      });
      baseItems.push({
        name: 'Activity Logs',
        href: '/admin/activity-logs',
        icon: FileText,
        current: location.pathname === '/admin/activity-logs',
      });
    }

    return baseItems;
  };

  const navigationItems = getNavigationItems();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 flex z-40 md:hidden"
            >
              <div
                className="fixed inset-0 bg-gray-600 bg-opacity-75"
                onClick={() => setSidebarOpen(false)}
              />
              <motion.div
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                exit={{ x: -300 }}
                className="relative flex-1 flex flex-col max-w-xs w-full bg-white"
              >
                <div className="absolute top-0 right-0 -mr-12 pt-2">
                  <button
                    type="button"
                    className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <X className="h-6 w-6 text-white" />
                  </button>
                </div>
                <SidebarContent navigationItems={navigationItems} user={user} onLogout={handleLogout} />
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Static sidebar for desktop */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 bg-white border-r border-gray-200">
          <SidebarContent navigationItems={navigationItems} user={user} onLogout={handleLogout} />
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1">
        {/* Top navigation */}
        <div className="sticky top-0 z-10 md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-gray-50">
          <button
            type="button"
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <div className="flex-shrink-0 md:hidden">
                  <GraduationCap className="h-8 w-8 text-primary-600" />
                </div>
                <div className="hidden md:block">
                  <div className="ml-4 flex items-center md:ml-6">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        placeholder="Search..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {/* Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  className="bg-white dark:bg-gray-800 p-2 rounded-full text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                  title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                  {theme === 'dark' ? (
                    <Sun className="h-5 w-5" />
                  ) : (
                    <Moon className="h-5 w-5" />
                  )}
                </button>

                {/* Notifications */}
                <button
                  type="button"
                  className="bg-white dark:bg-gray-800 p-1 rounded-full text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <Bell className="h-6 w-6" />
                </button>

                {/* Profile dropdown */}
                <div className="relative">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <Avatar user={user} size={48} />
                    </div>
                    <div className="hidden md:block">
                      <div className="text-sm font-medium text-gray-900">
                        {user?.profile?.firstName} {user?.profile?.lastName}
                      </div>
                      <div className="text-xs text-gray-500 capitalize">
                        {user?.role}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

const SidebarContent = ({ navigationItems, user, onLogout }) => {
  return (
    <>
      {/* Logo */}
      <div className="flex items-center h-16 flex-shrink-0 px-4 bg-white">
        <Link to="/" className="flex items-center">
          <GraduationCap className="h-8 w-8 text-primary-600" />
          <span className="ml-2 text-xl font-bold text-gray-900">AlumniAI</span>
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        <nav className="flex-1 px-2 py-4 bg-white space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`${
                  item.current
                    ? 'bg-primary-100 border-primary-500 text-primary-700'
                    : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                } group flex items-center px-2 py-2 text-sm font-medium border-l-4 transition-colors`}
              >
                <Icon
                  className={`${
                    item.current ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                  } mr-3 flex-shrink-0 h-6 w-6`}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
          <div className="flex-shrink-0 w-full group block">
            <div className="flex items-center">
              <Avatar user={user} size={56} />
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                  {user?.profile?.firstName} {user?.profile?.lastName}
                </p>
                <p className="text-xs font-medium text-gray-500 group-hover:text-gray-700 capitalize">
                  {user?.role}
                </p>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <Link
                to="/profile"
                className="group flex items-center px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:text-gray-900 hover:bg-gray-50"
              >
                <User className="text-gray-400 group-hover:text-gray-500 mr-3 flex-shrink-0 h-5 w-5" />
                Profile
              </Link>
              <Link
                to="/settings"
                className="group flex items-center px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:text-gray-900 hover:bg-gray-50"
              >
                <Settings className="text-gray-400 group-hover:text-gray-500 mr-3 flex-shrink-0 h-5 w-5" />
                Settings
              </Link>
              <button
                onClick={onLogout}
                className="w-full group flex items-center px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:text-gray-900 hover:bg-gray-50"
              >
                <LogOut className="text-gray-400 group-hover:text-gray-500 mr-3 flex-shrink-0 h-5 w-5" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DashboardLayout;