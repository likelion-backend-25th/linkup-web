import { NavLink, Outlet } from 'react-router';

const menus = [
  { to: '/admin/members', label: '회원' },
  { to: '/admin/reports', label: '신고' },
  { to: '/admin/payment', label: '결제' },
] as const;

export function AdminLayout() {
  return (
    <div className="flex h-full min-h-0 gap-4">
      <aside className="flex w-40 shrink-0 flex-col rounded-2xl bg-white p-4 shadow-sm">
        <p className="px-3 pb-3 text-sm font-bold text-zinc-900">관리자</p>
        <nav className="flex flex-col gap-1">
          {menus.map((menu) => (
            <NavLink
              key={menu.to}
              to={menu.to}
              className={({ isActive }) =>
                [
                  'rounded-xl px-3 py-2.5 text-sm font-medium',
                  isActive
                    ? 'bg-linkup-soft text-linkup'
                    : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800',
                ].join(' ')
              }
            >
              {menu.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
