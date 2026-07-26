import { type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound, Mail, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '../../api/auth.api';
import { AuthShell } from '../../components/auth/AuthShell';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { FormField } from '../../components/ui/FormField';
import { Input } from '../../components/ui/Input';
import { PasswordInput } from '../../components/ui/PasswordInput';
import { getApiError } from '../../utils';

type Step = 'request' | 'reset';
type FormState = {
  email: string;
  resetCode: string;
  newPassword: string;
  confirmNewPassword: string;
};
type FieldErrors = Partial<Record<keyof FormState, string>>;

export default function PasswordRecoveryPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('request');
  const [form, setForm] = useState<FormState>({
    email: '',
    resetCode: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const updateField = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const validate = () => {
    const nextErrors: FieldErrors = {};
    if (!form.email.trim()) nextErrors.email = 'Vui lòng nhập email';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) nextErrors.email = 'Email không hợp lệ';

    if (step === 'reset') {
      if (!form.resetCode.trim()) nextErrors.resetCode = 'Vui lòng nhập mã đặt lại';
      if (form.newPassword.length < 6) nextErrors.newPassword = 'Mật khẩu tối thiểu 6 ký tự';
      if (!form.confirmNewPassword) nextErrors.confirmNewPassword = 'Vui lòng xác nhận mật khẩu';
      else if (form.newPassword !== form.confirmNewPassword) {
        nextErrors.confirmNewPassword = 'Mật khẩu xác nhận không khớp';
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);
    if (!validate()) return;

    setLoading(true);
    try {
      if (step === 'request') {
        await authApi.forgotPassword(form.email);
        setStep('reset');
        toast.success('Đã gửi mã đặt lại mật khẩu');
      } else {
        await authApi.resetPassword(form);
        toast.success('Đặt lại mật khẩu thành công');
        navigate('/login');
      }
    } catch (error: unknown) {
      setSubmitError(getApiError(error, 'Không thể xử lý yêu cầu. Vui lòng thử lại.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Khôi phục truy cập"
      title={step === 'request' ? 'Quên mật khẩu?' : 'Tạo mật khẩu mới'}
      subtitle={step === 'request'
        ? 'Nhập email tài khoản để nhận mã đặt lại mật khẩu.'
        : `Nhập mã đã gửi tới ${form.email} và chọn mật khẩu mới.`}
      contentKey={step}
      footer={(
        <Link className="font-semibold text-indigo-300 hover:text-indigo-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]" to="/login">
          Quay lại đăng nhập
        </Link>
      )}
    >
      <form onSubmit={submit} className="grid gap-5" noValidate>
        {submitError && <Alert title="Yêu cầu chưa thành công" message={submitError} />}

        <FormField id="recovery-email" label="Email" error={errors.email} required>
          <Input
            id="recovery-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={form.email}
            disabled={step === 'reset'}
            onChange={(event) => updateField('email', event.target.value)}
            placeholder="your.name@fpt.edu.vn"
            error={Boolean(errors.email)}
            aria-describedby={errors.email ? 'recovery-email-error' : undefined}
          />
        </FormField>

        {step === 'reset' && (
          <>
            <FormField id="recovery-code" label="Mã đặt lại" error={errors.resetCode} required>
              <Input
                id="recovery-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={form.resetCode}
                onChange={(event) => updateField('resetCode', event.target.value)}
                placeholder="Nhập mã xác nhận"
                error={Boolean(errors.resetCode)}
                aria-describedby={errors.resetCode ? 'recovery-code-error' : undefined}
              />
            </FormField>
            <FormField id="recovery-password" label="Mật khẩu mới" error={errors.newPassword} hint="Tối thiểu 6 ký tự" required>
              <PasswordInput
                id="recovery-password"
                autoComplete="new-password"
                value={form.newPassword}
                onChange={(event) => updateField('newPassword', event.target.value)}
                placeholder="Tạo mật khẩu mới"
                error={Boolean(errors.newPassword)}
                aria-describedby={errors.newPassword ? 'recovery-password-error' : 'recovery-password-hint'}
              />
            </FormField>
            <FormField id="recovery-confirm" label="Xác nhận mật khẩu" error={errors.confirmNewPassword} required>
              <PasswordInput
                id="recovery-confirm"
                autoComplete="new-password"
                value={form.confirmNewPassword}
                onChange={(event) => updateField('confirmNewPassword', event.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                error={Boolean(errors.confirmNewPassword)}
                aria-describedby={errors.confirmNewPassword ? 'recovery-confirm-error' : undefined}
              />
            </FormField>
          </>
        )}

        <Button
          type="submit"
          size="lg"
          loading={loading}
          icon={step === 'request' ? <Mail size={18} aria-hidden="true" /> : <KeyRound size={18} aria-hidden="true" />}
          className="w-full"
          data-gsap-item
        >
          {loading ? 'Đang xử lý' : step === 'request' ? 'Gửi mã đặt lại' : 'Đặt lại mật khẩu'}
        </Button>

        {step === 'reset' && (
          <Button type="button" variant="ghost" onClick={() => setStep('request')} icon={<RotateCcw size={17} aria-hidden="true" />} data-gsap-item>
            Dùng email khác
          </Button>
        )}
      </form>
    </AuthShell>
  );
}
