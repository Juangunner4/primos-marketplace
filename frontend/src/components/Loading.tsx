import React from 'react';
import './Loading.css';

interface LoadingProps {
  message?: string;
}

const Loading: React.FC<LoadingProps> = ({ message }) => (
  <div className="loading-wrapper">
    <div className="spinner" />
    {message && <span>{message}</span>}
  </div>
);

export default Loading;
