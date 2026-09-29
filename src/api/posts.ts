import { fetchApiJson } from '@/api/http.ts';
import type {
  PostDetailResponse,
  PostImageResponse,
  PostResponse,
  PostUpdateRequest,
} from '@/types/post.ts';

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

function isPostImage(value: unknown): value is PostImageResponse {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === 'number' &&
    typeof value.imageUrl === 'string' &&
    typeof value.imageOrder === 'number'
  );
}

function isPostDetailResponse(value: unknown): value is PostDetailResponse {
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
    (value.fileUrl === null || typeof value.fileUrl === 'string') &&
    typeof value.likeCount === 'number' &&
    typeof value.subscriberOnly === 'boolean' &&
    typeof value.createdAt === 'string' &&
    typeof value.updatedAt === 'string' &&
    typeof value.likedByMe === 'boolean' &&
    Array.isArray(value.images) &&
    value.images.every(isPostImage)
  );
}

export async function fetchPost(id: number, signal?: AbortSignal): Promise<PostDetailResponse> {
  const data = await fetchApiJson(`/api/v1/posts/${id}`, { signal });
  if (!isPostDetailResponse(data)) {
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

export async function createPost(
  content: string,
  subscriberOnly: boolean,
  images: File[],
  file: File | null,
  accessToken: string,
): Promise<number> {
  const form = new FormData();
  form.append(
    'request',
    new Blob([JSON.stringify({ content, subscriberOnly })], { type: 'application/json' }),
  );
  for (const image of images) {
    form.append('images', image);
  }
  if (file) {
    form.append('file', file);
  }

  const data = await fetchApiJson('/api/v1/posts', {
    method: 'POST',
    accessToken,
    body: form,
  });
  if (!isRecord(data) || typeof data.id !== 'number') {
    throw new Error('게시글 등록 응답 형식이 올바르지 않습니다.');
  }
  return data.id;
}

export async function deletePost(id: number, accessToken: string): Promise<void> {
  await fetchApiJson(`/api/v1/posts/${id}`, {
    method: 'DELETE',
    accessToken,
  });
}

export async function setPostLike(id: number, liked: boolean, accessToken: string): Promise<void> {
  await fetchApiJson(`/api/v1/posts/${id}/likes`, {
    method: liked ? 'POST' : 'DELETE',
    accessToken,
  });
}

export async function reportPost(
  id: number,
  reason: string,
  content: string,
  accessToken: string,
): Promise<void> {
  await fetchApiJson(`/api/v1/posts/${id}/reports`, {
    method: 'POST',
    accessToken,
    body: { reason, content },
  });
}

export async function updatePostContent(
  post: PostDetailResponse,
  content: string,
  accessToken: string,
): Promise<void> {
  const form = new FormData();
  form.append(
    'request',
    new Blob(
      [
        JSON.stringify({
          content,
          subscriberOnly: post.subscriberOnly,
          removeFile: false,
          imageRequest: post.images.map((image) => ({
            imageId: image.id,
            newImageIndex: image.imageOrder,
          })),
        }),
      ],
      { type: 'application/json' },
    ),
  );

  await fetchApiJson(`/api/v1/posts/${post.id}`, {
    method: 'PUT',
    accessToken,
    body: form,
  });
}
