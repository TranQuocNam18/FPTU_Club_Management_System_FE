import type { ReactNode } from 'react';
import { BarChart3, CheckCircle2, ShieldCheck, UsersRound } from 'lucide-react';
import { useGsapReveal } from '../../hooks/useGsapReveal';

interface AuthShellProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
  contentKey?: string;
}

const benefits = [
  { icon: UsersRound, text: 'Quản lý câu lạc bộ tập trung' },
  { icon: BarChart3, text: 'Theo dõi báo cáo và KPI rõ ràng' },
  { icon: ShieldCheck, text: 'Phân quyền an toàn theo vai trò' },
];

function AuthContentReveal({ animationKey, children }: { animationKey: string; children: ReactNode }) {
  const contentRef = useGsapReveal<HTMLDivElement>({ animationKey });
  return (
    <div ref={contentRef} data-auth-content>
      {children}
    </div>
  );
}

export function AuthShell({ eyebrow, title, subtitle, children, footer, contentKey = 'initial' }: AuthShellProps) {
  const shellRef = useGsapReveal<HTMLElement>({ includeShell: true });

  return (
    <main ref={shellRef} className="auth-page">
      <section className="auth-brand" aria-label="Giới thiệu hệ thống" data-gsap-brand>
        <div className="max-w-xl">
          <div className="mb-10 flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-[var(--radius-lg)] border border-indigo-300/20 bg-indigo-400/15 text-indigo-200">
              <ShieldCheck size={25} aria-hidden="true" />
            </div>
            <div>
              <p className="text-base font-bold tracking-tight text-white">FPTU Club</p>
              <p className="text-[13px] text-[var(--color-text-muted)]">Report System</p>
            </div>
          </div>
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-indigo-300">University club management</p>
          <h1 className="max-w-lg text-4xl font-bold leading-[1.15] tracking-[-0.03em] text-white xl:text-5xl">
            Vận hành câu lạc bộ minh bạch, hiệu quả hơn.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-[var(--color-text-muted)]">
            Một không gian thống nhất cho hoạt động, báo cáo, tài chính và hiệu suất của cộng đồng FPT University.
          </p>
          <ul className="mt-10 grid gap-4" aria-label="Điểm nổi bật">
            {benefits.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm font-medium text-slate-200">
                <CheckCircle2 size={18} className="text-[var(--color-success)]" aria-hidden="true" />
                <Icon size={18} className="text-indigo-300" aria-hidden="true" />
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="auth-form-pane">
        <div className="auth-card" data-gsap-card>
          <header className="mb-8">
            <p className="mb-2 text-[13px] font-semibold uppercase tracking-[0.14em] text-indigo-300">{eyebrow}</p>
            <h2 className="text-3xl font-bold tracking-[-0.025em] text-white">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">{subtitle}</p>
          </header>
          <AuthContentReveal animationKey={contentKey}>{children}</AuthContentReveal>
          <footer className="mt-7 border-t border-[var(--color-border)] pt-6 text-center text-sm text-[var(--color-text-muted)]">
            {footer}
          </footer>
        </div>
      </section>
    </main>
  );
}
