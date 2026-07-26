import { type FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { MailCheck, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '../../api/auth.api';
import { AuthShell } from '../../components/auth/AuthShell';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { FormField } from '../../components/ui/FormField';
import { Input } from '../../components/ui/Input';
import { getApiError } from '../../utils';

const RESEND_COOLDOWN_SECONDS = 60;

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState(params.get('email') ?? '');
  const [code, setCode] = useState('');
  const [errors, setErrors] = useState<{ email?: string; code?: string }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => {
      setCooldown((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  const validate = (includeCode: boolean) => {
    const nextErrors: { email?: string; code?: string } = {};
    if (!email.trim()) nextErrors.email = 'Vui lòng nhập email';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) nextErrors.email = 'Email không hợp lệ';
    if (includeCode && !code.trim()) nextErrors.code = 'Vui lòng nhập mã xác minh';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const verify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);
    if (!validate(true)) return;

    setLoading(true);
    try {
      await authApi.verifyEmail(email, code);
      toast.success('Xác minh email thành công');
      navigate('/login');
    } catch (error: unknown) {
      setSubmitError(getApiError(error, 'Không thể xác minh email. Vui lòng kiểm tra mã và thử lại.'));
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setSubmitError(null);
    if (!validate(false) || cooldown > 0) return;

    setResending(true);
    try {
      await authApi.resendVerification(email);
      setCooldown(RESEND_COOLDOWN_SECONDS);
      toast.success('Đã gửi lại mã xác minh');
    } catch (error: unknown) {
      setSubmitError(getApiError(error, 'Không thể gửi lại mã xác minh.'));
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Bảo mật tài khoản"
      title="Xác minh email"
      subtitle="Nhập mã xác minh đã được gửi tới email của bạn để kích hoạt tài khoản."
      footer={(
        <Link className="font-semibold text-indigo-300 hover:text-indigo-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]" to="/login">
          Quay lại đăng nhập
        </Link>
      )}
    >
      <form onSubmit={verify} className="grid gap-5" noValidate>
        {submitError && <Alert title="Xác minh chưa thành công" message={submitError} />}

        <FormField id="verify-email" label="Email" error={errors.email} required>
          <Input
            id="verify-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setErrors((current) => ({ ...current, email: undefined }));
            }}
            placeholder="your.name@fpt.edu.vn"
            error={Boolean(errors.email)}
            aria-describedby={errors.email ? 'verify-email-error' : undefined}
          />
        </FormField>

        <FormField id="verify-code" label="Mã xác minh" error={errors.code} hint="Kiểm tra cả thư mục spam nếu bạn chưa thấy email." required>
          <Input
            id="verify-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(event) => {
              setCode(event.target.value);
              setErrors((current) => ({ ...current, code: undefined }));
            }}
            placeholder="Nhập mã xác minh"
            error={Boolean(errors.code)}
            aria-describedby={errors.code ? 'verify-code-error' : 'verify-code-hint'}
          />
        </FormField>

        <Button type="submit" size="lg" loading={loading} icon={<MailCheck size={18} aria-hidden="true" />} className="w-full" data-gsap-item>
          {loading ? 'Đang xác minh' : 'Xác minh email'}
        </Button>

        <Button
          type="button"
          variant="outline"
          loading={resending}
          disabled={cooldown > 0}
          onClick={resend}
          icon={<RefreshCw size={17} aria-hidden="true" />}
          className="w-full"
          data-gsap-item
        >
          {resending ? 'Đang gửi lại' : cooldown > 0 ? `Gửi lại sau ${cooldown}s` : 'Gửi lại mã'}
        </Button>
      </form>
    </AuthShell>
  );
}
