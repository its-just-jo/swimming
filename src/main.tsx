/**
 * Einstiegspunkt. Der eigentliche Aufbau der Oberflaeche ist Arbeitspaket 12
 * bis 16 (siehe UMSETZUNG.md) — hier steht nur die Montage.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './ui/App';
import './ui/stil.css';

const wurzel = document.getElementById('root');
if (!wurzel) throw new Error('Wurzelelement #root fehlt');

createRoot(wurzel).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
