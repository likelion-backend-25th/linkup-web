import { fetchApiJson } from '@/api/http.ts';
import type { PostFeedItem } from '@/types/feed.ts';
import type {
  MemberSearchItem,
  MemberSearchResponse,
  PostSearchResponse,
  SearchFilter,
} from '@/types/search.ts';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function asString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function likedByMeOf(value: Record<string, unknown>): boolean {
  if (typeof value.likedByMe === 'boolean') {
    return value.likedByMe;
  }
  if (typeof value.isLiked === 'boolean') {
    return value.isLiked;
  }
  if (typeof value.liked === 'boolean') {
    return value.liked;
  }
  return false;
}

function parseMemberSearchItem(value: unknown): MemberSearchItem | null {
  if (!isRecord(value)) {
    return null;
  }
  const id = asNumber(value.id);
  const name = asString(value.name);
  const uniqueId = asString(value.uniqueId) ?? asString(value.unique_id) ?? '';
  if (id === null || name === null) {
    return null;
  }
  const profileImage = asString(value.profileImage) ?? asString(value.profileImageUrl);
  const introduction = asString(value.introduction) ?? asString(value.intro);
  return {
    id,
    name,
    uniqueId,
    profileImage,
    introduction: introduction?.trim() ? introduction.trim() : null,
  };
}

function parseCursorPage(value: unknown): {
  raw: unknown[];
  nextCursor: number | null;
  hasNext: boolean;
} | null {
  if (!isRecord(value) || !Array.isArray(value.content) || typeof value.hasNext !== 'boolean') {
    return null;
  }
  if (value.nextCursor !== null && typeof value.nextCursor !== 'number') {
    return null;
  }
  return {
    raw: value.content,
    nextCursor: value.nextCursor,
    hasNext: value.hasNext,
  };
}

function parseMemberSearchResponse(value: unknown): MemberSearchResponse | null {
  const page = parseCursorPage(value);
  if (page === null) {
    return null;
  }
  const content: MemberSearchItem[] = [];
  for (const item of page.raw) {
    const member = parseMemberSearchItem(item);
    if (member === null) {
      return null;
    }
    content.push(member);
  }
  return { content, nextCursor: page.nextCursor, hasNext: page.hasNext };
}

function parsePostSearchItem(value: unknown): PostFeedItem | null {
  if (!isRecord(value)) {
    return null;
  }
  const postId = asNumber(value.postId);
  const memberId = asNumber(value.memberId);
  const memberName = asString(value.memberName);
  const uniqueId = asString(value.uniqueId);
  const content = asString(value.content);
  const likeCount = asNumber(value.likeCount);
  const commentCount = asNumber(value.commentCount);
  const createdAt = asString(value.createdAt);
  if (
    postId === null ||
    memberId === null ||
    memberName === null ||
    uniqueId === null ||
    content === null ||
    likeCount === null ||
    commentCount === null ||
    createdAt === null ||
    typeof value.subscriberOnly !== 'boolean'
  ) {
    return null;
  }
  const profileImageUrl = asString(value.profileImageUrl);
  const mainImageUrl = asString(value.mainImageUrl);
  return {
    postId,
    memberId,
    memberName,
    uniqueId,
    profileImageUrl,
    content,
    mainImageUrl,
    likeCount,
    commentCount,
    subscriberOnly: value.subscriberOnly,
    createdAt,
    likedByMe: likedByMeOf(value),
  };
}

function parsePostSearchResponse(value: unknown): PostSearchResponse | null {
  const page = parseCursorPage(value);
  if (page === null) {
    return null;
  }
  const content: PostFeedItem[] = [];
  for (const item of page.raw) {
    const post = parsePostSearchItem(item);
    if (post === null) {
      return null;
    }
    content.push(post);
  }
  return { content, nextCursor: page.nextCursor, hasNext: page.hasNext };
}

function searchParams(keyword: string, filter: SearchFilter, cursorId: number | null) {
  const params = new URLSearchParams({
    keyword: keyword.trim(),
    filter,
    size: '20',
  });
  if (cursorId !== null) {
    params.set('cursorId', String(cursorId));
  }
  return params;
}

export async function searchMembers(
  keyword: string,
  filter: SearchFilter,
  memberId: number | null,
  cursorId: number | null,
  signal?: AbortSignal,
): Promise<MemberSearchResponse> {
  const headers = memberId === null ? undefined : { 'X-Member-Id': String(memberId) };
  const data = await fetchApiJson(
    `/api/v1/search/members?${searchParams(keyword, filter, cursorId).toString()}`,
    { headers, signal },
  );
  const page = parseMemberSearchResponse(data);
  if (page === null) {
    throw new Error('회원 검색 응답 형식이 올바르지 않습니다.');
  }
  return page;
}

export async function searchPosts(
  keyword: string,
  filter: SearchFilter,
  memberId: number | null,
  cursorId: number | null,
  signal?: AbortSignal,
): Promise<PostSearchResponse> {
  const headers = memberId === null ? undefined : { 'X-Member-Id': String(memberId) };
  const data = await fetchApiJson(
    `/api/v1/search/posts?${searchParams(keyword, filter, cursorId).toString()}`,
    { headers, signal },
  );
  const page = parsePostSearchResponse(data);
  if (page === null) {
    throw new Error('게시글 검색 응답 형식이 올바르지 않습니다.');
  }
  return page;
}
