import React, { useEffect, useRef } from 'react';
import { MessageItem } from './MessageItem';

export const MessageList = ({ messages, searchQuery = '', onReply, onCopy, onImageClick }) => {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const filteredMessages = messages.filter((m) => {
    if (!searchQuery.trim()) return true;
    return m.text && m.text.toLowerCase().includes(searchQuery.toLowerCase().trim());
  });

  const getDateLabel = (isoString) => {
    const date = new Date(isoString);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return 'Today';
    }
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  };

  // Group messages by date
  let lastDateLabel = null;

  return (
    <div className="messages-container">
      {filteredMessages.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: 'auto', marginBottom: 'auto', fontSize: '0.88rem' }}>
          {searchQuery ? `No messages found matching "${searchQuery}"` : 'No messages yet. Send a message to start chatting!'}
        </div>
      ) : (
        filteredMessages.map((msg) => {
          const dateLabel = getDateLabel(msg.createdAt);
          const showDivider = dateLabel !== lastDateLabel;
          if (showDivider) lastDateLabel = dateLabel;

          return (
            <React.Fragment key={msg.id || msg.tempId}>
              {showDivider && (
                <div className="date-divider">
                  {dateLabel}
                </div>
              )}
              <MessageItem message={msg} onReply={onReply} onCopy={onCopy} onImageClick={onImageClick} />
            </React.Fragment>
          );
        })
      )}
      <div ref={bottomRef} />
    </div>
  );
};
