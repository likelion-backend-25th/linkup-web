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

/** POST /api/v1/subscriptions 응답 (CreateSubscriptionResponse) */
export interface CreateSubscriptionResponse {
  subscriptionId: number;
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
