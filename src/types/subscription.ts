/** GET /api/v1/subscriptions 항목 (SubscribeCreatorListResponse), status: ACTIVE | CANCELLED */
export interface SubscribeCreatorListResponse {
  subscription_id: number;
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
