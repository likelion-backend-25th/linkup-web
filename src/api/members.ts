import { fetchApiJson } from '@/api/http.ts';
import type { MemberResponseDto, MemberUpdateRequest } from '@/types/member.ts';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null;
}

function parseMemberResponse(value: unknown): MemberResponseDto | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = asNumber(value.id) ?? asNumber(value.memberId);
  const name = asString(value.name) ?? asString(value.nickname) ?? asString(value.memberName);
  if (id === null || name === null) {
    return null;
  }

  return {
    id,
    uniqueId: asString(value.uniqueId) ?? asString(value.unique_id),
    name,
    profileImage: asString(value.profileImage) ?? asString(value.profileImageUrl),
    introduction: asString(value.introduction) ?? asString(value.intro),
    postCount: asNumber(value.postCount),
    creator: typeof value.creator === 'boolean' ? value.creator : null,
    subscriptionPrice: asNumber(value.subscriptionPrice),
  };
}

export async function fetchMemberProfile(
  memberId: number,
  signal?: AbortSignal,
): Promise<MemberResponseDto> {
  const data = await fetchApiJson(`/api/v1/member/${memberId}`, { signal });
  const member = parseMemberResponse(data);
  if (member === null) {
    throw new Error('회원 프로필 응답 형식이 올바르지 않습니다.');
  }
  return member;
}

export async function updateMyProfile(
  request: MemberUpdateRequest,
  profileImage: File | null,
  accessToken: string,
): Promise<void> {
  const form = new FormData();
  form.append(
    'request',
    new Blob([JSON.stringify(request)], { type: 'application/json' }),
  );
  if (profileImage) {
    form.append('profileImage', profileImage);
  }

  await fetchApiJson('/api/v1/member/me', {
    method: 'PUT',
    accessToken,
    body: form,
  });
}
