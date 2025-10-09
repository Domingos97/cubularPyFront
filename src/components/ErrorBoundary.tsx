import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  errorId?: string;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; errorInfo?: React.ErrorInfo; resetError: () => void; reportError?: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  level?: 'page' | 'component' | 'critical';
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return { hasError: true, error, errorId };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Enhanced error logging
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      level: this.props.level || 'component'
    };

    // Log to console with detailed info
    console.group('🚨 Error Boundary Caught Error');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Error Details:', errorDetails);
    console.groupEnd();

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Store error info in state for fallback component
    this.setState({ errorInfo });

    // Report to external service (could be Sentry, LogRocket, etc.)
    this.reportErrorToService(errorDetails);
  }

  private reportErrorToService = (errorDetails: any) => {
    // This could integrate with error reporting services
    try {
      // For now, just store in localStorage for debugging
      const existingErrors = JSON.parse(localStorage.getItem('errorReports') || '[]');
      existingErrors.push(errorDetails);
      
      // Keep only last 10 errors to prevent localStorage bloat
      if (existingErrors.length > 10) {
        existingErrors.splice(0, existingErrors.length - 10);
      }
      
      localStorage.setItem('errorReports', JSON.stringify(existingErrors));
    } catch (e) {
      console.warn('Failed to store error report:', e);
    }
  };

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined, errorId: undefined });
  };

  reportError = () => {
    if (this.state.error && this.state.errorId) {
      // Create a more detailed error report
      const report = {
        errorId: this.state.errorId,
        timestamp: new Date().toISOString(),
        error: {
          message: this.state.error.message,
          stack: this.state.error.stack,
        },
        componentStack: this.state.errorInfo?.componentStack,
        userAgent: navigator.userAgent,
        url: window.location.href,
        level: this.props.level
      };

      // Copy to clipboard for easy reporting
      navigator.clipboard.writeText(JSON.stringify(report, null, 2)).then(() => {
        alert('Error report copied to clipboard. Please share this with support.');
      }).catch(() => {
        alert('Error report logged to console. Please check the console and share with support.');
      });
    }
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return (
        <FallbackComponent 
          error={this.state.error} 
          errorInfo={this.state.errorInfo}
          resetError={this.resetError}
          reportError={this.reportError}
        />
      );
    }

    return this.props.children;
  }
}

// Enhanced default error fallback with better UX
const DefaultErrorFallback = ({ 
  error, 
  errorInfo, 
  resetError, 
  reportError 
}: { 
  error?: Error; 
  errorInfo?: React.ErrorInfo; 
  resetError: () => void;
  reportError?: () => void;
}) => (
  <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
    <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 max-w-lg w-full">
      <div className="text-center mb-6">
        <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Oops! Something went wrong</h2>
        <p className="text-gray-300 text-sm mb-4">
          We encountered an unexpected error. Don't worry, your data is safe.
        </p>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-6">
          <p className="text-red-200 text-sm font-medium mb-2">Error Details:</p>
          <p className="text-red-300 text-xs font-mono break-all">
            {error.message}
          </p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={resetError}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
        >
          Try Again
        </button>
        
        <button
          onClick={() => window.location.reload()}
          className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
        >
          Refresh Page
        </button>
        
        {reportError && (
          <button
            onClick={reportError}
            className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition-colors font-medium text-sm"
          >
            Report Issue
          </button>
        )}
      </div>
      
      <div className="mt-4 text-center">
        <p className="text-gray-400 text-xs">
          If this problem persists, please contact support.
        </p>
      </div>
    </div>
  </div>
);

// Specialized error boundaries for different contexts
export const PageErrorBoundary = ({ children }: { children: React.ReactNode }) => (
  <ErrorBoundary level="page" fallback={PageErrorFallback}>
    {children}
  </ErrorBoundary>
);

export const ComponentErrorBoundary = ({ children }: { children: React.ReactNode }) => (
  <ErrorBoundary level="component" fallback={ComponentErrorFallback}>
    {children}
  </ErrorBoundary>
);

// Smaller fallback for component-level errors
const ComponentErrorFallback = ({ error, resetError }: { error?: Error; resetError: () => void }) => (
  <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 m-4">
    <div className="flex items-start space-x-3">
      <svg className="w-5 h-5 text-red-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <div className="flex-1">
        <h3 className="text-red-200 font-medium text-sm">Component Error</h3>
        <p className="text-red-300 text-xs mt-1">
          {error?.message || 'This component encountered an error'}
        </p>
        <button
          onClick={resetError}
          className="text-red-400 hover:text-red-300 text-xs underline mt-2"
        >
          Retry
        </button>
      </div>
    </div>
  </div>
);

// Page-level error fallback
const PageErrorFallback = ({ error, resetError, reportError }: { 
  error?: Error; 
  resetError: () => void; 
  reportError?: () => void;
}) => (
  <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
    <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 max-w-md w-full text-center">
      <h2 className="text-2xl font-bold text-white mb-4">Page Not Available</h2>
      <p className="text-gray-300 mb-6">
        This page encountered an error and couldn't load properly.
      </p>
      
      <div className="space-y-3">
        <button
          onClick={resetError}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
        >
          Try Again
        </button>
        
        <button
          onClick={() => window.history.back()}
          className="w-full bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
        >
          Go Back
        </button>
        
        {reportError && (
          <button
            onClick={reportError}
            className="w-full text-yellow-400 hover:text-yellow-300 text-sm underline"
          >
            Report this issue
          </button>
        )}
      </div>
    </div>
  </div>
);