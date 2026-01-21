import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ContextProvider } from './SocketContext';
import './index.css';

// Fix for video library in React 18
import process from 'process';
window.global = window;
window.process = process;
window.Buffer = [];

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
    <ContextProvider>
        <App />
    </ContextProvider>
);