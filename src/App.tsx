import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout, AuthLayout } from './components/layout/Layout';
import { RequireRole } from './components/auth/RequireRole';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { PageSpinner } from './components/ui/Spinner';

// Lazy load pages for optimized bundle sizing
const AuthPage = lazy(() => import('./pages/auth/AuthPage'));
const VerifyEmailPage = lazy(() => import('./pages/auth/VerifyEmailPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'));
const ClubsPage = lazy(() => import('./pages/clubs/ClubsPage'));
const ClubDetailPage = lazy(() => import('./pages/clubs/ClubDetailPage'));
const EventsPage = lazy(() => import('./pages/events/EventsPage'));
const ReportsPage = lazy(() => import('./pages/reports/ReportsPage'));
const FinancePage = lazy(() => import('./pages/finance/FinancePage'));
const KPIPage = lazy(() => import('./pages/kpi/KPIPage'));
const NotificationsPage = lazy(() => import('./pages/notifications/NotificationsPage'));
const AdminClubsPage = lazy(() => import('./pages/admin/AdminClubsPage'));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'));
const AdminBroadcastPage = lazy(() => import('./pages/admin/AdminBroadcastPage'));
const NotFoundPage = lazy(() => import('./pages/error/NotFoundPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 300000, // 5 minutes staleTime for standard performance pattern
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <Suspense fallback={<PageSpinner />}>
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<AuthPage mode="login" />} />
                <Route path="/register" element={<AuthPage mode="register" />} />
                <Route path="/verify-email" element={<VerifyEmailPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              </Route>

              {/* Protected routes */}
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/clubs" element={<ClubsPage />} />
                <Route path="/clubs/:id" element={<ClubDetailPage />} />
                <Route path="/events" element={<EventsPage />} />
                <Route path="/kpi" element={<KPIPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />

                <Route element={<RequireRole allowedRoles={['ClubManager', 'Admin', 'Advisor']} />}>
                  <Route path="/reports" element={<ReportsPage />} />
                  <Route path="/finance" element={<FinancePage />} />
                </Route>

                <Route element={<RequireRole allowedRoles={['Admin', 'Advisor']} />}>
                  <Route path="/admin/clubs" element={<AdminClubsPage />} />
                  <Route path="/admin/reports" element={<ReportsPage />} />
                  <Route path="/admin/finance" element={<FinancePage />} />
                  <Route path="/admin/kpi-rules" element={<KPIPage />} />
                  <Route path="/admin/users" element={<AdminUsersPage />} />
                  <Route path="/admin/broadcast" element={<AdminBroadcastPage />} />
                </Route>
              </Route>

              {/* Default redirect */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </BrowserRouter>
        </Suspense>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;
