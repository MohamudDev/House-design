import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import axios from 'axios'

const backendUrl = import.meta.env.VITE_API_URL || 'https://housedesignbackend-production.up.railway.app';
axios.defaults.baseURL = backendUrl;

// Global interceptor to fix relative upload paths from backend
axios.interceptors.response.use((response) => {
  const fixUrls = (obj) => {
    if (!obj) return;
    if (Array.isArray(obj)) {
      obj.forEach(item => fixUrls(item));
    } else if (typeof obj === 'object') {
      if (obj.images && Array.isArray(obj.images)) {
        obj.images = obj.images.map(img => img.startsWith('/uploads') ? backendUrl + img : img);
      }
      if (typeof obj.model3D === 'string' && obj.model3D.startsWith('/uploads')) {
        obj.model3D = backendUrl + obj.model3D;
      }
      Object.values(obj).forEach(val => fixUrls(val));
    }
  };
  fixUrls(response.data);
  return response;
}, (error) => {
  return Promise.reject(error);
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
