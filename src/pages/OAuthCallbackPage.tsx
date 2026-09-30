import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { fetchMyProfile } from '@/api/auth.ts';
import { toErrorMessage } from '@/api/http.ts';
import { useAuthStore } from '@/stores/useAuthStore.ts';
import type { MemberProfileResponse } from '@/types/auth.ts';

interface JwtClaims {
  exp?: number;
  id?: number;
  sub?: string;
  role?: string;
}

function tokenClaims(accessToken: string): JwtClaims | null {
  try {
    const payload = accessToken.split('.')[1];
    if (!payload) {
      return null;
    }
    const base64 = payload.replaceAll('-', '+').replaceAll('_', '/');
    const normalized = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const claims = JSON.parse(atob(normalized)) as unknown;
    if (typeof claims === 'object' && claims !== null) {
      return claims as JwtClaims;
    }
  } catch {
    return null;
  }
  return null;
}

function tokenExpiresIn(accessToken: string): number {
  const exp = tokenClaims(accessToken)?.exp;
  return typeof exp === 'number' ? Math.max(0, exp - Math.floor(Date.now() / 1000)) : 0;
}

function profileFromToken(accessToken: string): MemberProfileResponse | null {
  const claims = tokenClaims(accessToken);
  if (typeof claims?.id !== 'number' || typeof claims.sub !== 'string') {
    return null;
  }
  return {
    id: claims.id,
    email: claims.sub,
    nickname: claims.sub.split('@')[0] ?? '회원',
    profileImage: null,
    role: claims.role ?? 'ROLE_USER',
    createdAt: '',
  };
}

export function OAuthCallbackPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function completeLogin() {
      const query = new URLSearchParams(window.location.search);
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const accessToken = query.get('accessToken') ?? hash.get('accessToken');
      const refreshToken = query.get('refreshToken') ?? hash.get('refreshToken') ?? '';

      if (!accessToken) {
        setError('로그인 토큰을 받지 못했습니다.');
        return;
      }

      try {
        const profile = await fetchMyProfile(accessToken, controller.signal);
        setSession(
          {
            accessToken,
            refreshToken,
            tokenType: 'Bearer',
            expiresIn: tokenExpiresIn(accessToken),
          },
          profile,
        );
        await navigate('/', { replace: true });
      } catch (caught: unknown) {
        const fallbackProfile = profileFromToken(accessToken);
        if (!fallbackProfile) {
          setError(toErrorMessage(caught));
          return;
        }
        setSession(
          {
            accessToken,
            refreshToken,
            tokenType: 'Bearer',
            expiresIn: tokenExpiresIn(accessToken),
          },
          fallbackProfile,
        );
        await navigate('/', { replace: true });
      }
    }

    void completeLogin();
    return () => controller.abort();
  }, [navigate, setSession]);

  return (
    <main className="flex min-h-svh items-center justify-center bg-canvas p-4">
      <section className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-sm">
        <h1 className="text-lg font-semibold text-zinc-900">로그인 확인 중</h1>
        <p className={error ? 'mt-3 text-sm text-red-500' : 'mt-3 text-sm text-zinc-500'}>
          {error ?? '카카오 로그인 정보를 확인하고 있습니다.'}
        </p>
        {error && (
          <button
            type="button"
            onClick={() => void navigate('/login', { replace: true })}
            className="mt-4 rounded-xl bg-linkup px-4 py-2 text-sm font-semibold text-white"
          >
            로그인으로 돌아가기
          </button>
        )}
      </section>
    </main>
  );
}
