import { useEffect, useRef, useState } from 'react';
import { EllipsisVertical } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { ConfirmDialog } from '@/components/ConfirmDialog.tsx';
import { MemberAvatar } from '@/components/MemberAvatar.tsx';
import { useAuthStore } from '@/stores/useAuthStore.ts';

export function UserAccountMenu() {
  const navigate = useNavigate();
  const accessToken = useAuthStore((state) => state.accessToken);
  const profile = useAuthStore((state) => state.profile);
  const logout = useAuthStore((state) => state.logout);
  const [open, setOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const displayName = profile?.nickname ?? '회원';
  const handle = profile?.uniqueId || '';
  const isAdmin = profile?.role.trim().toUpperCase() === 'ROLE_ADMIN';

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  function requestLogout() {
    setOpen(false);
    setConfirmLogout(true);
  }

  function confirmLogoutAction() {
    setConfirmLogout(false);
    logout();
    void navigate('/login');
  }

  if (!accessToken) {
    return (
      <Link
        to="/login"
        className="flex items-center gap-3 rounded-xl px-1 py-1.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
      >
        <span className="size-11 shrink-0 rounded-full border border-zinc-200 bg-zinc-50" aria-hidden />
        로그인
      </Link>
    );
  }

  return (
    <div ref={menuRef} className="relative">
      {open && (
        <div
          role="menu"
          className="absolute bottom-full left-0 mb-2 w-full rounded-xl border border-zinc-100 bg-white py-1 shadow-md"
        >
          {isAdmin ? (
            <Link
              role="menuitem"
              to="/admin"
              onClick={() => setOpen(false)}
              className="block px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
            >
              관리자 페이지
            </Link>
          ) : null}
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
            onClick={requestLogout}
            className="block w-full px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50"
          >
            로그아웃
          </button>
        </div>
      )}

      <div className="flex items-center gap-3">
        <MemberAvatar name={displayName} imageUrl={profile?.profileImage ?? null} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-zinc-900">{displayName}</p>
          {handle ? <p className="truncate text-xs text-zinc-400">@{handle}</p> : null}
        </div>
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
          className="flex size-8 shrink-0 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700"
        >
          <EllipsisVertical className="size-5" aria-hidden />
          <span className="sr-only">계정 메뉴</span>
        </button>
      </div>

      {confirmLogout && (
        <ConfirmDialog
          message="로그아웃 하시겠습니까?"
          confirmLabel="로그아웃"
          danger
          onClose={() => setConfirmLogout(false)}
          onConfirm={confirmLogoutAction}
        />
      )}
    </div>
  );
}
