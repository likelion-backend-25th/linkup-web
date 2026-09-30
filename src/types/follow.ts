/** GET /api/v1/members/{targetId}/follow 응답 (FollowResponse) */
export interface FollowResponse {
  targetId: number;
  isFollowing: boolean;
  followerCount: number;
  memberId: number;
  followingCount: number;
}

export type FollowListType = 'followers' | 'followings';

/** GET /api/v1/members/{memberId}/followers|followings 항목 */
export interface FollowMember {
  memberId: number;
  name: string;
  uniqueId: string;
  profileImage: string | null;
}

/** GET /api/v1/members/{memberId}/followers|followings 응답 */
export interface FollowMemberPageResponse {
  members: FollowMember[];
  nextCursor: number | null;
  hasNext: boolean;
}
