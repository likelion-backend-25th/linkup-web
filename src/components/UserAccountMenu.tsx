import { useEffect, useRef, useState } from 'react';
import { Ellipsis } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { useAuthStore } from '@/stores/useAuthStore.ts';

export function UserAccountMenu() {
  const navigate = useNavigate();
  const profile = useAuthStore((state) => state.profile);
  const logout = useAuthStore((state) => state.logout);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const displayName = profile?.nickname ?? '게스트';
  const handle = profile?.nickname
    ? profile.nickname.replaceAll(/\s+/g, '').toLowerCase()
    : 'guest';

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  function handleLogout() {
    setOpen(false);
    logout();
    void navigate('/login');
  }

  return (
    <div ref={menuRef} className="relative">
      {open && (
        <div
          role="menu"
          className="absolute bottom-full left-0 mb-2 w-full rounded-xl border border-zinc-100 bg-white py-1 shadow-md"
        >
          <Link
            role="menuitem"
            to="/subscriptions"
            onClick={() => setOpen(false)}
            className="block px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
          >
            구독 관리
          </Link>
          <Link
            role="menuitem"
            to="/settings"
            onClick={() => setOpen(false)}
            className="block px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
          >
            설정
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="block w-full px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50"
          >
            로그아웃
          </button>
        </div>
      )}

      <div className="flex items-center gap-3">
        {profile?.profileImage ? (
          <img
            src={profile.profileImage}
            alt=""
            className="size-10 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-linkup-soft text-sm font-semibold text-linkup">
            {displayName.slice(0, 1)}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-zinc-900">{displayName}</p>
          <p className="truncate text-xs text-zinc-400">@{handle}</p>
        </div>
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
          className="flex size-8 shrink-0 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700"
        >
          <Ellipsis className="size-5" aria-hidden />
          <span className="sr-only">계정 메뉴</span>
        </button>
      </div>
    </div>
  );
}
