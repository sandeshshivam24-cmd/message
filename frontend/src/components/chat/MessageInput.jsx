import React, { useState, useRef } from 'react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { chatApi } from '../../api/client';
import { Send, X, Image as ImageIcon, Paperclip } from 'lucide-react';

export const MessageInput = ({ replyToMessage, onCancelReply }) => {
  const { sendMessage, setMessages, activeConversation, startTyping, stopTyping } = useSocket();
  const { user } = useAuth();

  const [text, setText] = useState('');
  const typingTimerRef = useRef(null);

  const imageInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleInputChange = (e) => {
    setText(e.target.value);

    // Trigger typing event with 2s debounce
    startTyping();
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      stopTyping();
    }, 2000);
  };

  const handleSendText = (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    const replyData = replyToMessage ? {
      id: replyToMessage.id,
      senderName: replyToMessage.senderId === user.id ? 'You' : 'Contact',
      text: replyToMessage.text
    } : null;

    sendMessage({ text: text.trim(), replyTo: replyData, type: 'text' });
    setText('');
    if (onCancelReply) onCancelReply();
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    stopTyping();
  };

  const handleFileUpload = async (e, forcedType = null) => {
    const file = e.target.files?.[0];
    if (!file || !activeConversation) return;

    // Reset input value so same file can be selected again
    e.target.value = '';

    const mime = file.type.toLowerCase();
    let type = forcedType;
    if (!type) {
      if (mime.startsWith('image/')) type = 'image';
      else if (mime.startsWith('video/')) type = 'video';
      else if (mime.startsWith('audio/')) type = 'audio';
      else type = 'file';
    }

    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const previewUrl = (type === 'image' || type === 'video' || type === 'audio') ? URL.createObjectURL(file) : null;

    // 1. Immediate optimistic message insertion into sender chat
    const optimisticMessage = {
      id: tempId,
      tempId,
      conversationId: activeConversation.id,
      senderId: user.id,
      recipientId: activeConversation.recipient.id,
      text: '',
      type,
      mediaUrl: previewUrl,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      uploadStatus: 'uploading', // 'uploading' | 'sent' | 'failed'
      uploadProgress: 0,
      status: 'sent',
      createdAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, optimisticMessage]);

    // 2. Upload file via REST with progress callback
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await chatApi.uploadFile(formData, (progress) => {
        setMessages(prev =>
          prev.map(m => m.tempId === tempId ? { ...m, uploadProgress: progress } : m)
        );
      });

      const uploadedMedia = res.data;

      // 3. Reconcile and emit socket message with server media URL
      sendMessage({
        tempId,
        type,
        mediaUrl: uploadedMedia.url,
        fileName: uploadedMedia.originalName,
        fileSize: uploadedMedia.size,
        fileType: uploadedMedia.mimeType,
        text: ''
      });
    } catch (err) {
      console.error('File upload failed:', err);
      setMessages(prev =>
        prev.map(m => m.tempId === tempId ? { ...m, uploadStatus: 'failed' } : m)
      );
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendText(e);
    }
  };

  return (
    <div className="chat-composer-wrapper">
      {/* Reply Banner */}
      {replyToMessage && (
        <div className="reply-preview-bar">
          <div className="reply-preview-content">
            <div className="reply-preview-author">Replying to message</div>
            <div className="reply-preview-text">{replyToMessage.text}</div>
          </div>
          <button className="icon-btn" onClick={onCancelReply} style={{ width: '28px', height: '28px' }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={imageInputRef}
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => handleFileUpload(e, 'image')}
      />

      <input
        type="file"
        ref={fileInputRef}
        accept="*/*"
        style={{ display: 'none' }}
        onChange={(e) => handleFileUpload(e, null)}
      />

      {/* Input Field Form */}
      <form className="chat-input-area" onSubmit={handleSendText}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            type="button"
            className="icon-btn"
            title="Attach Image"
            onClick={() => imageInputRef.current?.click()}
          >
            <ImageIcon size={20} />
          </button>

          <button
            type="button"
            className="icon-btn"
            title="Attach Document/File"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip size={20} />
          </button>
        </div>

        <input
          type="text"
          className="chat-input-field"
          placeholder="Type a message..."
          value={text}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          autoFocus
        />

        <button
          type="submit"
          className="send-btn"
          disabled={!text.trim()}
          title="Send Message"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};
