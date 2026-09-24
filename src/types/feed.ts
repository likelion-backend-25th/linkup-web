/** GET /api/v1/feeds/following 게시글 항목 (PostFeedResponse) */
export interface PostFeedItem {
  postId: number;
  memberId: number;
  memberName: string;
  uniqueId: string;
  profileImageUrl: string | null;
  content: string;
  mainImageUrl: string | null;
  likeCount: number;
  commentCount: number;
  subscriberOnly: boolean;
  createdAt: string;
}

/** GET /api/v1/feeds/following 응답 (FollowingFeedResponse) */
export interface FollowingFeedResponse {
  posts: PostFeedItem[];
  nextCursor: number | null;
  hasNext: boolean;
}
