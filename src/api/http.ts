import { useAuthStore } from '@/stores/useAuthStore.ts';

export interface ApiErrorBody {
  message: string;
}

export function isApiErrorBody(body: unknown): body is ApiErrorBody {
  return (
    typeof body === 'object' &&
    body !== null &&
    'message' in body &&
    typeof body.message === 'string'
  );
}

export function readApiErrorMessage(body: unknown, status: number): string {
  if (isApiErrorBody(body) && body.message.trim() !== '') {
    return body.message;
  }
  return `요청에 실패했습니다. (${status})`;
}

export function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : '알 수 없는 오류';
}

export function isHttpStatusError(error: unknown, status: number): boolean {
  return error instanceof Error && error.message.endsWith(`(${status})`);
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

export interface FetchApiOptions {
  method?: string;
  body?: unknown;
  accessToken?: string | null;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

// 브라우저는 항상 같은 호스트의 /api/v1 을 친다. (로컬 Vite 프록시 / CloudFront /api/*)
export function toApiUrl(path: string): string {
  return path;
}

export async function fetchApiJson(
  url: string,
  options: FetchApiOptions = {},
): Promise<unknown> {
  const headers = new Headers(options.headers);
  const formBody = options.body instanceof FormData ? options.body : null;
  if (options.body !== undefined && formBody === null) {
    headers.set('Content-Type', 'application/json');
  }
  const storedToken = useAuthStore.getState().accessToken;
  const accessToken = options.accessToken ?? storedToken;
  // 임시 이메일 토큰은 JWT가 아니므로 백엔드 인증 헤더에 넣지 않는다.
  if (accessToken?.split('.').length === 3) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const response = await fetch(toApiUrl(url), {
    method: options.method ?? 'GET',
    headers,
    body:
      formBody ??
      (options.body === undefined ? undefined : JSON.stringify(options.body)),
    credentials: 'include',
    // 백엔드(Spring Security oauth2Login)는 인증 실패·미처리 예외 시 /login 으로 302 를 준다.
    // 따라가면 다른 오리진이라 CORS 로 "Failed to fetch" 만 남으므로 리다이렉트를 막고 401 로 취급한다.
    redirect: 'manual',
    signal: options.signal,
  });

  if (response.type === 'opaqueredirect') {
    throw new Error('인증이 만료되었거나 서버 처리 중 오류가 발생했습니다. (401)');
  }

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    throw new Error(readApiErrorMessage(body, response.status));
  }

  // DELETE 204처럼 본문이 없는 성공 응답을 허용한다.
  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  if (text.trim() === '') {
    return null;
  }

  return JSON.parse(text) as unknown;
}
