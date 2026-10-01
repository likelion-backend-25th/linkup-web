import { useState } from 'react';
import { Link } from 'react-router';
import { MemberAvatar } from '@/components/MemberAvatar.tsx';
import { useLoginPromptStore } from '@/stores/useLoginPromptStore.ts';

interface SuggestedUser {
  memberId: number;
  nickname: string;
  uniqueId: string;
  profileImage: string | null;
}

interface SuggestedUsersProps {
  users: SuggestedUser[];
}

export function SuggestedUsers({ users }: SuggestedUsersProps) {
  const [following, setFollowing] = useState<number[]>([]);
  const promptIfLoggedOut = useLoginPromptStore((state) => state.promptIfLoggedOut);

  function toggleFollow(memberId: number) {
    if (promptIfLoggedOut()) {
      return;
    }
    setFollowing((current) =>
      current.includes(memberId)
        ? current.filter((id) => id !== memberId)
        : [...current, memberId],
    );
  }

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold text-zinc-900">추천 유저</h2>
      {users.length === 0 ? (
        <p className="text-sm text-zinc-400">추천할 사용자가 없습니다.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {users.map((user) => {
            const isFollowing = following.includes(user.memberId);
            return (
              <li key={user.memberId} className="flex items-center gap-3">
                <Link
                  to={`/members/${user.memberId}`}
                  state={{
                    name: user.nickname,
                    uniqueId: user.uniqueId,
                    profileImage: user.profileImage,
                  }}
                  aria-label={`${user.nickname} 프로필`}
                >
                  <MemberAvatar name={user.nickname} imageUrl={user.profileImage} size="sm" />
                </Link>
                <Link
                  to={`/members/${user.memberId}`}
                  state={{
                    name: user.nickname,
                    uniqueId: user.uniqueId,
                    profileImage: user.profileImage,
                  }}
                  className="min-w-0 flex-1 hover:text-linkup"
                >
                  <p className="truncate text-sm font-medium text-zinc-800">{user.nickname}</p>
                  <p className="truncate text-xs text-zinc-400">@{user.uniqueId}</p>
                </Link>
                <button
                  type="button"
                  onClick={() => toggleFollow(user.memberId)}
                  className={
                    isFollowing
                      ? 'rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-500'
                      : 'rounded-full bg-linkup px-3 py-1 text-xs font-medium text-white'
                  }
                >
                  {isFollowing ? '팔로잉' : '팔로우'}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
