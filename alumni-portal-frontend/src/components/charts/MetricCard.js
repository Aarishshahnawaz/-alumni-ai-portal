import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const MetricCard = ({ 
  title, 
  value, 
  change, 
  changeType, 
  icon: Icon, 
  color = 'blue',
  loading = false,
  onClick,
  className = ''
}) => {
  const colorClasses = {
    blue: {
      icon: 'text-blue-600',
      bg: 'bg-blue-100',
      border: 'border-blue-200',
    },
    green: {
      icon: 'text-green-600',
      bg: 'bg-green-100',
      border: 'border-green-200',
    },
    purple: {
      icon: 'text-purple-600',
      bg: 'bg-purple-100',
      border: 'border-purple-200',
    },
    orange: {
      icon: 'text-orange-600',
      bg: 'bg-orange-100',
      border: 'border-orange-200',
    },
    red: {
      icon: 'text-red-600',
      bg: 'bg-red-100',
      border: 'border-red-200',
    },
  };

  const colors = colorClasses[color] || colorClasses.blue;

  const getTrendIcon = () => {
    switch (changeType) {
      case 'increase':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'decrease':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendColor = () => {
    switch (changeType) {
      case 'increase':
        return 'text-green-600';
      case 'decrease':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  };

  if (loading) {
    return (
      <div className={`bg-white overflow-hidden shadow rounded-lg border ${colors.border} ${className}`}>
        <div className="p-5">
          <div className="animate-pulse">
            <div className="flex items-center">
              <div className={`p-3 rounded-md ${colors.bg}`}>
                <div className="h-6 w-6 bg-gray-300 rounded"></div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                <div className="h-6 bg-gray-300 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: onClick ? 1.02 : 1 }}
      className={`bg-white overflow-hidden shadow rounded-lg border ${colors.border} ${
        onClick ? 'cursor-pointer hover:shadow-md' : ''
      } transition-all duration-200 ${className}`}
      onClick={onClick}
    >
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`p-3 rounded-md ${colors.bg}`}>
              <Icon className={`h-6 w-6 ${colors.icon}`} />
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                {title}
              </dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900">
                  {value}
                </div>
                {change && (
                  <div className={`ml-2 flex items-center text-sm font-semibold ${getTrendColor()}`}>
                    {getTrendIcon()}
                    <span className="ml-1">{change}</span>
                  </div>
                )}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MetricCard;