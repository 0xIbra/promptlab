import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
import { LoadingProvider } from './context/LoadingContext';

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
    <LoadingProvider>
        <App />
    </LoadingProvider>
);
