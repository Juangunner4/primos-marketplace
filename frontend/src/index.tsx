import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { PrivyProvider } from '@privy-io/react-auth';
import './i18n';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find root element');

const privyAppId = process.env.REACT_APP_PRIVY_APP_ID;
if (!privyAppId) {
    console.error('REACT_APP_PRIVY_APP_ID environment variable is not set');
    // Render an error message instead of crashing
    const root = ReactDOM.createRoot(rootElement);
    root.render(
        <div style={{ 
            padding: '20px', 
            textAlign: 'center', 
            fontFamily: 'Arial, sans-serif',
            color: '#333'
        }}>
            <h1>Configuration Error</h1>
            <p>The application is missing required configuration. Please contact support.</p>
        </div>
    );
} else {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
        <React.StrictMode>
            <PrivyProvider appId={privyAppId}>
                <ThemeProvider theme={theme}>
                    <CssBaseline />
                    <App />
                </ThemeProvider>
            </PrivyProvider>
        </React.StrictMode>
    );
}
