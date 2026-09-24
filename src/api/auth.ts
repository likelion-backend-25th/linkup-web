import { fetchApiJson } from '@/api/http.ts';
import type { LoginRequest, MemberProfileResponse, TokenResponse } from '@/types/auth.ts';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isTokenResponse(value: unknown): value is TokenResponse {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.accessToken === 'string' &&
    typeof value.refreshToken === 'string' &&
    typeof value.tokenType === 'string' &&
    typeof value.expiresIn === 'number'
  );
}

function isMemberProfile(value: unknown): value is MemberProfileResponse {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === 'number' &&
    typeof value.email === 'string' &&
    typeof value.nickname === 'string' &&
    (value.profileImage === null || typeof value.profileImage === 'string') &&
    typeof value.role === 'string' &&
    typeof value.createdAt === 'string'
  );
}

export async function loginRequest(payload: LoginRequest): Promise<TokenResponse> {
  const data = await fetchApiJson('/api/v1/auth/login', {
    method: 'POST',
    body: payload,
  });
  if (!isTokenResponse(data)) {
    throw new Error('로그인 응답 형식이 올바르지 않습니다.');
  }
  return data;
}

export async function fetchMyProfile(
  accessToken: string,
  signal?: AbortSignal,
): Promise<MemberProfileResponse> {
  const data = await fetchApiJson('/api/v1/members/me', { accessToken, signal });
  if (!isMemberProfile(data)) {
    throw new Error('프로필 응답 형식이 올바르지 않습니다.');
  }
  return data;
}
