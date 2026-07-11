import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string, fmt = 'dd/MM/yyyy') {
  try {
    return format(parseISO(dateStr), fmt);
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr: string) {
  return formatDate(dateStr, 'dd/MM/yyyy HH:mm');
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    Active: 'bg-emerald-100 text-emerald-700',
    Approved: 'bg-emerald-100 text-emerald-700',
    Upcoming: 'bg-blue-100 text-blue-700',
    Pending: 'bg-amber-100 text-amber-700',
    Draft: 'bg-gray-100 text-gray-600',
    Suspended: 'bg-orange-100 text-orange-700',
    Rejected: 'bg-red-100 text-red-700',
    Inactive: 'bg-gray-100 text-gray-500',
    Cancelled: 'bg-red-100 text-red-600',
    Ongoing: 'bg-purple-100 text-purple-700',
    Completed: 'bg-emerald-100 text-emerald-700',
    Adjusted: 'bg-indigo-100 text-indigo-700',
    Income: 'bg-emerald-100 text-emerald-700',
    Expense: 'bg-red-100 text-red-700',
  };
  return map[status] ?? 'bg-gray-100 text-gray-600';
}

export function getRoleLabel(role: string): string {
  const map: Record<string, string> = {
    Admin: 'Quan tri vien',
    Advisor: 'Co van',
    ClubManager: 'Quan ly CLB',
    Student: 'Sinh vien',
    Leader: 'Chu nhiem',
    Treasurer: 'Thu quy',
    Member: 'Thanh vien',
  };
  return map[role] ?? role;
}

export function truncate(str: string, max = 80) {
  return str.length > max ? str.slice(0, max) + '...' : str;
}
