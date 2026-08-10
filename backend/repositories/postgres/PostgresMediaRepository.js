import { MediaRepository } from '../MediaRepository.js';
import { query } from '../../config/db.js';

export class PostgresMediaRepository extends MediaRepository {
  _mapMedia(row) {
    if (!row) return null;
    return {
      id: row.id,
      filename: row.filename,
      originalName: row.original_name,
      mimeType: row.mime_type,
      size: Number(row.size),
      url: row.url,
      type: row.type,
      uploadedAt: row.uploaded_at ? new Date(row.uploaded_at).toISOString() : new Date().toISOString()
    };
  }

  async saveFile(fileData) {
    const id = fileData.id || `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const sql = `
      INSERT INTO media (id, filename, original_name, mime_type, size, url, type, uploaded_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING *
    `;
    const values = [
      id,
      fileData.filename,
      fileData.originalname || fileData.filename,
      fileData.mimetype || fileData.mimeType,
      fileData.size,
      fileData.url,
      fileData.type || (fileData.mimetype?.startsWith('image/') ? 'image' : 'file')
    ];
    const res = await query(sql, values);
    return this._mapMedia(res.rows[0]);
  }

  async saveMedia(mediaData) {
    return this.saveFile(mediaData);
  }

  async getFileById(id) {
    const res = await query('SELECT * FROM media WHERE id = $1', [id]);
    return this._mapMedia(res.rows[0]);
  }

  async findById(id) {
    return this.getFileById(id);
  }
}
