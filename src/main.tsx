import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Register service worker for offline caching
if ('serviceWorker' in navigator && !localStorage.getItem('disableServiceWorker')) {
  window.addEventListener('load', () => {
    // Check if there's an existing service worker that might be causing issues
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      // Unregister any existing service workers to start fresh
      registrations.forEach((registration) => {
        registration.unregister();
        console.log('🗑️ Unregistered existing service worker');
      });
      
      // Register new service worker
      return navigator.serviceWorker.register('/sw.js');
    }).then((registration) => {
      console.log('✅ Service Worker registered successfully:', registration.scope);
      
      // Handle service worker updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('🔄 New service worker available');
            }
          });
        }
      });
      
      // Handle service worker errors
      registration.addEventListener('error', (error) => {
        console.error('Service worker error:', error);
        // Unregister if there are persistent errors
        registration.unregister();
        // Optionally disable service worker for this session
        localStorage.setItem('disableServiceWorker', 'true');
      });
    }).catch((error) => {
      console.log('❌ Service Worker registration failed:', error);
      // Don't let service worker errors break the app
      // Optionally disable service worker for this session
      localStorage.setItem('disableServiceWorker', 'true');
    });
  });
} else if (localStorage.getItem('disableServiceWorker')) {
  console.log('🚫 Service Worker disabled by user preference');
}

createRoot(document.getElementById("root")!).render(<App />);
