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
  nextCursor: number | null;
  hasNext: boolean;
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
