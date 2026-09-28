import { fetchApiJson } from '@/api/http.ts';
import type { SubscribeCreatorListResponse } from '@/types/subscription.ts';

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
    typeof value.subscription_id === 'number' &&
    typeof value.memberId === 'number' &&
    typeof value.creatorId === 'number' &&
    typeof value.creatorName === 'string' &&
    typeof value.creatorUniqueId === 'string' &&
    isNullableString(value.profileImage) &&
    isNullableString(value.introduction) &&
    typeof value.status === 'string' &&
    typeof value.startDate === 'string' &&
    isNullableString(value.endDate) &&
    isNullableString(value.nextBillingAt)
  );
}

export async function fetchSubscriptions(
  memberId: number,
  accessToken: string | null,
  signal?: AbortSignal,
): Promise<SubscribeCreatorListResponse[]> {
  // 서버가 X-Member-Id 헤더로 로그인 회원을 식별한다.
  const data = await fetchApiJson('/api/v1/subscriptions', {
    accessToken,
    headers: { 'X-Member-Id': String(memberId) },
    signal,
  });
  if (!Array.isArray(data) || !data.every(isSubscribeCreator)) {
    throw new Error('구독 목록 형식이 올바르지 않습니다.');
  }
  // 누락 필드(undefined)는 null 로 맞춘다.
  return data.map((item) => ({
    ...item,
    profileImage: item.profileImage ?? null,
    introduction: item.introduction ?? null,
    endDate: item.endDate ?? null,
    nextBillingAt: item.nextBillingAt ?? null,
  }));
}
