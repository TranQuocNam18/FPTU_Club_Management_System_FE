import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { Club, ClubEvent, CreateEventRequest } from '../../types';
import { Button } from '../ui/Button';

type Values = CreateEventRequest;

export function EventForm({
  clubs,
  event,
  busy,
  onCancel,
  onSubmit,
}: {
  clubs: Club[];
  event?: ClubEvent | null;
  busy: boolean;
  onCancel: () => void;
  onSubmit: (values: Values) => void;
}) {
  const [openedAt] = useState(() => Date.now());
  const { register, handleSubmit, formState: { errors } } = useForm<Values>({
    defaultValues: event ? {
      clubId: event.clubId,
      title: event.title,
      description: event.description,
      expectedDate: event.expectedDate.slice(0, 16),
      location: event.location,
    } : { clubId: clubs.length === 1 ? clubs[0].id : '' },
  });

  return (
    <form className="event-form" onSubmit={handleSubmit(onSubmit)}>
      <label>Câu lạc bộ
        <select {...register('clubId', { required: 'Vui lòng chọn câu lạc bộ.' })} disabled={Boolean(event)}>
          <option value="">Chọn câu lạc bộ</option>
          {clubs.map((club) => <option key={club.id} value={club.id}>{club.name}</option>)}
        </select>
        {errors.clubId && <span role="alert">{errors.clubId.message}</span>}
      </label>
      <label>Tiêu đề
        <input {...register('title', { required: 'Vui lòng nhập tiêu đề.', minLength: { value: 3, message: 'Tối thiểu 3 ký tự.' }, maxLength: { value: 200, message: 'Tối đa 200 ký tự.' } })} />
        {errors.title && <span role="alert">{errors.title.message}</span>}
      </label>
      <label>Mô tả
        <textarea rows={5} {...register('description', { required: 'Vui lòng nhập mô tả.', maxLength: { value: 1000, message: 'Tối đa 1.000 ký tự.' } })} />
        {errors.description && <span role="alert">{errors.description.message}</span>}
      </label>
      <div className="event-form__grid">
        <label>Ngày và giờ dự kiến
          <input type="datetime-local" {...register('expectedDate', {
            required: 'Vui lòng chọn thời gian.',
            validate: (value) => new Date(value).getTime() > openedAt || 'Thời gian phải ở tương lai.',
          })} />
          {errors.expectedDate && <span role="alert">{errors.expectedDate.message}</span>}
        </label>
        <label>Địa điểm
          <input {...register('location', { required: 'Vui lòng nhập địa điểm.', maxLength: { value: 250, message: 'Tối đa 250 ký tự.' } })} />
          {errors.location && <span role="alert">{errors.location.message}</span>}
        </label>
      </div>
      <div className="event-form__actions">
        <Button type="button" variant="ghost" onClick={onCancel}>Hủy</Button>
        <Button type="submit" loading={busy}>{event ? 'Lưu thay đổi' : 'Tạo bản nháp'}</Button>
      </div>
    </form>
  );
}
