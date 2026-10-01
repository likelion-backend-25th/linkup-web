import { CreditCard, Flag, House, PenLine, Search, User, Users } from 'lucide-react';
import { Link, NavLink } from 'react-router';
import { LoginPromptDialog } from '@/components/LoginPromptDialog.tsx';
import { UserAccountMenu } from '@/components/UserAccountMenu.tsx';
import { useAuthStore } from '@/stores/useAuthStore.ts';
import { useLoginPromptStore } from '@/stores/useLoginPromptStore.ts';

const navItems = [
  { to: '/', label: '홈', icon: House, auth: false },
  { to: '/search', label: '검색', icon: Search, auth: true },
  { to: '/profile', label: '내프로필', icon: User, auth: true },
  { to: '/posts/new', label: '글쓰기', icon: PenLine, auth: true },
] as const;

const adminItems = [
  { to: '/admin/members', label: '회원', icon: Users },
  { to: '/admin/reports', label: '신고 관리', icon: Flag },
  { to: '/admin/payment', label: '결제', icon: CreditCard },
] as const;

function navClassName(isActive: boolean): string {
  return [
    'inline-flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium',
    isActive ? 'bg-linkup-soft text-linkup' : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800',
  ].join(' ');
}

export function LinkUpSideNav() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const profile = useAuthStore((state) => state.profile);
  const showLoginPrompt = useLoginPromptStore((state) => state.show);
  const isAdmin = profile?.role.trim().toUpperCase() === 'ROLE_ADMIN';

  return (
    <>
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
                  onClick={(event) => {
                    if (item.auth && !accessToken) {
                      event.preventDefault();
                      showLoginPrompt();
                    }
                  }}
                  className={({ isActive }) => navClassName(isActive)}
                >
                  <Icon className="size-4" aria-hidden />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
          {isAdmin ? (
            <div className="mt-3 border-t border-zinc-100 pt-3">
              <p className="px-3 pb-1 text-xs font-semibold text-zinc-400">관리자</p>
              <nav className="flex flex-col gap-1">
                {adminItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) => navClassName(isActive)}
                    >
                      <Icon className="size-4" aria-hidden />
                      {item.label}
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          ) : null}
        </div>

        <UserAccountMenu />
      </aside>
      <LoginPromptDialog />
    </>
  );
}
