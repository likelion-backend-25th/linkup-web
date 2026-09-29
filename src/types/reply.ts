/** GET /api/v1/posts/{postId}/replies 항목 (ReplyResponse) */
export interface ReplyResponse {
  id: number;
  memberId: number;
  name: string;
  uniqueId: string;
  profileImage: string | null;
  content: string;
  likeCount: number;
  createdAt: string;
  updatedAt: string;
}

/** GET /api/v1/posts/{postId}/replies 응답 (ReplyPageResponse) */
export interface ReplyPageResponse {
  replies: ReplyResponse[];
  nextCursor: number | null;
  hasNext: boolean;
}
