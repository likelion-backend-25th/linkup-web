import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import { FollowMemberList } from '@/components/FollowMemberList.tsx';
import { useAuthStore } from '@/stores/useAuthStore.ts';

export function FollowListPage() {
  const params = useParams();
  const navigate = useNavigate();
  const profileId = useAuthStore((state) => state.profile?.id ?? null);
  const routeMemberId = Number(params.memberId);
  const isMemberProfile = Number.isInteger(routeMemberId) && routeMemberId > 0;
  const memberId = isMemberProfile ? routeMemberId : profileId;
  const backTo = isMemberProfile ? `/members/${routeMemberId}` : '/profile';

  function goBack() {
    const idx = (window.history.state as { idx?: number } | null)?.idx;
    if (typeof idx === 'number' && idx > 0) {
      void navigate(-1);
      return;
    }
    void navigate(backTo, { replace: true });
  }

  const backLink = (
    <div className="shrink-0 border-b border-zinc-100 px-5 py-3">
      <button
        type="button"
        onClick={goBack}
        className="inline-flex items-center gap-1 text-sm font-medium text-zinc-500 hover:text-linkup"
      >
        <ArrowLeft className="size-4" aria-hidden />
        뒤로
      </button>
    </div>
  );

  if (memberId === null) {
    return (
      <section className="flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm">
        {backLink}
        <p className="flex flex-1 items-center justify-center text-sm text-zinc-400">
          로그인 후 팔로우 목록을 볼 수 있습니다.
        </p>
      </section>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl bg-white shadow-sm">
      {backLink}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <FollowMemberList memberId={memberId} listType="followers" title="팔로워" />
        <div className="w-px shrink-0 bg-zinc-200" />
        <FollowMemberList memberId={memberId} listType="followings" title="팔로잉" />
      </div>
    </div>
  );
}
