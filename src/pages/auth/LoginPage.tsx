import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Shield, Eye, EyeOff, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '../../api/auth.api';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../../components/ui/Button';

const schema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
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
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      const meRes = await authApi.me();
      setAuth(meRes.data.data, accessToken, refreshToken);
      toast.success('Đăng nhập thành công!');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Đăng nhập thất bại');
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 bg-indigo-500 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-violet-500 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-2xl animate-pulse-ring">
            <Shield size={36} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight">
            FPTU Club<br />Report System
          </h1>
          <p className="text-slate-400 text-lg max-w-sm mx-auto leading-relaxed">
            Nền tảng quản lý câu lạc bộ thông minh của Đại học FPT
          </p>
          <div className="grid grid-cols-3 gap-4 pt-4">
            {['15+ Chức năng', '5 Microservices', 'Real-time'].map(f => (
              <div key={f} className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                <p className="text-white text-xs font-semibold">{f}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-900 lg:bg-transparent">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-2xl p-8 lg:p-10 animate-fadeIn border border-slate-100/50">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Chào mừng trở lại 👋</h2>
              <p className="text-slate-500 text-sm mt-1">Đăng nhập vào tài khoản của bạn</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
              <div className="auth-input-group">
                <label className="auth-label">Email</label>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="your.name@fpt.edu.vn"
                  className="auth-input"
                />
                {errors.email && <p className="text-red-500 text-xs mt-0.5">{errors.email.message}</p>}
              </div>

              <div className="auth-input-group">
                <label className="auth-label">Mật khẩu</label>
                <div className="relative">
                  <input
                    {...register('password')}
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="auth-input pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-0.5">{errors.password.message}</p>}
              </div>

              <Button
                type="submit"
                loading={isSubmitting}
                icon={<LogIn size={16} />}
                className="w-full py-3 mt-2 font-semibold"
                size="lg"
              >
                Đăng nhập
              </Button>
            </form>

            <p className="text-center text-sm text-slate-500 mt-6">
              Chưa có tài khoản?{' '}
              <Link to="/register" className="text-indigo-600 font-semibold hover:underline">
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
