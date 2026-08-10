import React, { useState, useEffect } from 'react';
import { privacyApi } from '../../api/client';
import { Avatar } from '../common/Avatar';
import { X, Bell, Shield, UserX, Volume2, VolumeX, Eye } from 'lucide-react';

export const SettingsModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('notifications'); // 'notifications' | 'privacy' | 'blocked'
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    return localStorage.getItem('messenger_notifications') !== 'false';
  });
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('messenger_sound') !== 'false';
  });
  const [readReceipts, setReadReceipts] = useState(true);

  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loadingBlocked, setLoadingBlocked] = useState(false);

  useEffect(() => {
    if (isOpen && activeTab === 'blocked') {
      fetchBlockedUsers();
    }
  }, [isOpen, activeTab]);

  const fetchBlockedUsers = async () => {
    setLoadingBlocked(true);
    try {
      const res = await privacyApi.getBlockedUsers();
      setBlockedUsers(res.data);
    } catch (err) {
      console.error('Failed to load blocked users:', err);
    } finally {
      setLoadingBlocked(false);
    }
  };

  const handleUnblock = async (userId) => {
    try {
      await privacyApi.unblockUser(userId);
      setBlockedUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      console.error('Unblock failed:', err);
    }
  };

  const toggleNotifications = () => {
    const next = !notificationsEnabled;
    setNotificationsEnabled(next);
    localStorage.setItem('messenger_notifications', next.toString());
    if (next && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem('messenger_sound', next.toString());
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '480px', padding: '24px' }}>
        <div className="modal-header" style={{ marginBottom: '16px' }}>
          <h3 className="modal-title">Settings & Privacy</h3>
          <button className="icon-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Tab Selection */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', marginBottom: '20px', paddingBottom: '8px' }}>
          <button
            onClick={() => setActiveTab('notifications')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '0.88rem',
              fontWeight: 600,
              background: activeTab === 'notifications' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
              color: activeTab === 'notifications' ? 'var(--primary)' : 'var(--text-muted)'
            }}
          >
            Notifications
          </button>

          <button
            onClick={() => setActiveTab('privacy')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '0.88rem',
              fontWeight: 600,
              background: activeTab === 'privacy' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
              color: activeTab === 'privacy' ? 'var(--primary)' : 'var(--text-muted)'
            }}
          >
            Privacy
          </button>

          <button
            onClick={() => setActiveTab('blocked')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '0.88rem',
              fontWeight: 600,
              background: activeTab === 'blocked' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
              color: activeTab === 'blocked' ? 'var(--primary)' : 'var(--text-muted)'
            }}
          >
            Blocked Users
          </button>
        </div>

        {/* NOTIFICATIONS TAB */}
        {activeTab === 'notifications' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Bell size={20} color="var(--primary)" />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Desktop Notifications</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Show popups for new messages & calls</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={toggleNotifications}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {soundEnabled ? <Volume2 size={20} color="var(--primary)" /> : <VolumeX size={20} color="var(--text-muted)" />}
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Sound Effects</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Play chime for messages & ringtone for calls</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={toggleSound}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
            </div>
          </div>
        )}

        {/* PRIVACY TAB */}
        {activeTab === 'privacy' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Eye size={20} color="var(--primary)" />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Read Receipts (Blue Ticks)</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Show double ticks when messages are read</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={readReceipts}
                onChange={(e) => setReadReceipts(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
            </div>
          </div>
        )}

        {/* BLOCKED USERS TAB */}
        {activeTab === 'blocked' && (
          <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {loadingBlocked ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>Loading...</div>
            ) : blockedUsers.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px', fontSize: '0.88rem' }}>
                You have not blocked any users.
              </div>
            ) : (
              blockedUsers.map((u) => (
                <div
                  key={u.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.03)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Avatar name={u.displayName || u.username} avatarUrl={u.avatarUrl} size={36} />
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{u.displayName || u.username}</span>
                  </div>

                  <button
                    onClick={() => handleUnblock(u.id)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      background: 'rgba(99, 102, 241, 0.2)',
                      color: 'var(--primary)',
                      fontSize: '0.8rem',
                      fontWeight: 600
                    }}
                  >
                    Unblock
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
