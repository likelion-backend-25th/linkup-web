import { Navigate, Outlet, useOutletContext } from 'react-router';
import type { AuthOutletContext } from '@/hooks/useRequiredAccessToken.ts';
import { useAuthStore } from '@/stores/useAuthStore.ts';

export function RequireAdmin() {
  const profile = useAuthStore((state) => state.profile);
  const accessToken = useOutletContext<AuthOutletContext>();
  const isAdmin = profile?.role.trim().toUpperCase() === 'ROLE_ADMIN';

  if (!profile) {
    return (
      <section className="h-full rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-sm text-zinc-400">불러오는 중...</p>
      </section>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet context={accessToken} />;
}
