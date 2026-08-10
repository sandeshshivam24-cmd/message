import { BlockRepository } from '../BlockRepository.js';
import { query } from '../../config/db.js';

export class PostgresBlockRepository extends BlockRepository {
  async blockUser(blockerId, blockedId) {
    if (blockerId === blockedId) {
      throw new Error('Cannot block yourself');
    }
    const id = `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const sql = `
      INSERT INTO blocks (id, blocker_id, blocked_id, created_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (blocker_id, blocked_id) DO NOTHING
    `;
    await query(sql, [id, blockerId, blockedId]);
    return true;
  }

  async unblockUser(blockerId, blockedId) {
    const sql = 'DELETE FROM blocks WHERE blocker_id = $1 AND blocked_id = $2';
    await query(sql, [blockerId, blockedId]);
    return true;
  }

  async getBlockedUserIds(blockerId) {
    const sql = 'SELECT blocked_id FROM blocks WHERE blocker_id = $1';
    const res = await query(sql, [blockerId]);
    return res.rows.map(row => row.blocked_id);
  }

  async isBlocked(userId1, userId2) {
    const sql = `
      SELECT id FROM blocks
      WHERE (blocker_id = $1 AND blocked_id = $2)
         OR (blocker_id = $2 AND blocked_id = $1)
      LIMIT 1
    `;
    const res = await query(sql, [userId1, userId2]);
    return res.rows.length > 0;
  }
}
