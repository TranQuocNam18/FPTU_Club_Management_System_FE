import { type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, KeyRound, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '../../api/auth.api';
import { getApiErrorMessage } from '../../utils/apiError';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const normalizedEmail = email.trim().toLowerCase();

  const handleRequestCode = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      const res = await authApi.forgotPassword({ email: normalizedEmail });
      toast.success(res.data.message || 'Reset code has been sent if the email exists.');
      setStep('reset');
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, 'Khong the gui ma dat lai mat khau'));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (event: FormEvent) => {
    event.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('Mat khau xac nhan khong khop');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.resetPassword({
        email: normalizedEmail,
        resetCode: resetCode.trim(),
        newPassword,
        confirmNewPassword: confirmPassword,
      });
      toast.success(res.data.message || 'Password reset successfully.');
      navigate('/login');
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, 'Khong the dat lai mat khau'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#070b13] p-4 font-sans">
      <div className="w-full max-w-md rounded-3xl border border-cyan-500/40 bg-[#0b1120] p-8 shadow-[0_0_35px_rgba(6,182,212,0.25)]">
        <Link to="/login" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white">
          <ArrowLeft size={16} /> Back to login
        </Link>

        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-300">
            {step === 'email' ? <Mail size={28} /> : <KeyRound size={28} />}
          </div>
          <h1 className="text-2xl font-bold text-white">Forgot password</h1>
          <p className="mt-2 text-sm text-slate-400">
            {step === 'email'
              ? 'Enter your email to receive a reset code.'
              : 'Enter the reset code and set a new password.'}
          </p>
        </div>

        {step === 'email' ? (
          <form onSubmit={handleRequestCode} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Email</label>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500"
                placeholder="you@example.com"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-cyan-500 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-cyan-600 disabled:cursor-wait disabled:opacity-60"
            >
              {loading ? 'Sending...' : 'Send reset code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Email</label>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Reset code</label>
              <input
                value={resetCode}
                onChange={(event) => setResetCode(event.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500"
                placeholder="123456"
                inputMode="numeric"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">New password</label>
              <input
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                type="password"
                minLength={6}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Confirm password</label>
              <input
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                type="password"
                minLength={6}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500"
                required
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep('email')}
                className="flex-1 rounded-xl border border-slate-700 px-4 py-3 text-sm font-bold text-slate-300 transition-colors hover:bg-slate-900"
              >
                Change email
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-xl bg-cyan-500 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-cyan-600 disabled:cursor-wait disabled:opacity-60"
              >
                {loading ? 'Resetting...' : 'Reset password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
