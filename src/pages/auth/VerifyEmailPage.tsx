import { Link } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import { UnsupportedFeature } from '../../components/ui/UnsupportedFeature';

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#070b13] p-4 font-sans">
      <div className="w-full max-w-md rounded-3xl border border-cyan-500/40 bg-[#0b1120] p-8 shadow-[0_0_35px_rgba(6,182,212,0.25)]">
        <UnsupportedFeature
          icon={<MailCheck size={30} />}
          title="Xac thuc email chua duoc phat trien"
          description="Backend hien tai chua co API verify-email/resend-verification-email. Tai khoan sau khi dang ky se dang nhap truc tiep bang email va mat khau."
        />
        <Link
          to="/login"
          className="mt-5 block rounded-xl bg-cyan-500 px-4 py-3 text-center text-sm font-bold text-white transition-colors hover:bg-cyan-600"
        >
          Quay lai dang nhap
        </Link>
      </div>
    </div>
  );
}
