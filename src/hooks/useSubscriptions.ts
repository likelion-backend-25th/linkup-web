import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchSubscriptions } from '@/api/subscriptions.ts';
import { isAbortError, toErrorMessage } from '@/api/http.ts';
import type { SubscribeCreatorListResponse } from '@/types/subscription.ts';

const PAGE_SIZE = 9;

export function useSubscriptions(accessToken: string) {
  const [subscriptions, setSubscriptions] = useState<SubscribeCreatorListResponse[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cursorRef = useRef<number | null>(null);
  const hasNextRef = useRef(true);
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
        const page = await fetchSubscriptions(accessToken, cursorRef.current, PAGE_SIZE, signal);
        // 첫 페이지(cursor 없음)는 기존 목록을 교체한다.
        const isFirstPage = cursorRef.current === null;
        setSubscriptions((current) =>
          isFirstPage ? page.subCreatorList : [...current, ...page.subCreatorList],
        );
        setTotalCount(page.subCreatorCount);
        cursorRef.current = page.nextCursor;
        // nextCursor 가 없으면 더 요청할 수 없으므로 종료로 본다.
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
    const controller = new AbortController();
    cursorRef.current = null;
    hasNextRef.current = true;
    inFlightRef.current = false;
    void loadMore(controller.signal);

    return () => controller.abort();
  }, [loadMore]);

  return { subscriptions, totalCount, hasNext, loading, error, loadMore };
}
