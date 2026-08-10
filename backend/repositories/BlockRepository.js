/**
 * BlockRepository Interface / Base Class
 * Contract for managing user block lists.
 */
export class BlockRepository {
  async blockUser(blockerId, blockedId) {
    throw new Error('Method blockUser() must be implemented');
  }

  async unblockUser(blockerId, blockedId) {
    throw new Error('Method unblockUser() must be implemented');
  }

  async getBlockedUserIds(blockerId) {
    throw new Error('Method getBlockedUserIds() must be implemented');
  }

  async isBlocked(userId1, userId2) {
    throw new Error('Method isBlocked() must be implemented');
  }
}
