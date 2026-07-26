import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '../../api/auth.api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { PasswordInput } from '../../components/ui/PasswordInput';
import { FormField } from '../../components/ui/FormField';
import { Alert } from '../../components/ui/Alert';
import { AuthShell } from '../../components/auth/AuthShell';
import { getApiError } from '../../utils';

const schema = z.object({
  fullName: z.string().trim().min(3, 'Họ tên tối thiểu 3 ký tự'),
  email: z.string().trim().min(1, 'Vui lòng nhập email').email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
  confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
});
type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema), mode: 'onBlur' });

  const onSubmit = async (data: FormData) => {
    setSubmitError(null);
    try {
      await authApi.register(data);
      toast.success('Đăng ký thành công. Vui lòng xác minh email.');
      navigate(`/verify-email?email=${encodeURIComponent(data.email)}`);
    } catch (error: unknown) {
      setSubmitError(getApiError(error, 'Không thể tạo tài khoản. Vui lòng thử lại.'));
    }
  };

  return (
    <AuthShell
      eyebrow="Bắt đầu cùng FPTU Club"
      title="Tạo tài khoản"
      subtitle="Đăng ký để theo dõi hoạt động và tham gia cộng đồng câu lạc bộ."
      footer={(
        <p>
          Đã có tài khoản?{' '}
          <Link className="font-semibold text-indigo-300 hover:text-indigo-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]" to="/login">
            Đăng nhập
          </Link>
        </p>
      )}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
        {submitError && <Alert title="Chưa thể tạo tài khoản" message={submitError} />}

        <FormField id="register-name" label="Họ và tên" error={errors.fullName?.message} required>
          <Input
            id="register-name"
            autoComplete="name"
            placeholder="Nguyễn Văn A"
            error={Boolean(errors.fullName)}
            aria-describedby={errors.fullName ? 'register-name-error' : undefined}
            {...register('fullName')}
          />
        </FormField>

        <FormField id="register-email" label="Email" error={errors.email?.message} required>
          <Input
            id="register-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="your.name@fpt.edu.vn"
            error={Boolean(errors.email)}
            aria-describedby={errors.email ? 'register-email-error' : undefined}
            {...register('email')}
          />
        </FormField>

        <FormField id="register-password" label="Mật khẩu" error={errors.password?.message} hint="Tối thiểu 6 ký tự" required>
          <PasswordInput
            id="register-password"
            autoComplete="new-password"
            placeholder="Tạo mật khẩu"
            error={Boolean(errors.password)}
            aria-describedby={errors.password ? 'register-password-error' : 'register-password-hint'}
            {...register('password')}
          />
        </FormField>

        <FormField id="register-confirm-password" label="Xác nhận mật khẩu" error={errors.confirmPassword?.message} required>
          <PasswordInput
            id="register-confirm-password"
            autoComplete="new-password"
            placeholder="Nhập lại mật khẩu"
            error={Boolean(errors.confirmPassword)}
            aria-describedby={errors.confirmPassword ? 'register-confirm-password-error' : undefined}
            {...register('confirmPassword')}
          />
        </FormField>

        <Button type="submit" loading={isSubmitting} icon={<UserPlus size={18} aria-hidden="true" />} size="lg" className="mt-2 w-full">
          {isSubmitting ? 'Đang tạo tài khoản' : 'Tạo tài khoản'}
        </Button>
      </form>
    </AuthShell>
  );
}
