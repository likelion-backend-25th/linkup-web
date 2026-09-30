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

interface MemberSearchHit {
  id: number;
  name: string;
  uniqueId: string;
  profileImage: string | null;
}

function isMemberSearchHit(value: unknown): value is MemberSearchHit {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === 'number' &&
    typeof value.name === 'string' &&
    typeof value.uniqueId === 'string' &&
    (value.profileImage === null || typeof value.profileImage === 'string')
  );
}

// 샘플 이메일은 uniqueId의 . 을 _ 로 바꾼 로컬 파트다. seoyeon.reads -> seoyeon_reads@linkup.test
function uniqueIdFromEmail(email: string): string {
  const local = email.trim().toLowerCase().split('@')[0] ?? '';
  return local.replaceAll('_', '.');
}

export async function loginByEmail(email: string): Promise<{
  tokens: TokenResponse;
  profile: MemberProfileResponse;
}> {
  const uniqueId = uniqueIdFromEmail(email);
  const data = await fetchApiJson(
    `/api/v1/search/members?keyword=${encodeURIComponent(uniqueId)}&size=20`,
  );
  if (!isRecord(data) || !Array.isArray(data.content) || !data.content.every(isMemberSearchHit)) {
    throw new Error('회원 검색 응답 형식이 올바르지 않습니다.');
  }

  const member = data.content.find((item) => item.uniqueId === uniqueId);
  if (!member) {
    throw new Error('해당 이메일의 회원을 찾지 못했습니다.');
  }

  return {
    tokens: {
      accessToken: `dev-email:${member.id}`,
      refreshToken: '',
      tokenType: 'Bearer',
      expiresIn: 0,
    },
    profile: {
      id: member.id,
      email: email.trim(),
      nickname: member.name,
      uniqueId: member.uniqueId,
      profileImage: member.profileImage,
      role: 'ROLE_USER',
      createdAt: '',
    },
  };
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
    role,
    createdAt: asString(data.createdAt) ?? '',
    creatorStatus,
    isCreator,
  };
}
