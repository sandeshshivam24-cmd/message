import { MessageRepository } from '../MessageRepository.js';

export class InMemoryMessageRepository extends MessageRepository {
  constructor() {
    super();
    // Key: messageId, Value: message object
    this.messages = new Map();
  }

  async create(messageData) {
    const id = messageData.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = messageData.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const newMessage = {
      id,
      conversationId: messageData.conversationId,
      senderId: messageData.senderId,
      recipientId: messageData.recipientId,
      text: messageData.text || '',
      type: messageData.type || 'text', // 'text' | 'image' | 'file'
      mediaUrl: messageData.mediaUrl || null,
      fileName: messageData.fileName || null,
      fileSize: messageData.fileSize || null,
      fileType: messageData.fileType || null,
      status: messageData.status || 'sent', // 'sent' | 'delivered' | 'seen'
      replyTo: messageData.replyTo || null, // { id, senderName, text }
      deletedFor: [], // array of userIds who deleted this message for themselves
      isDeletedForEveryone: false,
      expiresAt,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.messages.set(id, newMessage);
    return { ...newMessage };
  }

  async findById(id) {
    const msg = this.messages.get(id);
    if (!msg) return null;
    if (msg.expiresAt && new Date(msg.expiresAt) <= new Date()) {
      return null;
    }
    return { ...msg };
  }

  async findByConversationId(conversationId, userId, clearedTimestamp = null) {
    const conversationMessages = [];
    const now = new Date();

    for (const msg of this.messages.values()) {
      if (msg.conversationId === conversationId) {
        // Skip if expired
        if (msg.expiresAt && new Date(msg.expiresAt) <= now) {
          continue;
        }

        // Skip if deleted for this user
        if (userId && msg.deletedFor && msg.deletedFor.includes(userId)) {
          continue;
        }

        // Skip if message created before clear chat timestamp
        if (clearedTimestamp && new Date(msg.createdAt) <= new Date(clearedTimestamp)) {
          continue;
        }

        conversationMessages.push({ ...msg });
      }
    }
    // Sort chronologically
    conversationMessages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    return conversationMessages;
  }

  async updateStatus(messageId, status) {
    const msg = this.messages.get(messageId);
    if (!msg) return null;
    
    // Status can only advance: sent -> delivered -> seen
    const statusPriority = { sent: 1, delivered: 2, seen: 3 };
    if (statusPriority[status] > (statusPriority[msg.status] || 0)) {
      msg.status = status;
      msg.updatedAt = new Date().toISOString();
      this.messages.set(messageId, msg);
    }
    return { ...msg };
  }

  async markConversationAsDelivered(conversationId, recipientId) {
    const updatedMessages = [];
    for (const msg of this.messages.values()) {
      if (
        msg.conversationId === conversationId &&
        msg.recipientId === recipientId &&
        msg.status === 'sent'
      ) {
        msg.status = 'delivered';
        msg.updatedAt = new Date().toISOString();
        this.messages.set(msg.id, msg);
        updatedMessages.push({ ...msg });
      }
    }
    return updatedMessages;
  }

  async markConversationAsSeen(conversationId, recipientId) {
    const updatedMessages = [];
    for (const msg of this.messages.values()) {
      if (
        msg.conversationId === conversationId &&
        msg.recipientId === recipientId &&
        (msg.status === 'sent' || msg.status === 'delivered')
      ) {
        msg.status = 'seen';
        msg.updatedAt = new Date().toISOString();
        this.messages.set(msg.id, msg);
        updatedMessages.push({ ...msg });
      }
    }
    return updatedMessages;
  }

  async deleteForUser(messageId, userId) {
    const msg = this.messages.get(messageId);
    if (!msg) return null;

    if (!msg.deletedFor.includes(userId)) {
      msg.deletedFor.push(userId);
      this.messages.set(messageId, msg);
    }
    return { ...msg };
  }

  async deleteForEveryone(messageId) {
    const msg = this.messages.get(messageId);
    if (!msg) return null;
    this.messages.delete(messageId);
    return { ...msg };
  }

  async purgeExpiredMessages() {
    const now = new Date();
    const purged = [];
    for (const [id, msg] of this.messages.entries()) {
      if (msg.expiresAt && new Date(msg.expiresAt) <= now) {
        purged.push({ ...msg });
        this.messages.delete(id);
      }
    }
    return purged;
  }
}
