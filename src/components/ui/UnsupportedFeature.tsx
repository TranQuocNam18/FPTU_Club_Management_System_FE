import React from 'react';
import { Construction } from 'lucide-react';

interface UnsupportedFeatureProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
}

export function UnsupportedFeature({
  title = 'Chuc nang chua duoc phat trien',
  description = 'Backend hoac API Gateway hien tai chua ho tro chuc nang nay. Phan giao dien se duoc ket noi sau khi API san sang.',
  icon,
}: UnsupportedFeatureProps) {
  return (
    <div className="rounded-2xl border border-amber-100 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-500">
        {icon ?? <Construction size={30} />}
      </div>
      <h2 className="text-base font-semibold text-slate-800">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">{description}</p>
    </div>
  );
}
