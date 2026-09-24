import { fetchApiJson } from '@/api/http.ts';
import type { PostResponse, PostUpdateRequest } from '@/types/post.ts';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isPostResponse(value: unknown): value is PostResponse {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === 'number' &&
    typeof value.memberId === 'number' &&
    typeof value.content === 'string' &&
    (value.imageUrl === null || typeof value.imageUrl === 'string') &&
    typeof value.likeCount === 'number' &&
    typeof value.createdAt === 'string' &&
    typeof value.updatedAt === 'string'
  );
}

export async function fetchPostList(signal?: AbortSignal): Promise<PostResponse[]> {
  const data = await fetchApiJson('/api/v1/posts', { signal });
  if (!Array.isArray(data) || !data.every(isPostResponse)) {
    throw new Error('게시글 목록 형식이 올바르지 않습니다.');
  }
  return data;
}

export async function fetchPost(id: number, signal?: AbortSignal): Promise<PostResponse> {
  const data = await fetchApiJson(`/api/v1/posts/${id}`, { signal });
  if (!isPostResponse(data)) {
    throw new Error('게시글 형식이 올바르지 않습니다.');
  }
  return data;
}

export async function updatePost(
  id: number,
  payload: PostUpdateRequest,
  accessToken: string,
): Promise<PostResponse> {
  const data = await fetchApiJson(`/api/v1/posts/${id}`, {
    method: 'PUT',
    body: payload,
    accessToken,
  });
  if (!isPostResponse(data)) {
    throw new Error('게시글 형식이 올바르지 않습니다.');
  }
  return data;
}

export async function deletePost(id: number, accessToken: string): Promise<void> {
  await fetchApiJson(`/api/v1/posts/${id}`, {
    method: 'DELETE',
    accessToken,
  });
}
