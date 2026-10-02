import { fetchApiJson } from '@/api/http.ts';
import type {
  AdminMemberDetailResponse,
  AdminMemberResponse,
  AdminMemberSearchRequest,
  AdminOperationResponse,
  AdminPaymentDetailResponse,
  AdminPaymentResponse,
  AdminPaymentSearchRequest,
  AdminReportDetailResponse,
  AdminReportProcessRequest,
  AdminReportResponse,
  AdminReportSearchRequest,
} from '@/types/admin.ts';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function appendQuery(
  params: URLSearchParams,
  query: Record<string, string | number | undefined>,
): void {
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) {
      continue;
    }
    params.set(key, String(value));
  }
}

function isAdminReport(value: unknown): value is AdminReportResponse {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === 'number' &&
    typeof value.targetType === 'string' &&
    typeof value.reporterName === 'string' &&
    (value.targetUserName === null || typeof value.targetUserName === 'string') &&
    (value.content === null || typeof value.content === 'string') &&
    typeof value.reason === 'string' &&
    typeof value.createdAt === 'string' &&
    typeof value.status === 'string'
  );
}

function isAdminReportDetail(value: unknown): value is AdminReportDetailResponse {
  if (!isRecord(value)) {
    return false;
  }

  const hasDetail =
    (value.postId === null || typeof value.postId === 'number') &&
    (value.replyId === null || typeof value.replyId === 'number') &&
    (value.targetMemberId === null || typeof value.targetMemberId === 'number') &&
    (value.reportContent === null || typeof value.reportContent === 'string');

  return hasDetail && isAdminReport(value);
}

function isAdminOperation(value: unknown): value is AdminOperationResponse {
  if (!isRecord(value)) {
    return false;
  }

  return typeof value.pendingReportCount === 'number' && typeof value.totalMember === 'number';
}

function isAdminMember(value: unknown): value is AdminMemberResponse {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === 'number' &&
    (value.profileImage === null || typeof value.profileImage === 'string') &&
    typeof value.nickname === 'string' &&
    typeof value.userId === 'string' &&
    typeof value.memberStatus === 'string' &&
    typeof value.creatorStatus === 'string' &&
    typeof value.createdAt === 'string'
  );
}

function isAdminMemberDetail(value: unknown): value is AdminMemberDetailResponse {
  if (!isRecord(value)) {
    return false;
  }

  const hasDetail =
    typeof value.email === 'string' &&
    (value.subscriptionPrice === null || typeof value.subscriptionPrice === 'number') &&
    typeof value.subscriberCount === 'number';

  return hasDetail && isAdminMember(value);
}

function isAdminPayment(value: unknown): value is AdminPaymentResponse {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.paymentId === 'number' &&
    typeof value.paymentDate === 'string' &&
    typeof value.sellerNickname === 'string' &&
    typeof value.buyerNickname === 'string' &&
    typeof value.buyerId === 'string' &&
    typeof value.amount === 'number' &&
    typeof value.paymentStatus === 'string'
  );
}

function isAdminPaymentDetail(value: unknown): value is AdminPaymentDetailResponse {
  if (!isRecord(value)) {
    return false;
  }

  const hasDetail =
    typeof value.paymentMethod === 'string' &&
    typeof value.orderId === 'string' &&
    typeof value.paymentKey === 'string' &&
    typeof value.sellerId === 'string' &&
    typeof value.subStartDate === 'string' &&
    (value.subEndDate === null || typeof value.subEndDate === 'string') &&
    (value.nextBillingAt === null || typeof value.nextBillingAt === 'string') &&
    typeof value.subStatus === 'string';

  return hasDetail && isAdminPayment(value);
}

function parseList<T>(
  data: unknown,
  isItem: (value: unknown) => value is T,
  message: string,
): T[] {
  if (!Array.isArray(data) || !data.every(isItem)) {
    throw new Error(message);
  }
  return data;
}

export async function getAdminReports(
  query: AdminReportSearchRequest = {},
  signal?: AbortSignal,
): Promise<AdminReportResponse[]> {
  const params = new URLSearchParams();
  appendQuery(params, {
    ...query,
    page: query.page !== undefined && query.page >= 1 ? query.page : 1,
    size: query.size !== undefined && query.size >= 1 ? query.size : 20,
  });
  const data = await fetchApiJson(`/api/v1/admin/reports?${params.toString()}`, { signal });
  return parseList(data, isAdminReport, '신고 목록 형식이 올바르지 않습니다.');
}

// 서버 경로는 /reports/summary 가 아니라 /reports/operation 이다.
export async function getAdminReportSummary(
  signal?: AbortSignal,
): Promise<AdminOperationResponse> {
  const data = await fetchApiJson('/api/v1/admin/reports/operation', { signal });
  if (!isAdminOperation(data)) {
    throw new Error('신고 요약 형식이 올바르지 않습니다.');
  }
  return data;
}

export async function getAdminReportDetail(
  reportId: number,
  signal?: AbortSignal,
): Promise<AdminReportDetailResponse> {
  const data = await fetchApiJson(`/api/v1/admin/reports/${reportId}`, { signal });
  if (!isAdminReportDetail(data)) {
    throw new Error('신고 상세 형식이 올바르지 않습니다.');
  }
  return data;
}

export async function processAdminReport(
  reportId: number,
  request: AdminReportProcessRequest,
): Promise<void> {
  await fetchApiJson(`/api/v1/admin/reports/${reportId}`, {
    method: 'PATCH',
    body: request,
  });
}

export async function fetchAdminMembers(
  query: AdminMemberSearchRequest = {},
  signal?: AbortSignal,
): Promise<AdminMemberResponse[]> {
  const keyword = query.keyword?.trim();
  const params = new URLSearchParams();
  // 백엔드는 page/size 가 없으면 400이다. 페이지는 1부터다.
  appendQuery(params, {
    ...query,
    keyword: keyword || undefined,
    searchType: undefined,
    page: query.page !== undefined && query.page >= 1 ? query.page : 1,
    size: query.size !== undefined && query.size >= 1 ? query.size : 20,
  });
  const data = await fetchApiJson(`/api/v1/admin/members?${params.toString()}`, { signal });
  return parseList(data, isAdminMember, '회원 목록 형식이 올바르지 않습니다.');
}

export async function fetchAdminMember(
  memberId: number,
  signal?: AbortSignal,
): Promise<AdminMemberDetailResponse> {
  const data = await fetchApiJson(`/api/v1/admin/members/${memberId}`, { signal });
  if (!isAdminMemberDetail(data)) {
    throw new Error('회원 상세 형식이 올바르지 않습니다.');
  }
  return data;
}

export async function fetchAdminPayments(
  query: AdminPaymentSearchRequest = {},
  signal?: AbortSignal,
): Promise<AdminPaymentResponse[]> {
  const keyword = query.keyword?.trim();
  const params = new URLSearchParams();
  appendQuery(params, {
    ...query,
    keyword: keyword || undefined,
    page: query.page !== undefined && query.page >= 1 ? query.page : 1,
    size: query.size !== undefined && query.size >= 1 ? query.size : 20,
  });
  const data = await fetchApiJson(`/api/v1/admin/payment?${params.toString()}`, { signal });
  return parseList(data, isAdminPayment, '결제 목록 형식이 올바르지 않습니다.');
}

export async function fetchAdminPayment(
  paymentId: number,
  signal?: AbortSignal,
): Promise<AdminPaymentDetailResponse> {
  const data = await fetchApiJson(`/api/v1/admin/payment/${paymentId}`, { signal });
  if (!isAdminPaymentDetail(data)) {
    throw new Error('결제 상세 형식이 올바르지 않습니다.');
  }
  return data;
}
