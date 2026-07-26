import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, Plus, Search, UsersRound, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { clubApi } from '../../api/club.api';
import {
  ClubCard,
  ClubEmptyState,
  ClubErrorState,
  ClubGridSkeleton,
} from '../../components/clubs/ClubPrimitives';
import { Button } from '../../components/ui/Button';
import { useGsapReveal } from '../../hooks/useGsapReveal';
import { useAuthStore } from '../../stores/authStore';
import type { ClubMember } from '../../types';
import { ClubStatusMap } from '../../types';

export default function ClubsPage() {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const scopeRef = useGsapReveal<HTMLDivElement>({ animationKey: 'clubs-list' });
  const isStudent = user?.role === 'Student';
  const isAdmin = user?.role === 'StudentAffairsAdmin';

  const clubsQuery = useQuery({ queryKey: ['clubs'], queryFn: clubApi.getAll });
  const membershipsQuery = useQuery({
    queryKey: ['my-memberships', user?.id],
    queryFn: clubApi.getMyMemberships,
    enabled: isStudent && Boolean(user?.id),
  });
  const clubs = useMemo(() => clubsQuery.data?.data.data ?? [], [clubsQuery.data]);
  const memberships = useMemo(
    () => membershipsQuery.data?.data.data ?? [],
    [membershipsQuery.data],
  );
  const membershipByClub = useMemo(
    () => new Map(memberships.map((membership) => [membership.clubId, membership])),
    [memberships],
  );
  const normalizedSearch = search.trim().toLocaleLowerCase('vi-VN');
  const filteredClubs = useMemo(
    () => clubs.filter((club) => {
      if (!normalizedSearch) return true;
      return club.name.toLocaleLowerCase('vi-VN').includes(normalizedSearch)
        || club.description.toLocaleLowerCase('vi-VN').includes(normalizedSearch);
    }),
    [clubs, normalizedSearch],
  );

  const joinMutation = useMutation({
    mutationFn: (clubId: string) => clubApi.joinClub(clubId),
    onSuccess: async () => {
      toast.success('Đã gửi yêu cầu gia nhập CLB.');
      await queryClient.invalidateQueries({ queryKey: ['my-memberships', user?.id] });
      await queryClient.invalidateQueries({ queryKey: ['clubs'] });
    },
    onError: () => toast.error('Không thể gửi yêu cầu gia nhập CLB.'),
  });

  return (
    <div ref={scopeRef} className="clubs-page">
      <header className="clubs-header" data-gsap-item>
        <div>
          <p className="clubs-eyebrow">Club discovery</p>
          <h1>Khám phá câu lạc bộ</h1>
          <p>Tìm hiểu các cộng đồng sinh viên và theo dõi trạng thái membership của bạn.</p>
        </div>
        {isAdmin && (
          <Link className="clubs-admin-link" to="/admin/clubs">
            <Plus size={18} aria-hidden="true" /> Quản lý câu lạc bộ
          </Link>
        )}
      </header>

      <div className="clubs-toolbar" data-gsap-item>
        <label className="clubs-search">
          <span className="sr-only">Tìm kiếm câu lạc bộ</span>
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm theo tên hoặc mô tả..."
          />
          {search && (
            <button type="button" onClick={() => setSearch('')} aria-label="Xóa từ khóa tìm kiếm">
              <X size={17} aria-hidden="true" />
            </button>
          )}
        </label>
        <p><Building2 size={17} aria-hidden="true" />{clubs.length} câu lạc bộ</p>
      </div>

      {clubsQuery.isLoading ? (
        <ClubGridSkeleton />
      ) : clubsQuery.isError ? (
        <ClubErrorState message="Danh sách câu lạc bộ hiện không khả dụng." onRetry={() => void clubsQuery.refetch()} />
      ) : filteredClubs.length === 0 ? (
        <ClubEmptyState
          title={search ? 'Không tìm thấy câu lạc bộ' : 'Chưa có câu lạc bộ'}
          description={search ? 'Thử một từ khóa khác hoặc xóa bộ lọc tìm kiếm.' : 'Hệ thống chưa có câu lạc bộ để hiển thị.'}
          action={search ? <Button variant="outline" onClick={() => setSearch('')}>Xóa tìm kiếm</Button> : undefined}
        />
      ) : (
        <div className="clubs-grid" aria-busy={membershipsQuery.isLoading || undefined}>
          {filteredClubs.map((club) => {
            const membership = membershipByClub.get(club.id);
            const active = ClubStatusMap[club.status] === 'Active';
            const membershipResolved = !isStudent || membershipsQuery.isSuccess;
            const canSubmitJoin = isStudent && active && membershipResolved && !membership;
            let joinAction;

            if (isStudent && !membershipResolved) {
              joinAction = <span className="club-join-pending">Đang kiểm tra membership...</span>;
            } else if (canSubmitJoin) {
              joinAction = (
                <Button
                  size="sm"
                  loading={joinMutation.isPending && joinMutation.variables === club.id}
                  disabled={joinMutation.isPending}
                  onClick={() => joinMutation.mutate(club.id)}
                  icon={<UsersRound size={15} aria-hidden="true" />}
                >
                  Gia nhập
                </Button>
              );
            } else if (isStudent && !active && !membership) {
              joinAction = <span className="club-join-unavailable">CLB hiện không nhận yêu cầu</span>;
            }

            return <ClubCard key={club.id} club={club} membership={membership as ClubMember | undefined} joinAction={joinAction} />;
          })}
        </div>
      )}

      {isStudent && membershipsQuery.isError && (
        <div className="mt-5">
          <ClubErrorState
            message="Không thể xác định membership nên thao tác gia nhập đang được ẩn để tránh gửi trùng."
            onRetry={() => void membershipsQuery.refetch()}
          />
        </div>
      )}
    </div>
  );
}
