import { conversationRepository, messageRepository, userRepository } from '../repositories/index.js';
import { removeFromSupabaseStorage } from '../config/storage.js';

export class ChatService {
  static async getOrCreateConversation(user1Id, user2Id) {
    if (!user2Id) throw new Error('Recipient ID is required');
    if (user1Id === user2Id) throw new Error('Cannot create conversation with yourself');

    const recipient = await userRepository.findById(user2Id);
    if (!recipient) throw new Error('Recipient user not found');

    const conversation = await conversationRepository.findOrCreate(user1Id, user2Id);
    const { passwordHash: _, ...sanitizedRecipient } = recipient;

    return {
      ...conversation,
      recipient: sanitizedRecipient
    };
  }

  static async getUserConversations(userId) {
    const rawConversations = await conversationRepository.findByUserId(userId);
    const result = [];

    for (const conv of rawConversations) {
      const otherUserId = conv.participants.find(p => p !== userId);
      const otherUser = await userRepository.findById(otherUserId);
      
      let unreadCount = 0;
      const messages = await messageRepository.findByConversationId(conv.id, userId);
      
      for (const m of messages) {
        if (m.recipientId === userId && m.status !== 'seen') {
          unreadCount++;
        }
      }

      if (otherUser) {
        const { passwordHash: _, ...sanitizedUser } = otherUser;
        result.push({
          ...conv,
          recipient: sanitizedUser,
          unreadCount
        });
      }
    }

    return result;
  }

  static async getConversationMessages(conversationId, userId) {
    const conversation = await conversationRepository.findById(conversationId);
    if (!conversation || !conversation.participants.includes(userId)) {
      throw new Error('Conversation not found or access denied');
    }

    return await messageRepository.findByConversationId(conversationId, userId);
  }

  static async sendMessage({ senderId, conversationId, text, type = 'text', mediaUrl, fileName, fileSize, fileType, replyTo }) {
    if (type === 'text' && (!text || !text.trim())) {
      throw new Error('Message text cannot be empty');
    }

    let conv = null;
    if (conversationId) {
      conv = await conversationRepository.findById(conversationId);
    }

    if (!conv) {
      throw new Error('Conversation not found');
    }

    const recipientId = conv.participants.find(p => p !== senderId);
    if (!recipientId) throw new Error('Invalid conversation participants');

    const message = await messageRepository.create({
      conversationId: conv.id,
      senderId,
      recipientId,
      text: (text || '').trim(),
      type,
      mediaUrl: mediaUrl || null,
      fileName: fileName || null,
      fileSize: fileSize || null,
      fileType: fileType || null,
      replyTo: replyTo || null,
      status: 'sent'
    });

    await conversationRepository.updateLastMessage(conv.id, message);

    return { message, conversation: conv };
  }

  static async markMessagesAsSeen(conversationId, recipientId) {
    const updatedMessages = await messageRepository.markConversationAsSeen(conversationId, recipientId);
    
    if (updatedMessages.length > 0) {
      const latestMsg = updatedMessages[updatedMessages.length - 1];
      await conversationRepository.updateLastMessage(conversationId, latestMsg);
    }

    return updatedMessages;
  }

  static async markMessagesAsDelivered(conversationId, recipientId) {
    const updatedMessages = await messageRepository.markConversationAsDelivered(conversationId, recipientId);
    return updatedMessages;
  }

  static async deleteMessageForUser(messageId, userId) {
    const updatedMsg = await messageRepository.deleteForUser(messageId, userId);
    if (!updatedMsg) throw new Error('Message not found');
    return updatedMsg;
  }

  static async deleteMessageForEveryone(messageId, userId) {
    const existingMsg = await messageRepository.findById(messageId);
    if (!existingMsg) throw new Error('Message not found');
    if (existingMsg.senderId !== userId) {
      throw new Error('Forbidden: Only the message sender can delete for everyone');
    }

    const deletedMsg = await messageRepository.deleteForEveryone(messageId, userId);
    if (!deletedMsg) throw new Error('Failed to delete message for everyone');

    // Clean up Supabase Storage if message was media
    if (existingMsg.mediaUrl) {
      removeFromSupabaseStorage(existingMsg.mediaUrl).catch(() => {});
    }

    return deletedMsg;
  }

  static async clearConversationForUser(conversationId, userId) {
    const conversation = await conversationRepository.findById(conversationId);
    if (!conversation || !conversation.participants.includes(userId)) {
      throw new Error('Conversation not found or access denied');
    }

    const updatedConv = await conversationRepository.clearConversationForUser(conversationId, userId);
    return updatedConv;
  }

  static async purgeExpiredMessages() {
    const expiredMessages = await messageRepository.purgeExpiredMessages();
    for (const msg of expiredMessages) {
      if (msg.mediaUrl) {
        removeFromSupabaseStorage(msg.mediaUrl).catch(() => {});
      }
    }
    return expiredMessages.length;
  }
}
