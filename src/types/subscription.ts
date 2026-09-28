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
  startDate: string;
  endDate: string | null;
  nextBillingAt: string | null;
}

/** GET /api/v1/subscriptions 응답 (PagingSubListResponse) */
export interface PagingSubListResponse {
  subCreatorList: SubscribeCreatorListResponse[];
  nextCursor: number | null;
  hasNext: boolean;
}
