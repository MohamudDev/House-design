import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import axios from 'axios'
import { registerSW } from 'virtual:pwa-register'
import { getApiBaseUrl } from './utils/apiBase'

// PWA build stamp — bump to force installed apps to fetch a new service worker.
const PWA_BUILD = '20260805-cf';

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    updateSW(true).then(() => {
      window.location.reload();
    });
  },
  onOfflineReady() {
    console.log('PWA app ready to work offline');
  },
  onRegisteredSW(_swUrl, registration) {
    console.info('PWA build', PWA_BUILD);
    registration?.update();
    setInterval(() => registration?.update(), 60 * 1000);
  }
})

const backendUrl = getApiBaseUrl();
axios.defaults.baseURL = backendUrl;

const UPLOAD_KEYS = new Set([
  'images', 'model3D', 'plan2D', 'image', 'attachmentUrl', 'attachment',
  'fileUrl', 'nationalIdUrl', 'certificateUrl', 'selfieUrl', 'profileImage', 'url'
]);

function absolutizeUploadUrl(value) {
  if (typeof value !== 'string' || !value.startsWith('/uploads')) return value;
  if (!backendUrl) return value;
  return backendUrl + value;
}

// Global interceptor to fix relative upload paths from backend
axios.interceptors.response.use((response) => {
  const fixUrls = (obj) => {
    if (!obj) return;
    if (Array.isArray(obj)) {
      obj.forEach((item) => fixUrls(item));
      return;
    }
    if (typeof obj !== 'object') return;

    for (const [key, val] of Object.entries(obj)) {
      if (UPLOAD_KEYS.has(key)) {
        if (typeof val === 'string') {
          obj[key] = absolutizeUploadUrl(val);
        } else if (Array.isArray(val)) {
          obj[key] = val.map((item) => {
            if (typeof item === 'string') return absolutizeUploadUrl(item);
            fixUrls(item);
            return item;
          });
        }
      } else if (val && typeof val === 'object') {
        fixUrls(val);
      }
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
