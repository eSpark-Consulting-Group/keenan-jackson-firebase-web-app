import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';
import App from './app.js';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/authcontext';
import { Toaster } from 'react-hot-toast';

// Create root element
const root = ReactDOM.createRoot(document.getElementById('root'));

// Render app with providers
root.render(
  <React.StrictMode>
    {/* <BrowserRouter> */}
      {/* <AuthProvider> */}
        <App />
        {/* <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              style: {
                background: '#10b981',
              },
            },
            error: {
              style: {
                background: '#ef4444',
              },
            },
          }}
        /> */}
      {/* </AuthProvider> */}
    {/* </BrowserRouter> */}
  </React.StrictMode>
);