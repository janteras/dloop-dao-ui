import React, { ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, resetError: () => void) => ReactNode);
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary component to catch JavaScript errors in child component trees
 * and display a fallback UI instead of crashing the whole application
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // You can also log the error to an error reporting service like Sentry
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // Render the fallback UI
      if (typeof this.props.fallback === 'function') {
        return this.props.fallback(this.state.error!, this.resetError);
      } else if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="p-4 m-4 border border-red-600 rounded-md bg-red-50 text-red-800 shadow-md">
          <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
          <details className="text-sm">
            <summary className="cursor-pointer mb-2">Show error details</summary>
            <pre className="p-2 bg-red-100 overflow-auto max-w-full whitespace-pre-wrap break-words">
              {this.state.error?.message}
            </pre>
          </details>
          <button
            onClick={this.resetError}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Default error fallback component
 */
export const DefaultErrorFallback = ({ error, resetError }: { error: Error; resetError: () => void }) => (
  <div className="p-4 m-4 border border-red-600 rounded-md bg-red-50 text-red-800 shadow-md">
    <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
    <details className="text-sm">
      <summary className="cursor-pointer mb-2">Show error details</summary>
      <pre className="p-2 bg-red-100 overflow-auto max-w-full whitespace-pre-wrap break-words">
        {error.message}
      </pre>
    </details>
    <button
      onClick={resetError}
      className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
    >
      Try again
    </button>
  </div>
);
