import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Shield, Eye, EyeOff, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '../../api/auth.api';
import { Button } from '../../components/ui/Button';

const schema = z.object({
  fullName: z.string().min(3, 'Họ tên tối thiểu 3 ký tự'),
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
  confirmPassword: z.string(),
  role: z.enum(['Student', 'ClubManager', 'Admin', 'Advisor']),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
});
type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'Student' },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await authApi.register({ email: data.email, password: data.password, fullName: data.fullName, role: data.role });
      toast.success('Đăng ký thành công! Vui lòng đăng nhập.');
      navigate('/login');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Đăng ký thất bại');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-2xl mb-4 animate-pulse-ring">
            <Shield size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Tạo tài khoản mới</h1>
          <p className="text-slate-400 text-sm mt-1.5">FPTU Club Report System</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8 animate-fadeIn border border-slate-100/50">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="auth-input-group">
              <label className="auth-label">Họ và tên</label>
              <input
                {...register('fullName')}
                placeholder="Nguyễn Văn A"
                className="auth-input"
              />
              {errors.fullName && <p className="text-red-500 text-xs mt-0.5">{errors.fullName.message}</p>}
            </div>

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
              <label className="auth-label">Vai trò</label>
              <select
                {...register('role')}
                className="auth-input bg-white"
              >
                <option value="Student">Sinh viên</option>
                <option value="ClubManager">Quản lý CLB</option>
                <option value="Advisor">Cố vấn</option>
                <option value="Admin">Quản trị viên</option>
              </select>
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
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 focus:outline-none">
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-0.5">{errors.password.message}</p>}
            </div>

            <div className="auth-input-group">
              <label className="auth-label">Xác nhận mật khẩu</label>
              <input
                {...register('confirmPassword')}
                type="password"
                placeholder="••••••••"
                className="auth-input"
              />
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-0.5">{errors.confirmPassword.message}</p>}
            </div>

            <Button
              type="submit"
              loading={isSubmitting}
              icon={<UserPlus size={16} />}
              className="w-full py-3 mt-2 font-semibold"
              size="lg"
            >
              Tạo tài khoản
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-5">
            Đã có tài khoản?{' '}
            <Link to="/login" className="text-indigo-600 font-semibold hover:underline">Đăng nhập</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
