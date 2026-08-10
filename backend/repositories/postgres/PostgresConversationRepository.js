import { ConversationRepository } from '../ConversationRepository.js';
import { query } from '../../config/db.js';

export class PostgresConversationRepository extends ConversationRepository {
  _mapConversation(row) {
    if (!row) return null;
    let lastMessage = row.last_message || null;
    if (typeof lastMessage === 'string') {
      try {
        lastMessage = JSON.parse(lastMessage);
      } catch (e) {}
    }
    return {
      id: row.id,
      participants: row.participants || [],
      lastMessage,
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString()
    };
  }

  async findById(id) {
    const res = await query('SELECT * FROM conversations WHERE id = $1', [id]);
    return this._mapConversation(res.rows[0]);
  }

  async findBetweenUsers(userId1, userId2) {
    const sql = `
      SELECT * FROM conversations
      WHERE participants @> ARRAY[$1, $2]::text[]
      LIMIT 1
    `;
    const res = await query(sql, [userId1, userId2]);
    return this._mapConversation(res.rows[0]);
  }

  async findOrCreate(user1Id, user2Id) {
    const existing = await this.findBetweenUsers(user1Id, user2Id);
    if (existing) {
      return existing;
    }
    return await this.create({ participants: [user1Id, user2Id], lastMessage: null });
  }

  async findByUserId(userId) {
    const sql = `
      SELECT c.*,
        (
          SELECT COUNT(*)::int FROM messages m
          WHERE m.conversation_id = c.id
            AND m.recipient_id = $1
            AND m.status != 'seen'
            AND (m.deleted_for IS NULL OR NOT ($1 = ANY(m.deleted_for)))
        ) as unread_count
      FROM conversations c
      WHERE $1 = ANY(c.participants)
      ORDER BY c.updated_at DESC
    `;
    const res = await query(sql, [userId]);
    return res.rows.map(row => {
      const mapped = this._mapConversation(row);
      mapped.unreadCount = row.unread_count || 0;
      return mapped;
    });
  }

  async create(conversationData) {
    const id = conversationData.id || `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const sql = `
      INSERT INTO conversations (id, participants, last_message, created_at, updated_at)
      VALUES ($1, $2, $3, NOW(), NOW())
      RETURNING *
    `;
    const values = [
      id,
      conversationData.participants,
      conversationData.lastMessage ? JSON.stringify(conversationData.lastMessage) : null
    ];
    const res = await query(sql, values);
    return this._mapConversation(res.rows[0]);
  }

  async updateLastMessage(conversationId, messageData) {
    const sql = `
      UPDATE conversations
      SET last_message = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;
    const res = await query(sql, [JSON.stringify(messageData), conversationId]);
    return this._mapConversation(res.rows[0]);
  }
}
