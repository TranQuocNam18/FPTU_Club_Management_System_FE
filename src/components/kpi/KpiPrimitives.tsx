import type { ReactNode } from 'react';
import { AlertCircle, ArrowDown, ArrowUp, BarChart3, Building2, RotateCcw, Trophy } from 'lucide-react';
import type { KpiLeaderboardEntry, KpiScoreHistory } from '../../api/kpi.api';
import type { Club } from '../../types';
import { cn, formatDate } from '../../utils';
import { ClubLogo } from '../clubs/ClubPrimitives';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';

export function KpiRankBadge({ rank }: { rank: number }) {
  return <span className={cn('kpi-rank', rank <= 3 && `kpi-rank--top-${rank}`)} aria-label={`Hạng ${rank}`}>#{rank}</span>;
}

export function KpiScoreText({ score }: { score: number }) {
  return <span className="kpi-score">{new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(score)} <small>điểm</small></span>;
}

export function KpiLeaderboardRow({ entry, club, onOpen }: { entry: KpiLeaderboardEntry; club?: Club; onOpen: () => void }) {
  return (
    <article className="kpi-row" data-gsap-item>
      <button type="button" onClick={onOpen}>
        <KpiRankBadge rank={entry.rank} />
        {club ? <ClubLogo club={club} size="sm" /> : <span className="kpi-club-fallback" aria-hidden="true"><Building2 size={18} /></span>}
        <div><h2>{club?.name ?? entry.clubName ?? entry.clubId}</h2><p>Semester KPI chính thức từ backend</p></div>
        <KpiScoreText score={entry.totalPoints} />
      </button>
    </article>
  );
}

export function KpiHistoryItem({ item, ruleName }: { item: KpiScoreHistory; ruleName?: string }) {
  const positive = item.points > 0;
  const neutral = item.points === 0;
  return (
    <li className="kpi-history-item">
      <span className={cn('kpi-history-item__icon', positive ? 'is-positive' : neutral ? 'is-neutral' : 'is-negative')}>
        {positive ? <ArrowUp size={16} aria-hidden="true" /> : <ArrowDown size={16} aria-hidden="true" />}
      </span>
      <div>
        <div><strong>{item.reason}</strong><span>{positive ? 'Tăng' : neutral ? 'Không đổi' : 'Giảm'} {Math.abs(item.points)} điểm</span></div>
        <p>{ruleName ?? (item.ruleId ? `Rule #${item.ruleId}` : 'Không gắn rule')} · {item.sourceType}</p>
        {item.sourceId && <p>Source #{item.sourceId}</p>}
        <time dateTime={item.createdAt}>{formatDate(item.createdAt, 'dd/MM/yyyy HH:mm')}</time>
      </div>
    </li>
  );
}

export function KpiEmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="kpi-empty"><Trophy size={29} aria-hidden="true" /><h3>{title}</h3><p>{description}</p>{action}</div>;
}

export function KpiErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div className="kpi-error" role="alert"><AlertCircle size={22} aria-hidden="true" /><div><h3>Không thể tải dữ liệu KPI</h3><p>{message}</p></div><Button size="sm" variant="outline" onClick={onRetry} icon={<RotateCcw size={15} aria-hidden="true" />}>Thử lại</Button></div>;
}

export function KpiUnavailableState({ title, description }: { title: string; description: string }) {
  return <div className="kpi-unavailable" role="status"><BarChart3 size={21} aria-hidden="true" /><div><strong>{title}</strong><p>{description}</p></div></div>;
}

export function KpiSkeleton({ count = 5 }: { count?: number }) {
  return <div className="kpi-leaderboard" role="status" aria-label="Đang tải KPI">{Array.from({ length: count }, (_, index) => <div className="kpi-row kpi-row--skeleton" key={index}><Skeleton className="h-12 w-full bg-slate-200" /></div>)}</div>;
}
