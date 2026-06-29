// Safeguard against third-party libraries trying to write to window.fetch
// in sandboxed iframe environments where it is a read-only getter.
try {
  if (typeof window !== 'undefined') {
    // 1. Bypass formdata-polyfill which reassigns global.fetch if FormData.prototype.keys is missing
    if (typeof (window as any).FormData === 'undefined') {
      (window as any).FormData = class FormData {};
    }
    if (!(window as any).FormData.prototype.keys) {
      (window as any).FormData.prototype.keys = function* () {};
    }
  }
} catch (e) {
  console.warn("Bypass formdata-polyfill setup failed", e);
}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
