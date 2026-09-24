import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MemberProfileResponse, TokenResponse } from '@/types/auth.ts';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  tokenType: string | null;
  profile: MemberProfileResponse | null;
  setSession: (tokens: TokenResponse, profile: MemberProfileResponse | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      tokenType: null,
      profile: null,
      setSession: (tokens, profile) =>
        set({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          tokenType: tokens.tokenType,
          profile,
        }),
      logout: () =>
        set({
          accessToken: null,
          refreshToken: null,
          tokenType: null,
          profile: null,
        }),
    }),
    {
      name: 'mybatis-sns-auth',
    },
  ),
);
