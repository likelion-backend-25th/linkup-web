/** GET /api/v1/admin/reports 쿼리 (AdminReportSearchRequest) */
export interface AdminReportSearchRequest {
  targetType?: string;
  status?: string;
  page?: number;
  size?: number;
  offset?: number;
}

/** GET /api/v1/admin/reports 응답 항목 (AdminReportResponse) */
export interface AdminReportResponse {
  id: number;
  targetType: string;
  reporterName: string;
  targetUserName: string | null;
  content: string | null;
  reason: string;
  createdAt: string;
  status: string;
}

/** GET /api/v1/admin/reports/operation 응답 (AdminOperationResponse) */
export interface AdminOperationResponse {
  pendingReportCount: number;
  totalMember: number;
}

/** GET /api/v1/admin/reports/{reportId} 응답 (AdminReportDetailResponse) */
export interface AdminReportDetailResponse {
  id: number;
  targetType: string;
  postId: number | null;
  replyId: number | null;
  targetMemberId: number | null;
  reporterName: string;
  targetUserName: string | null;
  content: string | null;
  reason: string;
  reportContent: string | null;
  createdAt: string;
  status: string;
}

/** PATCH /api/v1/admin/reports/{reportId} 요청 (AdminReportProcessRequest) */
export interface AdminReportProcessRequest {
  status: string;
}

/** GET /api/v1/admin/members 쿼리 (AdminMemberSearchRequest) */
export interface AdminMemberSearchRequest {
  keyword?: string;
  searchType?: string;
  memberStatus?: string;
  creatorStatus?: string;
  page?: number;
  size?: number;
}

/** GET /api/v1/admin/members 응답 항목 (AdminMemberResponse) */
export interface AdminMemberResponse {
  id: number;
  profileImage: string | null;
  nickname: string;
  userId: string;
  memberStatus: string;
  creatorStatus: string;
  createdAt: string;
}

/** GET /api/v1/admin/members/{memberId} 응답 (AdminMemberDetailResponse) */
export interface AdminMemberDetailResponse {
  id: number;
  profileImage: string | null;
  nickname: string;
  userId: string;
  email: string;
  memberStatus: string;
  creatorStatus: string;
  createdAt: string;
  subscriptionPrice: number | null;
  subscriberCount: number;
}

/** GET /api/v1/admin/payment 쿼리 (AdminPaymentSearchRequest) */
export interface AdminPaymentSearchRequest {
  keyword?: string;
  paymentStatus?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
}

/** GET /api/v1/admin/payment 응답 항목 (AdminPaymentResponse) */
export interface AdminPaymentResponse {
  paymentId: number;
  paymentDate: string;
  sellerNickname: string;
  buyerNickname: string;
  buyerId: string;
  amount: number;
  paymentStatus: string;
}

/** GET /api/v1/admin/payment/{paymentId} 응답 (AdminPaymentDetailResponse) */
export interface AdminPaymentDetailResponse {
  paymentId: number;
  paymentDate: string;
  buyerNickname: string;
  buyerId: string;
  amount: number;
  paymentStatus: string;
  paymentMethod: string;
  merchantUid: string;
  impUid: string;
  sellerNickname: string;
  sellerId: string;
  subStartDate: string;
  subEndDate: string;
  nextBillingAt: string;
  subStatus: string;
}
