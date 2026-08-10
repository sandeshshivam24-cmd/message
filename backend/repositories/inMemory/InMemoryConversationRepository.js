import { ConversationRepository } from '../ConversationRepository.js';

export class InMemoryConversationRepository extends ConversationRepository {
  constructor() {
    super();
    // Key: conversationId, Value: conversation object
    this.conversations = new Map();
  }

  _getParticipantKey(user1Id, user2Id) {
    return [user1Id, user2Id].sort().join('::');
  }

  async findOrCreate(user1Id, user2Id) {
    const key = this._getParticipantKey(user1Id, user2Id);
    
    for (const conv of this.conversations.values()) {
      const convKey = this._getParticipantKey(conv.participants[0], conv.participants[1]);
      if (convKey === key) {
        return { ...conv };
      }
    }

    const id = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newConv = {
      id,
      participants: [user1Id, user2Id],
      lastMessage: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.conversations.set(id, newConv);
    return { ...newConv };
  }

  async findById(id) {
    const conv = this.conversations.get(id);
    if (!conv) return null;
    return { ...conv };
  }

  async findByUserId(userId) {
    const userConvs = [];
    for (const conv of this.conversations.values()) {
      if (conv.participants.includes(userId)) {
        userConvs.push({ ...conv });
      }
    }
    // Sort by most recently updated
    userConvs.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    return userConvs;
  }

  async updateLastMessage(conversationId, message) {
    const conv = this.conversations.get(conversationId);
    if (!conv) return null;

    conv.lastMessage = message ? {
      id: message.id,
      text: message.text,
      senderId: message.senderId,
      status: message.status,
      createdAt: message.createdAt
    } : null;

    conv.updatedAt = new Date().toISOString();
    this.conversations.set(conversationId, conv);
    return { ...conv };
  }
}
