import React from 'react';
import './Loading.css';
import { useSelector } from 'react-redux';

function Loading() {
  const t = useSelector((state) => state.language);
  console.log('t', t);

  return (
    <div className="loading-wrapper">
      <div className="spinner"></div>
      <div className="loading-text">{t === 'en' ? 'Loading Data...' : '読み込み中'}</div>
    </div>
  );
}

export default Loading;
