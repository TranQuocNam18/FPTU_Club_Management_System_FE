import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  FileText,
  Lightbulb,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';
import { reportApi } from '../../api/report.api';
import type {
  GeneratedReportDraft,
  ReportGenerationSnapshot,
  ReportValidationIssue,
  ReportValidationResult,
  SmartReportAvailability,
  SmartReportSourceReference,
} from '../../types';
import { formatCurrency, formatDateTime, getApiError } from '../../utils';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

interface SmartReportAssistantPanelProps {
  clubId: string;
  semesterId: string;
  reportType: number;
  title: string;
  content: string;
  onApplyDraft: (title: string, content: string) => void;
}

export function SmartReportAssistantPanel({
  clubId,
  semesterId,
  reportType,
  title,
  content,
  onApplyDraft,
}: SmartReportAssistantPanelProps) {
  const [snapshot, setSnapshot] = useState<ReportGenerationSnapshot | null>(null);
  const [draft, setDraft] = useState<GeneratedReportDraft | null>(null);
  const [validation, setValidation] = useState<ReportValidationResult | null>(null);
  const [sources, setSources] = useState<SmartReportSourceReference[]>([]);
  const [error, setError] = useState('');
  const [replaceOpen, setReplaceOpen] = useState(false);

  const previewMutation = useMutation({
    mutationFn: () => reportApi.getSmartReportPreview(clubId, semesterId),
    onSuccess: ({ data }) => {
      setSnapshot(data.data);
      setSources(data.data.sources);
      setError('');
    },
    onError: (requestError) => setError(smartReportError(requestError)),
  });

  const generateMutation = useMutation({
    mutationFn: () => reportApi.generateSmartReportDraft({ clubId, semesterId, reportType }),
    onSuccess: ({ data }) => {
      const generated = data.data;
      setDraft(generated);
      setValidation(generated.validation);
      setSources(generated.sources);
      setError('');
      if (title.trim() || content.trim()) {
        setReplaceOpen(true);
      } else {
        onApplyDraft(generated.generatedTitle, generated.generatedContent);
      }
    },
    onError: (requestError) => setError(smartReportError(requestError)),
  });

  const validateMutation = useMutation({
    mutationFn: () => reportApi.validateSmartReport({
      clubId,
      semesterId,
      reportType,
      title,
      content,
    }),
    onSuccess: ({ data }) => {
      setValidation(data.data);
      setError('');
    },
    onError: (requestError) => setError(smartReportError(requestError)),
  });

  const ready = Boolean(clubId && semesterId && [1, 2, 3].includes(reportType));

  return (
    <section className="smart-report" aria-labelledby="smart-report-title">
      <div className="smart-report__header">
        <div>
          <p className="smart-report__eyebrow">Hỗ trợ dựa trên quy tắc</p>
          <h3 id="smart-report-title"><FileText size={18} aria-hidden="true" />Smart Report Assistant</h3>
          <p>Dùng dữ liệu hệ thống để xem trước, tạo nội dung và kiểm tra báo cáo. Không tự lưu hoặc gửi duyệt.</p>
        </div>
        {draft && (
          <div className="smart-report__generator">
            <strong>{draft.generatorType}</strong>
            <span>{formatDateTime(draft.generatedAt)}</span>
          </div>
        )}
      </div>

      {!ready && (
        <p className="smart-report__notice" role="status">
          Chọn Active Semester và loại báo cáo trước khi sử dụng.
        </p>
      )}

      <div className="smart-report__actions">
        <Button
          type="button"
          variant="outline"
          disabled={!ready}
          loading={previewMutation.isPending}
          onClick={() => previewMutation.mutate()}
          icon={<Database size={16} aria-hidden="true" />}
        >
          Xem dữ liệu tổng hợp
        </Button>
        <Button
          type="button"
          disabled={!ready}
          loading={generateMutation.isPending}
          onClick={() => generateMutation.mutate()}
          icon={<FileText size={16} aria-hidden="true" />}
        >
          Tạo bản nháp từ dữ liệu hệ thống
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={!ready}
          loading={validateMutation.isPending}
          onClick={() => validateMutation.mutate()}
          icon={<RefreshCw size={16} aria-hidden="true" />}
        >
          Kiểm tra lại
        </Button>
      </div>

      {(previewMutation.isPending || generateMutation.isPending || validateMutation.isPending) && (
        <p className="smart-report__loading" role="status">Đang xử lý dữ liệu báo cáo…</p>
      )}
      {error && <p className="smart-report__error" role="alert">{error}</p>}

      {snapshot && <SnapshotSummary snapshot={snapshot} />}
      {validation && <ValidationPanel validation={validation} />}
      {sources.length > 0 && <SourcesList sources={sources} />}

      <Modal
        isOpen={replaceOpen}
        onClose={() => setReplaceOpen(false)}
        title="Thay thế nội dung hiện tại?"
        size="sm"
      >
        <div className="smart-report-confirm">
          <p>Form đang có tiêu đề hoặc nội dung. Bản nháp rule-based chỉ được điền khi bạn xác nhận thay thế.</p>
          <div>
            <Button type="button" variant="outline" onClick={() => setReplaceOpen(false)}>Hủy</Button>
            <Button
              type="button"
              onClick={() => {
                if (draft) onApplyDraft(draft.generatedTitle, draft.generatedContent);
                setReplaceOpen(false);
              }}
            >
              Thay thế nội dung hiện tại
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}

function SnapshotSummary({ snapshot }: { snapshot: ReportGenerationSnapshot }) {
  const metrics = [
    ['Tổng thành viên', value(snapshot.totalMembers)],
    ['Thành viên mới', value(snapshot.newMembers)],
    ['Hoạt động hoàn thành', value(snapshot.completedEvents)],
    ['Hoạt động đã hủy', value(snapshot.cancelledEvents)],
    ['Ngân sách được duyệt', money(snapshot.approvedBudget)],
    ['Chi thực tế', money(snapshot.actualExpense)],
    ['Số dư hiện tại', money(snapshot.remainingBalance)],
    ['Điểm KPI', value(snapshot.kpiScore)],
    ['Hạng KPI', value(snapshot.kpiRank)],
  ];
  return (
    <div className="smart-report-snapshot">
      <div className="smart-report-snapshot__title">
        <div><strong>{snapshot.clubName}</strong><span>{snapshot.semesterCode}</span></div>
        <Availability availability={snapshot.availability} />
      </div>
      <dl>
        {metrics.map(([label, metric]) => (
          <div key={label}><dt>{label}</dt><dd>{metric}</dd></div>
        ))}
      </dl>
      <p>Số dư hiện tại là persisted current balance, không phải số dư riêng của học kỳ.</p>
    </div>
  );
}

function Availability({ availability }: { availability: SmartReportAvailability }) {
  return (
    <ul className="smart-report-availability" aria-label="Trạng thái nguồn dữ liệu">
      {Object.entries(availability).map(([source, available]) => (
        <li className={available ? 'is-available' : 'is-unavailable'} key={source}>
          {available ? <CheckCircle2 size={13} aria-hidden="true" /> : <AlertTriangle size={13} aria-hidden="true" />}
          <span>{source}: {available ? 'Khả dụng' : 'Không khả dụng'}</span>
        </li>
      ))}
    </ul>
  );
}

function ValidationPanel({ validation }: { validation: ReportValidationResult }) {
  const groups: Array<{
    key: 'errors' | 'warnings' | 'suggestions';
    title: string;
    state: string;
    icon: typeof ShieldAlert;
  }> = [
    { key: 'errors', title: 'Errors', state: 'Chặn gửi', icon: ShieldAlert },
    { key: 'warnings', title: 'Warnings', state: 'Cần xem lại', icon: AlertTriangle },
    { key: 'suggestions', title: 'Suggestions', state: 'Gợi ý', icon: Lightbulb },
  ];
  return (
    <section className="smart-report-validation" aria-labelledby="smart-validation-title">
      <div>
        <h4 id="smart-validation-title">Kết quả kiểm tra</h4>
        <span className={validation.isReadyToSubmit ? 'is-ready' : 'is-blocked'}>
          {validation.isReadyToSubmit ? 'Không có lỗi chặn' : 'Có lỗi chặn gửi'}
        </span>
      </div>
      {groups.map(({ key, title, state, icon: Icon }) => (
        <div className={`smart-report-validation__group smart-report-validation__group--${key}`} key={key}>
          <h5><Icon size={16} aria-hidden="true" />{title}<span>{state}</span></h5>
          {validation[key].length === 0 ? (
            <p>Không có mục nào.</p>
          ) : (
            <ul>{validation[key].map((issue) => <ValidationIssue issue={issue} key={issueKey(issue)} />)}</ul>
          )}
        </div>
      ))}
    </section>
  );
}

function ValidationIssue({ issue }: { issue: ReportValidationIssue }) {
  return (
    <li>
      <strong>{issue.code}</strong>
      <p>{issue.message}</p>
      {(issue.field || issue.sourceTitle) && (
        <span>{issue.field && `Field: ${issue.field}`}{issue.field && issue.sourceTitle && ' · '}{issue.sourceTitle && `Nguồn: ${issue.sourceTitle}`}</span>
      )}
      {issue.suggestedAction && <em>Hành động đề xuất: {issue.suggestedAction}</em>}
    </li>
  );
}

function SourcesList({ sources }: { sources: SmartReportSourceReference[] }) {
  return (
    <details className="smart-report-sources">
      <summary><Database size={15} aria-hidden="true" />Nguồn dữ liệu đã sử dụng ({sources.length})</summary>
      <ul>
        {sources.map((source) => (
          <li key={`${source.type}-${source.id}`}>
            <strong>{source.type}</strong>
            <span>{source.title}</span>
            <code>{source.id}</code>
            {source.route && <code>{source.route}</code>}
          </li>
        ))}
      </ul>
    </details>
  );
}

function value(metric: number | null) {
  return metric === null ? 'Chưa có dữ liệu' : String(metric);
}

function money(metric: number | null) {
  return metric === null ? 'Chưa có dữ liệu' : formatCurrency(metric);
}

function issueKey(issue: ReportValidationIssue) {
  return `${issue.code}-${issue.field ?? ''}-${issue.sourceType ?? ''}-${issue.sourceId ?? ''}`;
}

function smartReportError(error: unknown) {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 403) return 'Bạn không có quyền sử dụng chức năng này cho CLB này.';
    if (error.response?.status === 404) return 'Không tìm thấy học kỳ.';
    if (error.response?.status === 503) return 'Nguồn dữ liệu tạm thời không khả dụng.';
  }
  return getApiError(error, 'Không thể xử lý Smart Report Assistant.');
}
