import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Shield, Eye, EyeOff, LogIn, Mail, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '../../api/auth.api';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../../components/ui/Button';

const schema = z.object({
  email: z.string().email('Email khong hop le'),
  password: z.string().min(6, 'Mat khau toi thieu 6 ky tu'),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [showPass, setShowPass] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await authApi.login(data);
      const { accessToken, refreshToken } = res.data.data;
      
      // Set tokens in store first so the api.me call has the authorization header
      useAuthStore.getState().setAccessToken(accessToken);
      useAuthStore.getState().setRefreshToken(refreshToken);
      
      const meRes = await authApi.me();
      setAuth(meRes.data.data, accessToken, refreshToken);
      toast.success('Dang nhap thanh cong!');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Dang nhap that bai');
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-[#0B1120] via-[#111827] to-[#0B1120] overflow-hidden">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-16 relative overflow-hidden border-r border-slate-800/40">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b12_1px,transparent_1px),linear-gradient(to_bottom,#1e293b12_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
        </div>
        <div className="relative z-10 text-center space-y-6">
          <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-cyan-400 via-cyan-500 to-cyan-700 flex items-center justify-center shadow-[0_12px_40px_-12px_rgba(6,182,212,0.5)] animate-pulse-ring">
            <Shield size={44} className="text-white" />
          </div>
          <h1 className="text-4xl font-extrabold text-white leading-tight tracking-tight">
            FPTU Club<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-cyan-200 to-white">
              Report System
            </span>
          </h1>
          <p className="text-slate-400 text-lg max-w-sm mx-auto leading-relaxed">
            Nen tang chuyen doi so toan dien cho cong tac quan ly va bao cao hoat dong cau lac bo.
          </p>
          <div className="grid grid-cols-3 gap-4 pt-6 max-w-md mx-auto">
            {[
              { label: 'Thong minh', desc: '15+ Tinh nang' },
              { label: 'Chuan hoa', desc: 'Microservices' },
              { label: 'Real-time', desc: 'SignalR Hub' }
            ].map(f => (
              <div key={f.label} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 backdrop-blur-md">
                <p className="text-white text-sm font-semibold">{f.label}</p>
                <p className="text-slate-500 text-xs mt-1">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
        <div className="absolute inset-0 block lg:hidden">
          <div className="absolute top-10 right-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl" />
        </div>
        <div className="w-full max-w-md z-10">
          <div className="glass-card rounded-3xl p-8 lg:p-10 animate-fadeIn">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white tracking-tight">Chao mung</h2>
              <p className="text-slate-400 text-sm mt-2">Dang nhap tai khoan FPTU Club Portal</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
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
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 focus:outline-none"
                  >
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <p className="text-rose-500 text-xs mt-1">{errors.password.message}</p>}
              </div>

              <Button
                type="submit"
                loading={isSubmitting}
                icon={<LogIn size={16} />}
                className="w-full py-3.5 mt-2 font-semibold bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 border-none text-white shadow-lg shadow-cyan-500/20"
                size="lg"
              >
                Dang nhap
              </Button>
            </form>

            <p className="text-center text-sm text-slate-400 mt-6">
              Chua co tai khoan?{' '}
              <Link to="/register" className="text-cyan-400 font-semibold hover:text-cyan-300 transition-colors">
                Dang ky ngay
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
