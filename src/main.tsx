import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/index.css";

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <main className="error-boundary">
          <h1>Resume Studio hit a local error</h1>
          <p>Your browser data should still be intact. Refresh the page, or export a backup from Settings once the app loads again.</p>
          <pre>{this.state.error.message}</pre>
          <button onClick={() => window.location.reload()}>Reload app</button>
        </main>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
