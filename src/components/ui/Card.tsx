import React from 'react';
import { cn } from '../../utils';
import { CountUp } from './CountUp';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className, hover = false }: CardProps) {
  return (
    <div className={cn(
      'bg-white rounded-2xl shadow-sm border border-slate-100 p-6',
      hover && 'transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer',
      className
    )}>
      {children}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  gradient: string;
  subtitle?: string;
  trend?: { value: number; positive: boolean };
}

export function StatCard({ title, value, icon, gradient, subtitle, trend }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-start gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-sm', gradient)}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-500 font-medium">{title}</p>
        <p className="text-2xl font-bold text-slate-800 mt-0.5">
          <CountUp end={value} />
        </p>
        {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        {trend && (
          <p className={cn('text-xs font-medium mt-1', trend.positive ? 'text-emerald-600' : 'text-red-500')}>
            {trend.positive ? '+' : '-'} {Math.abs(trend.value)}% vs last month
          </p>
        )}
      </div>
    </div>
  );
}
