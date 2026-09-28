import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { installDevMock } from '../dev-mock';
import { App } from './App';
import './bubble.css';

installDevMock();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
