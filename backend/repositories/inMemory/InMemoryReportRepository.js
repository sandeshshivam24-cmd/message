import { ReportRepository } from '../ReportRepository.js';

export class InMemoryReportRepository extends ReportRepository {
  constructor() {
    super();
    this.reports = [];
  }

  async createReport(reportData) {
    const id = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newReport = {
      id,
      reporterId: reportData.reporterId,
      reportedUserId: reportData.reportedUserId,
      reason: reportData.reason,
      details: reportData.details || '',
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    this.reports.push(newReport);
    return { ...newReport };
  }

  async getReports() {
    return [...this.reports];
  }
}
