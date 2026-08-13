import React from 'react';
import { useSocket } from '../../context/SocketContext';
import { Avatar } from '../common/Avatar';

export const ConversationList = ({ filterQuery = '' }) => {
  const { conversations, activeConversation, selectConversation, typingUsers, onlineUserIds } = useSocket();

  const filtered = conversations.filter((c) => {
    if (!c.recipient) return false;
    const name = (c.recipient.displayName || c.recipient.username).toLowerCase();
    return name.includes(filterQuery.toLowerCase());
  });

  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  if (filtered.length === 0) {
    return (
      <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        {filterQuery ? 'No matching conversations' : 'No conversations yet. Start one by clicking + above!'}
      </div>
    );
  }

  return (
    <div className="conversation-list">
      {filtered.map((conv) => {
        const isActive = activeConversation?.id === conv.id;
        const recipient = conv.recipient;
        const isOnline = recipient ? onlineUserIds.has(recipient.id) : false;
        const typingUserId = typingUsers[conv.id];
        const isTyping = typingUserId && typingUserId === recipient?.id;
        const lastMsg = conv.lastMessage;
        const hasUnread = conv.unreadCount > 0 && !isActive;

        return (
          <div
            key={conv.id}
            className={`conversation-item ${isActive ? 'active' : ''}`}
            onClick={() => selectConversation(conv)}
          >
            <Avatar
              name={recipient?.displayName || recipient?.username}
              avatarUrl={recipient?.avatarUrl}
              isOnline={isOnline}
              size={46}
            />

            <div className="conversation-details">
              <div className="conv-top-row">
                <span className={`conv-name ${hasUnread ? 'unread-name' : ''}`} style={{ fontWeight: hasUnread ? 700 : 600 }}>
                  {recipient?.displayName || recipient?.username}
                </span>
                {lastMsg && (
                  <span className="conv-time" style={{ color: hasUnread ? '#10b981' : 'var(--text-dim)', fontWeight: hasUnread ? 700 : 400 }}>
                    {formatTime(lastMsg.createdAt)}
                  </span>
                )}
              </div>

              <div className="conv-bottom-row">
                {isTyping ? (
                  <span className="conv-last-msg typing-text">typing...</span>
                ) : (
                  <span className="conv-last-msg" style={{ color: hasUnread ? 'white' : 'var(--text-muted)', fontWeight: hasUnread ? 600 : 400 }}>
                    {lastMsg ? lastMsg.text : 'No messages yet'}
                  </span>
                )}

                {hasUnread && (
                  <span
                    className="unread-badge"
                    style={{
                      background: '#10b981',
                      color: 'white',
                      fontWeight: 700,
                      boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)'
                    }}
                    title={`${conv.unreadCount} unread message(s)`}
                  >
                    {conv.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
