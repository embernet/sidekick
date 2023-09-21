import React from 'react';
import { toast } from 'react-toastify';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error(error, errorInfo);
    toast.error('An error occurred. Please try again later.');
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return <div>
        <h1>Something went wrong.</h1>
        <p>{this.state.error.message}</p><br/>
        <p>Refresh the browser to reload the app.</p>
    </div>;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
