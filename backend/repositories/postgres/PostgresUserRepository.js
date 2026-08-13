import { UserRepository } from '../UserRepository.js';
import { query } from '../../config/db.js';

export class PostgresUserRepository extends UserRepository {
  _mapUser(row) {
    if (!row) return null;
    return {
      id: row.id,
      username: row.username,
      displayName: row.display_name,
      passwordHash: row.password_hash,
      avatarUrl: row.avatar_url || '',
      statusMessage: row.status_message || 'Hey there! I am using Messenger.',
      isOnline: row.is_online || false,
      lastSeen: row.last_seen ? new Date(row.last_seen).toISOString() : new Date().toISOString(),
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString()
    };
  }

  async findById(id) {
    const res = await query('SELECT * FROM users WHERE id = $1', [id]);
    return this._mapUser(res.rows[0]);
  }

  async findByUsername(username) {
    const res = await query('SELECT * FROM users WHERE LOWER(username) = LOWER($1)', [username]);
    return this._mapUser(res.rows[0]);
  }

  async create(userData) {
    const id = userData.id || `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const displayName = userData.displayName || userData.username;
    const avatarUrl = userData.avatarUrl || '';
    const statusMessage = userData.statusMessage || 'Hey there! I am using Messenger.';

    const sql = `
      INSERT INTO users (id, username, display_name, password_hash, avatar_url, status_message, is_online, last_seen)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING *
    `;
    const values = [id, userData.username, displayName, userData.passwordHash, avatarUrl, statusMessage, false];
    const res = await query(sql, values);
    return this._mapUser(res.rows[0]);
  }

  async update(id, updateData) {
    const fields = [];
    const values = [];
    let idx = 1;

    if (updateData.displayName !== undefined) {
      fields.push(`display_name = $${idx++}`);
      values.push(updateData.displayName);
    }
    if (updateData.statusMessage !== undefined) {
      fields.push(`status_message = $${idx++}`);
      values.push(updateData.statusMessage);
    }
    if (updateData.avatarUrl !== undefined) {
      fields.push(`avatar_url = $${idx++}`);
      values.push(updateData.avatarUrl);
    }
    if (updateData.isOnline !== undefined) {
      fields.push(`is_online = $${idx++}`);
      values.push(updateData.isOnline);
    }
    if (updateData.lastSeen !== undefined) {
      fields.push(`last_seen = $${idx++}`);
      values.push(updateData.lastSeen ? new Date(updateData.lastSeen) : new Date());
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
    const res = await query(sql, values);
    return this._mapUser(res.rows[0]);
  }

  async updateOnlineStatus(id, isOnline, lastSeen = new Date().toISOString()) {
    return await this.update(id, { isOnline, lastSeen });
  }

  async searchUsers(searchQuery, currentUserId) {
    const q = `%${searchQuery.toLowerCase().trim()}%`;
    const sql = `
      SELECT id, username, display_name, avatar_url, status_message, is_online, last_seen, created_at
      FROM users
      WHERE id != $1 AND (LOWER(username) LIKE $2 OR LOWER(display_name) LIKE $2)
      ORDER BY display_name ASC
    `;
    const res = await query(sql, [currentUserId, q]);
    return res.rows.map(row => this._mapUser(row));
  }

  async findAllExcept(currentUserId) {
    const sql = `
      SELECT id, username, display_name, avatar_url, status_message, is_online, last_seen, created_at
      FROM users
      WHERE id != $1
      ORDER BY display_name ASC
    `;
    const res = await query(sql, [currentUserId]);
    return res.rows.map(row => this._mapUser(row));
  }
}
