import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '../../api/auth.api';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { PasswordInput } from '../../components/ui/PasswordInput';
import { FormField } from '../../components/ui/FormField';
import { Alert } from '../../components/ui/Alert';
import { AuthShell } from '../../components/auth/AuthShell';
import { getApiError } from '../../utils';

const schema = z.object({
  email: z.string().trim().min(1, 'Vui lòng nhập email').email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema), mode: 'onBlur' });

  const onSubmit = async (data: FormData) => {
    setSubmitError(null);
    try {
      const res = await authApi.login(data);
      const { accessToken, refreshToken } = res.data.data;
      useAuthStore.getState().setAccessToken(accessToken);
      const meRes = await authApi.me();
      setAuth(meRes.data.data, accessToken, refreshToken);
      toast.success('Đăng nhập thành công');
      navigate('/dashboard');
    } catch (error: unknown) {
      setSubmitError(getApiError(error, 'Không thể đăng nhập. Vui lòng kiểm tra thông tin và thử lại.'));
    }
  };

  return (
    <AuthShell
      eyebrow="Chào mừng trở lại"
      title="Đăng nhập"
      subtitle="Sử dụng tài khoản FPT University của bạn để tiếp tục."
      footer={(
        <p>
          Chưa có tài khoản?{' '}
          <Link className="font-semibold text-indigo-300 hover:text-indigo-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]" to="/register">
            Đăng ký ngay
          </Link>
        </p>
      )}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5" noValidate>
        {submitError && <Alert title="Đăng nhập chưa thành công" message={submitError} />}

        <FormField id="login-email" label="Email" error={errors.email?.message} required>
          <Input
            id="login-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="your.name@fpt.edu.vn"
            error={Boolean(errors.email)}
            aria-describedby={errors.email ? 'login-email-error' : undefined}
            {...register('email')}
          />
        </FormField>

        <FormField id="login-password" label="Mật khẩu" error={errors.password?.message} required>
          <PasswordInput
            id="login-password"
            autoComplete="current-password"
            placeholder="Nhập mật khẩu"
            error={Boolean(errors.password)}
            aria-describedby={errors.password ? 'login-password-error' : undefined}
            {...register('password')}
          />
        </FormField>

        <div className="flex justify-end">
          <Link className="min-h-11 py-2 text-sm font-semibold text-indigo-300 hover:text-indigo-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]" to="/forgot-password">
            Quên mật khẩu?
          </Link>
        </div>

        <Button type="submit" loading={isSubmitting} icon={<LogIn size={18} aria-hidden="true" />} size="lg" className="w-full">
          {isSubmitting ? 'Đang đăng nhập' : 'Đăng nhập'}
        </Button>
      </form>
    </AuthShell>
  );
}
