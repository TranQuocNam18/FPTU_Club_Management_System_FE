import React, { useState } from 'react';
import { Send, Megaphone, Users, Building2, Bell } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import toast from 'react-hot-toast';

const mockBroadcasts = [
  { id: '1', title: 'Thông báo về kỳ nộp báo cáo học kỳ', message: 'Tất cả CLB vui lòng nộp báo cáo tổng kết học kỳ 2024-2 trước ngày 30/06/2025.', sentAt: new Date(Date.now() - 86400000).toISOString(), recipients: 'Tất cả CLB' },
  { id: '2', title: 'Lịch họp Ban chủ nhiệm', message: 'P. CTSV tổ chức họp với Ban chủ nhiệm tất cả CLB lúc 14:00 ngày 20/06/2025 tại Hội trường A.', sentAt: new Date(Date.now() - 172800000).toISOString(), recipients: 'Tất cả CLB' },
];

export default function AdminBroadcastPage() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [broadcasts, setBroadcasts] = useState(mockBroadcasts);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error('Vui lòng nhập tiêu đề và nội dung thông báo');
      return;
    }
    setSending(true);
    await new Promise(r => setTimeout(r, 1000));
    setBroadcasts(prev => [{
      id: Date.now().toString(), title, message, sentAt: new Date().toISOString(), recipients: 'Tất cả CLB'
    }, ...prev]);
    setTitle('');
    setMessage('');
    setSending(false);
    toast.success('Đã gửi thông báo tới tất cả CLB!');
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Gửi thông báo hệ thống</h1>
        <p className="text-slate-500 text-sm mt-1">Đăng tải thông báo, chỉ thị tới tất cả CLB</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Compose */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-base font-semibold text-slate-800 mb-5 flex items-center gap-2">
              <Megaphone size={18} className="text-indigo-500" /> Soạn thông báo mới
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Tiêu đề thông báo</label>
                <input value={title} onChange={e => setTitle(e.target.value)}
                  className="input-field" placeholder="VD: Thông báo về hạn nộp báo cáo học kỳ..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nội dung</label>
                <textarea value={message} onChange={e => setMessage(e.target.value)}
                  rows={8} className="input-field resize-none"
                  placeholder="Nhập nội dung thông báo chi tiết. Hệ thống sẽ gửi email và thông báo in-app đến tất cả thành viên CLB..." />
              </div>
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Bell size={15} />
                  <span>Sẽ gửi đến: <strong>Tất cả CLB</strong></span>
                </div>
                <Button icon={<Send size={16} />} loading={sending} onClick={handleSend}>
                  Gửi thông báo
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-4">
          {[
            { label: 'CLB đang hoạt động', value: '26', icon: <Building2 size={20} />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { label: 'Tổng sinh viên', value: '1,240', icon: <Users size={20} />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Thông báo đã gửi', value: broadcasts.length, icon: <Megaphone size={20} />, color: 'text-violet-600', bg: 'bg-violet-50' },
          ].map(({ label, value, icon, color, bg }) => (
            <div key={label} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl ${bg} ${color} flex items-center justify-center`}>{icon}</div>
              <div>
                <p className="text-xs text-slate-400">{label}</p>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* History */}
      <div className="mt-6">
        <h2 className="text-base font-semibold text-slate-800 mb-4">Lịch sử thông báo đã gửi</h2>
        <div className="space-y-3">
          {broadcasts.map(b => (
            <div key={b.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                <Megaphone size={20} className="text-indigo-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800">{b.title}</p>
                <p className="text-sm text-slate-500 mt-1 line-clamp-2">{b.message}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                  <span>Gửi đến: {b.recipients}</span>
                  <span>•</span>
                  <span>{new Date(b.sentAt).toLocaleString('vi-VN')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
