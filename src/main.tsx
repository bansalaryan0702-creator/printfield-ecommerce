import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global error handler to suppress benign Firebase/IndexedDB and network errors from crashing the preview
if (typeof window !== 'undefined') {
  const isBenignError = (msg: string) => {
    const m = msg.toLowerCase();
    return m.includes('database is closing') || 
           m.includes('hidden') || 
           m.includes('load failed') ||
           m.includes('database is closed');
  };

  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason) {
      const msg = event.reason.message || String(event.reason);
      if (isBenignError(msg)) {
        console.warn('[Global Guard] Suppressed benign background error:', msg);
        event.preventDefault();
      }
    }
  });
  window.addEventListener('error', (event) => {
    const msg = event.message || (event.error && event.error.message) || String(event.error);
    if (msg && isBenignError(msg)) {
      console.warn('[Global Guard] Suppressed benign background error:', msg);
      event.preventDefault();
    }
  });
}

// Global guard for Response.json() to prevent WebKit/Safari "The string did not match the expected pattern." crashes
// when the server returns HTML (e.g. during restarts, server errors, or timeouts) instead of JSON.
if (typeof window !== 'undefined' && window.Response) {
  const originalJson = Response.prototype.json;
  Response.prototype.json = async function () {
    try {
      const text = await this.text();
      try {
        return JSON.parse(text);
      } catch (parseErr) {
        console.warn("[Global Response.json Guard] Failed to parse JSON, returning error object. Response text:", text.substring(0, 150));
        return { error: text || "Invalid JSON response" };
      }
    } catch (err) {
      console.error("[Global Response.json Guard] Error reading response body:", err);
      return { error: "Failed to read response body" };
    }
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
