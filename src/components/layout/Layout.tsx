import React, { useEffect, useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAuthStore } from '../../stores/authStore';
import { Toaster } from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { getSignalRConnection, startSignalR, stopSignalR } from '../../utils/signalr';
import toast from 'react-hot-toast';

export function AppLayout() {
  const { isAuthenticated } = useAuthStore();
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
    if (!isAuthenticated) return;
    const token = useAuthStore.getState().accessToken;
    if (token) {
      startSignalR(token).then(() => {
        const conn = getSignalRConnection(token);
        conn.on('ReceiveNotification', (notification: any) => {
          toast((t) => (
            <div className="flex flex-col gap-1">
              <span className="font-bold text-sm text-slate-800">{notification.title || notification.Title}</span>
              <span className="text-xs text-slate-500">{notification.message || notification.Message}</span>
            </div>
          ), { icon: 'Bell', duration: 5000 });
          qc.invalidateQueries({ queryKey: ['notifications'] });
        });
      });
    }

    return () => {
      stopSignalR();
    };
  }, [isAuthenticated, qc]);

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
