import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchFollowingFeed, fetchPopularFeed, fetchSubscriptionFeed } from '@/api/feed.ts';
import { isAbortError, toErrorMessage } from '@/api/http.ts';
import type { PostFeedItem } from '@/types/feed.ts';

const PAGE_SIZE = 10;

export type FeedType = 'following' | 'subscription' | 'popular';

export function useFollowingFeed(enabled: boolean, feedType: FeedType = 'following') {
  const [posts, setPosts] = useState<PostFeedItem[]>([]);
  const [hasNext, setHasNext] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cursorRef = useRef<number | null>(null);
  const hasNextRef = useRef(true);
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

    const controller = new AbortController();
    cursorRef.current = null;
    hasNextRef.current = true;
    inFlightRef.current = false;
    setPosts([]);
    setHasNext(true);
    setError(null);
    void loadMore(controller.signal);

    return () => controller.abort();
  }, [enabled, loadMore]);

  return { posts, hasNext, loading, error, loadMore };
}
