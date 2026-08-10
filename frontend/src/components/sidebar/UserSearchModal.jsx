import React, { useState, useEffect } from 'react';
import { userApi } from '../../api/client';
import { useSocket } from '../../context/SocketContext';
import { Avatar } from '../common/Avatar';
import { Search, X, MessageSquarePlus } from 'lucide-react';

export const UserSearchModal = ({ isOpen, onClose }) => {
  const { startConversationWithUser, onlineUserIds } = useSocket();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const res = await userApi.searchUsers(query);
        setResults(res.data);
      } catch (err) {
        console.error('Error searching users:', err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchUsers, 200);
    return () => clearTimeout(timer);
  }, [query, isOpen]);

  if (!isOpen) return null;

  const handleSelectUser = async (user) => {
    await startConversationWithUser(user);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquarePlus size={20} color="var(--primary)" />
            <h3 className="modal-title">New Conversation</h3>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="search-input-wrapper" style={{ marginBottom: '16px' }}>
          <Search size={18} />
          <input
            type="text"
            className="search-input"
            placeholder="Search by name or username..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </div>

        <div style={{ maxHeight: '320px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {loading ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Searching...
            </div>
          ) : results.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              No users found matching "{query}"
            </div>
          ) : (
            results.map((u) => {
              const isOnline = onlineUserIds.has(u.id);
              return (
                <div
                  key={u.id}
                  onClick={() => handleSelectUser(u)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease',
                    background: 'rgba(255, 255, 255, 0.03)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'}
                >
                  <Avatar name={u.displayName || u.username} avatarUrl={u.avatarUrl} isOnline={isOnline} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>
                      {u.displayName || u.username}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      @{u.username} • {u.statusMessage || 'Available'}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
