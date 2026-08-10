import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../common/Avatar';
import { ConversationList } from './ConversationList';
import { UserSearchModal } from './UserSearchModal';
import { ProfileModal } from './ProfileModal';
import { SettingsModal } from './SettingsModal';
import { MessageSquare, Plus, Search, Settings, Shield } from 'lucide-react';

export const Sidebar = ({ isMobileHidden }) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  return (
    <>
      <aside className={`sidebar ${isMobileHidden ? 'hidden-mobile' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-header">
          <div className="brand">
            <div className="brand-icon">
              <MessageSquare size={20} />
            </div>
            <span className="brand-title">Messenger</span>
          </div>

          <div className="header-actions">
            <button
              className="icon-btn"
              title="New Chat"
              onClick={() => setIsSearchModalOpen(true)}
            >
              <Plus size={20} />
            </button>

            <button
              className="icon-btn"
              title="Settings & Privacy"
              onClick={() => setIsSettingsModalOpen(true)}
            >
              <Shield size={20} />
            </button>

            <button
              className="icon-btn"
              title="Profile"
              onClick={() => setIsProfileModalOpen(true)}
            >
              <Settings size={20} />
            </button>
          </div>
        </div>

        {/* Current User Card */}
        {user && (
          <div
            className="current-user-card"
            onClick={() => setIsProfileModalOpen(true)}
            style={{ cursor: 'pointer' }}
          >
            <Avatar
              name={user.displayName || user.username}
              avatarUrl={user.avatarUrl}
              isOnline={true}
              size={38}
            />
            <div className="user-info">
              <div className="user-name">{user.displayName || user.username}</div>
              <div className="user-status-text">{user.statusMessage || 'Available'}</div>
            </div>
          </div>
        )}

        {/* Filter Input */}
        <div className="sidebar-search">
          <div className="search-input-wrapper">
            <Search size={16} />
            <input
              type="text"
              className="search-input"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Conversation List */}
        <ConversationList filterQuery={searchQuery} />
      </aside>

      <UserSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
      />

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </>
  );
};
