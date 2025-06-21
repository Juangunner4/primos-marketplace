import React from 'react';
import './LoadingOverlay.css';

interface LoadingOverlayProps {
  message?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message }) => (
  <div className="loading-overlay">
    <div className="spinner" />
    {message && <span>{message}</span>}
  </div>
);

export default LoadingOverlay;
