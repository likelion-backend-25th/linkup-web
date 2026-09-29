import { fetchApiJson } from '@/api/http.ts';
import type { FollowResponse } from '@/types/follow.ts';

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
