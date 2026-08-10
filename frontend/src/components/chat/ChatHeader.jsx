import React, { useState } from 'react';
import { useSocket } from '../../context/SocketContext';
import { useCall } from '../../context/CallContext';
import { privacyApi } from '../../api/client';
import { Avatar } from '../common/Avatar';
import { ArrowLeft, Search, Phone, Video, MoreVertical, ShieldAlert, UserX } from 'lucide-react';
import { ReportModal } from '../sidebar/ReportModal';

export const ChatHeader = ({ onBack, onToggleSearch }) => {
  const { activeConversation, onlineUserIds, typingUsers, selectConversation, fetchConversations } = useSocket();
  const { startCall, callState } = useCall();

  const [showOptions, setShowOptions] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  if (!activeConversation) return null;

  const recipient = activeConversation.recipient;
  const isOnline = recipient ? onlineUserIds.has(recipient.id) : false;
  const isTyping = typingUsers[activeConversation.id] === recipient?.id;

  const formatLastSeen = (isoString) => {
    if (!isoString) return 'Offline';
    const date = new Date(isoString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return `Last seen today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return `Last seen ${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
  };

  const handleBlockUser = async () => {
    if (!recipient) return;
    if (window.confirm(`Are you sure you want to block ${recipient.displayName || recipient.username}?`)) {
      try {
        await privacyApi.blockUser(recipient.id);
        alert('User blocked');
        setShowOptions(false);
        selectConversation(null);
        fetchConversations();
      } catch (err) {
        alert('Failed to block user: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  return (
    <>
      <div className="chat-header" onMouseLeave={() => setShowOptions(false)}>
        <div className="chat-header-user">
          <button className="icon-btn back-btn" onClick={onBack} title="Back to chats">
            <ArrowLeft size={20} />
          </button>

          <Avatar
            name={recipient?.displayName || recipient?.username}
            avatarUrl={recipient?.avatarUrl}
            isOnline={isOnline}
            size={42}
          />

          <div>
            <div className="chat-user-name">
              {recipient?.displayName || recipient?.username}
            </div>
            <div className="chat-user-status">
              <span className={`status-dot ${isOnline ? 'online' : ''}`} />
              {isTyping ? (
                <span style={{ color: 'var(--primary)', fontWeight: 600 }}>typing...</span>
              ) : isOnline ? (
                <span>Online</span>
              ) : (
                <span>{formatLastSeen(recipient?.lastSeen)}</span>
              )}
            </div>
          </div>
        </div>

        {/* Header Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
          <button
            className="icon-btn"
            onClick={() => startCall(recipient, 'audio')}
            disabled={callState !== 'idle'}
            title="Audio Call"
            style={{ opacity: callState !== 'idle' ? 0.5 : 1 }}
          >
            <Phone size={18} />
          </button>

          <button
            className="icon-btn"
            onClick={() => startCall(recipient, 'video')}
            disabled={callState !== 'idle'}
            title="Video Call"
            style={{ opacity: callState !== 'idle' ? 0.5 : 1 }}
          >
            <Video size={18} />
          </button>

          <button className="icon-btn" onClick={onToggleSearch} title="Search Messages">
            <Search size={18} />
          </button>

          <button className="icon-btn" onClick={() => setShowOptions(!showOptions)} title="More Options">
            <MoreVertical size={18} />
          </button>

          {showOptions && (
            <div className="context-menu-popup" style={{ top: '100%', right: 0 }}>
              <button
                className="context-item danger"
                onClick={handleBlockUser}
              >
                <UserX size={15} /> Block Contact
              </button>

              <button
                className="context-item"
                onClick={() => {
                  setIsReportModalOpen(true);
                  setShowOptions(false);
                }}
              >
                <ShieldAlert size={15} /> Report Contact
              </button>
            </div>
          )}
        </div>
      </div>

      <ReportModal
        targetUser={recipient}
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />
    </>
  );
};
