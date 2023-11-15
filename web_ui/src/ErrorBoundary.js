import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
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
