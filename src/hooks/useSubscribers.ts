import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchSubscribers } from '@/api/creators.ts';
import { isAbortError, toErrorMessage } from '@/api/http.ts';
import type { SubscriberResponse } from '@/types/creator.ts';

const PAGE_SIZE = 10;

// enabled=false(크리에이터 아님)면 요청하지 않고 빈 목록으로 둔다.
export function useSubscribers(accessToken: string, enabled: boolean) {
  const [subscribers, setSubscribers] = useState<SubscriberResponse[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(enabled);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const cursorRef = useRef<number | null>(null);
  const hasNextRef = useRef(enabled);
  const inFlightRef = useRef(false);

  const loadMore = useCallback(
    async (signal?: AbortSignal) => {
      if (!hasNextRef.current || inFlightRef.current) {
        return;
      }

      inFlightRef.current = true;
      setLoading(true);
      setError(null);
      try {
        const page = await fetchSubscribers(accessToken, cursorRef.current, PAGE_SIZE, signal);
        const isFirstPage = cursorRef.current === null;
        setSubscribers((current) =>
          isFirstPage ? page.subscriberList : [...current, ...page.subscriberList],
        );
        setTotalCount(page.subscriberCount);
        cursorRef.current = page.nextCursor;
        hasNextRef.current = page.hasNext && page.nextCursor !== null;
        setHasNext(hasNextRef.current);
      } catch (caught: unknown) {
        if (isAbortError(caught)) {
          return;
        }
        setError(toErrorMessage(caught));
      } finally {
        inFlightRef.current = false;
        setLoading(false);
      }
    },
    [accessToken],
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }
    const controller = new AbortController();
    cursorRef.current = null;
    hasNextRef.current = true;
    inFlightRef.current = false;
    void loadMore(controller.signal);
    return () => controller.abort();
  }, [enabled, loadMore]);

  return { subscribers, totalCount, hasNext, loading, error, loadMore };
}
