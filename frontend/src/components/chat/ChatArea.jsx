import React, { useState } from 'react';
import { useSocket } from '../../context/SocketContext';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { ImageViewerModal } from './ImageViewerModal';
import { Toast } from '../common/Toast';
import { MessageSquare, Search, X } from 'lucide-react';

export const ChatArea = ({ isMobileHidden, onBackMobile }) => {
  const { activeConversation, messages } = useSocket();
  const [replyToMessage, setReplyToMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Image Lightbox Viewer state
  const [activeImage, setActiveImage] = useState(null); // { url, fileName }

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  const handleCopyText = (text) => {
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard!');
  };

  const handleImageClick = (url, fileName) => {
    setActiveImage({ url, fileName });
  };

  if (!activeConversation) {
    return (
      <main className={`chat-main ${isMobileHidden ? 'hidden-mobile' : ''}`}>
        <div className="empty-chat-state">
          <div className="empty-icon">
            <MessageSquare size={36} />
          </div>
          <h2 style={{ fontFamily: 'Outfit', fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Select a conversation
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '6px', maxWidth: '300px' }}>
            Choose a contact from the sidebar or click the + button to search and start a new chat.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className={`chat-main ${isMobileHidden ? 'hidden-mobile' : ''}`}>
      <ChatHeader
        onBack={onBackMobile}
        onToggleSearch={() => setIsSearchOpen(!isSearchOpen)}
      />

      {/* Message Search Bar Overlay */}
      {isSearchOpen && (
        <div
          style={{
            padding: '10px 24px',
            background: 'var(--bg-card-solid)',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <div className="search-input-wrapper" style={{ flex: 1 }}>
            <Search size={16} />
            <input
              type="text"
              className="search-input"
              placeholder="Search in this conversation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>
          <button className="icon-btn" onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}>
            <X size={18} />
          </button>
        </div>
      )}

      {/* Message List */}
      <MessageList
        messages={messages}
        searchQuery={searchQuery}
        onReply={(msg) => setReplyToMessage(msg)}
        onCopy={handleCopyText}
        onImageClick={handleImageClick}
      />

      {/* Message Input */}
      <MessageInput
        replyToMessage={replyToMessage}
        onCancelReply={() => setReplyToMessage(null)}
      />

      {/* Full Screen Image Lightbox */}
      {activeImage && (
        <ImageViewerModal
          imageUrl={activeImage.url}
          fileName={activeImage.fileName}
          onClose={() => setActiveImage(null)}
        />
      )}

      <Toast message={toastMessage} />
    </main>
  );
};
