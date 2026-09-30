import { Navigate, Outlet } from 'react-router';
import type { AuthOutletContext } from '@/hooks/useRequiredAccessToken.ts';
import { useAuthStore } from '@/stores/useAuthStore.ts';

export function RequireAuth() {
  const accessToken = useAuthStore((state) => state.accessToken);

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet context={{ accessToken } satisfies AuthOutletContext} />;
}
