import { useParams } from 'react-router';
import { FollowMemberList } from '@/components/FollowMemberList.tsx';
import { useAuthStore } from '@/stores/useAuthStore.ts';

export function FollowListPage() {
  const params = useParams();
  const profileId = useAuthStore((state) => state.profile?.id ?? null);
  const routeMemberId = Number(params.memberId);
  const memberId =
    Number.isInteger(routeMemberId) && routeMemberId > 0 ? routeMemberId : profileId;

  if (memberId === null) {
    return (
      <section className="flex h-full items-center justify-center rounded-2xl bg-white shadow-sm">
        <p className="text-sm text-zinc-400">로그인 후 팔로우 목록을 볼 수 있습니다.</p>
      </section>
    );
  }

  return (
    <div className="flex h-full min-h-0 overflow-hidden rounded-2xl bg-white shadow-sm">
      <FollowMemberList memberId={memberId} listType="followers" title="팔로워" />
      <div className="w-px shrink-0 bg-zinc-200" />
      <FollowMemberList memberId={memberId} listType="followings" title="팔로잉" />
    </div>
  );
}
