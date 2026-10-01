/** PUT /api/v1/member/me 요청 JSON 파트 (MemberUpdateRequest) */
export interface MemberUpdateRequest {
  name: string;
  uniqueId: string;
  introduction: string;
}

/** GET /api/v1/member/recommendations 항목 (RecommendedMemberResponseDto) */
export interface RecommendedMemberResponseDto {
  id: number;
  name: string;
  uniqueId: string;
  profileImage: string | null;
  introduction: string | null;
  followerCount: number;
  following: boolean;
}

/** GET /api/v1/member/{memberId} 응답 (MemberResponseDto) */
export interface MemberResponseDto {
  id: number;
  uniqueId: string | null;
  name: string;
  profileImage: string | null;
  introduction: string | null;
  postCount: number | null;
  followerCount: number | null;
  followingCount: number | null;
  /** ROLE_USER | ROLE_CREATOR | ROLE_ADMIN */
  role: string | null;
  /** 로그인 사용자의 이 회원 구독 상태. null 이면 미구독, ACTIVE | CANCELED */
  subscribedStatus: string | null;
}
