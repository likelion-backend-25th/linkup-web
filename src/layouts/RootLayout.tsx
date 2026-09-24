import { Outlet } from 'react-router';
import { LinkUpSideNav } from '@/components/LinkUpSideNav.tsx';

export function RootLayout() {
  return (
    <div className="h-svh overflow-hidden bg-canvas p-4 md:p-6">
      <div className="mx-auto flex h-full max-w-6xl flex-col gap-4 lg:flex-row">
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
