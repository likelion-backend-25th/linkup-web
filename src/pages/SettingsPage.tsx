import { useState } from 'react';
import { Link } from 'react-router';
import { toErrorMessage } from '@/api/http.ts';
import { ConfirmDialog } from '@/components/ConfirmDialog.tsx';
import { MemberAvatar } from '@/components/MemberAvatar.tsx';
import { useBlockedMembers } from '@/hooks/useBlockedMembers.ts';
import { useRequiredAccessToken } from '@/hooks/useRequiredAccessToken.ts';

export function SettingsPage() {
  const accessToken = useRequiredAccessToken();
  const { members, loading, error, unblock } = useBlockedMembers(accessToken);
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);
  const [confirmUnblock, setConfirmUnblock] = useState<{
    memberId: number;
    name: string;
  } | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function onUnblock() {
    if (confirmUnblock === null) {
      return;
    }
    setPendingId(confirmUnblock.memberId);
    setActionError(null);
    try {
      await unblock(confirmUnblock.memberId);
      setConfirmUnblock(null);
    } catch (caught: unknown) {
      setActionError(toErrorMessage(caught));
    } finally {
      setPendingId(null);
    }
  }

  return (
    <section className="flex h-full min-h-0 overflow-hidden rounded-2xl bg-white shadow-sm">
      <nav className="flex w-44 shrink-0 flex-col gap-1 border-r border-zinc-100 p-4">
        <span className="rounded-xl bg-zinc-50 px-3 py-2 text-left text-sm font-semibold text-zinc-900">
          차단한 사용자
        </span>
        <button
          type="button"
          onClick={() => {
            setActionError(null);
            setConfirmWithdraw(true);
          }}
          className="rounded-xl px-3 py-2 text-left text-sm text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800"
        >
          회원 탈퇴
        </button>
      </nav>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <h1 className="shrink-0 border-b border-zinc-100 px-6 py-4 text-base font-semibold text-zinc-900">
          차단한 사용자
        </h1>
        <div className="linkup-scrollbar min-h-0 flex-1 overflow-y-auto">
          {loading && members.length === 0 ? (
            <p className="px-6 py-8 text-sm text-zinc-400">목록을 불러오는 중...</p>
          ) : error && members.length === 0 ? (
            <p className="px-6 py-8 text-sm text-red-500">{error}</p>
          ) : members.length === 0 ? (
            <p className="px-6 py-8 text-sm text-zinc-400">차단한 사용자가 없습니다.</p>
          ) : (
            <ul>
              {members.map((member) => (
                <li
                  key={member.memberId}
                  className="flex items-center gap-3 px-6 py-3 hover:bg-zinc-50"
                >
                  <Link
                    to={`/members/${member.memberId}`}
                    state={{
                      name: member.name,
                      uniqueId: member.uniqueId,
                      profileImage: member.profileImage,
                    }}
                    className="flex min-w-0 flex-1 items-center gap-3"
                  >
                    <MemberAvatar
                      name={member.name || '회원'}
                      imageUrl={member.profileImage}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-900">
                        {member.name || '회원'}
                      </p>
                      <p className="truncate text-xs text-zinc-400">
                        @{member.uniqueId || '아이디'}
                      </p>
                    </div>
                  </Link>
                  <button
                    type="button"
                    disabled={pendingId === member.memberId}
                    onClick={() =>
                      setConfirmUnblock({
                        memberId: member.memberId,
                        name: member.name || '회원',
                      })
                    }
                    className="shrink-0 rounded-xl border border-zinc-200 px-3 py-1.5 text-sm text-zinc-700 hover:bg-white disabled:opacity-60"
                  >
                    차단 해제
                  </button>
                </li>
              ))}
            </ul>
          )}
          {actionError && <p className="px-6 py-3 text-sm text-red-500">{actionError}</p>}
        </div>
      </div>

      {confirmUnblock && (
        <ConfirmDialog
          message={`${confirmUnblock.name} 님의 차단을 해제할까요?`}
          confirmLabel="차단 해제"
          pending={pendingId === confirmUnblock.memberId}
          onClose={() => setConfirmUnblock(null)}
          onConfirm={() => void onUnblock()}
        />
      )}
      {confirmWithdraw && (
        <ConfirmDialog
          message="회원 탈퇴하시겠습니까?"
          confirmLabel="회원 탈퇴"
          danger
          onClose={() => setConfirmWithdraw(false)}
          onConfirm={() => {
            setConfirmWithdraw(false);
            setActionError('회원 탈퇴 API가 아직 없습니다.');
          }}
        />
      )}
    </section>
  );
}
