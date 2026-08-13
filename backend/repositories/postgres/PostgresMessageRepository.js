import { MessageRepository } from '../MessageRepository.js';
import { query } from '../../config/db.js';

export class PostgresMessageRepository extends MessageRepository {
  _mapMessage(row) {
    if (!row) return null;
    let replyTo = row.reply_to || null;
    if (typeof replyTo === 'string') {
      try {
        replyTo = JSON.parse(replyTo);
      } catch (e) {}
    }
    return {
      id: row.id,
      conversationId: row.conversation_id,
      senderId: row.sender_id,
      recipientId: row.recipient_id,
      text: row.text || '',
      type: row.type || 'text',
      mediaUrl: row.media_url || null,
      fileName: row.file_name || null,
      fileSize: row.file_size ? Number(row.file_size) : null,
      fileType: row.file_type || null,
      status: row.status || 'sent',
      replyTo,
      deletedFor: row.deleted_for || [],
      isDeletedForEveryone: Boolean(row.is_deleted_for_everyone),
      expiresAt: row.expires_at ? new Date(row.expires_at).toISOString() : null,
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString()
    };
  }

  async create(messageData) {
    const id = messageData.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = messageData.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const sql = `
      INSERT INTO messages (
        id, conversation_id, sender_id, recipient_id, text, type,
        media_url, file_name, file_size, file_type, status, reply_to, deleted_for,
        is_deleted_for_everyone, expires_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `;
    const values = [
      id,
      messageData.conversationId,
      messageData.senderId,
      messageData.recipientId,
      messageData.text || '',
      messageData.type || 'text',
      messageData.mediaUrl || null,
      messageData.fileName || null,
      messageData.fileSize || null,
      messageData.fileType || null,
      messageData.status || 'sent',
      messageData.replyTo ? JSON.stringify(messageData.replyTo) : null,
      [],
      false,
      expiresAt
    ];

    const res = await query(sql, values);
    return this._mapMessage(res.rows[0]);
  }

  async findById(id) {
    const res = await query('SELECT * FROM messages WHERE id = $1', [id]);
    return this._mapMessage(res.rows[0]);
  }

  async findByConversationId(conversationId, userId) {
    const sql = `
      SELECT m.* FROM messages m
      LEFT JOIN conversations c ON c.id = m.conversation_id
      WHERE m.conversation_id = $1
        AND (m.deleted_for IS NULL OR NOT ($2 = ANY(m.deleted_for)))
        AND (m.expires_at IS NULL OR m.expires_at > NOW())
        AND (
          c.cleared_timestamps IS NULL 
          OR c.cleared_timestamps->$2 IS NULL 
          OR m.created_at > (c.cleared_timestamps->>$2)::timestamptz
        )
      ORDER BY m.created_at ASC
    `;
    const res = await query(sql, [conversationId, userId]);
    return res.rows.map(row => this._mapMessage(row));
  }

  async updateStatus(messageId, status) {
    const sql = `
      UPDATE messages
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;
    const res = await query(sql, [status, messageId]);
    return this._mapMessage(res.rows[0]);
  }

  async markConversationAsDelivered(conversationId, recipientId) {
    const sql = `
      UPDATE messages
      SET status = 'delivered', updated_at = NOW()
      WHERE conversation_id = $1 AND recipient_id = $2 AND status = 'sent'
      RETURNING *
    `;
    const res = await query(sql, [conversationId, recipientId]);
    return res.rows.map(row => this._mapMessage(row));
  }

  async markConversationAsSeen(conversationId, recipientId) {
    const sql = `
      UPDATE messages
      SET status = 'seen', updated_at = NOW()
      WHERE conversation_id = $1 AND recipient_id = $2 AND (status = 'sent' OR status = 'delivered')
      RETURNING *
    `;
    const res = await query(sql, [conversationId, recipientId]);
    return res.rows.map(row => this._mapMessage(row));
  }

  async deleteForUser(messageId, userId) {
    const sql = `
      UPDATE messages
      SET deleted_for = array_append(deleted_for, $2), updated_at = NOW()
      WHERE id = $1 AND NOT ($2 = ANY(deleted_for))
      RETURNING *
    `;
    const res = await query(sql, [messageId, userId]);
    if (res.rows.length === 0) {
      return this.findById(messageId);
    }
    return this._mapMessage(res.rows[0]);
  }

  async deleteForEveryone(messageId) {
    const sql = `
      DELETE FROM messages
      WHERE id = $1
      RETURNING *
    `;
    const res = await query(sql, [messageId]);
    if (res.rows.length === 0) {
      return null;
    }
    return this._mapMessage(res.rows[0]);
  }

  async purgeExpiredMessages() {
    const sql = `
      DELETE FROM messages
      WHERE expires_at <= NOW()
      RETURNING *
    `;
    const res = await query(sql, []);
    return res.rows.map(row => this._mapMessage(row));
  }
}
