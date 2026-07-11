import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HelpCircle, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-100 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.1),transparent_50%)]" />
      <div className="max-w-md w-full bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 p-8 rounded-3xl shadow-2xl relative z-10 text-center space-y-6">
        <div className="w-16 h-16 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/5">
          <HelpCircle size={32} />
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold text-white tracking-tight">404</h1>
          <h2 className="text-xl font-bold text-slate-200">Khong tim thay trang</h2>
          <p className="text-slate-400 text-sm">
            Duong dan ban truy cap khong ton tai hoac da bi go bo khoi he thong.
          </p>
        </div>

        <div className="pt-2">
          <Button
            variant="primary"
            className="w-full"
            onClick={() => navigate('/dashboard')}
            icon={<ArrowLeft size={16} />}
          >
            Quay l?i trang ch?
          </Button>
        </div>
      </div>
    </div>
  );
}
