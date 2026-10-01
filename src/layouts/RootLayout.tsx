import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import { fetchMyProfile } from '@/api/auth.ts';
import { LinkUpSideNav } from '@/components/LinkUpSideNav.tsx';
import { useAuthStore } from '@/stores/useAuthStore.ts';

export function RootLayout() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const setProfile = useAuthStore((state) => state.setProfile);
  const isAdminRoute = useLocation().pathname.startsWith('/admin');

  useEffect(() => {
    if (!accessToken) {
      return;
    }
    const controller = new AbortController();
    void fetchMyProfile(accessToken, controller.signal)
      .then(setProfile)
      .catch(() => undefined);
    return () => controller.abort();
  }, [accessToken, setProfile]);

  return (
    <div className="h-svh overflow-hidden bg-canvas p-3 md:p-5">
      <div
        className={`mx-auto flex h-full w-full flex-col gap-4 lg:flex-row ${isAdminRoute ? 'max-w-[104rem]' : 'max-w-[92rem]'}`}
      >
        <div className="lg:h-full lg:w-56 lg:shrink-0">
          <LinkUpSideNav />
        </div>
        <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
