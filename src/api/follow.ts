import { fetchApiJson } from '@/api/http.ts';
import type {
  FollowListType,
  FollowMember,
  FollowMemberPageResponse,
  FollowResponse,
} from '@/types/follow.ts';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isFollowResponse(value: unknown): value is FollowResponse {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.targetId === 'number' &&
    typeof value.isFollowing === 'boolean' &&
    typeof value.followerCount === 'number' &&
    typeof value.memberId === 'number' &&
    typeof value.followingCount === 'number'
  );
}

export async function fetchFollow(targetId: number, signal?: AbortSignal): Promise<FollowResponse> {
  const data = await fetchApiJson(`/api/v1/members/${targetId}/follow`, { signal });
  if (!isFollowResponse(data)) {
    throw new Error('팔로우 응답 형식이 올바르지 않습니다.');
  }
  return data;
}

export async function setFollow(
  targetId: number,
  following: boolean,
  accessToken: string,
): Promise<void> {
  await fetchApiJson(`/api/v1/members/${targetId}/follow`, {
    method: following ? 'POST' : 'DELETE',
    accessToken,
  });
}

function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function asString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function parseFollowMember(value: unknown): FollowMember | null {
  if (!isRecord(value)) {
    return null;
  }

  const memberId = asNumber(value.memberId) ?? asNumber(value.id);
  const name = asString(value.name) ?? asString(value.memberName) ?? asString(value.nickname);
  const uniqueId = asString(value.uniqueId) ?? '';
  const profileImage = asString(value.profileImage) ?? asString(value.profileImageUrl);

  if (memberId === null || name === null) {
    return null;
  }

  return {
    memberId,
    name,
    uniqueId,
    profileImage,
  };
}

function parseFollowMemberPage(value: unknown): FollowMemberPageResponse | null {
  if (!isRecord(value)) {
    return null;
  }

  const rawList = [value.members, value.content, value.items, value.followers, value.followings].find(
    Array.isArray,
  );
  if (!rawList) {
    return null;
  }

  const members: FollowMember[] = [];
  for (const item of rawList) {
    const member = parseFollowMember(item);
    if (member === null) {
      return null;
    }
    members.push(member);
  }

  const nextCursor = asNumber(value.nextCursor) ?? asNumber(value.cursor);
  const hasNext = typeof value.hasNext === 'boolean' ? value.hasNext : nextCursor !== null;

  return { members, nextCursor, hasNext };
}

export async function fetchFollowMembers(
  memberId: number,
  listType: FollowListType,
  cursor: number | null,
  size: number,
  signal?: AbortSignal,
): Promise<FollowMemberPageResponse> {
  const params = new URLSearchParams({ size: String(size) });
  if (cursor !== null) {
    params.set('cursor', String(cursor));
  }

  const data = await fetchApiJson(`/api/v1/members/${memberId}/${listType}?${params.toString()}`, {
    signal,
  });
  const page = parseFollowMemberPage(data);
  if (page === null) {
    throw new Error('팔로우 목록 응답 형식이 올바르지 않습니다.');
  }
  return page;
}
