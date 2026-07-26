import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { Megaphone, Send, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import { notificationApi } from '../../api/notification.api';
import { getApiError, getRoleLabel } from '../../utils';
import { useGsapReveal } from '../../hooks/useGsapReveal';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

type BroadcastForm = {
  title: string;
  message: string;
  targetRole: 'StudentAffairsAdmin' | 'ClubManager' | 'Student';
};

const initialValues: BroadcastForm = { title: '', message: '', targetRole: 'Student' };

export function BroadcastWorkspace() {
  const scope = useGsapReveal<HTMLDivElement>();
  const [pendingBroadcast, setPendingBroadcast] = useState<BroadcastForm | null>(null);
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<BroadcastForm>({
    defaultValues: initialValues,
  });
  const preview = useWatch({ control });

  const mutation = useMutation({
    mutationFn: notificationApi.broadcast,
    onSuccess: (response) => {
      toast.success(`Đã gửi tới ${response.data.data.recipientCount} người nhận.`);
      setPendingBroadcast(null);
      reset(initialValues);
    },
    onError: (error) => toast.error(getApiError(error)),
  });

  return (
    <section ref={scope} className="broadcast-workspace" aria-labelledby="broadcast-heading">
      <header className="broadcast-heading" data-gsap-item>
        <span className="broadcast-icon"><Megaphone size={20} /></span>
        <div>
          <p className="admin-eyebrow">Admin broadcast</p>
          <h2 id="broadcast-heading">Gửi thông báo theo vai trò</h2>
          <p>Soạn, xem trước và xác nhận trước khi gửi thông báo thật.</p>
        </div>
      </header>

      <div className="broadcast-layout">
        <form className="broadcast-form" onSubmit={handleSubmit(setPendingBroadcast)} data-gsap-item>
          <label>
            Tiêu đề
            <input {...register('title', { required: 'Vui lòng nhập tiêu đề.', maxLength: { value: 150, message: 'Tối đa 150 ký tự.' } })} className="input-field" placeholder="Ví dụ: Nhắc hạn nộp báo cáo" />
            {errors.title && <span className="admin-field-error">{errors.title.message}</span>}
          </label>
          <label>
            Nhóm người nhận
            <select {...register('targetRole')} className="input-field">
              <option value="Student">Sinh viên</option>
              <option value="ClubManager">Quản lý CLB</option>
              <option value="StudentAffairsAdmin">Cán bộ Phòng CTSV</option>
            </select>
          </label>
          <label>
            Nội dung
            <textarea {...register('message', { required: 'Vui lòng nhập nội dung.', maxLength: { value: 1000, message: 'Tối đa 1.000 ký tự.' } })} className="input-field broadcast-message" placeholder="Nội dung thông báo..." />
            {errors.message && <span className="admin-field-error">{errors.message.message}</span>}
          </label>
          <Button type="submit" icon={<Send size={16} />}>Kiểm tra trước khi gửi</Button>
        </form>

        <aside className="broadcast-preview" data-gsap-item>
          <div className="broadcast-preview-label">Preview — chưa gửi</div>
          <span className="admin-badge admin-role-Student">{getRoleLabel(preview.targetRole ?? 'Student')}</span>
          <h3>{preview.title?.trim() || 'Tiêu đề thông báo'}</h3>
          <p>{preview.message?.trim() || 'Nội dung bạn nhập sẽ xuất hiện ở đây để kiểm tra trước khi gửi.'}</p>
        </aside>
      </div>

      <Modal isOpen={Boolean(pendingBroadcast)} onClose={() => !mutation.isPending && setPendingBroadcast(null)} title="Xác nhận gửi broadcast" size="md">
        {pendingBroadcast && (
          <div className="admin-confirm">
            <div className="admin-warning"><ShieldAlert size={20} /><p>Thao tác này sẽ gửi thông báo thật tới tất cả tài khoản thuộc vai trò đã chọn.</p></div>
            <dl>
              <div><dt>Người nhận</dt><dd>{getRoleLabel(pendingBroadcast.targetRole)}</dd></div>
              <div><dt>Tiêu đề</dt><dd>{pendingBroadcast.title}</dd></div>
              <div><dt>Nội dung</dt><dd>{pendingBroadcast.message}</dd></div>
            </dl>
            <div className="admin-dialog-actions">
              <Button variant="ghost" onClick={() => setPendingBroadcast(null)} disabled={mutation.isPending}>Quay lại chỉnh sửa</Button>
              <Button onClick={() => mutation.mutate(pendingBroadcast)} loading={mutation.isPending} icon={<Send size={16} />}>Gửi thông báo</Button>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}
