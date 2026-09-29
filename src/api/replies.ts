import { fetchApiJson } from '@/api/http.ts';
import type { ReplyPageResponse, ReplyResponse } from '@/types/reply.ts';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isReply(value: unknown): value is ReplyResponse {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === 'number' &&
    typeof value.memberId === 'number' &&
    typeof value.name === 'string' &&
    typeof value.uniqueId === 'string' &&
    (value.profileImage === null || typeof value.profileImage === 'string') &&
    typeof value.content === 'string' &&
    typeof value.likeCount === 'number' &&
    typeof value.createdAt === 'string' &&
    typeof value.updatedAt === 'string'
  );
}

function isReplyPage(value: unknown): value is ReplyPageResponse {
  if (!isRecord(value)) {
    return false;
  }

  return (
    Array.isArray(value.replies) &&
    value.replies.every(isReply) &&
    (value.nextCursor === null || typeof value.nextCursor === 'number') &&
    typeof value.hasNext === 'boolean'
  );
}

export async function fetchReplies(
  postId: number,
  cursor: number | null,
  signal?: AbortSignal,
): Promise<ReplyPageResponse> {
  const params = new URLSearchParams({ size: '10' });
  if (cursor !== null) {
    params.set('cursor', String(cursor));
  }

  const data = await fetchApiJson(`/api/v1/posts/${postId}/replies?${params.toString()}`, {
    signal,
  });
  if (!isReplyPage(data)) {
    throw new Error('댓글 응답 형식이 올바르지 않습니다.');
  }
  return data;
}

export async function createReply(
  postId: number,
  content: string,
  accessToken: string,
): Promise<void> {
  await fetchApiJson(`/api/v1/posts/${postId}/replies`, {
    method: 'POST',
    accessToken,
    body: { content },
  });
}

export async function updateReply(
  postId: number,
  replyId: number,
  content: string,
  accessToken: string,
): Promise<void> {
  await fetchApiJson(`/api/v1/posts/${postId}/replies/${replyId}`, {
    method: 'PUT',
    accessToken,
    body: { content },
  });
}

export async function deleteReply(
  postId: number,
  replyId: number,
  accessToken: string,
): Promise<void> {
  await fetchApiJson(`/api/v1/posts/${postId}/replies/${replyId}`, {
    method: 'DELETE',
    accessToken,
  });
}

export async function setReplyLike(
  postId: number,
  replyId: number,
  liked: boolean,
  accessToken: string,
): Promise<void> {
  await fetchApiJson(`/api/v1/posts/${postId}/replies/${replyId}/likes`, {
    method: liked ? 'POST' : 'DELETE',
    accessToken,
  });
}

export async function reportReply(
  postId: number,
  replyId: number,
  reason: string,
  content: string,
  accessToken: string,
): Promise<void> {
  await fetchApiJson(`/api/v1/posts/${postId}/replies/${replyId}/reports`, {
    method: 'POST',
    accessToken,
    body: { reason, content },
  });
}
