/** POST /api/v1/auth/login 요청 (LoginRequest) */
export interface LoginRequest {
  email: string;
  password: string;
}

/** POST /api/v1/auth/login 응답 (TokenResponse) */
export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

/** GET /api/v1/member/me 응답 (MemberDto) */
export interface MemberProfileResponse {
  id: number;
  email: string;
  nickname: string;
  uniqueId: string | null;
  profileImage: string | null;
  introduction: string | null;
  role: string;
  createdAt: string;
  followerCount?: number;
  creatorStatus?: string | null;
  isCreator?: boolean | null;
}
