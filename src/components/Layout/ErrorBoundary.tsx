import React, { Component, ErrorInfo, ReactNode } from 'react';
    import { AlertTriangle, RefreshCw } from 'lucide-react';

    interface Props {
      children: ReactNode;
    }

    interface State {
      hasError: boolean;
      error?: Error;
    }

    class ErrorBoundary extends Component<Props, State> {
      public state: State = {
        hasError: false,
      };

      public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
      }

      public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
      }

      private handleRefresh = () => {
        window.location.reload();
      };

      public render() {
        if (this.state.hasError) {
          return (
            <div className="fixed inset-0 bg-gray-100 z-[200] flex flex-col items-center justify-center text-center p-4">
              <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
              <h1 className="text-2xl font-semibold text-gray-800">Something went wrong.</h1>
              <p className="text-gray-600 mt-2 max-w-md">
                An unexpected error occurred. Please try refreshing the page. If the problem persists, please contact support.
              </p>
              <button
                onClick={this.handleRefresh}
                className="mt-6 flex items-center justify-center space-x-2 px-6 py-2 bg-orange-500 text-white font-semibold rounded-lg shadow-md hover:bg-orange-600 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh Page</span>
              </button>
              {this.state.error && (
                 <details className="mt-4 text-xs text-gray-500 max-w-lg text-left">
                    <summary className="cursor-pointer">Error Details</summary>
                    <pre className="mt-2 bg-gray-200 p-2 rounded-md font-mono whitespace-pre-wrap break-all">
                        {this.state.error.message}
                    </pre>
                 </details>
              )}
            </div>
          );
        }

        return this.props.children;
      }
    }

    export default ErrorBoundary;
