import { useEffect, useLayoutEffect, useMemo, useRef, type RefObject } from 'react';
import { PostCard } from '@/components/PostCard.tsx';
import { useFollowingFeed, type FeedType } from '@/hooks/useFollowingFeed.ts';
import { useFeedViewStore } from '@/stores/useFeedViewStore.ts';
import type { PostFeedItem } from '@/types/feed.ts';

interface FollowingFeedListProps {
  enabled: boolean;
  feedType?: FeedType;
  query: string;
  scrollRoot: RefObject<HTMLDivElement | null>;
  onPostsChange?: (posts: PostFeedItem[]) => void;
}

export function FollowingFeedList({
  enabled,
  feedType = 'following',
  query,
  scrollRoot,
  onPostsChange,
}: FollowingFeedListProps) {
  const { posts, hasNext, loading, error, loadMore } = useFollowingFeed(enabled, feedType);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const restoredRef = useRef(false);

  useEffect(() => {
    onPostsChange?.(posts);
  }, [onPostsChange, posts]);

  useLayoutEffect(() => {
    const el = scrollRoot.current;
    if (!el || posts.length === 0 || restoredRef.current) {
      return;
    }

    const top = useFeedViewStore.getState().scrollTop;
    if (top <= 0) {
      restoredRef.current = true;
      return;
    }

    // 이미지 로드 전엔 높이가 부족해서 스크롤이 잘리므로, 목표 위치까지 반복해서 맞춘다.
    let cancelled = false;

    function apply() {
      if (cancelled || !el) {
        return;
      }
      el.scrollTop = top;
    }

    apply();

    const images = [...el.querySelectorAll('img')];
    const pending = images.filter((image) => !image.complete);

    function finish() {
      apply();
      restoredRef.current = true;
    }

    if (pending.length === 0) {
      finish();
      return;
    }

    function onImageSettled() {
      apply();
      if (images.every((image) => image.complete)) {
        finish();
      }
    }

    for (const image of pending) {
      image.addEventListener('load', onImageSettled);
      image.addEventListener('error', onImageSettled);
    }
    const timer = window.setTimeout(finish, 800);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      for (const image of pending) {
        image.removeEventListener('load', onImageSettled);
        image.removeEventListener('error', onImageSettled);
      }
    };
  }, [posts.length, scrollRoot]);

  useEffect(() => {
    const root = scrollRoot.current;
    const sentinel = sentinelRef.current;
    if (!root || !sentinel || !enabled) {
      return;
    }

    function loadIfNearBottom() {
      const scrollEl = scrollRoot.current;
      if (!scrollEl || !hasNext || loading) {
        return;
      }
      if (scrollEl.scrollTop + scrollEl.clientHeight >= scrollEl.scrollHeight - 240) {
        void loadMore();
      }
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadIfNearBottom();
        }
      },
      { root, rootMargin: '200px 0px' },
    );

    observer.observe(sentinel);
    root.addEventListener('scroll', loadIfNearBottom);
    return () => {
      observer.disconnect();
      root.removeEventListener('scroll', loadIfNearBottom);
    };
  }, [enabled, hasNext, loadMore, loading, posts.length, scrollRoot]);

  const visiblePosts = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (keyword === '') {
      return posts;
    }
    return posts.filter((post) => post.content.toLowerCase().includes(keyword));
  }, [posts, query]);

  if (loading && posts.length === 0) {
    return <p className="py-8 text-sm text-zinc-400">게시글을 불러오는 중...</p>;
  }

  if (error && posts.length === 0) {
    return <p className="py-8 text-sm text-red-500">에러 발생: {error}</p>;
  }

  if (!loading && visiblePosts.length === 0) {
    return <p className="py-8 text-sm text-zinc-400">표시할 게시글이 없습니다.</p>;
  }

  return (
    <>
      <ul>
        {visiblePosts.map((post) => (
          <li key={post.postId}>
            <PostCard post={post} />
          </li>
        ))}
      </ul>
      <div ref={sentinelRef} className="h-8" />
      {loading && posts.length > 0 && (
        <p className="py-3 text-center text-xs text-zinc-400">더 불러오는 중...</p>
      )}
      {error && posts.length > 0 && (
        <p className="py-3 text-center text-xs text-red-500">{error}</p>
      )}
    </>
  );
}
