import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
      }

      return <DefaultErrorFallback error={this.state.error} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

const DefaultErrorFallback: React.FC<{ error?: Error; resetError: () => void }> = ({ 
  error, 
  resetError 
}) => {
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        padding: 3,
        textAlign: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 1,
        border: '1px solid #ddd',
        margin: 2,
      }}
    >
      <Typography variant="h5" sx={{ mb: 2, color: '#d32f2f' }}>
        {t('something_went_wrong') || 'Something went wrong'}
      </Typography>
      
      <Typography variant="body1" sx={{ mb: 2, color: '#666' }}>
        {t('error_occurred') || 'An error occurred while loading this page. Please try again.'}
      </Typography>

      {error && (
        <Typography 
          variant="body2" 
          sx={{ 
            mb: 3, 
            color: '#999', 
            fontFamily: 'monospace',
            backgroundColor: '#f0f0f0',
            padding: 1,
            borderRadius: 1,
            maxWidth: '100%',
            overflow: 'auto',
            fontSize: '0.875rem'
          }}
        >
          {error.message}
        </Typography>
      )}

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          onClick={resetError}
          sx={{
            backgroundColor: '#000',
            color: '#fff',
            '&:hover': { backgroundColor: '#333' },
          }}
        >
          {t('try_again') || 'Try Again'}
        </Button>

        <Button
          variant="outlined"
          onClick={() => window.location.reload()}
          sx={{
            borderColor: '#000',
            color: '#000',
            '&:hover': { borderColor: '#333', color: '#333' },
          }}
        >
          {t('reload_page') || 'Reload Page'}
        </Button>
      </Box>
    </Box>
  );
};

export default ErrorBoundary;
