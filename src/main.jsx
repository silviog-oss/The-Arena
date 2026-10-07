import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { GameProvider } from './state/GameContext.jsx';
import { requestPersistence } from './lib/storage.js';
import './styles/base.css';
import './styles/components.css';
import './styles/screens.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GameProvider>
      <App />
    </GameProvider>
  </React.StrictMode>,
);

requestPersistence();

// Register the service worker (production builds only, so dev hot-reload stays simple).
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', { scope: './' }).catch((err) => console.warn('SW failed', err));
  });
}
