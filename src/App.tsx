import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout, AuthLayout } from './components/layout/Layout';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';
import PasswordRecoveryPage from './pages/auth/PasswordRecoveryPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import ClubsPage from './pages/clubs/ClubsPage';
import ClubDetailPage from './pages/clubs/ClubDetailPage';
import EventsPage from './pages/events/EventsPage';
import ReportsPage from './pages/reports/ReportsPage';
import NotificationsPage from './pages/notifications/NotificationsPage';
import AdminClubsPage from './pages/admin/AdminClubsPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import FinancePage from './pages/finance/FinancePage';
import KpiPage from './pages/kpi/KpiPage';
import ClubApplicationsPage from './pages/clubs/ClubApplicationsPage';
import AdminClubApplicationsPage from './pages/admin/AdminClubApplicationsPage';
import { useAuthStore } from './stores/authStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
      refetchOnWindowFocus: false,
    },
  },
});

// Guard route for Student Affairs administrators only.
function AdminGuard() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'StudentAffairsAdmin';
  return isAdmin ? <Outlet /> : <Navigate to="/dashboard" replace />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/forgot-password" element={<PasswordRecoveryPage />} />
          </Route>

          {/* Protected routes */}
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/clubs" element={<ClubsPage />} />
            <Route path="/clubs/:id" element={<ClubDetailPage />} />
            <Route path="/club-applications" element={<ClubApplicationsPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/finance" element={<FinancePage />} />
            <Route path="/kpi" element={<KpiPage />} />

            {/* Student Affairs administration routes protected by AdminGuard */}
            <Route element={<AdminGuard />}>
              <Route path="/admin/clubs" element={<AdminClubsPage />} />
              <Route path="/admin/club-applications" element={<AdminClubApplicationsPage />} />
              <Route path="/admin/reports" element={<ReportsPage />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
            </Route>
          </Route>

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
