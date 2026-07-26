export const routeLabels: Record<string, string> = {
  dashboard: 'Tổng quan',
  clubs: 'Câu lạc bộ',
  events: 'Lịch hoạt động',
  reports: 'Báo cáo',
  finance: 'Tài chính',
  kpi: 'KPI & Semester',
  notifications: 'Thông báo',
  admin: 'Quản trị',
  users: 'Người dùng',
};

export function isRouteIdentifier(segment: string) {
  return /^[0-9a-f-]{16,}$/i.test(segment) || /^\d+$/.test(segment);
}

export function getPageTitle(pathname: string) {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return 'Tổng quan';
  const last = segments[segments.length - 1];
  if (isRouteIdentifier(last)) return 'Chi tiết câu lạc bộ';
  return routeLabels[last] ?? 'FPTU Club Report';
}
