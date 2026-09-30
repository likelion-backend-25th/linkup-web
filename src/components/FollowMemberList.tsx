import { useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { MemberAvatar } from '@/components/MemberAvatar.tsx';
import { useFollowMembers } from '@/hooks/useFollowMembers.ts';
import type { FollowListType } from '@/types/follow.ts';

interface FollowMemberListProps {
  memberId: number;
  listType: FollowListType;
  title: string;
}

export function FollowMemberList({ memberId, listType, title }: FollowMemberListProps) {
  const { members, hasNext, loading, error, loadMore } = useFollowMembers(memberId, listType);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = scrollRef.current;
    const sentinel = sentinelRef.current;
    if (!root || !sentinel || !hasNext || loading || error) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void loadMore();
        }
      },
      { root, rootMargin: '160px 0px' },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [error, hasNext, loadMore, loading, members.length]);

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-white">
      <h2 className="shrink-0 border-b border-zinc-100 px-6 py-4 text-base font-semibold text-zinc-900">
        {title}
      </h2>
      <div ref={scrollRef} className="linkup-scrollbar min-h-0 flex-1 overflow-y-auto">
        {loading && members.length === 0 ? (
          <p className="px-6 py-8 text-sm text-zinc-400">목록을 불러오는 중...</p>
        ) : error && members.length === 0 ? (
          <p className="px-6 py-8 text-sm text-red-500">{error}</p>
        ) : members.length === 0 ? (
          <p className="px-6 py-8 text-sm text-zinc-400">표시할 회원이 없습니다.</p>
        ) : (
          <ul>
            {members.map((member) => (
              <li key={member.memberId}>
                <Link
                  to={`/members/${member.memberId}`}
                  state={{
                    name: member.name,
                    uniqueId: member.uniqueId,
                    profileImage: member.profileImage,
                  }}
                  className="flex items-center gap-3 px-6 py-3 hover:bg-zinc-50"
                >
                  <MemberAvatar name={member.name} imageUrl={member.profileImage} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-900">{member.name}</p>
                    <p className="truncate text-xs text-zinc-400">@{member.uniqueId}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <div ref={sentinelRef} className="h-8" />
        {loading && members.length > 0 && (
          <p className="py-3 text-center text-xs text-zinc-400">더 불러오는 중...</p>
        )}
        {error && members.length > 0 && (
          <p className="py-3 text-center text-xs text-red-500">{error}</p>
        )}
      </div>
    </section>
  );
}
