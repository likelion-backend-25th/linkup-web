import { fetchApiJson } from '@/api/http.ts';
import type { FollowingFeedResponse, PostFeedItem } from '@/types/feed.ts';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isPostFeedItem(value: unknown): value is PostFeedItem {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.postId === 'number' &&
    typeof value.memberId === 'number' &&
    typeof value.memberName === 'string' &&
    typeof value.uniqueId === 'string' &&
    (value.profileImageUrl === null || typeof value.profileImageUrl === 'string') &&
    typeof value.content === 'string' &&
    (value.mainImageUrl === null || typeof value.mainImageUrl === 'string') &&
    typeof value.likeCount === 'number' &&
    typeof value.commentCount === 'number' &&
    typeof value.subscriberOnly === 'boolean' &&
    typeof value.createdAt === 'string'
  );
}

function isFollowingFeedResponse(value: unknown): value is FollowingFeedResponse {
  if (!isRecord(value)) {
    return false;
  }

  return (
    Array.isArray(value.posts) &&
    value.posts.every(isPostFeedItem) &&
    (value.nextCursor === null || typeof value.nextCursor === 'number') &&
    typeof value.hasNext === 'boolean'
  );
}

export async function fetchFollowingFeed(
  cursor: number | null,
  size: number,
  signal?: AbortSignal,
): Promise<FollowingFeedResponse> {
  const params = new URLSearchParams({ size: String(size) });
  if (cursor !== null) {
    params.set('cursor', String(cursor));
  }

  // 서버 매핑은 /api/v1/feeds/following (cursor, size).
  const data = await fetchApiJson(`/api/v1/feeds/following?${params.toString()}`, { signal });
  if (!isFollowingFeedResponse(data)) {
    throw new Error('팔로잉 피드 응답 형식이 올바르지 않습니다.');
  }
  return data;
}
