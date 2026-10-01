import { useCallback, useEffect, useState } from 'react';
import { deleteBlock, fetchBlockedMembers } from '@/api/blocks.ts';
import { isAbortError, toErrorMessage } from '@/api/http.ts';
import { useBlockMemoryStore } from '@/stores/useBlockMemoryStore.ts';
import type { BlockedMember } from '@/types/block.ts';

export function useBlockedMembers(accessToken: string) {
  const [members, setMembers] = useState<BlockedMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError(null);
      try {
        const next = await fetchBlockedMembers(accessToken, signal);
        if (!signal?.aborted) {
          setMembers(next);
        }
      } catch (caught: unknown) {
        if (isAbortError(caught) || signal?.aborted) {
          return;
        }
        setError(toErrorMessage(caught));
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [accessToken],
  );

  useEffect(() => {
    const controller = new AbortController();
    void reload(controller.signal);
    return () => controller.abort();
  }, [reload]);

  const unblock = useCallback(
    async (memberId: number) => {
      await deleteBlock(memberId, accessToken);
      useBlockMemoryStore.getState().markUnblocked(memberId);
      setMembers((current) => current.filter((member) => member.memberId !== memberId));
    },
    [accessToken],
  );

  return { members, loading, error, unblock };
}
