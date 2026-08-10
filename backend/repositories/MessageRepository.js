/**
 * MessageRepository Interface / Base Class
 * Defines the contract for message data operations.
 */
export class MessageRepository {
  async create(messageData) {
    throw new Error('Method create() must be implemented');
  }

  async findById(id) {
    throw new Error('Method findById() must be implemented');
  }

  async findByConversationId(conversationId) {
    throw new Error('Method findByConversationId() must be implemented');
  }

  async updateStatus(messageId, status) {
    throw new Error('Method updateStatus() must be implemented');
  }

  async markConversationAsSeen(conversationId, recipientId) {
    throw new Error('Method markConversationAsSeen() must be implemented');
  }

  async markConversationAsDelivered(conversationId, recipientId) {
    throw new Error('Method markConversationAsDelivered() must be implemented');
  }

  async deleteForUser(messageId, userId) {
    throw new Error('Method deleteForUser() must be implemented');
  }
}
