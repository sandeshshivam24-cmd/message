import {
  userRepository,
  messageRepository,
  conversationRepository,
  mediaRepository
} from '../repositories/index.js';
import { removeFromSupabaseStorage } from '../config/storage.js';

export class ChatService {
  static async getUserConversations(userId) {
    const conversations = await conversationRepository.findByUserId(userId);
    
    // Attach recipient user details to each conversation
    const result = await Promise.all(
      conversations.map(async (conv) => {
        const recipientId = conv.participants.find(id => id !== userId);
        const recipient = recipientId ? await userRepository.findById(recipientId) : null;
        
        let recipientData = null;
        if (recipient) {
          recipientData = {
            id: recipient.id,
            username: recipient.username,
            displayName: recipient.displayName,
            avatarUrl: recipient.avatarUrl,
            statusMessage: recipient.statusMessage,
            isOnline: recipient.isOnline,
            lastSeen: recipient.lastSeen
          };
        }

        return {
          id: conv.id,
          participants: conv.participants,
          recipient: recipientData,
          lastMessage: conv.lastMessage,
          unreadCount: 0,
          updatedAt: conv.updatedAt
        };
      })
    );

    return result;
  }

  static async getOrCreateConversation(userAId, userBId) {
    if (userAId === userBId) {
      throw new Error('Cannot create conversation with yourself');
    }

    let conv = await conversationRepository.findByParticipants(userAId, userBId);
    if (!conv) {
      conv = await conversationRepository.create([userAId, userBId]);
    }
    return conv;
  }

  static async getConversationMessages(conversationId, userId) {
    const conv = await conversationRepository.findById(conversationId);
    if (!conv || !conv.participants.includes(userId)) {
      throw new Error('Conversation not found or access denied');
    }

    const clearedTimestamp = conv.clearedTimestamps ? conv.clearedTimestamps[userId] : null;
    return await messageRepository.findByConversationId(conversationId, userId, clearedTimestamp);
  }

  static async sendMessage({ senderId, conversationId, text, type, mediaUrl, fileName, fileSize, fileType, replyTo }) {
    const conv = await conversationRepository.findById(conversationId);
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

    // Verify requesting user is a participant of the conversation (Sender OR Recipient)
    const conversation = await conversationRepository.findById(existingMsg.conversationId);
    if (!conversation || !conversation.participants.includes(userId)) {
      throw new Error('Forbidden: Access denied to conversation message');
    }

    // Permanently remove message record from database for everyone
    const deletedMsg = await messageRepository.deleteForEveryone(messageId);
    if (!deletedMsg) throw new Error('Failed to delete message for everyone');

    // Clean up Supabase Storage if message was media
    if (existingMsg.mediaUrl) {
      removeFromSupabaseStorage(existingMsg.mediaUrl).catch(() => {});
    }

    // If deleted message was the last message preview, update conversation preview
    const remainingMsgs = await messageRepository.findByConversationId(existingMsg.conversationId, userId);
    const newLastMsg = remainingMsgs.length > 0 ? remainingMsgs[remainingMsgs.length - 1] : null;
    await conversationRepository.updateLastMessage(existingMsg.conversationId, newLastMsg);

    return { messageId, conversationId: existingMsg.conversationId };
  }

  static async clearConversationForUser(conversationId, userId) {
    const conversation = await conversationRepository.findById(conversationId);
    if (!conversation || !conversation.participants.includes(userId)) {
      throw new Error('Conversation not found or access denied');
    }
    return await conversationRepository.clearConversationForUser(conversationId, userId);
  }

  static async purgeExpiredMessages() {
    const expiredMessages = await messageRepository.purgeExpiredMessages();
    
    // Asynchronously clean up media files from Supabase Storage for expired messages
    for (const msg of expiredMessages) {
      if (msg.mediaUrl) {
        removeFromSupabaseStorage(msg.mediaUrl).catch(() => {});
      }
    }

    return expiredMessages.length;
  }
}
