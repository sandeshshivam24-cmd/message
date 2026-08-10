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
                <span className="conv-name">{recipient?.displayName || recipient?.username}</span>
                {lastMsg && <span className="conv-time">{formatTime(lastMsg.createdAt)}</span>}
              </div>

              <div className="conv-bottom-row">
                {isTyping ? (
                  <span className="conv-last-msg typing-text">typing...</span>
                ) : (
                  <span className="conv-last-msg">
                    {lastMsg ? lastMsg.text : 'No messages yet'}
                  </span>
                )}

                {conv.unreadCount > 0 && (
                  <span className="unread-badge">{conv.unreadCount}</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
