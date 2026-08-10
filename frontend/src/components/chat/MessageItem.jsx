import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { chatApi } from '../../api/client';
import { Check, CheckCheck, MoreVertical, Reply, Copy, Trash2, FileText, Download, AlertCircle, RefreshCw } from 'lucide-react';

const MessageItemComponent = React.memo(({ message, onReply, onCopy, onImageClick }) => {
  const { user } = useAuth();
  const { deleteMessageForMe } = useSocket();
  const [showMenu, setShowMenu] = useState(false);
  const [signedUrl, setSignedUrl] = useState(message.mediaUrl);

  const isSentByMe = message.senderId === user?.id;

  useEffect(() => {
    let isMounted = true;
    if (message.mediaUrl && (message.type === 'image' || message.type === 'file')) {
      // Skip redundant fetch if URL is blob or already signed
      if (message.mediaUrl.startsWith('blob:') || message.mediaUrl.includes('token=')) {
        setSignedUrl(message.mediaUrl);
        return;
      }

      chatApi.getSignedMediaUrl({
        conversationId: message.conversationId,
        messageId: message.id,
        mediaUrl: message.mediaUrl
      }).then(res => {
        if (isMounted && res.data?.signedUrl) {
          setSignedUrl(res.data.signedUrl);
        }
      }).catch(err => {
        console.warn('Signed URL authorization notice:', err.message);
      });
    }
    return () => { isMounted = false; };
  }, [message.id, message.mediaUrl, message.conversationId, message.type]);

  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const renderStatusTicks = () => {
    if (!isSentByMe) return null;

    if (message.status === 'seen') {
      return <span className="status-icon seen" title="Seen"><CheckCheck size={15} /></span>;
    }
    if (message.status === 'delivered') {
      return <span className="status-icon delivered" title="Delivered"><CheckCheck size={15} /></span>;
    }
    return <span className="status-icon sent" title="Sent"><Check size={15} /></span>;
  };

  const handleDownloadFile = () => {
    const urlToUse = signedUrl || message.mediaUrl;
    if (urlToUse) {
      const a = document.createElement('a');
      a.href = urlToUse;
      a.download = message.fileName || 'download';
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const activeMediaUrl = signedUrl || message.mediaUrl;

  return (
    <div
      className={`message-wrapper ${isSentByMe ? 'sent' : 'received'}`}
      onMouseLeave={() => setShowMenu(false)}
    >
      <div className="message-bubble" style={{ padding: message.type === 'image' ? '6px' : '10px 14px' }}>
        {/* Reply Reference Quote */}
        {message.replyTo && (
          <div className="reply-quote" style={{ margin: message.type === 'image' ? '4px 4px 6px' : '0 0 6px' }}>
            <div className="reply-author">{message.replyTo.senderName || 'Message'}</div>
            <div className="reply-text">{message.replyTo.text}</div>
          </div>
        )}

        {/* IMAGE MESSAGE TYPE */}
        {message.type === 'image' && (
          <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden' }}>
            {activeMediaUrl ? (
              <img
                src={activeMediaUrl}
                alt={message.fileName || 'Image'}
                onClick={() => onImageClick(activeMediaUrl, message.fileName)}
                style={{
                  width: '100%',
                  maxWidth: '280px',
                  maxHeight: '320px',
                  objectFit: 'cover',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  display: 'block'
                }}
              />
            ) : (
              <div
                style={{
                  width: '240px',
                  height: '160px',
                  background: 'rgba(255,255,255,0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)'
                }}
              >
                Uploading...
              </div>
            )}

            {/* Upload Progress Overlay */}
            {message.uploadStatus === 'uploading' && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0,0,0,0.6)',
                  backdropFilter: 'blur(2px)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  color: 'white'
                }}
              >
                <RefreshCw size={24} className="spin" />
                <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>
                  {message.uploadProgress || 0}% Uploading
                </span>
              </div>
            )}

            {/* Upload Failed Overlay */}
            {message.uploadStatus === 'failed' && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(244, 63, 94, 0.85)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  color: 'white'
                }}
              >
                <AlertCircle size={22} />
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Upload Failed</span>
              </div>
            )}
          </div>
        )}

        {/* FILE / DOCUMENT MESSAGE TYPE */}
        {message.type === 'file' && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '6px 4px',
              minWidth: '220px'
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'rgba(255,255,255,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isSentByMe ? 'white' : 'var(--primary)'
              }}
            >
              <FileText size={22} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {message.fileName || 'Document'}
              </div>
              <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                {message.uploadStatus === 'uploading'
                  ? `Uploading ${message.uploadProgress || 0}%`
                  : formatFileSize(message.fileSize)}
              </div>
            </div>

            {activeMediaUrl && message.uploadStatus !== 'uploading' && (
              <button
                className="icon-btn"
                onClick={handleDownloadFile}
                title="Download file"
                style={{ color: 'inherit' }}
              >
                <Download size={18} />
              </button>
            )}
          </div>
        )}

        {/* TEXT MESSAGE TYPE & OPTIONAL CAPTION */}
        {message.text && (
          <div style={{ marginTop: message.type ? '6px' : '0' }}>
            {message.text}
          </div>
        )}

        {/* Meta (Time & Status Tick) */}
        <div className="message-meta">
          <span>{formatTime(message.createdAt)}</span>
          {renderStatusTicks()}
        </div>

        {/* Context Action Menu */}
        <div className="message-bubble-actions">
          <button
            className="action-trigger-btn"
            onClick={() => setShowMenu(!showMenu)}
            title="Options"
          >
            <MoreVertical size={14} />
          </button>

          {showMenu && (
            <div className="context-menu-popup">
              <button
                className="context-item"
                onClick={() => {
                  onReply(message);
                  setShowMenu(false);
                }}
              >
                <Reply size={14} /> Reply
              </button>

              {message.text && (
                <button
                  className="context-item"
                  onClick={() => {
                    onCopy(message.text);
                    setShowMenu(false);
                  }}
                >
                  <Copy size={14} /> Copy
                </button>
              )}

              <button
                className="context-item danger"
                onClick={() => {
                  deleteMessageForMe(message.id);
                  setShowMenu(false);
                }}
              >
                <Trash2 size={14} /> Delete for me
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

MessageItemComponent.displayName = 'MessageItem';
export const MessageItem = MessageItemComponent;
