import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { initMobileAdapter } from './services/mobileAdapter';

// Initialize Mobile / Web Adapter if not running in Electron
initMobileAdapter();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
