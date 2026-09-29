/** GET /api/v1/members/{targetId}/follow 응답 (FollowResponse) */
export interface FollowResponse {
  targetId: number;
  isFollowing: boolean;
  followerCount: number;
  memberId: number;
  followingCount: number;
}
