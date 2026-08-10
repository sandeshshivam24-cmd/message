/**
 * ConversationRepository Interface / Base Class
 * Defines the contract for conversation data operations.
 */
export class ConversationRepository {
  async findOrCreate(user1Id, user2Id) {
    throw new Error('Method findOrCreate() must be implemented');
  }

  async findById(id) {
    throw new Error('Method findById() must be implemented');
  }

  async findByUserId(userId) {
    throw new Error('Method findByUserId() must be implemented');
  }

  async updateLastMessage(conversationId, messageId, updatedAt) {
    throw new Error('Method updateLastMessage() must be implemented');
  }
}
