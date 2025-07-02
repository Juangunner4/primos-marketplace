import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './i18n';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find root element');

const root = ReactDOM.createRoot(rootElement);
root.render(
    <React.StrictMode>
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <App />
        </ThemeProvider>
    </React.StrictMode>
);

// WalletLogin component is provided in App/Header for login UI
