import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchFollowingFeed, fetchPopularFeed, fetchSubscriptionFeed } from '@/api/feed.ts';
import { isAbortError, toErrorMessage } from '@/api/http.ts';
import { useFeedViewStore } from '@/stores/useFeedViewStore.ts';
import type { FeedType, PostFeedItem } from '@/types/feed.ts';

const PAGE_SIZE = 10;

export type { FeedType };

function snapshotOf(feedType: FeedType) {
  return useFeedViewStore.getState().snapshots[feedType];
}

export function useFollowingFeed(enabled: boolean, feedType: FeedType = 'following') {
  const cached = snapshotOf(feedType);
  const [posts, setPosts] = useState<PostFeedItem[]>(() => cached?.posts ?? []);
  const [hasNext, setHasNext] = useState(() => cached?.hasNext ?? true);
  const [loading, setLoading] = useState(() => (cached?.posts.length ?? 0) === 0);
  const [error, setError] = useState<string | null>(null);

  const cursorRef = useRef<number | null>(cached?.nextCursor ?? null);
  const hasNextRef = useRef(cached?.hasNext ?? true);
  const inFlightRef = useRef(false);

  const loadMore = useCallback(async (signal?: AbortSignal) => {
    if (!hasNextRef.current || inFlightRef.current) {
      return;
    }

    inFlightRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const fetchFeed =
        feedType === 'subscription'
          ? fetchSubscriptionFeed
          : feedType === 'popular'
            ? fetchPopularFeed
            : fetchFollowingFeed;
      const page = await fetchFeed(cursorRef.current, PAGE_SIZE, signal);
      setPosts((current) => [...current, ...page.posts]);
      cursorRef.current = page.nextCursor;
      hasNextRef.current = page.hasNext;
      setHasNext(page.hasNext);
    } catch (caught: unknown) {
      if (isAbortError(caught)) {
        return;
      }
      setError(toErrorMessage(caught));
    } finally {
      inFlightRef.current = false;
      setLoading(false);
    }
  }, [feedType]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // 상세에서 돌아오면 이미 받아 둔 목록을 그대로 쓰고, 첫 페이지부터 다시 치지 않는다.
    const existing = snapshotOf(feedType);
    if (existing && existing.posts.length > 0) {
      cursorRef.current = existing.nextCursor;
      hasNextRef.current = existing.hasNext;
      inFlightRef.current = false;
      setPosts(existing.posts);
      setHasNext(existing.hasNext);
      setLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    cursorRef.current = null;
    hasNextRef.current = true;
    inFlightRef.current = false;
    setPosts([]);
    setHasNext(true);
    setError(null);
    void loadMore(controller.signal);

    return () => controller.abort();
  }, [enabled, feedType, loadMore]);

  useEffect(() => {
    if (!enabled || posts.length === 0) {
      return;
    }
    useFeedViewStore.getState().saveSnapshot(feedType, {
      posts,
      nextCursor: cursorRef.current,
      hasNext: hasNextRef.current,
    });
  }, [enabled, feedType, hasNext, posts]);

  return { posts, hasNext, loading, error, loadMore };
}
