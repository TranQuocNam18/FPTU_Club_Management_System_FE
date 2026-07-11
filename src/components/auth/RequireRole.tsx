import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import type { User } from '../../types';

interface RequireRoleProps {
  allowedRoles: User['role'][];
}

export function RequireRole({ allowedRoles }: RequireRoleProps) {
  const { user } = useAuthStore();

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
