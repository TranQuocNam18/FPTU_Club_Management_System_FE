import { useState } from 'react';
import { Send, Megaphone, Users, Bell } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import toast from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '../../api/notification.api';

interface SentBroadcast { id: string; title: string; message: string; sentAt: string; recipients: string; }

export default function AdminBroadcastPage() {
  const qc = useQueryClient();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [broadcasts, setBroadcasts] = useState<SentBroadcast[]>([]);
  const broadcastMutation = useMutation({
    mutationFn: (data: { title: string; message: string }) => notificationApi.broadcast(data),
    onSuccess: () => {
      toast.success('Thong bao mock da gui thanh cong.');
      setBroadcasts(prev => [{ id: Date.now().toString(), title: title.trim(), message: message.trim(), sentAt: new Date().toISOString(), recipients: 'Tat ca nguoi dung' }, ...prev]);
      setTitle(''); setMessage(''); qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
  const handleSend = () => {
    if (!title.trim() || !message.trim()) return toast.error('Vui long nhap tieu de va noi dung thong bao');
    broadcastMutation.mutate({ title: title.trim(), message: message.trim() });
  };
  return <div>
    <div className="mb-6"><h1 className="text-2xl font-bold text-slate-800">Gui thong bao he thong</h1><p className="text-slate-500 text-sm mt-1">Mock broadcast den toan he thong</p></div>
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h2 className="text-base font-semibold text-slate-800 mb-5 flex items-center gap-2"><Megaphone size={18} className="text-indigo-500" /> Soan thong bao moi</h2>
        <div className="space-y-4"><input value={title} onChange={e => setTitle(e.target.value)} className="input-field" placeholder="Tieu de thong bao" /><textarea value={message} onChange={e => setMessage(e.target.value)} rows={8} className="input-field resize-none" placeholder="Noi dung thong bao..." />
          <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-sm text-slate-500"><Bell size={15} /> Gui den: <strong>Tat ca nguoi dung</strong></span><Button icon={<Send size={16} />} loading={broadcastMutation.isPending} onClick={handleSend}>Gui thong bao</Button></div>
        </div>
      </div>
      <div className="space-y-4">{[{ label: 'Kenh gui', value: 'In-app', icon: <Bell size={20} />, color: 'text-indigo-600', bg: 'bg-indigo-50' }, { label: 'Pham vi', value: 'All', icon: <Users size={20} />, color: 'text-emerald-600', bg: 'bg-emerald-50' }, { label: 'Da gui', value: broadcasts.length, icon: <Megaphone size={20} />, color: 'text-violet-600', bg: 'bg-violet-50' }].map(({ label, value, icon, color, bg }) => <div key={label} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex items-center gap-4"><div className={`w-12 h-12 rounded-xl ${bg} ${color} flex items-center justify-center`}>{icon}</div><div><p className="text-xs text-slate-400">{label}</p><p className={`text-2xl font-bold ${color}`}>{value}</p></div></div>)}</div>
    </div>
    <div className="mt-6"><h2 className="text-base font-semibold text-slate-800 mb-4">Lich su thong bao da gui</h2><div className="space-y-3">{broadcasts.length === 0 ? <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center text-slate-400">Chua co thong bao nao trong phien nay</div> : broadcasts.map(b => <div key={b.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5"><p className="text-sm font-semibold text-slate-800">{b.title}</p><p className="text-sm text-slate-500 mt-1">{b.message}</p><p className="text-xs text-slate-400 mt-2">Gui den: {b.recipients} - {new Date(b.sentAt).toLocaleString('vi-VN')}</p></div>)}</div></div>
  </div>;
}
