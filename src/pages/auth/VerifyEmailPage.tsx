import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, Mail, MailCheck, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '../../api/auth.api';
import { Button } from '../../components/ui/Button';

function getApiErrorMessage(err: any, fallback: string) {
  const data = err?.response?.data;
  if (!data) return fallback;
  if (typeof data.message === 'string' && data.message) return data.message;
  if (Array.isArray(data.errors)) return data.errors.join('\n');
  if (data.errors && typeof data.errors === 'object') {
    return Object.values(data.errors).flat().join('\n');
  }
  return fallback;
}

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialEmail = (location.state as { email?: string } | null)?.email ?? '';
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleVerify = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedCode = code.trim();
    if (!normalizedEmail || !normalizedCode) {
      toast.error('Vui long nhap email va ma xac minh');
      return;
    }

    try {
      setIsVerifying(true);
      const res = await authApi.verifyEmail({ email: normalizedEmail, code: normalizedCode });
      toast.success(res.data.message || 'Xac thuc tai khoan thanh cong.');
      navigate('/login');
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, 'Ma xac minh khong dung hoac da het han'));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      toast.error('Vui long nhap email');
      return;
    }

    try {
      setIsResending(true);
      const res = await authApi.resendVerificationEmail({ email: normalizedEmail });
      toast.success(res.data.message || 'Da gui lai ma xac minh.');
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, 'Khong gui lai duoc ma xac minh'));
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0B1120] via-[#111827] to-[#0B1120] p-6 overflow-y-auto relative">
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md z-10 py-8">
        <div className="text-center mb-6">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-cyan-400 via-cyan-500 to-cyan-700 flex items-center justify-center shadow-[0_12px_40px_-12px_rgba(6,182,212,0.5)] mb-4 animate-pulse-ring">
            <MailCheck size={36} className="text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Xac thuc email</h1>
          <p className="text-slate-400 text-sm mt-1.5">FPTU Club Report System</p>
        </div>

        <form onSubmit={handleVerify} className="glass-card rounded-3xl p-8 animate-fadeIn flex flex-col gap-4">
          <div className="auth-input-group">
            <label className="auth-label text-slate-400">Email</label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <Mail size={18} />
              </div>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                placeholder="you@example.com"
                className="auth-input"
              />
            </div>
          </div>

          <div className="auth-input-group">
            <label className="auth-label text-slate-400">Ma xac minh</label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <Shield size={18} />
              </div>
              <input
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="Nhap ma 6 so"
                className="auth-input"
                style={{ paddingRight: '6rem' }}
              />
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending}
                className="absolute right-3 top-1/2 -translate-y-1/2 border-l border-slate-700 pl-3 text-sm font-semibold text-cyan-400 transition-colors hover:text-cyan-300 disabled:cursor-not-allowed disabled:text-slate-500"
              >
                {isResending ? 'Dang gui' : 'Gui'}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            loading={isVerifying}
            icon={<CheckCircle2 size={16} />}
            className="w-full py-3.5 mt-2 font-semibold bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 border-none text-white shadow-lg shadow-cyan-500/20"
            size="lg"
          >
            Xac thuc tai khoan
          </Button>

          <Link
            to="/login"
            className="text-center text-sm font-semibold text-slate-400 transition-colors hover:text-cyan-300"
          >
            Quay lai dang nhap
          </Link>
        </form>
      </div>
    </div>
  );
}
