import './polyfills'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { MeshProvider } from '@meshsdk/react'
import { App } from './App'

import './index.css'
import './i18n/config'

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('SW registrado: ', registration);
    }).catch(registrationError => {
      console.log('Fallo el registro de SW: ', registrationError);
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MeshProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </MeshProvider>
  </StrictMode>,
)
