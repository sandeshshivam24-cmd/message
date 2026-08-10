import { BlockRepository } from '../BlockRepository.js';

export class InMemoryBlockRepository extends BlockRepository {
  constructor() {
    super();
    // Key: blockerId (string), Value: Set of blockedUserIds
    this.blocks = new Map();
  }

  async blockUser(blockerId, blockedId) {
    if (blockerId === blockedId) {
      throw new Error('Cannot block yourself');
    }
    if (!this.blocks.has(blockerId)) {
      this.blocks.set(blockerId, new Set());
    }
    this.blocks.get(blockerId).add(blockedId);
    return true;
  }

  async unblockUser(blockerId, blockedId) {
    if (this.blocks.has(blockerId)) {
      this.blocks.get(blockerId).delete(blockedId);
    }
    return true;
  }

  async getBlockedUserIds(blockerId) {
    if (!this.blocks.has(blockerId)) {
      return [];
    }
    return Array.from(this.blocks.get(blockerId));
  }

  async isBlocked(userId1, userId2) {
    const user1Blocks = this.blocks.get(userId1);
    const user2Blocks = this.blocks.get(userId2);

    const is1BlockedBy2 = user2Blocks && user2Blocks.has(userId1);
    const is2BlockedBy1 = user1Blocks && user1Blocks.has(userId2);

    return Boolean(is1BlockedBy2 || is2BlockedBy1);
  }
}
