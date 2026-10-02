/** GET /api/v1/creators 항목 (SubscriberResponse) */
export interface SubscriberResponse {
  subscriptionId: number;
  creatorId: number;
  memberId: number;
  memberName: string;
  memberUniqueId: string;
  profileImage: string | null;
  startDate: string;
  endDate: string | null;
  nextBillingAt: string | null;
}

/** GET /api/v1/creators 응답 (PagingSubscriberListResponse) */
export interface PagingSubscriberListResponse {
  subscriberList: SubscriberResponse[];
  subscriberCount: number;
  nextCursor: number | null;
  hasNext: boolean;
}
