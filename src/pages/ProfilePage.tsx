import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { fetchMyPosts } from '@/api/feed.ts';
import { fetchFollow } from '@/api/follow.ts';
import { isAbortError, toErrorMessage } from '@/api/http.ts';
import { MemberAvatar } from '@/components/MemberAvatar.tsx';
import { useAuthStore } from '@/stores/useAuthStore.ts';
import type { PostFeedItem } from '@/types/feed.ts';

type ProfileTab = 'public' | 'subscriber';

function formatCount(value: number): string {
  if (value >= 10000) {
    const man = value / 10000;
    const text = Number.isInteger(man) ? String(man) : man.toFixed(1);
    return `${text}만`;
  }
  return value.toLocaleString('ko-KR');
}

export function ProfilePage() {
  const profile = useAuthStore((state) => state.profile);
  const [tab, setTab] = useState<ProfileTab>('public');
  const [publicPosts, setPublicPosts] = useState<PostFeedItem[]>([]);
  const [posts, setPosts] = useState<PostFeedItem[]>([]);
  const [followerCount, setFollowerCount] = useState<number | null>(null);
  const [followingCount, setFollowingCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const owner = publicPosts[0];
  const name = owner?.memberName ?? profile?.nickname ?? '회원';
  const uniqueId = owner?.uniqueId ?? '';
  const imageUrl = owner?.profileImageUrl ?? profile?.profileImage ?? null;
  const memberId = owner?.memberId ?? profile?.id ?? null;

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const nextPosts = await fetchMyPosts(tab === 'subscriber', controller.signal);
        setPosts(nextPosts);
        if (tab === 'public') {
          setPublicPosts(nextPosts);
        }
      } catch (caught: unknown) {
        if (isAbortError(caught)) {
          return;
        }
        setError(toErrorMessage(caught));
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => controller.abort();
  }, [tab]);

  useEffect(() => {
    if (memberId === null) {
      return;
    }
    const controller = new AbortController();

    async function loadFollow() {
      try {
        const follow = await fetchFollow(memberId as number, controller.signal);
        setFollowerCount(follow.followerCount);
        setFollowingCount(follow.followingCount);
      } catch (caught: unknown) {
        if (!isAbortError(caught)) {
          setFollowerCount(null);
          setFollowingCount(null);
        }
      }
    }

    void loadFollow();
    return () => controller.abort();
  }, [memberId]);

  return (
    <section className="h-full overflow-y-auto rounded-2xl bg-white px-6 py-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-4">
        <MemberAvatar name={name} imageUrl={imageUrl} size="lg" />
        <div className="min-w-0">
          <p className="text-lg font-semibold text-zinc-900">
            {name}
            {uniqueId && <span className="ml-2 text-sm font-normal text-zinc-400">@{uniqueId}</span>}
          </p>
        </div>
      </div>

      <dl className="mt-5 flex gap-8 text-center">
        <div>
          <dt className="text-xs text-zinc-400">게시글</dt>
          <dd className="text-lg font-semibold text-zinc-900">{formatCount(publicPosts.length)}</dd>
        </div>
        <div>
          <dt className="text-xs text-zinc-400">팔로워</dt>
          <dd className="text-lg font-semibold text-zinc-900">
            {followerCount === null ? '-' : formatCount(followerCount)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-zinc-400">팔로잉</dt>
          <dd className="text-lg font-semibold text-zinc-900">
            {followingCount === null ? '-' : formatCount(followingCount)}
          </dd>
        </div>
      </dl>

      <div className="mt-5 flex flex-wrap gap-2">
        <Link
          to="/settings"
          className="rounded-xl border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          프로필 수정
        </Link>
        <span className="rounded-xl border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-400">
          크리에이터 페이지
        </span>
        <Link
          to="/subscriptions"
          className="rounded-xl border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          내가 구독한 크리에이터
        </Link>
      </div>

      <div className="mt-6 flex gap-5 border-b border-zinc-100">
        <button
          type="button"
          onClick={() => setTab('public')}
          className={
            tab === 'public'
              ? 'border-b-2 border-linkup py-3 text-sm font-semibold text-linkup'
              : 'py-3 text-sm font-medium text-zinc-400'
          }
        >
          전체공개
        </button>
        <button
          type="button"
          onClick={() => setTab('subscriber')}
          className={
            tab === 'subscriber'
              ? 'border-b-2 border-linkup py-3 text-sm font-semibold text-linkup'
              : 'py-3 text-sm font-medium text-zinc-400'
          }
        >
          구독자 전용
        </button>
      </div>

      {loading && <p className="py-8 text-sm text-zinc-400">게시글을 불러오는 중...</p>}
      {error && <p className="py-8 text-sm text-red-500">{error}</p>}
      {!loading && !error && posts.length === 0 && (
        <p className="py-8 text-sm text-zinc-400">표시할 게시글이 없습니다.</p>
      )}
      {!loading && !error && posts.length > 0 && (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {posts.map((post) => (
            <li key={post.postId}>
              <Link to={`/posts/${post.postId}`} className="block overflow-hidden rounded-2xl bg-zinc-100">
                {post.mainImageUrl ? (
                  <img src={post.mainImageUrl} alt="" className="aspect-square w-full object-cover" />
                ) : (
                  <span className="flex aspect-square items-center p-3 text-xs text-zinc-400">
                    {post.content}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
