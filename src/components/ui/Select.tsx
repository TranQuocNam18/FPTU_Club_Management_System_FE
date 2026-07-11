import React, { forwardRef } from 'react';
import { cn } from '../../utils';

interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ options, label, error, className, id, ...props }, ref) => {
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={selectId} className="text-xs font-semibold text-slate-600 tracking-wide uppercase">
            {label}
          </label>
        )}
        <select
          {...props}
          ref={ref}
          id={selectId}
          className={cn(
            "w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-800 transition-all duration-200 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 disabled:opacity-60 disabled:cursor-not-allowed",
            error && "border-red-500 bg-red-50/10 focus:border-red-500 focus:ring-red-500/10",
            className
          )}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="text-xs font-medium text-red-500 mt-0.5 animate-fadeIn">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
