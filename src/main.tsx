import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Handle unhandled promise rejections
// This specifically catches Firebase's persistentMultipleTabManager message channel errors
// which are harmless and occur when tabs close during cross-tab communication
window.addEventListener('unhandledrejection', (event) => {
  const error = event.reason;
  const errorMessage = error?.message || String(error);
  
  // Suppress Firebase multi-tab persistence message channel errors
  if (
    errorMessage.includes('message channel closed') ||
    errorMessage.includes('asynchronous response') ||
    (errorMessage.includes('listener') && errorMessage.includes('response'))
  ) {
    event.preventDefault();
    // Silently ignore - this is a known Firebase issue that doesn't affect functionality
    return;
  }
  
  // Log other unhandled rejections for debugging
  console.error('Unhandled promise rejection:', error);
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);


