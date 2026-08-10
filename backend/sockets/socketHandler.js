import { userRepository, conversationRepository, blockRepository } from '../repositories/index.js';
import { ChatService } from '../services/ChatService.js';

// Global map tracking active userId -> Set of socketIds
const onlineUsersMap = new Map();

export const setupSocketHandlers = (io) => {
  io.on('connection', async (socket) => {
    // Authenticated sender ID strictly derived from verified JWT token
    const userId = socket.user.id;
    
    // Add socket to online users tracking
    if (!onlineUsersMap.has(userId)) {
      onlineUsersMap.set(userId, new Set());
    }
    onlineUsersMap.get(userId).add(socket.id);

    // Join personal user room
    socket.join(`user:${userId}`);

    // Update user online status asynchronously in repository
    userRepository.update(userId, { isOnline: true }).catch(err => {
      console.error('Failed to update online status:', err.message);
    });

    // Automatically transition pending 'sent' messages to 'delivered' when user comes online
    (async () => {
      try {
        const userConvs = await conversationRepository.findByUserId(userId);
        for (const conv of userConvs) {
          const updatedDelivered = await ChatService.markMessagesAsDelivered(conv.id, userId);
          if (updatedDelivered && updatedDelivered.length > 0) {
            io.to(`conversation:${conv.id}`).emit('messages_status_changed', {
              conversationId: conv.id,
              status: 'delivered',
              messageIds: updatedDelivered.map(m => m.id),
              updatedBy: userId
            });
          }
        }
      } catch (err) {
        console.error('Error updating delivered status on connect:', err.message);
      }
    })();

    // Broadcast presence update (ONLINE) to all connected clients
    io.emit('user_presence_change', {
      userId,
      isOnline: true,
      lastSeen: null
    });

    // Send initial list of all online user IDs to the newly connected user
    const onlineUserIds = Array.from(onlineUsersMap.keys());
    socket.emit('initial_presence_state', { onlineUserIds });

    // --- CONVERSATION ROOMS ---
    socket.on('join_conversation', async ({ conversationId }) => {
      if (!conversationId) return;

      try {
        // Authorization check: Verify user is a participant of conversation
        const conv = await conversationRepository.findById(conversationId);
        if (!conv || !conv.participants.includes(userId)) {
          return socket.emit('error_notification', { message: 'Unauthorized: Access to conversation denied' });
        }

        socket.join(`conversation:${conversationId}`);

        // Mark messages sent to this user in this conversation as SEEN
        const updatedSeen = await ChatService.markMessagesAsSeen(conversationId, userId);
        if (updatedSeen.length > 0) {
          io.to(`conversation:${conversationId}`).emit('messages_status_changed', {
            conversationId,
            status: 'seen',
            messageIds: updatedSeen.map(m => m.id),
            updatedBy: userId
          });
        }
      } catch (err) {
        console.error('Error joining conversation room:', err.message);
      }
    });

    socket.on('leave_conversation', ({ conversationId }) => {
      if (conversationId) {
        socket.leave(`conversation:${conversationId}`);
      }
    });

    // --- SEND MESSAGE ---
    socket.on('send_message', async (data, callback) => {
      try {
        const { conversationId, recipientId, text, type = 'text', mediaUrl, fileName, fileSize, fileType, replyTo, tempId } = data;

        // Input validation
        if (text && text.length > 5000) {
          if (callback) callback({ error: 'Message exceeds maximum length of 5000 characters' });
          return;
        }

        if (!['text', 'image', 'file'].includes(type)) {
          if (callback) callback({ error: 'Invalid message type' });
          return;
        }

        let targetConvId = conversationId;
        // If conversation ID is not provided, find or create it
        if (!targetConvId && recipientId) {
          // Check block policy
          const blocked = await blockRepository.isBlocked(userId, recipientId);
          if (blocked) {
            if (callback) callback({ error: 'Messaging unavailable due to user block settings' });
            return;
          }

          const conv = await ChatService.getOrCreateConversation(userId, recipientId);
          targetConvId = conv.id;
        }

        if (!targetConvId) {
          if (callback) callback({ error: 'Conversation ID or recipient required' });
          return;
        }

        // Authorization check: Verify sender is in conversation
        const conversationRecord = await conversationRepository.findById(targetConvId);
        if (!conversationRecord || !conversationRecord.participants.includes(userId)) {
          if (callback) callback({ error: 'Unauthorized: Not a participant of this conversation' });
          return;
        }

        const otherUserId = conversationRecord.participants.find(p => p !== userId);

        // Check block policy
        const isUserBlocked = await blockRepository.isBlocked(userId, otherUserId);
        if (isUserBlocked) {
          if (callback) callback({ error: 'Messaging unavailable due to user block settings' });
          return;
        }

        // Save message via ChatService using verified authenticated senderId (userId)
        const { message, conversation } = await ChatService.sendMessage({
          senderId: userId,
          conversationId: targetConvId,
          text,
          type,
          mediaUrl,
          fileName,
          fileSize,
          fileType,
          replyTo
        });

        if (tempId) {
          message.tempId = tempId;
        }

        // Determine recipient online/viewing status
        const isRecipientOnline = onlineUsersMap.has(otherUserId) && onlineUsersMap.get(otherUserId).size > 0;

        // Check if recipient is actively in the conversation room
        const roomSockets = io.sockets.adapter.rooms.get(`conversation:${targetConvId}`);
        let isRecipientInRoom = false;
        if (roomSockets && isRecipientOnline) {
          const recipientSockets = onlineUsersMap.get(otherUserId);
          for (const sId of recipientSockets) {
            if (roomSockets.has(sId)) {
              isRecipientInRoom = true;
              break;
            }
          }
        }

        // Initial status update if recipient is online / viewing
        if (isRecipientInRoom) {
          await ChatService.markMessagesAsSeen(targetConvId, otherUserId);
          message.status = 'seen';
        } else if (isRecipientOnline) {
          await ChatService.markMessagesAsDelivered(targetConvId, otherUserId);
          message.status = 'delivered';
        }

        // Attach tempId for frontend deduplication
        const payload = {
          message,
          conversationId: targetConvId,
          tempId
        };

        // Broadcast to conversation room and user rooms
        io.to(`conversation:${targetConvId}`).emit('receive_message', payload);
        io.to(`user:${otherUserId}`).emit('receive_message', payload);
        io.to(`user:${userId}`).emit('receive_message', payload);

        // Emit notification of updated conversation list
        io.to(`user:${userId}`).to(`user:${otherUserId}`).emit('conversation_updated', {
          conversationId: targetConvId,
          lastMessage: message
        });

        if (callback) callback({ success: true, message });
      } catch (err) {
        console.error('Socket send_message error:', err);
        if (callback) callback({ error: err.message });
      }
    });

    // --- MARK CONVERSATION SEEN ---
    socket.on('mark_seen', async ({ conversationId }) => {
      try {
        const conv = await conversationRepository.findById(conversationId);
        if (!conv || !conv.participants.includes(userId)) return;

        const updatedSeen = await ChatService.markMessagesAsSeen(conversationId, userId);
        if (updatedSeen.length > 0) {
          io.to(`conversation:${conversationId}`).emit('messages_status_changed', {
            conversationId,
            status: 'seen',
            messageIds: updatedSeen.map(m => m.id),
            updatedBy: userId
          });
        }
      } catch (err) {
        console.error('Error marking seen:', err);
      }
    });

    // --- TYPING INDICATORS ---
    socket.on('typing_start', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('user_typing', {
        conversationId,
        userId,
        isTyping: true
      });
    });

    socket.on('typing_stop', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('user_typing', {
        conversationId,
        userId,
        isTyping: false
      });
    });

    // --- DELETE FOR ME ---
    socket.on('delete_message_for_me', async ({ messageId, conversationId }) => {
      try {
        await ChatService.deleteMessageForUser(messageId, userId);
        socket.emit('message_deleted_for_me', { messageId, conversationId });
      } catch (err) {
        console.error('Delete message error:', err);
      }
    });

    // --- WEBRTC CALL SIGNALING EVENTS WITH BLOCK POLICY ENFORCEMENT ---
    socket.on('call:initiate', async ({ recipientId, callType }) => {
      const blocked = await blockRepository.isBlocked(userId, recipientId);
      if (blocked) {
        return socket.emit('call:rejected', { reason: 'unavailable' });
      }

      io.to(`user:${recipientId}`).emit('call:incoming', {
        callerId: userId,
        callerName: socket.user.displayName || socket.user.username,
        callerAvatar: socket.user.avatarUrl,
        callType // 'audio' | 'video'
      });
    });

    socket.on('call:offer', ({ recipientId, offer }) => {
      io.to(`user:${recipientId}`).emit('call:offer', {
        callerId: userId,
        offer
      });
    });

    socket.on('call:answer', ({ callerId, answer }) => {
      io.to(`user:${callerId}`).emit('call:answer', {
        answer
      });
    });

    socket.on('call:ice-candidate', ({ recipientId, candidate }) => {
      io.to(`user:${recipientId}`).emit('call:ice-candidate', {
        candidate
      });
    });

    socket.on('call:accept', ({ callerId }) => {
      io.to(`user:${callerId}`).emit('call:accepted', {
        recipientId: userId
      });
    });

    socket.on('call:reject', ({ callerId, reason }) => {
      io.to(`user:${callerId}`).emit('call:rejected', {
        reason: reason || 'declined'
      });
    });

    socket.on('call:busy', ({ callerId }) => {
      io.to(`user:${callerId}`).emit('call:rejected', {
        reason: 'busy'
      });
    });

    socket.on('call:end', ({ recipientId }) => {
      io.to(`user:${recipientId}`).emit('call:ended', {
        endedBy: userId
      });
    });

    socket.on('call:mute-toggle', ({ recipientId, isMuted }) => {
      io.to(`user:${recipientId}`).emit('call:remote-mute', {
        isMuted
      });
    });

    socket.on('call:video-toggle', ({ recipientId, isVideoOff }) => {
      io.to(`user:${recipientId}`).emit('call:remote-video', {
        isVideoOff
      });
    });

    // --- DISCONNECT ---
    socket.on('disconnect', async () => {
      const userSockets = onlineUsersMap.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsersMap.delete(userId);
          const lastSeen = new Date().toISOString();
          userRepository.update(userId, {
            isOnline: false,
            lastSeen
          }).catch(e => {});

          // Broadcast offline status to all
          io.emit('user_presence_change', {
            userId,
            isOnline: false,
            lastSeen
          });
        }
      }
    });
  });
};
