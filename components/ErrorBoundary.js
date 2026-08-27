import React from "react";

/**
 * Lightweight Client-Side Error Boundary for visual & interactive subsystems (WebGL, Web Audio, Canvas).
 * Prevents subsystem errors from breaking the overall page layout or React tree.
 */
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
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          className={this.props.className}
          data-webgl="fallback"
          aria-hidden="true"
          style={{
            minHeight: "100%",
            width: "100%",
            background: "radial-gradient(circle at center, #0a1510 0%, #060b09 100%)",
            ...this.props.style,
          }}
        >
          {process.env.NODE_ENV !== "production" && (
            <div style={{ display: "none" }}>
              {this.state.error?.toString()}
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
