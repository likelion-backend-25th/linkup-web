import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router';
import type { AuthOutletContext } from '@/hooks/useRequiredAccessToken.ts';
import { useAuthStore } from '@/stores/useAuthStore.ts';
import { useLoginPromptStore } from '@/stores/useLoginPromptStore.ts';

export function RequireAuth() {
  const accessToken = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    if (!accessToken) {
      useLoginPromptStore.getState().show();
    }
  }, [accessToken]);

  if (!accessToken) {
    return <Navigate to="/" replace />;
  }
  return <Outlet context={{ accessToken } satisfies AuthOutletContext} />;
}
