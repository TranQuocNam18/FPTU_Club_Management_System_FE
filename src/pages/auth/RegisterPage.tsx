import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Shield, Eye, EyeOff, UserPlus, User, Mail, ShieldAlert, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '../../api/auth.api';
import { Button } from '../../components/ui/Button';

const schema = z.object({
  fullName: z.string().min(3, 'Ho ten toi thieu 3 ky tu'),
  email: z.string().email('Email khong hop le'),
  password: z.string().min(6, 'Mat khau toi thieu 6 ky tu'),
  confirmPassword: z.string(),
  role: z.enum(['Student', 'ClubManager', 'Admin', 'Advisor']),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Mat khau xac nhan khong khop',
  path: ['confirmPassword'],
});
type FormData = z.infer<typeof schema>;

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

export default function RegisterPage() {
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'Student' },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await authApi.register({
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
        fullName: data.fullName,
        role: data.role,
      });
      toast.success(res.data.message || 'Verification email has been sent.');
      navigate('/verify-email', { state: { email: data.email.trim().toLowerCase() } });
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, 'Dang ky that bai'));
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
            <Shield size={36} className="text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Tao tai khoan moi</h1>
          <p className="text-slate-400 text-sm mt-1.5">FPTU Club Report System</p>
        </div>

        <div className="glass-card rounded-3xl p-8 animate-fadeIn">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="auth-input-group">
              <label className="auth-label text-slate-400">Ho va ten</label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <User size={18} />
                </div>
                <input
                  {...register('fullName')}
                  placeholder="Nguyen Van A"
                  className="auth-input"
                />
              </div>
              {errors.fullName && <p className="text-rose-500 text-xs mt-1">{errors.fullName.message}</p>}
            </div>

            <div className="auth-input-group">
              <label className="auth-label text-slate-400">Email</label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Mail size={18} />
                </div>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="you@example.com"
                  className="auth-input"
                />
              </div>
              {errors.email && <p className="text-rose-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div className="auth-input-group">
              <label className="auth-label text-slate-400">Vai tro</label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <ShieldAlert size={18} />
                </div>
                <select
                  {...register('role')}
                  className="auth-input auth-input-has-right-icon appearance-none"
                >
                  <option value="Student" className="bg-slate-900 text-white">Sinh vien</option>
                  <option value="ClubManager" className="bg-slate-900 text-white">Quan ly CLB</option>
                  <option value="Advisor" className="bg-slate-900 text-white">Co van</option>
                  <option value="Admin" className="bg-slate-900 text-white">Quan tri vien</option>
                </select>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  ?
                </div>
              </div>
            </div>

            <div className="auth-input-group">
              <label className="auth-label text-slate-400">Mat khau</label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock size={18} />
                </div>
                <input
                  {...register('password')}
                  type={showPass ? 'text' : 'password'}
                  placeholder="********"
                  className="auth-input auth-input-has-right-icon"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 focus:outline-none">
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="text-rose-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div className="auth-input-group">
              <label className="auth-label text-slate-400">Xac nhan mat khau</label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock size={18} />
                </div>
                <input
                  {...register('confirmPassword')}
                  type="password"
                  placeholder="********"
                  className="auth-input"
                />
              </div>
              {errors.confirmPassword && <p className="text-rose-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
            </div>

            <Button
              type="submit"
              loading={isSubmitting}
              icon={<UserPlus size={16} />}
              className="w-full py-3.5 mt-2 font-semibold bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 border-none text-white shadow-lg shadow-cyan-500/20"
              size="lg"
            >
              Tao tai khoan
            </Button>
          </form>

          <p className="text-center text-sm text-slate-400 mt-5">
            Da co tai khoan?{' '}
            <Link to="/login" className="text-cyan-400 font-semibold hover:text-cyan-300 transition-colors">Dang nhap</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
