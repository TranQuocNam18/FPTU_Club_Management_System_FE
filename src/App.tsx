import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout, AuthLayout } from './components/layout/Layout';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import ClubsPage from './pages/clubs/ClubsPage';
import ClubDetailPage from './pages/clubs/ClubDetailPage';
import EventsPage from './pages/events/EventsPage';
import ReportsPage from './pages/reports/ReportsPage';
import FinancePage from './pages/finance/FinancePage';
import KPIPage from './pages/kpi/KPIPage';
import NotificationsPage from './pages/notifications/NotificationsPage';
import AdminClubsPage from './pages/admin/AdminClubsPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminBroadcastPage from './pages/admin/AdminBroadcastPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          {/* Protected routes */}
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/clubs" element={<ClubsPage />} />
            <Route path="/clubs/:id" element={<ClubDetailPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/finance" element={<FinancePage />} />
            <Route path="/kpi" element={<KPIPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />

            {/* Admin routes */}
            <Route path="/admin/clubs" element={<AdminClubsPage />} />
            <Route path="/admin/reports" element={<ReportsPage />} />
            <Route path="/admin/finance" element={<FinancePage />} />
            <Route path="/admin/kpi-rules" element={<KPIPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/broadcast" element={<AdminBroadcastPage />} />
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
