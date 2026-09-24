import { Bell, House, PenLine, Search, User } from 'lucide-react';
import { Link, NavLink } from 'react-router';
import { UserAccountMenu } from '@/components/UserAccountMenu.tsx';

const navItems = [
  { to: '/', label: '홈', icon: House },
  { to: '/search', label: '검색', icon: Search },
  { to: '/notifications', label: '알림', icon: Bell, badge: true },
  { to: '/profile', label: '내프로필', icon: User },
  { to: '/posts/new', label: '글쓰기', icon: PenLine },
] as const;

export function LinkUpSideNav() {
  return (
    <aside className="flex h-full min-h-0 flex-col justify-between rounded-2xl bg-white p-5 shadow-sm">
      <div>
        <Link to="/" className="mb-8 inline-flex items-center text-lg font-bold text-zinc-900">
          LinkUp
        </Link>

        <nav className="flex flex-wrap gap-1 md:flex-col">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  [
                    'inline-flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium',
                    isActive
                      ? 'bg-linkup-soft text-linkup'
                      : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800',
                  ].join(' ')
                }
              >
                <span className="relative">
                  <Icon className="size-4" aria-hidden />
                  {'badge' in item && item.badge ? (
                    <span className="absolute -right-0.5 -top-0.5 size-1.5 rounded-full bg-linkup" />
                  ) : null}
                </span>
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </div>

      <UserAccountMenu />
    </aside>
  );
}
