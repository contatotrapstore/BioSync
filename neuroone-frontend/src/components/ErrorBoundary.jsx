import React from 'react';
import ErrorFallback from './ErrorFallback';

/**
 * Error Boundary Component
 * Catches React errors in component tree and shows fallback UI
 * Prevents entire app from crashing when errors occur
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so next render shows fallback UI
    return {
      hasError: true,
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error('🔴 [ERROR BOUNDARY] React error caught:', error);
    console.error('🔴 [ERROR BOUNDARY] Component stack:', errorInfo.componentStack);

    // Update state with error details
    this.setState({
      error,
      errorInfo,
    });

    // Optional: Send to error tracking service (Sentry, etc.)
    // trackError(error, errorInfo);
  }

  handleReset = () => {
    // Reset error state and allow retry
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Render fallback UI
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={this.handleReset}
        />
      );
    }

    // No error - render children normally
    return this.props.children;
  }
}

export default ErrorBoundary;
