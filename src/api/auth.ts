import { fetchApiJson } from '@/api/http.ts';
import type { LoginRequest, MemberProfileResponse, TokenResponse } from '@/types/auth.ts';
import { isCreatorAccount, roleFromAccessToken } from '@/utils/authRole.ts';

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

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

function resolveRole(
  data: Record<string, unknown>,
  accessToken: string,
): { role: string; creatorStatus: string | null; isCreator: boolean | null } {
  const creatorStatus = asString(data.creatorStatus);
  const isCreatorFlag = typeof data.isCreator === 'boolean' ? data.isCreator : null;
  const apiRole = asString(data.role) ?? roleFromAccessToken(accessToken) ?? 'ROLE_USER';
  const role = isCreatorAccount({
    role: apiRole,
    creatorStatus,
    isCreator: isCreatorFlag,
  })
    ? apiRole.toUpperCase().includes('CREATOR')
      ? apiRole
      : 'ROLE_CREATOR'
    : apiRole;

  return { role, creatorStatus, isCreator: isCreatorFlag };
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

/** POST /api/v1/auth/refresh 응답 (AccessTokenResponseDto) */
export async function refreshTokens(
  refreshToken: string,
): Promise<{ accessToken: string; refreshToken: string }> {
  const data = await fetchApiJson('/api/v1/auth/refresh', {
    method: 'POST',
    body: { refreshToken },
  });
  if (!isRecord(data) || typeof data.token !== 'string' || typeof data.refreshToken !== 'string') {
    throw new Error('토큰 재발급 응답 형식이 올바르지 않습니다.');
  }
  return { accessToken: data.token, refreshToken: data.refreshToken };
}

export async function fetchMyProfile(
  accessToken: string,
  signal?: AbortSignal,
): Promise<MemberProfileResponse> {
  const data = await fetchApiJson('/api/v1/member/me', { accessToken, signal });
  if (!isRecord(data)) {
    throw new Error('프로필 응답 형식이 올바르지 않습니다.');
  }

  const id = typeof data.id === 'number' ? data.id : null;
  const email = asString(data.email);
  const nickname = asString(data.nickname) ?? asString(data.name);
  if (id === null || email === null || nickname === null) {
    throw new Error('프로필 응답 형식이 올바르지 않습니다.');
  }

  const { role, creatorStatus, isCreator } = resolveRole(data, accessToken);
  return {
    id,
    email,
    nickname,
    uniqueId:
      asString(data.uniqueId) ??
      asString(data.unique_id) ??
      asString(data.userId) ??
      asString(data.user_id),
    profileImage: asString(data.profileImage),
    introduction: asString(data.introduction) ?? asString(data.intro),
    role,
    createdAt: asString(data.createdAt) ?? '',
    followerCount: typeof data.followerCount === 'number' ? data.followerCount : undefined,
    creatorStatus,
    isCreator,
  };
}
