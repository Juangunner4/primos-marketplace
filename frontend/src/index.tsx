import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import '@solana/wallet-adapter-react-ui/styles.css';
import './i18n';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme';
import { Theme as RadixTheme } from '@radix-ui/themes';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find root element');

const root = ReactDOM.createRoot(rootElement);
root.render(
    <React.StrictMode>
        <RadixTheme appearance="light" accentColor="gray">
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <App />
            </ThemeProvider>
        </RadixTheme>
    </React.StrictMode>
);
