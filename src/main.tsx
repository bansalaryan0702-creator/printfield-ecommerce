import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {Analytics} from '@vercel/analytics/react';
import {SpeedInsights} from '@vercel/speed-insights/react';
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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Analytics />
    <SpeedInsights />
  </StrictMode>,
);
