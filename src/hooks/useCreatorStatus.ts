import { useCallback, useEffect, useState } from 'react';
import { fetchMyProfile, refreshTokens } from '@/api/auth.ts';
import { applyCreator } from '@/api/creators.ts';
import { isAbortError, toErrorMessage } from '@/api/http.ts';
import { fetchMemberProfile } from '@/api/members.ts';
import { useAuthStore } from '@/stores/useAuthStore.ts';
import { isCreatorAccount } from '@/utils/authRole.ts';

export const CREATOR_MIN_FOLLOWERS = 10;

interface CreatorStatus {
  followerCount: number;
  isCreator: boolean;
}

/**
 * /member/me 에는 role 이 없고 JWT role 은 승인 후에도 갱신되지 않는다.
 * 그래서 팔로워 수는 /member/me, 실제 role 은 /member/{id}(DB 값)로 확인한다.
 */
async function loadCreatorStatus(accessToken: string, signal?: AbortSignal): Promise<CreatorStatus> {
  const me = await fetchMyProfile(accessToken, signal);
  const member = await fetchMemberProfile(me.id, signal);
  return {
    followerCount: me.followerCount ?? member.followerCount ?? 0,
    isCreator: isCreatorAccount({ role: member.role }) || isCreatorAccount(me),
  };
}

export function useCreatorStatus(accessToken: string) {
  const [status, setStatus] = useState<CreatorStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    loadCreatorStatus(accessToken, controller.signal)
      .then((next) => {
        setStatus(next);
        setError(null);
      })
      .catch((caught: unknown) => {
        if (!isAbortError(caught)) {
          setError(toErrorMessage(caught));
        }
      });
    return () => controller.abort();
  }, [accessToken]);

  /** 신청 후 role 을 재조회해 실제 승인 여부를 반환한다. */
  const apply = useCallback(async (): Promise<boolean> => {
    setApplying(true);
    try {
      await applyCreator(accessToken);
      const next = await loadCreatorStatus(accessToken);
      setStatus(next);
      if (next.isCreator) {
        // 다른 화면(isCreatorAccount(profile))도 즉시 크리에이터로 보이도록 스토어 role 갱신
        const { profile, setProfile, refreshToken } = useAuthStore.getState();
        if (profile) {
          setProfile({ ...profile, role: 'ROLE_CREATOR', followerCount: next.followerCount });
        }
        // 기존 JWT 의 role 은 ROLE_USER 이므로 재발급받는다. 실패해도 승인 자체는 완료된 상태.
        if (refreshToken) {
          try {
            const tokens = await refreshTokens(refreshToken);
            useAuthStore.setState(tokens);
          } catch {
            // 재발급 실패 시 기존 토큰 유지 (다음 로그인 때 반영)
          }
        }
      }
      return next.isCreator;
    } finally {
      setApplying(false);
    }
  }, [accessToken]);

  return { status, error, applying, apply };
}
