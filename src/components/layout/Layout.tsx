import React, { useEffect, useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAuthStore } from '../../stores/authStore';
import { Toaster } from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { getSignalRConnection, startSignalR, stopSignalR, registerOnReconnectedListener } from '../../utils/signalr';
import toast from 'react-hot-toast';

export function AppLayout() {
  const { isAuthenticated, user } = useAuthStore();
  const qc = useQueryClient();
  const [collapsed, setCollapsed] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setCollapsed(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // 1. Initial REST hydration on layout mount
    qc.invalidateQueries({ queryKey: ['notifications'] });
    qc.invalidateQueries({ queryKey: ['unread-count'] });

    // 2. Register reconnect listener for offline reconciliation
    const unregisterReconnect = registerOnReconnectedListener(() => {
      console.log('[AppLayout] Reconnect event received. Reconciling notifications with REST server...');
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['unread-count'] });
    });

    // 3. Connect SignalR
    let isSubscribed = true;
    startSignalR().then(() => {
      if (!isSubscribed) return;
      const conn = getSignalRConnection();

      const handleReceiveNotification = (rawPayload: any) => {
        const notifId = rawPayload?.id || rawPayload?.Id;
        const title = rawPayload?.title || rawPayload?.Title || 'Notification';
        const message = rawPayload?.message || rawPayload?.Message || 'You have a new update.';
        const targetUrl = rawPayload?.targetUrl || rawPayload?.TargetUrl;

        // Toast feedback
        toast(
          (t) => (
            <div className="flex flex-col gap-1 cursor-pointer" onClick={() => {
              toast.dismiss(t.id);
              if (targetUrl) window.location.href = targetUrl;
            }}>
              <span className="font-bold text-sm text-slate-800">{title}</span>
              <span className="text-xs text-slate-500">{message}</span>
            </div>
          ),
          { icon: '🔔', duration: 5000 }
        );

        // Deduplication & Cache Update
        if (notifId) {
          qc.setQueryData(['notifications'], (oldData: any) => {
            if (!oldData?.data?.data) {
              qc.invalidateQueries({ queryKey: ['notifications'] });
              return oldData;
            }
            const existingList = oldData.data.data as any[];
            if (existingList.some((item) => item.id === notifId)) {
              return oldData; // Deduplicated!
            }

            const newNotif = {
              id: notifId,
              userId: rawPayload?.userId || user.id,
              title,
              message,
              type: rawPayload?.type || 'Info',
              isRead: false,
              targetUrl,
              createdAt: rawPayload?.createdAt || new Date().toISOString(),
            };

            return {
              ...oldData,
              data: {
                ...oldData.data,
                data: [newNotif, ...existingList],
              },
            };
          });
        } else {
          qc.invalidateQueries({ queryKey: ['notifications'] });
        }

        qc.invalidateQueries({ queryKey: ['unread-count'] });
      };

      conn.off('ReceiveNotification');
      conn.on('ReceiveNotification', handleReceiveNotification);
    });

    return () => {
      isSubscribed = false;
      unregisterReconnect();
      stopSignalR();
    };
  }, [isAuthenticated, user?.id, qc]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header collapsed={collapsed} setCollapsed={setCollapsed} />
        <main className="flex-1 overflow-y-auto min-w-0">
          <div className="min-h-full p-6 animate-fadeIn">
            <Outlet />
          </div>
        </main>
      </div>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { borderRadius: '12px', fontSize: '14px', fontFamily: 'Inter, sans-serif' },
        }}
      />
    </div>
  );
}

export function AuthLayout() {
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return (
    <>
      <Outlet />
      <Toaster position="top-right" toastOptions={{ style: { borderRadius: '12px', fontSize: '14px' } }} />
    </>
  );
}
