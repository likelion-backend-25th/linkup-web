import { fetchApiJson } from '@/api/http.ts';
import type { PagingSubscriberListResponse, SubscriberResponse } from '@/types/creator.ts';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isNullableString(value: unknown): boolean {
  return value === null || value === undefined || typeof value === 'string';
}

function isSubscriber(value: unknown): value is SubscriberResponse {
  return (
    isRecord(value) &&
    typeof value.subscriptionId === 'number' &&
    typeof value.memberId === 'number' &&
    typeof value.memberName === 'string' &&
    typeof value.memberUniqueId === 'string' &&
    typeof value.startDate === 'string' &&
    isNullableString(value.profileImage) &&
    isNullableString(value.endDate) &&
    isNullableString(value.nextBillingAt)
  );
}

export async function fetchSubscribers(
  accessToken: string,
  cursor: number | null,
  size: number,
  signal?: AbortSignal,
): Promise<PagingSubscriberListResponse> {
  const params = new URLSearchParams({ size: String(size) });
  if (cursor !== null) {
    params.set('cursor', String(cursor));
  }

  // 서버가 Bearer 토큰으로 크리에이터(로그인 회원)를 식별한다.
  const data = await fetchApiJson(`/api/v1/creators?${params.toString()}`, { accessToken, signal });
  if (
    !isRecord(data) ||
    !Array.isArray(data.subscriberList) ||
    !data.subscriberList.every(isSubscriber) ||
    typeof data.subscriberCount !== 'number' ||
    typeof data.hasNext !== 'boolean'
  ) {
    throw new Error('구독자 목록 형식이 올바르지 않습니다.');
  }

  return {
    subscriberList: data.subscriberList.map((item) => ({
      ...item,
      profileImage: item.profileImage ?? null,
      endDate: item.endDate ?? null,
      nextBillingAt: item.nextBillingAt ?? null,
    })),
    subscriberCount: data.subscriberCount,
    nextCursor: typeof data.nextCursor === 'number' ? data.nextCursor : null,
    hasNext: data.hasNext,
  };
}
