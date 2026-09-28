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
  if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }
  if (options.accessToken) {
    headers.set('Authorization', `Bearer ${options.accessToken}`);
  }

  const response = await fetch(toApiUrl(url), {
    method: options.method ?? 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    signal: options.signal,
  });

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
