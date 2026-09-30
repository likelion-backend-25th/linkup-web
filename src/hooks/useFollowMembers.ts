import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchFollowMembers } from '@/api/follow.ts';
import { isAbortError, toErrorMessage } from '@/api/http.ts';
import type { FollowListType, FollowMember } from '@/types/follow.ts';

const PAGE_SIZE = 20;

function mergeMembers(current: FollowMember[], incoming: FollowMember[]): FollowMember[] {
  const seen = new Set(current.map((member) => member.memberId));
  const next = [...current];
  incoming.forEach((member) => {
    if (!seen.has(member.memberId)) {
      seen.add(member.memberId);
      next.push(member);
    }
  });
  return next;
}

export function useFollowMembers(memberId: number | null, listType: FollowListType) {
  const [members, setMembers] = useState<FollowMember[]>([]);
  const [hasNext, setHasNext] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cursorRef = useRef<number | null>(null);
  const hasNextRef = useRef(true);
  const inFlightRef = useRef(false);
  const requestIdRef = useRef(0);

  const loadMore = useCallback(
    async (signal?: AbortSignal) => {
      if (memberId === null || !hasNextRef.current || inFlightRef.current) {
        return;
      }

      const requestId = requestIdRef.current;
      const isFirstPage = cursorRef.current === null;
      inFlightRef.current = true;
      setLoading(true);
      setError(null);
      try {
        const page = await fetchFollowMembers(
          memberId,
          listType,
          cursorRef.current,
          PAGE_SIZE,
          signal,
        );
        if (signal?.aborted || requestIdRef.current !== requestId) {
          return;
        }
        const nextCursor = page.nextCursor;
        const hasNext = page.hasNext && nextCursor !== null;
        setMembers((current) => mergeMembers(isFirstPage ? [] : current, page.members));
        cursorRef.current = nextCursor;
        hasNextRef.current = hasNext;
        setHasNext(hasNext);
      } catch (caught: unknown) {
        if (isAbortError(caught) || requestIdRef.current !== requestId) {
          return;
        }
        setError(toErrorMessage(caught));
      } finally {
        if (requestIdRef.current === requestId) {
          inFlightRef.current = false;
          setLoading(false);
        }
      }
    },
    [listType, memberId],
  );

  useEffect(() => {
    if (memberId === null) {
      requestIdRef.current += 1;
      setMembers([]);
      setLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    requestIdRef.current += 1;
    cursorRef.current = null;
    hasNextRef.current = true;
    inFlightRef.current = false;
    setMembers([]);
    setHasNext(true);
    setError(null);
    void loadMore(controller.signal);

    return () => {
      requestIdRef.current += 1;
      controller.abort();
    };
  }, [loadMore, memberId]);

  return { members, hasNext, loading, error, loadMore };
}
