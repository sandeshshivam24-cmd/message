import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { chatApi, BACKEND_SERVER_URL } from '../api/client';
import { playMessageChime } from '../utils/audioSynth';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // 'connected' | 'connecting' | 'disconnected'
  const [onlineUserIds, setOnlineUserIds] = useState(new Set());
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState({}); // { conversationId: { userId, isTyping } }

  const activeConvRef = useRef(activeConversation);
  activeConvRef.current = activeConversation;

  // Initialize socket when token changes
  useEffect(() => {
    if (!token || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setConnectionStatus('disconnected');
      }
      return;
    }

    setConnectionStatus('connecting');
    const newSocket = io(BACKEND_SERVER_URL, {
      auth: { token },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling']
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      setConnectionStatus('connected');
    });

    newSocket.on('disconnect', () => {
      setConnectionStatus('disconnected');
    });

    newSocket.on('connect_error', () => {
      setConnectionStatus('connecting');
    });

    // Initial presence setup
    newSocket.on('initial_presence_state', ({ onlineUserIds: ids }) => {
      setOnlineUserIds(new Set(ids));
    });

    // Realtime presence changes (user online/offline)
    newSocket.on('user_presence_change', ({ userId: pUserId, isOnline, lastSeen }) => {
      setOnlineUserIds(prev => {
        const updated = new Set(prev);
        if (isOnline) {
          updated.add(pUserId);
        } else {
          updated.delete(pUserId);
        }
        return updated;
      });

      // Update recipient status in active conversation if matching
      setActiveConversation(prev => {
        if (prev && prev.recipient && prev.recipient.id === pUserId) {
          return {
            ...prev,
            recipient: {
              ...prev.recipient,
              isOnline,
              lastSeen: lastSeen || prev.recipient.lastSeen
            }
          };
        }
        return prev;
      });

      // Update recipient status in conversation list
      setConversations(prevConvs =>
        prevConvs.map(conv => {
          if (conv.recipient && conv.recipient.id === pUserId) {
            return {
              ...conv,
              recipient: {
                ...conv.recipient,
                isOnline,
                lastSeen: lastSeen || conv.recipient.lastSeen
              }
            };
          }
          return conv;
        })
      );
    });

    // Receive Message (Realtime Socket Event)
    newSocket.on('receive_message', ({ message, conversationId: msgConvId, tempId }) => {
      const currentActive = activeConvRef.current;

      // Audio and Desktop Notification if received from another user
      if (message.senderId !== user.id) {
        const isSoundEnabled = localStorage.getItem('messenger_sound') !== 'false';
        if (isSoundEnabled) playMessageChime();

        const isNotifEnabled = localStorage.getItem('messenger_notifications') !== 'false';
        if (isNotifEnabled && Notification.permission === 'granted' && document.hidden) {
          new Notification('New Message', {
            body: message.type === 'image' ? '📷 Sent an image' : message.type === 'file' ? '📎 Sent a file' : message.text,
            icon: '/favicon.ico'
          });
        }
      }

      // Deduplication & Append to active conversation if viewing
      if (currentActive && currentActive.id === msgConvId) {
        setMessages(prev => {
          // Check if tempId exists to deduplicate
          if (tempId && prev.some(m => m.tempId === tempId || m.id === tempId)) {
            return prev.map(m => (m.tempId === tempId || m.id === tempId) ? message : m);
          }
          // Check if message ID already exists
          if (prev.some(m => m.id === message.id)) {
            return prev.map(m => m.id === message.id ? message : m);
          }
          return [...prev, message];
        });

        // Auto mark seen if recipient is current user viewing chat
        if (message.recipientId === user.id) {
          newSocket.emit('mark_seen', { conversationId: msgConvId });
        }
      }

      // Update conversations list (last message & unread count)
      fetchConversations();
    });

    // Message Status Changed (sent -> delivered -> seen)
    newSocket.on('messages_status_changed', ({ conversationId: msgConvId, status, messageIds }) => {
      const currentActive = activeConvRef.current;
      if (currentActive && currentActive.id === msgConvId) {
        setMessages(prev =>
          prev.map(m => {
            if (messageIds.includes(m.id)) {
              return { ...m, status };
            }
            return m;
          })
        );
      }
      fetchConversations();
    });

    // Typing Event
    newSocket.on('user_typing', ({ conversationId: msgConvId, userId: typingUserId, isTyping }) => {
      setTypingUsers(prev => ({
        ...prev,
        [msgConvId]: isTyping ? typingUserId : null
      }));
    });

    // Message deleted for me event
    newSocket.on('message_deleted_for_me', ({ messageId, conversationId: msgConvId }) => {
      const currentActive = activeConvRef.current;
      if (currentActive && currentActive.id === msgConvId) {
        setMessages(prev => prev.filter(m => m.id !== messageId));
      }
      fetchConversations();
    });

    return () => {
      newSocket.off('connect');
      newSocket.off('disconnect');
      newSocket.off('connect_error');
      newSocket.off('initial_presence_state');
      newSocket.off('user_presence_change');
      newSocket.off('receive_message');
      newSocket.off('messages_status_changed');
      newSocket.off('user_typing');
      newSocket.off('message_deleted_for_me');
      newSocket.disconnect();
    };
  }, [token, user?.id]);

  // Initial load of user conversations
  const fetchConversations = async () => {
    try {
      const res = await chatApi.getConversations();
      setConversations(res.data);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchConversations();
    }
  }, [token]);

  // Select Active Conversation
  const selectConversation = async (conv) => {
    if (activeConversation && socket) {
      socket.emit('leave_conversation', { conversationId: activeConversation.id });
    }

    setActiveConversation(conv);
    if (!conv) {
      setMessages([]);
      return;
    }

    try {
      // Load messages via REST
      const res = await chatApi.getMessages(conv.id);
      setMessages(res.data);

      // Join socket room
      if (socket) {
        socket.emit('join_conversation', { conversationId: conv.id });
      }

      // Reset unread count locally
      setConversations(prev =>
        prev.map(c => c.id === conv.id ? { ...c, unreadCount: 0 } : c)
      );
    } catch (err) {
      console.error('Failed to load conversation messages:', err);
    }
  };

  // Start direct conversation with user from search
  const startConversationWithUser = async (targetUser) => {
    try {
      const res = await chatApi.getOrCreateConversation(targetUser.id);
      const convData = res.data;
      await fetchConversations();
      await selectConversation(convData);
      return convData;
    } catch (err) {
      console.error('Failed to start conversation:', err);
    }
  };

  // Send message (text or media) via socket
  const sendMessage = (options, legacyReplyTo = null) => {
    let payload = {};
    if (typeof options === 'string') {
      payload = { text: options, replyTo: legacyReplyTo, type: 'text' };
    } else {
      payload = options;
    }

    const {
      text = '',
      type = 'text',
      mediaUrl = null,
      fileName = null,
      fileSize = null,
      fileType = null,
      replyTo = null,
      tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
    } = payload;

    if (!activeConversation || !socket) return;
    if (type === 'text' && !text.trim()) return;

    const newOptimisticMsg = {
      id: tempId,
      tempId,
      conversationId: activeConversation.id,
      senderId: user.id,
      recipientId: activeConversation.recipient.id,
      text: text ? text.trim() : '',
      type,
      mediaUrl,
      fileName,
      fileSize,
      fileType,
      replyTo,
      status: 'sent',
      createdAt: new Date().toISOString()
    };

    // Optimistically update messages UI
    setMessages(prev => {
      if (prev.some(m => m.id === tempId || m.tempId === tempId)) {
        return prev.map(m => (m.id === tempId || m.tempId === tempId) ? newOptimisticMsg : m);
      }
      return [...prev, newOptimisticMsg];
    });

    socket.emit('send_message', {
      conversationId: activeConversation.id,
      recipientId: activeConversation.recipient.id,
      text: text ? text.trim() : '',
      type,
      mediaUrl,
      fileName,
      fileSize,
      fileType,
      replyTo,
      tempId
    }, (response) => {
      if (response && response.error) {
        console.error('Send message failed:', response.error);
        setMessages(prev => prev.filter(m => m.tempId !== tempId && m.id !== tempId));
      }
    });
  };

  // Typing triggers
  const startTyping = () => {
    if (activeConversation && socket) {
      socket.emit('typing_start', { conversationId: activeConversation.id });
    }
  };

  const stopTyping = () => {
    if (activeConversation && socket) {
      socket.emit('typing_stop', { conversationId: activeConversation.id });
    }
  };

  // Delete message for current user
  const deleteMessageForMe = (messageId) => {
    if (socket && activeConversation) {
      socket.emit('delete_message_for_me', { messageId, conversationId: activeConversation.id });
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        connectionStatus,
        onlineUserIds,
        conversations,
        activeConversation,
        messages,
        typingUsers,
        selectConversation,
        startConversationWithUser,
        sendMessage,
        setMessages,
        startTyping,
        stopTyping,
        deleteMessageForMe,
        fetchConversations
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
