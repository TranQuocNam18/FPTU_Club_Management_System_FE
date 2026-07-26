import type { ActivityReport } from '../../types';
import { ReportStatusMap, ReportTypeMap } from '../../types';

export function reportStatus(report: ActivityReport) {
  return ReportStatusMap[report.status] ?? String(report.status);
}

export function reportType(report: ActivityReport) {
  return ReportTypeMap[report.type] ?? String(report.type || 'General');
}
