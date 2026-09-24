/** GET /api/v1/posts 응답 항목 (PostResponse) */
export interface PostResponse {
  id: number;
  memberId: number;
  content: string;
  imageUrl: string | null;
  likeCount: number;
  createdAt: string;
  updatedAt: string;
}

/** PUT /api/v1/posts/{id} 요청 (PostUpdateRequest) */
export interface PostUpdateRequest {
  content: string;
  imageUrl: string | null;
}
