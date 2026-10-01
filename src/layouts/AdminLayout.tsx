import { Outlet } from 'react-router';

export function AdminLayout() {
  return (
    <div className="flex h-full min-h-0 min-w-0">
      <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
