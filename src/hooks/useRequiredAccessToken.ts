import { useOutletContext } from 'react-router';

export interface AuthOutletContext {
  accessToken: string;
}

/** `RequireAuth` 하위 라우트에서만 사용한다. */
export function useRequiredAccessToken(): string {
  return useOutletContext<AuthOutletContext>().accessToken;
}
