import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { chatApi } from '../api/client';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [onlineUserIds, setOnlineUserIds] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState({}); // Key: conversationId, Value: userId
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  const activeConvRef = useRef(activeConversation);
  useEffect(() => {
    activeConvRef.current = activeConversation;
  }, [activeConversation]);

  // Connect to Socket.IO server when user is authenticated
  useEffect(() => {
    if (!token || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      setConnectionStatus('disconnected');
      return;
    }

    const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    setConnectionStatus('connecting');

    const newSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    newSocket.on('connect', () => {
      setConnectionStatus('connected');

      // Join room for active conversation if already selected
      if (activeConvRef.current) {
        newSocket.emit('join_conversation', { conversationId: activeConvRef.current.id });
      }
    });

    newSocket.on('disconnect', () => {
      setConnectionStatus('disconnected');
    });

    newSocket.on('connect_error', (err) => {
      console.warn('Socket connection notice:', err.message);
      setConnectionStatus('error');
    });

    // Presence updates
    newSocket.on('initial_presence_state', ({ onlineUserIds: ids }) => {
      setOnlineUserIds(new Set(ids));
    });

    newSocket.on('user_presence_change', ({ userId, isOnline }) => {
      setOnlineUserIds(prev => {
        const updated = new Set(prev);
        if (isOnline) updated.add(userId);
        else updated.delete(userId);
        return updated;
      });
      // Refresh conversations list to update online status dots
      fetchConversations();
    });

    // Real-time message receiver
    newSocket.on('receive_message', ({ message, conversationId: msgConvId }) => {
      const currentActive = activeConvRef.current;
      if (currentActive && currentActive.id === msgConvId) {
        setMessages(prev => {
          // If optimistic message exists with tempId, replace it
          if (message.tempId) {
            return prev.map(m => m.tempId === message.tempId ? message : m);
          }
          // Avoid duplicate messages
          if (prev.some(m => m.id === message.id)) return prev;
          return [...prev, message];
        });

        // Automatically send read receipt if recipient is actively viewing this chat
        if (message.senderId !== user.id) {
          newSocket.emit('mark_seen', { conversationId: msgConvId });
        }
      }
      // Always refresh conversations list so unread count badge & last_message update in real time
      fetchConversations();
    });

    // Status updates (sent -> delivered -> seen)
    newSocket.on('messages_status_changed', ({ conversationId: msgConvId, status, messageIds }) => {
      const currentActive = activeConvRef.current;
      if (currentActive && currentActive.id === msgConvId) {
        setMessages(prev =>
          prev.map(m => messageIds.includes(m.id) ? { ...m, status } : m)
        );
      }
      fetchConversations();
    });

    // Typing indicators
    newSocket.on('user_typing', ({ conversationId: msgConvId, userId, isTyping }) => {
      setTypingUsers(prev => ({
        ...prev,
        [msgConvId]: isTyping ? userId : null
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

    // Message deleted for everyone event (permanently removes message from state & DOM)
    newSocket.on('message_deleted_for_everyone', ({ messageId, conversationId: msgConvId }) => {
      const currentActive = activeConvRef.current;
      if (currentActive && currentActive.id === msgConvId) {
        setMessages(prev => prev.filter(m => m.id !== messageId));
      }
      fetchConversations();
    });

    // Chat cleared event
    newSocket.on('chat_cleared', ({ conversationId: msgConvId }) => {
      const currentActive = activeConvRef.current;
      if (currentActive && currentActive.id === msgConvId) {
        setMessages([]);
      }
      fetchConversations();
    });

    setSocket(newSocket);

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
      newSocket.off('message_deleted_for_everyone');
      newSocket.off('chat_cleared');
      newSocket.disconnect();
    };
  }, [token, user?.id]);

  // Initial load of user conversations
  const fetchConversations = async () => {
    try {
      const res = await chatApi.getConversations();
      setConversations(res.data);
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchConversations();
    }
  }, [token]);

  // Select active conversation and load messages
  const selectConversation = async (conv) => {
    const prevConv = activeConversation;

    if (socket && prevConv && prevConv.id !== conv?.id) {
      socket.emit('leave_conversation', { conversationId: prevConv.id });
    }

    setActiveConversation(conv);
    if (!conv) {
      setMessages([]);
      return;
    }

    try {
      const res = await chatApi.getMessages(conv.id);
      setMessages(res.data);

      if (socket) {
        socket.emit('join_conversation', { conversationId: conv.id });
        socket.emit('mark_seen', { conversationId: conv.id });
      }

      // Immediately refresh conversations list so unread badge clears
      fetchConversations();
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  };

  // Send message
  const sendMessage = (messageData) => {
    if (!socket || !activeConversation) return;

    socket.emit('send_message', {
      conversationId: activeConversation.id,
      recipientId: activeConversation.recipient.id,
      ...messageData
    });
  };

  // Typing controls
  const startTyping = () => {
    if (socket && activeConversation) {
      socket.emit('typing_start', { conversationId: activeConversation.id });
    }
  };

  const stopTyping = () => {
    if (socket && activeConversation) {
      socket.emit('typing_stop', { conversationId: activeConversation.id });
    }
  };

  // Delete message for me
  const deleteMessageForMe = (messageId) => {
    if (socket && activeConversation) {
      socket.emit('delete_message_for_me', { messageId, conversationId: activeConversation.id });
    }
  };

  // Delete message for everyone
  const deleteMessageForEveryone = (messageId) => {
    if (socket && activeConversation) {
      socket.emit('delete_message_for_everyone', { messageId, conversationId: activeConversation.id });
    }
  };

  // Clear chat
  const clearChat = (conversationId) => {
    if (socket) {
      socket.emit('clear_chat', { conversationId });
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        conversations,
        activeConversation,
        messages,
        setMessages,
        onlineUserIds,
        typingUsers,
        connectionStatus,
        selectConversation,
        sendMessage,
        startTyping,
        stopTyping,
        deleteMessageForMe,
        deleteMessageForEveryone,
        clearChat,
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
