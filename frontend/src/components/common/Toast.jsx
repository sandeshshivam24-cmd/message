import React from 'react';

export const Toast = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        background: 'rgba(30, 41, 59, 0.95)',
        color: '#f8fafc',
        padding: '12px 20px',
        borderRadius: '12px',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
        zIndex: 2000,
        fontSize: '0.88rem',
        fontWeight: '500',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        animation: 'fadeIn 0.2s ease'
      }}
    >
      <span>{message}</span>
    </div>
  );
};
