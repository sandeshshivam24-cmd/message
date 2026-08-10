/**
 * ReportRepository Interface / Base Class
 * Contract for managing user moderation reports.
 */
export class ReportRepository {
  async createReport(reportData) {
    throw new Error('Method createReport() must be implemented');
  }

  async getReports() {
    throw new Error('Method getReports() must be implemented');
  }
}
