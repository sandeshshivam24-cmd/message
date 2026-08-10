import React from 'react';

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
  'linear-gradient(135deg, #3b82f6 0%, #2dd4bf 100%)',
  'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
  'linear-gradient(135deg, #f97316 0%, #eab308 100%)',
  'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)'
];

export const Avatar = ({ name, avatarUrl, isOnline, size = 42 }) => {
  const getInitials = (str) => {
    if (!str) return 'U';
    const parts = str.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return str.substring(0, 2).toUpperCase();
  };

  const getGradientIndex = (str) => {
    if (!str) return 0;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % AVATAR_GRADIENTS.length;
  };

  const bgGradient = AVATAR_GRADIENTS[getGradientIndex(name)];

  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        position: 'relative',
        flexShrink: 0
      }}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            objectFit: 'cover'
          }}
        />
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            background: bgGradient,
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '700',
            fontSize: `${size * 0.4}px`,
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
          }}
        >
          {getInitials(name)}
        </div>
      )}

      {isOnline !== undefined && (
        <span
          style={{
            position: 'absolute',
            bottom: '2px',
            right: '2px',
            width: `${Math.max(10, size * 0.26)}px`,
            height: `${Math.max(10, size * 0.26)}px`,
            borderRadius: '50%',
            backgroundColor: isOnline ? '#10b981' : '#64748b',
            border: '2px solid #121826',
            boxShadow: isOnline ? '0 0 8px #10b981' : 'none'
          }}
        />
      )}
    </div>
  );
};
