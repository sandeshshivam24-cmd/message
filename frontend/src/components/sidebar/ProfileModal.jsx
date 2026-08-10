import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../common/Avatar';
import { X, User, MessageSquare, Image, LogOut, Check } from 'lucide-react';

export const ProfileModal = ({ isOpen, onClose }) => {
  const { user, updateProfile, logout } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [statusMessage, setStatusMessage] = useState(user?.statusMessage || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      await updateProfile({ displayName, statusMessage, avatarUrl });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3 className="modal-title">Your Profile</h3>
          <button className="icon-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
          <Avatar name={user.displayName || user.username} avatarUrl={avatarUrl || user.avatarUrl} size={72} />
          <h4 style={{ marginTop: '12px', fontSize: '1.1rem', fontWeight: 700 }}>
            {user.displayName || user.username}
          </h4>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>@{user.username}</span>
        </div>

        {success && (
          <div
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#34d399',
              fontSize: '0.82rem',
              marginBottom: '16px',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Check size={16} /> Profile updated successfully!
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block', fontWeight: 600 }}>
              Display Name
            </label>
            <div className="search-input-wrapper">
              <User size={18} />
              <input
                type="text"
                className="search-input"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block', fontWeight: 600 }}>
              Status Message
            </label>
            <div className="search-input-wrapper">
              <MessageSquare size={18} />
              <input
                type="text"
                className="search-input"
                value={statusMessage}
                onChange={(e) => setStatusMessage(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block', fontWeight: 600 }}>
              Avatar Image URL (Optional)
            </label>
            <div className="search-input-wrapper">
              <Image size={18} />
              <input
                type="text"
                className="search-input"
                placeholder="https://..."
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '12px',
                background: 'var(--bubble-sent)',
                color: 'white',
                fontWeight: 600,
                fontSize: '0.9rem'
              }}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>

            <button
              type="button"
              onClick={logout}
              style={{
                padding: '10px 16px',
                borderRadius: '12px',
                background: 'rgba(244, 63, 94, 0.15)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                color: '#fb7185',
                fontWeight: 600,
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
