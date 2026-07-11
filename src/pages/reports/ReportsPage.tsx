import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient, useQueries } from '@tanstack/react-query';
import { Plus, ClipboardList, Send, Star, Edit2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { reportApi } from '../../api/report.api';
import { clubApi } from '../../api/club.api';
import { useAuthStore } from '../../stores/authStore';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { PageSpinner, EmptyState } from '../../components/ui/Spinner';
import { Modal } from '../../components/ui/Modal';
import { getStatusColor, formatDate } from '../../utils';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ReportStatusMap, ReportTypeMap } from '../../types';

// ── Schemas ───────────────────────────────────────────────────────────────────
const submitSchema = z.object({
  clubId: z.string().min(1, 'Chọn CLB'),
  title: z.string().min(5, 'Tiêu đề tối thiểu 5 ký tự').max(200),
  content: z.string().min(20, 'Nội dung tối thiểu 20 ký tự'),
  type: z.string().min(1, 'Chọn loại báo cáo'),
});
type SubmitForm = z.infer<typeof submitSchema>;

const editSchema = z.object({
  title: z.string().min(5, 'Tiêu đề tối thiểu 5 ký tự').max(200),
  content: z.string().min(20, 'Nội dung tối thiểu 20 ký tự'),
  type: z.string().min(1, 'Chọn loại báo cáo'),
});
type EditForm = z.infer<typeof editSchema>;

const reviewSchema = z.object({
  isApproved: z.boolean(),
  reviewNote: z.string().optional(),
});
type ReviewForm = z.infer<typeof reviewSchema>;

export default function ReportsPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();

  // Per BE: Admin/Advisor can review; ClubManager can submit & read; Advisor can also review
  const isAdmin = user?.role === 'Admin' || user?.role === 'Advisor';
  const isClubManager = user?.role === 'ClubManager';
  // Per BE [Authorize(Roles = "Admin,ClubManager")] for review endpoint
  const canReview = user?.role === 'Admin' || user?.role === 'Advisor' || user?.role === 'ClubManager';

  const [showSubmit, setShowSubmit] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [reviewTarget, setReviewTarget] = useState<any>(null);
  const [selectedClubId, setSelectedClubId] = useState<string>('');

  // ── Fetch all clubs ────────────────────────────────────────────────────────
  const { data: clubsRes, isLoading: isLoadingClubs } = useQuery({
    queryKey: ['clubs'],
    queryFn: () => clubApi.getAll(),
  });
  const allClubs: any[] = clubsRes?.data?.data ?? [];

  // For ClubManager: filter clubs they manage (role=1 Manager or role=2 President)
  // useQueries[i] corresponds to allClubs[i] by index
  const membersQueries = useQueries({
    queries: allClubs.map(c => ({
      queryKey: ['club-members', c.id],
      queryFn: () => clubApi.getMembers(c.id),
      enabled: allClubs.length > 0,
    })),
  });

  const clubs = React.useMemo(() => {
    if (isAdmin) return allClubs;
    if (isClubManager) {
      return allClubs.filter((club, idx) => {
        const query = membersQueries[idx];
        if (!query?.data) return false;
        const members: any[] = query.data.data?.data ?? [];
        return members.some((m: any) =>
          m.userId === user?.id &&
          (m.role === 1 || m.role === 2) && // Manager=1, President=2
          m.status === 1 // Approved
        );
      });
    }
    return [];
  }, [allClubs, membersQueries, user, isAdmin, isClubManager]);

  // Auto-select first club
  useEffect(() => {
    if (clubs.length > 0 && !selectedClubId) {
      setSelectedClubId(clubs[0].id);
    }
  }, [clubs, selectedClubId]);

  // ── Fetch reports for selected club ───────────────────────────────────────
  const { data: res, isLoading: isLoadingReports } = useQuery({
    queryKey: ['reports', selectedClubId],
    queryFn: () => reportApi.getByClub(selectedClubId),
    enabled: !!selectedClubId,
  });
  const reports: any[] = res?.data?.data ?? [];

  // ── Mutations ─────────────────────────────────────────────────────────────
  const submitMutation = useMutation({
    mutationFn: (d: SubmitForm) => reportApi.create({
      clubId: d.clubId,
      title: d.title,
      content: d.content,
      type: parseInt(d.type),
    }),
    onSuccess: () => {
      toast.success('Nộp báo cáo thành công!');
      qc.invalidateQueries({ queryKey: ['reports', selectedClubId] });
      setShowSubmit(false);
      submitReset();
    },
    onError: () => toast.error('Không thể nộp báo cáo'),
  });

  const editMutation = useMutation({
    mutationFn: (d: EditForm) => reportApi.update(editTarget.id, {
      title: d.title,
      content: d.content,
      type: parseInt(d.type),
    }),
    onSuccess: () => {
      toast.success('Cập nhật báo cáo thành công!');
      qc.invalidateQueries({ queryKey: ['reports', selectedClubId] });
      setEditTarget(null);
      editReset();
    },
    onError: () => toast.error('Không thể cập nhật báo cáo'),
  });

  const reviewMutation = useMutation({
    mutationFn: (d: ReviewForm) => reportApi.review(reviewTarget.id, {
      isApproved: d.isApproved,
      reviewNote: d.reviewNote,
    }),
    onSuccess: (_, vars) => {
      toast.success(vars.isApproved ? 'Đã duyệt báo cáo!' : 'Đã từ chối báo cáo!');
      qc.invalidateQueries({ queryKey: ['reports', selectedClubId] });
      setReviewTarget(null);
      reviewReset();
    },
    onError: () => toast.error('Không thể duyệt báo cáo'),
  });

  // ── Forms ─────────────────────────────────────────────────────────────────
  const {
    register: submitReg, handleSubmit: handleSubmitForm, reset: submitReset,
    setValue: setSubmitValue, formState: { errors: submitErrors },
  } = useForm<SubmitForm>({ resolver: zodResolver(submitSchema), defaultValues: { type: '2' } });

  const {
    register: editReg, handleSubmit: handleEditForm, reset: editReset,
    formState: { errors: editErrors },
  } = useForm<EditForm>({ resolver: zodResolver(editSchema), defaultValues: { type: '2' } });

  const {
    register: reviewReg, handleSubmit: handleReviewForm, reset: reviewReset,
    watch: reviewWatch, setValue: setReviewValue,
  } = useForm<ReviewForm>({ resolver: zodResolver(reviewSchema), defaultValues: { isApproved: true } });

  // Auto-set clubId in submit form
  useEffect(() => {
    if (selectedClubId && showSubmit) {
      setSubmitValue('clubId', selectedClubId);
    }
  }, [selectedClubId, showSubmit, setSubmitValue]);

  // Pre-fill edit form
  const openEdit = (report: any) => {
    setEditTarget(report);
    const typeNum = ReportTypeMap[report.type] === 'Financial' || report.type === 1 || report.type === 'Financial' ? '1'
      : ReportTypeMap[report.type] === 'Activity' || report.type === 2 || report.type === 'Activity' ? '2' : '3';
    editReset({ title: report.title, content: report.content, type: typeNum });
  };

  if (isLoadingClubs || (selectedClubId && isLoadingReports)) return <PageSpinner />;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {isAdmin ? 'Kiểm duyệt báo cáo' : 'Báo cáo hoạt động'}
          </h1>
          <p className="text-slate-500 text-sm mt-1">Danh sách báo cáo theo câu lạc bộ</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Club selector */}
          {clubs.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-500">CLB:</span>
              <select
                value={selectedClubId}
                onChange={(e) => setSelectedClubId(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                {clubs.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}
          {/* ClubManager: nộp báo cáo */}
          {isClubManager && selectedClubId && (
            <Button icon={<Plus size={16} />} onClick={() => setShowSubmit(true)}>Nộp báo cáo</Button>
          )}
        </div>
      </div>

      {/* Content */}
      {!selectedClubId ? (
        <EmptyState
          icon={<ClipboardList size={48} />}
          title="Không có câu lạc bộ nào"
          description={isClubManager
            ? 'Bạn chưa được phân công quản lý CLB nào'
            : 'Không có dữ liệu báo cáo'}
        />
      ) : reports.length === 0 ? (
        <EmptyState
          icon={<ClipboardList size={48} />}
          title="Chưa có báo cáo nào"
          description={isAdmin ? 'Không có báo cáo cho CLB này' : 'Hãy nộp báo cáo hoạt động đầu tiên'}
          action={isClubManager
            ? <Button icon={<Plus size={16} />} onClick={() => setShowSubmit(true)}>Nộp báo cáo</Button>
            : undefined}
        />
      ) : (
        <div className="space-y-3">
          {reports.map((r: any) => {
            const mappedStatus = ReportStatusMap[r.status] ?? r.status;
            const mappedType = ReportTypeMap[r.type] ?? r.type ?? 'General';
            const isPending = r.status === 1 || r.status === 'Pending';
            // ClubManager chỉ có thể edit báo cáo Pending (chưa được review)
            const canEdit = isClubManager && isPending;

            return (
              <div key={r.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex items-start gap-4 hover:shadow-md transition-all">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                  <ClipboardList size={22} className="text-indigo-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-sm font-semibold text-slate-800">{r.title}</h3>
                    <Badge className={getStatusColor(mappedStatus)}>{mappedStatus}</Badge>
                    <Badge className="bg-slate-100 text-slate-600">{mappedType}</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-1.5 whitespace-pre-wrap line-clamp-3">{r.content}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                    <span>Nộp ngày: {formatDate(r.createdAt || r.submissionDate)}</span>
                    {r.updatedAt && r.updatedAt !== r.createdAt && (
                      <span>Cập nhật: {formatDate(r.updatedAt)}</span>
                    )}
                    {r.kpiPoints !== undefined && r.kpiPoints !== null && (
                      <span className="flex items-center gap-1 text-amber-600 font-medium">
                        <Star size={11} />{r.kpiPoints} điểm KPI
                      </span>
                    )}
                  </div>
                  {r.reviewNote && (
                    <div className="mt-2.5 px-3 py-2 bg-slate-50 rounded-lg text-xs text-slate-600">
                      <span className="font-semibold">Phản hồi: </span>{r.reviewNote}
                    </div>
                  )}
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  {canEdit && (
                    <button
                      onClick={() => openEdit(r)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                      title="Chỉnh sửa báo cáo"
                    >
                      <Edit2 size={14} />
                    </button>
                  )}
                  {/* Admin/Advisor/ClubManager (per BE) duyệt báo cáo Pending */}
                  {canReview && isPending && (
                    <Button size="sm" variant="secondary" onClick={() => setReviewTarget(r)}>Duyệt</Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Submit Modal ───────────────────────────────────────────────────── */}
      <Modal isOpen={showSubmit} onClose={() => { setShowSubmit(false); submitReset(); }} title="Nộp báo cáo hoạt động">
        <form onSubmit={handleSubmitForm(d => submitMutation.mutate(d))} className="space-y-4">
          <input type="hidden" {...submitReg('clubId')} />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Loại báo cáo</label>
            <select {...submitReg('type')} className="input-field">
              <option value="1">Báo cáo tài chính (Financial)</option>
              <option value="2">Báo cáo hoạt động (Activity)</option>
              <option value="3">Báo cáo chung (General)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tiêu đề báo cáo</label>
            <input {...submitReg('title')} className="input-field" placeholder="Báo cáo tuần, tháng, học kỳ..." />
            {submitErrors.title && <p className="text-red-500 text-xs mt-1">{submitErrors.title.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nội dung</label>
            <textarea {...submitReg('content')} rows={6} className="input-field resize-none"
              placeholder="Mô tả chi tiết các hoạt động, số lượng tham gia, kết quả đạt được..." />
            {submitErrors.content && <p className="text-red-500 text-xs mt-1">{submitErrors.content.message}</p>}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => { setShowSubmit(false); submitReset(); }}>Hủy</Button>
            <Button type="submit" icon={<Send size={14} />} loading={submitMutation.isPending}>Nộp báo cáo</Button>
          </div>
        </form>
      </Modal>

      {/* ── Edit Modal ─────────────────────────────────────────────────────── */}
      <Modal isOpen={!!editTarget} onClose={() => { setEditTarget(null); editReset(); }} title="Chỉnh sửa báo cáo">
        <form onSubmit={handleEditForm(d => editMutation.mutate(d))} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Loại báo cáo</label>
            <select {...editReg('type')} className="input-field">
              <option value="1">Báo cáo tài chính (Financial)</option>
              <option value="2">Báo cáo hoạt động (Activity)</option>
              <option value="3">Báo cáo chung (General)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tiêu đề báo cáo</label>
            <input {...editReg('title')} className="input-field" />
            {editErrors.title && <p className="text-red-500 text-xs mt-1">{editErrors.title.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nội dung</label>
            <textarea {...editReg('content')} rows={6} className="input-field resize-none" />
            {editErrors.content && <p className="text-red-500 text-xs mt-1">{editErrors.content.message}</p>}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => { setEditTarget(null); editReset(); }}>Hủy</Button>
            <Button type="submit" loading={editMutation.isPending}>Cập nhật</Button>
          </div>
        </form>
      </Modal>

      {/* ── Review Modal ───────────────────────────────────────────────────── */}
      <Modal isOpen={!!reviewTarget} onClose={() => { setReviewTarget(null); reviewReset(); }} title="Duyệt báo cáo">
        {reviewTarget && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-sm font-semibold text-slate-800">{reviewTarget.title}</p>
              <p className="text-xs text-slate-500 mt-1 line-clamp-3">{reviewTarget.content}</p>
            </div>
            <form onSubmit={handleReviewForm(d => reviewMutation.mutate(d))} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Kết quả duyệt</label>
                <div className="flex gap-3">
                  {[{ value: true, label: '✓ Duyệt', activeClass: 'border-emerald-500 bg-emerald-50 text-emerald-700' },
                    { value: false, label: '✗ Từ chối', activeClass: 'border-red-400 bg-red-50 text-red-600' }
                  ].map(opt => (
                    <label key={String(opt.value)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 cursor-pointer transition-all
                        ${reviewWatch('isApproved') === opt.value ? opt.activeClass : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                      <input
                        type="radio"
                        className="hidden"
                        checked={reviewWatch('isApproved') === opt.value}
                        onChange={() => setReviewValue('isApproved', opt.value)}
                      />
                      <span className="text-sm font-medium">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Phản hồi <span className="text-slate-400 font-normal">(tối đa 500 ký tự)</span>
                </label>
                <textarea {...reviewReg('reviewNote')} rows={3} className="input-field resize-none" placeholder="Nhận xét, góp ý..." />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" type="button" onClick={() => { setReviewTarget(null); reviewReset(); }}>Hủy</Button>
                <Button type="submit" loading={reviewMutation.isPending}>Xác nhận duyệt</Button>
              </div>
            </form>
          </div>
        )}
      </Modal>
    </div>
  );
}
