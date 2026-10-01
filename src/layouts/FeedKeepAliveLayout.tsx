import { Outlet, useLocation } from 'react-router';
import { FeedPage } from '@/pages/FeedPage.tsx';

export function FeedKeepAliveLayout() {
  const { pathname } = useLocation();
  const showFeed = pathname === '/';

  return (
    <>
      <div className={showFeed ? 'h-full min-h-0' : 'hidden'}>
        <FeedPage />
      </div>
      {showFeed ? null : <Outlet />}
    </>
  );
}
