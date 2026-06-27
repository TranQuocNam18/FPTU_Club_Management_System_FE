import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, ClipboardList, Send, Star } from 'lucide-react';
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

const submitSchema = z.object({
  clubId: z.string().min(1, 'Chọn CLB'),
  title: z.string().min(5, 'Tiêu đề tối thiểu 5 ký tự'),
  content: z.string().min(20, 'Nội dung tối thiểu 20 ký tự'),
  type: z.string().min(1, 'Chọn loại báo cáo'),
});
type SubmitForm = z.infer<typeof submitSchema>;

const reviewSchema = z.object({
  status: z.enum(['Approved', 'Rejected']),
  feedback: z.string().min(5, 'Phản hồi tối thiểu 5 ký tự'),
});
type ReviewForm = z.infer<typeof reviewSchema>;

const reportStatusMap: Record<number | string, string> = {
  1: 'Pending',
  2: 'Approved',
  3: 'Rejected',
  'Pending': 'Pending',
  'Approved': 'Approved',
  'Rejected': 'Rejected'
};

const reportTypeMap: Record<number | string, string> = {
  1: 'Financial',
  2: 'Activity',
  3: 'General',
  'Financial': 'Financial',
  'Activity': 'Activity',
  'General': 'General'
};

export default function ReportsPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const isAdmin = user?.role === 'Admin' || user?.role === 'Advisor';
  const [showSubmit, setShowSubmit] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<any>(null);
  const [selectedClubId, setSelectedClubId] = useState<string>('');

  // Fetch all clubs to show in selector
  const { data: clubsRes, isLoading: isLoadingClubs } = useQuery({
    queryKey: ['clubs'],
    queryFn: () => clubApi.getAll(),
  });
  const clubs = clubsRes?.data?.data ?? [];

  // Default select first club when loaded
  useEffect(() => {
    if (clubs.length > 0 && !selectedClubId) {
      setSelectedClubId(clubs[0].id);
    }
  }, [clubs, selectedClubId]);

  // Fetch reports for the selected club
  const { data: res, isLoading: isLoadingReports } = useQuery({
    queryKey: ['reports', selectedClubId],
    queryFn: () => reportApi.getByClub(selectedClubId),
    enabled: !!selectedClubId,
  });
  const reports = res?.data?.data ?? [];

  const submitMutation = useMutation({
    mutationFn: (d: SubmitForm) => reportApi.create({
      clubId: d.clubId,
      title: d.title,
      content: d.content,
      type: parseInt(d.type)
    }),
    onSuccess: () => {
      toast.success('Nộp báo cáo thành công!');
      qc.invalidateQueries({ queryKey: ['reports', selectedClubId] });
      setShowSubmit(false);
      submitReset();
    },
    onError: () => toast.error('Không thể nộp báo cáo'),
  });

  const reviewMutation = useMutation({
    mutationFn: (d: ReviewForm) => reportApi.review(reviewTarget.id, {
      isApproved: d.status === 'Approved',
      reviewNote: d.feedback
    }),
    onSuccess: () => {
      toast.success('Đã duyệt báo cáo!');
      qc.invalidateQueries({ queryKey: ['reports', selectedClubId] });
      setReviewTarget(null);
      reviewReset();
    },
    onError: () => toast.error('Không thể duyệt báo cáo'),
  });

  const { register: submitReg, handleSubmit: handleSubmitForm, reset: submitReset, setValue: setSubmitValue, formState: { errors: submitErrors } } = useForm<SubmitForm>({
    resolver: zodResolver(submitSchema),
    defaultValues: { type: '2' }
  });

  const { register: reviewReg, handleSubmit: handleReviewForm, reset: reviewReset, watch: reviewWatch } = useForm<ReviewForm>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { status: 'Approved' }
  });

  // Automatically set selected club in creation form when opening modal
  useEffect(() => {
    if (selectedClubId && showSubmit) {
      setSubmitValue('clubId', selectedClubId);
    }
  }, [selectedClubId, showSubmit, setSubmitValue]);

  if (isLoadingClubs || (selectedClubId && isLoadingReports)) return <PageSpinner />;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{isAdmin ? 'Kiểm duyệt báo cáo' : 'Báo cáo hoạt động'}</h1>
          <p className="text-slate-500 text-sm mt-1">Danh sách báo cáo</p>
        </div>
        <div className="flex items-center gap-3">
          {clubs.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-500">Chọn CLB:</span>
              <select
                value={selectedClubId}
                onChange={(e) => setSelectedClubId(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                {clubs.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}
          {!isAdmin && selectedClubId && (
            <Button icon={<Plus size={16} />} onClick={() => setShowSubmit(true)}>Nộp báo cáo</Button>
          )}
        </div>
      </div>

      {!selectedClubId ? (
        <EmptyState icon={<ClipboardList size={48} />} title="Không có câu lạc bộ nào" description="Bạn cần có câu lạc bộ để xem báo cáo" />
      ) : reports.length === 0 ? (
        <EmptyState icon={<ClipboardList size={48} />} title="Chưa có báo cáo nào"
          description={isAdmin ? 'Không có báo cáo cho câu lạc bộ này' : 'Hãy nộp báo cáo hoạt động đầu tiên'}
          action={!isAdmin ? <Button icon={<Plus size={16} />} onClick={() => setShowSubmit(true)}>Nộp báo cáo</Button> : undefined}
        />
      ) : (
        <div className="space-y-3">
          {reports.map((r: any) => {
            const mappedStatus = reportStatusMap[r.status] ?? r.status;
            const mappedType = reportTypeMap[r.type] ?? r.reportType ?? 'General';
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
                  <p className="text-xs text-slate-500 mt-1.5 whitespace-pre-wrap">{r.content}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                    <span>Nộp ngày: {formatDate(r.createdAt || r.submissionDate)}</span>
                    {r.kpiPoints !== undefined && r.kpiPoints !== null && (
                      <span className="flex items-center gap-1 text-amber-600 font-medium">
                        <Star size={11} />{r.kpiPoints} điểm KPI
                      </span>
                    )}
                  </div>
                  {r.reviewNote && (
                    <div className="mt-2.5 px-3 py-2 bg-slate-50 rounded-lg text-xs text-slate-600">
                      <span className="font-semibold">Phản hồi của Advisor: </span>{r.reviewNote}
                    </div>
                  )}
                </div>
                {isAdmin && (r.status === 1 || r.status === 'Pending') && (
                  <Button size="sm" variant="secondary" onClick={() => setReviewTarget(r)}>Duyệt</Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Submit Modal */}
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
              placeholder="Mô tả chi tiết các hoạt động, số lượng tham gia, kết quả đạt được, link minh chứng..." />
            {submitErrors.content && <p className="text-red-500 text-xs mt-1">{submitErrors.content.message}</p>}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => { setShowSubmit(false); submitReset(); }}>Hủy</Button>
            <Button type="submit" icon={<Send size={14} />} loading={submitMutation.isPending}>Nộp báo cáo</Button>
          </div>
        </form>
      </Modal>

      {/* Review Modal */}
      <Modal isOpen={!!reviewTarget} onClose={() => { setReviewTarget(null); reviewReset(); }} title="Duyệt báo cáo">
        {reviewTarget && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-sm font-semibold text-slate-800">{reviewTarget.title}</p>
              <p className="text-xs text-slate-500 mt-1 line-clamp-3">{reviewTarget.content}</p>
            </div>
            <form onSubmit={handleReviewForm((d) => reviewMutation.mutate(d))} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Kết quả duyệt</label>
                <div className="flex gap-3">
                  {['Approved', 'Rejected'].map(s => (
                    <label key={s} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 cursor-pointer transition-all
                      ${reviewWatch('status') === s
                        ? s === 'Approved' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-red-400 bg-red-50 text-red-600'
                        : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                      <input {...reviewReg('status')} type="radio" value={s} className="hidden" />
                      <span className="text-sm font-medium">{s === 'Approved' ? '✓ Duyệt' : '✗ Từ chối'}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phản hồi cho CLB</label>
                <textarea {...reviewReg('feedback')} rows={3} className="input-field resize-none" placeholder="Nhận xét, góp ý..." />
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
