import { fetchApiJson } from '@/api/http.ts';
import type {
  MemberSearchFilter,
  MemberSearchItem,
  MemberSearchResponse,
} from '@/types/search.ts';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isMemberSearchItem(value: unknown): value is MemberSearchItem {
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

function isMemberSearchResponse(value: unknown): value is MemberSearchResponse {
  if (!isRecord(value)) {
    return false;
  }
  return (
    Array.isArray(value.content) &&
    value.content.every(isMemberSearchItem) &&
    (value.nextCursor === null || typeof value.nextCursor === 'number') &&
    typeof value.hasNext === 'boolean'
  );
}

export async function searchMembers(
  keyword: string,
  filter: MemberSearchFilter,
  memberId: number | null,
  cursorId: number | null,
  signal?: AbortSignal,
): Promise<MemberSearchResponse> {
  const params = new URLSearchParams({
    keyword: keyword.trim(),
    filter,
    size: '20',
  });
  if (cursorId !== null) {
    params.set('cursorId', String(cursorId));
  }

  const headers = memberId === null ? undefined : { 'X-Member-Id': String(memberId) };
  const data = await fetchApiJson(`/api/v1/search/members?${params.toString()}`, {
    headers,
    signal,
  });
  if (!isMemberSearchResponse(data)) {
    throw new Error('회원 검색 응답 형식이 올바르지 않습니다.');
  }
  return data;
}
