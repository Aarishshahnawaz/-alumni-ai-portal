/**
 * Frontend Error Handling Utilities
 * Centralized error handling with user-friendly messages and logging
 */

import React from 'react';

/**
 * Error types for categorization
 */
export const ErrorTypes = {
  NETWORK: 'NETWORK_ERROR',
  AUTHENTICATION: 'AUTHENTICATION_ERROR',
  AUTHORIZATION: 'AUTHORIZATION_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  SERVER: 'SERVER_ERROR',
  CLIENT: 'CLIENT_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR',
};

/**
 * User-friendly error messages
 */
const errorMessages = {
  [ErrorTypes.NETWORK]: 'Unable to connect to the server. Please check your internet connection.',
  [ErrorTypes.AUTHENTICATION]: 'Your session has expired. Please log in again.',
  [ErrorTypes.AUTHORIZATION]: 'You do not have permission to perform this action.',
  [ErrorTypes.VALIDATION]: 'Please check your input and try again.',
  [ErrorTypes.SERVER]: 'Something went wrong on our end. Please try again later.',
  [ErrorTypes.CLIENT]: 'There was an issue with your request. Please try again.',
  [ErrorTypes.UNKNOWN]: 'An unexpected error occurred. Please try again.',
};

/**
 * Enhanced error class with context
 */
export class AppError extends Error {
  constructor(message, type = ErrorTypes.UNKNOWN, statusCode = null, context = {}) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.statusCode = statusCode;
    this.context = context;
    this.timestamp = new Date().toISOString();
    this.userMessage = errorMessages[type] || message;
  }

  /**
   * Get user-friendly message
   */
  getUserMessage() {
    return this.userMessage;
  }

  /**
   * Get error details for logging
   */
  getLogDetails() {
    return {
      message: this.message,
      type: this.type,
      statusCode: this.statusCode,
      context: this.context,
      timestamp: this.timestamp,
      stack: this.stack,
    };
  }
}

/**
 * Parse API error response
 */
export const parseApiError = (error) => {
  // Network error
  if (!error.response) {
    return new AppError(
      'Network connection failed',
      ErrorTypes.NETWORK,
      null,
      { originalError: error.message }
    );
  }

  const { status, data } = error.response;
  const message = data?.message || 'An error occurred';

  // Determine error type based on status code
  let errorType = ErrorTypes.UNKNOWN;
  
  if (status === 401) {
    errorType = ErrorTypes.AUTHENTICATION;
  } else if (status === 403) {
    errorType = ErrorTypes.AUTHORIZATION;
  } else if (status >= 400 && status < 500) {
    errorType = ErrorTypes.VALIDATION;
  } else if (status >= 500) {
    errorType = ErrorTypes.SERVER;
  }

  const appError = new AppError(
    message,
    errorType,
    status,
    {
      requestId: data?.requestId,
      field: data?.field,
      originalError: error.message,
    }
  );
  
  // Preserve validation errors array and full response data
  appError.response = error.response;
  appError.errors = data?.errors || [];
  
  return appError;
};

/**
 * Log error to console and external service
 */
export const logError = (error, context = {}) => {
  const errorDetails = {
    ...context,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
  };

  if (error instanceof AppError) {
    console.error('App Error:', error.getLogDetails(), errorDetails);
  } else {
    console.error('Unexpected Error:', error, errorDetails);
  }

  // In production, send to error tracking service (Sentry, LogRocket, etc.)
  if (process.env.NODE_ENV === 'production' && window.Sentry) {
    window.Sentry.captureException(error, {
      tags: {
        errorType: error.type || 'unknown',
        statusCode: error.statusCode,
      },
      extra: errorDetails,
    });
  }
};

/**
 * Handle async errors in components
 */
export const handleAsyncError = (asyncFn) => {
  return async (...args) => {
    try {
      return await asyncFn(...args);
    } catch (error) {
      const appError = error instanceof AppError ? error : parseApiError(error);
      logError(appError, { function: asyncFn.name });
      throw appError;
    }
  };
};

/**
 * Retry function with exponential backoff
 */
export const retryWithBackoff = async (
  fn,
  maxRetries = 3,
  baseDelay = 1000,
  maxDelay = 10000
) => {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on client errors (4xx) except 408, 429
      if (error.statusCode >= 400 && error.statusCode < 500) {
        if (error.statusCode !== 408 && error.statusCode !== 429) {
          throw error;
        }
      }

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Calculate delay with exponential backoff and jitter
      const delay = Math.min(
        baseDelay * Math.pow(2, attempt) + Math.random() * 1000,
        maxDelay
      );

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};

/**
 * Validate form data with custom rules
 */
export const validateFormData = (data, rules) => {
  const errors = {};

  Object.keys(rules).forEach(field => {
    const value = data[field];
    const fieldRules = rules[field];

    fieldRules.forEach(rule => {
      if (rule.required && (!value || value.toString().trim() === '')) {
        errors[field] = rule.message || `${field} is required`;
        return;
      }

      if (value && rule.minLength && value.toString().length < rule.minLength) {
        errors[field] = rule.message || `${field} must be at least ${rule.minLength} characters`;
        return;
      }

      if (value && rule.maxLength && value.toString().length > rule.maxLength) {
        errors[field] = rule.message || `${field} must not exceed ${rule.maxLength} characters`;
        return;
      }

      if (value && rule.pattern && !rule.pattern.test(value)) {
        errors[field] = rule.message || `${field} format is invalid`;
        return;
      }

      if (value && rule.custom && !rule.custom(value, data)) {
        errors[field] = rule.message || `${field} is invalid`;
        return;
      }
    });
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Sanitize user input to prevent XSS
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;

  return input
    .replace(/[<>]/g, '') // Remove < and > characters
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
};

/**
 * Format error message for display
 */
export const formatErrorMessage = (error) => {
  if (error instanceof AppError) {
    return error.getUserMessage();
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error?.message) {
    return error.message;
  }

  return 'An unexpected error occurred';
};

/**
 * Check if error is retryable
 */
export const isRetryableError = (error) => {
  if (!error.statusCode) return true; // Network errors are retryable

  // Retry on server errors and specific client errors
  return (
    error.statusCode >= 500 ||
    error.statusCode === 408 || // Request Timeout
    error.statusCode === 429    // Too Many Requests
  );
};

/**
 * Create error boundary HOC
 */
export const withErrorBoundary = (Component, fallbackComponent = null) => {
  return class ErrorBoundary extends React.Component {
    constructor(props) {
      super(props);
      this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
      return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
      logError(error, { errorInfo, component: Component.name });
    }

    render() {
      if (this.state.hasError) {
        if (fallbackComponent) {
          return fallbackComponent;
        }

        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="mt-4 text-center">
                <h3 className="text-lg font-medium text-gray-900">Something went wrong</h3>
                <p className="mt-2 text-sm text-gray-500">
                  We're sorry, but something unexpected happened. Please refresh the page and try again.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  Refresh Page
                </button>
              </div>
            </div>
          </div>
        );
      }

      return <Component {...this.props} />;
    }
  };
};