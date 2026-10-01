/** PUT /api/v1/member/me 요청 JSON 파트 (MemberUpdateRequest) */
export interface MemberUpdateRequest {
  name: string;
  uniqueId: string;
  introduction: string;
}

/** GET /api/v1/member/{memberId} 응답 (MemberResponseDto) */
export interface MemberResponseDto {
  id: number;
  uniqueId: string | null;
  name: string;
  profileImage: string | null;
  introduction: string | null;
  postCount: number | null;
  creator: boolean | null;
  subscriptionPrice: number | null;
}
