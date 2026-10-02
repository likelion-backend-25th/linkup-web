/** GET /api/v1/subscriptions 항목 (SubscribeCreatorListResponse), status: ACTIVE | CANCELLED */
export interface SubscribeCreatorListResponse {
  subscriptionId: number;
  memberId: number;
  creatorId: number;
  creatorName: string;
  creatorUniqueId: string;
  profileImage: string | null;
  introduction: string | null;
  status: string;
}

/** GET /api/v1/subscriptions 응답 (PagingSubListResponse) */
export interface PagingSubListResponse {
  subCreatorList: SubscribeCreatorListResponse[];
  subCreatorCount: number;
  nextCursor: number | null;
  hasNext: boolean;
}

/** POST /api/v1/subscriptions 요청 (CreateSubscriptionRequest) */
export interface CreateSubscriptionRequest {
  creatorId: number;
  customerKey: string;
  authKey: string;
}

/** POST /api/v1/subscriptions 응답 (CreateSubscriptionResponse). 카드 등록 후 첫 결제 승인 결과 */
export interface CreateSubscriptionResponse {
  subscriptionId: number;
  orderName: string | null;
  /** 토스 결제 상태 (DONE 등) */
  status: string | null;
  totalAmount: number;
  /** 토스 승인 시각 원문 문자열 (ISO 8601 + 오프셋, 예: 2026-10-01T18:00:00+09:00) */
  approvedAt: string | null;
}

/** GET /api/v1/subscriptions/cancel/{id} 응답 (CheckBillingDateResponse) */
export interface CheckBillingDateResponse {
  /** 가장 최근 결제일. 24시간 이내면 환불 가능 */
  billingDate: string;
}

/** POST /api/v1/subscriptions/cancel/{id}/refund 응답 (RefundSubscriptionResponse) */
export interface RefundSubscriptionResponse {
  totalAmount: number;
  /** 토스 환불 처리 시각 원문 (ISO 8601 + 오프셋) */
  canceledAt: string | null;
}

/** POST /api/v1/subscriptions/cancel/{id} 응답 (CancelSubscriptionResponse) */
export interface CancelSubscriptionResponse {
  /** 구독 혜택이 끝나는 날짜 */
  endDate: string | null;
}

/** GET /api/v1/subscriptions/{id} 응답 (SubscriptionDetailResponse) */
export interface SubscriptionDetailResponse {
  subscriptionId: number;
  name: string;
  uniqueId: string;
  email: string;
  price: number;
  status: string;
  startDate: string;
  endDate: string | null;
  nextBillingAt: string | null;
}
