import React from 'react';
import './Loading.css';

function Loading() {
  return (
    <div className="loading-wrapper">
      <div className="spinner"></div>
      <div className="loading-text">Loading Data...</div>
    </div>
  );
}

export default Loading;
