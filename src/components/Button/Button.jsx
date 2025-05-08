import React from 'react';
import './Button.css';

const RoundedBlackButton = ({ children, onClick }) => {
  return (
    <button className="rounded-black-button" onClick={onClick}>
      {children}
    </button>
  );
};

export default RoundedBlackButton;
