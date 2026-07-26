import { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import toast, { Toaster } from 'react-hot-toast';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Drawer } from '../ui/Drawer';
import { useAuthStore } from '../../stores/authStore';
import { authApi } from '../../api/auth.api';
import { getSignalRConnection, startSignalR, stopSignalR, subscribeRealtimeState } from '../../utils/signalr';

export function AppLayout() {
  const { isAuthenticated, accessToken, refreshToken, user, logout } = useAuthStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuTriggerRef = useRef<HTMLButtonElement>(null);

  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

  const handleLogout = useCallback(async () => {
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch {
        // Local logout must still complete if the refresh token is expired.
      }
    }
    queryClient.clear();
    logout();
    navigate('/login');
  }, [logout, navigate, queryClient, refreshToken]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const token = accessToken;
    let active = true;
    let notificationHandler:
      | ((notification: { title?: string; Title?: string; message?: string; Message?: string }) => void)
      | null = null;

    if (token) {
      const unsubscribeState = subscribeRealtimeState((state) => {
        if (state === 'connected') {
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
      });
      startSignalR(token).then(() => {
        if (!active) return;
        const connection = getSignalRConnection(token);
        notificationHandler = (notification) => {
          toast(
            () => (
              <div className="flex flex-col gap-1">
                <span className="text-sm font-bold text-slate-800">{notification.title || notification.Title}</span>
                <span className="text-xs text-slate-500">{notification.message || notification.Message}</span>
              </div>
            ),
            { icon: <Bell size={18} aria-hidden="true" />, duration: 5000 },
          );
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        };
        connection.on('ReceiveNotification', notificationHandler);
      });
      return () => {
        active = false;
        unsubscribeState();
        if (notificationHandler) {
          getSignalRConnection(token).off('ReceiveNotification', notificationHandler);
        }
        stopSignalR();
      };
    }

    return () => {
      active = false;
      stopSignalR();
    };
  }, [accessToken, isAuthenticated, queryClient]);

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className={`app-shell ${sidebarCollapsed ? 'app-shell--collapsed' : ''}`}>
      <div className="app-shell__desktop-sidebar">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((current) => !current)}
          onLogout={handleLogout}
        />
      </div>

      <div className="app-shell__workspace">
        <Header
          user={user}
          menuTriggerRef={mobileMenuTriggerRef}
          onOpenMenu={() => setMobileMenuOpen(true)}
          onLogout={handleLogout}
        />
        <main className="app-main" id="main-content">
          <div className="app-content">
            <Outlet />
          </div>
        </main>
      </div>

      <Drawer open={mobileMenuOpen} onClose={closeMobileMenu} triggerRef={mobileMenuTriggerRef}>
        <Sidebar mobile onNavigate={closeMobileMenu} onLogout={handleLogout} />
      </Drawer>

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: 'var(--radius-lg)',
            fontSize: '14px',
            fontFamily: 'Inter, sans-serif',
          },
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
      <Toaster
        position="top-right"
        toastOptions={{ style: { borderRadius: 'var(--radius-lg)', fontSize: '14px' } }}
      />
    </>
  );
}
