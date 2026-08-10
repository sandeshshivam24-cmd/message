import { ReportRepository } from '../ReportRepository.js';
import { query } from '../../config/db.js';

export class PostgresReportRepository extends ReportRepository {
  _mapReport(row) {
    if (!row) return null;
    return {
      id: row.id,
      reporterId: row.reporter_id,
      reportedUserId: row.reported_user_id,
      reason: row.reason,
      details: row.details || '',
      status: row.status || 'pending',
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString()
    };
  }

  async createReport(reportData) {
    const id = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const sql = `
      INSERT INTO reports (id, reporter_id, reported_user_id, reason, details, status, created_at)
      VALUES ($1, $2, $3, $4, $5, 'pending', NOW())
      RETURNING *
    `;
    const values = [
      id,
      reportData.reporterId,
      reportData.reportedUserId,
      reportData.reason,
      reportData.details || ''
    ];
    const res = await query(sql, values);
    return this._mapReport(res.rows[0]);
  }

  async getReports() {
    const res = await query('SELECT * FROM reports ORDER BY created_at DESC');
    return res.rows.map(row => this._mapReport(row));
  }
}
