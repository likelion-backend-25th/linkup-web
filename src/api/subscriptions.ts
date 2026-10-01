import { fetchApiJson } from '@/api/http.ts';
import type {
  CreateSubscriptionRequest,
  CreateSubscriptionResponse,
  PagingSubListResponse,
  SubscribeCreatorListResponse,
  SubscriptionDetailResponse,
} from '@/types/subscription.ts';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isNullableString(value: unknown): boolean {
  return value === null || value === undefined || typeof value === 'string';
}

function isSubscribeCreator(value: unknown): value is SubscribeCreatorListResponse {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.subscriptionId === 'number' &&
    typeof value.memberId === 'number' &&
    typeof value.creatorId === 'number' &&
    typeof value.creatorName === 'string' &&
    typeof value.creatorUniqueId === 'string' &&
    isNullableString(value.profileImage) &&
    isNullableString(value.introduction) &&
    typeof value.status === 'string'
  );
}

function isPagingSubListResponse(value: unknown): value is PagingSubListResponse {
  if (!isRecord(value)) {
    return false;
  }

  return (
    Array.isArray(value.subCreatorList) &&
    value.subCreatorList.every(isSubscribeCreator) &&
    typeof value.subCreatorCount === 'number' &&
    (value.nextCursor === null ||
      value.nextCursor === undefined ||
      typeof value.nextCursor === 'number') &&
    typeof value.hasNext === 'boolean'
  );
}

function isSubscriptionDetail(value: unknown): value is SubscriptionDetailResponse {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.subscriptionId === 'number' &&
    typeof value.name === 'string' &&
    typeof value.uniqueId === 'string' &&
    typeof value.email === 'string' &&
    typeof value.price === 'number' &&
    typeof value.status === 'string' &&
    typeof value.startDate === 'string' &&
    isNullableString(value.endDate) &&
    isNullableString(value.nextBillingAt)
  );
}

export async function fetchSubscriptions(
  accessToken: string,
  cursor: number | null,
  size: number,
  signal?: AbortSignal,
): Promise<PagingSubListResponse> {
  const params = new URLSearchParams({ size: String(size) });
  if (cursor !== null) {
    params.set('cursor', String(cursor));
  }

  // 서버가 Bearer 토큰으로 로그인 회원을 식별한다.
  const data = await fetchApiJson(`/api/v1/subscriptions?${params.toString()}`, {
    accessToken,
    signal,
  });
  if (!isPagingSubListResponse(data)) {
    throw new Error('구독 목록 형식이 올바르지 않습니다.');
  }
  // 누락 필드(undefined)는 null 로 맞춘다.
  return {
    subCreatorList: data.subCreatorList.map((item) => ({
      ...item,
      profileImage: item.profileImage ?? null,
      introduction: item.introduction ?? null,
    })),
    subCreatorCount: data.subCreatorCount,
    nextCursor: data.nextCursor ?? null,
    hasNext: data.hasNext,
  };
}

export async function fetchSubscriptionDetail(
  subscriptionId: number,
  accessToken: string,
  signal?: AbortSignal,
): Promise<SubscriptionDetailResponse> {
  const data = await fetchApiJson(`/api/v1/subscriptions/${subscriptionId}`, {
    accessToken,
    signal,
  });
  if (!isSubscriptionDetail(data)) {
    throw new Error('구독 상세 형식이 올바르지 않습니다.');
  }
  return {
    ...data,
    endDate: data.endDate ?? null,
    nextBillingAt: data.nextBillingAt ?? null,
  };
}

export async function createSubscription(
  request: CreateSubscriptionRequest,
  accessToken: string,
): Promise<CreateSubscriptionResponse> {
  const data = await fetchApiJson('/api/v1/subscriptions', {
    method: 'POST',
    body: request,
    accessToken,
  });
  if (!isRecord(data) || typeof data.subscriptionId !== 'number') {
    throw new Error('구독 등록 응답 형식이 올바르지 않습니다.');
  }
  return { subscriptionId: data.subscriptionId };
}
