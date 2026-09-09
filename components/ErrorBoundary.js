import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Visual subsystem error caught by ErrorBoundary:", error, errorInfo);
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return this.props.fallback || (
      <div className={this.props.className} data-webgl="fallback" aria-hidden="true" style={{ minHeight: "100%", width: "100%", background: "radial-gradient(circle at center, #0a1510 0%, #060b09 100%)", ...this.props.style }} />
    );
  }
}

export default ErrorBoundary;
