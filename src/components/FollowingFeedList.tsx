import { useEffect, useMemo, useRef, type RefObject } from 'react';
import { PostCard } from '@/components/PostCard.tsx';
import { useFollowingFeed, type FeedType } from '@/hooks/useFollowingFeed.ts';
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

  useEffect(() => {
    onPostsChange?.(posts);
  }, [onPostsChange, posts]);

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
