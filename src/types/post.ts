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

/** GET /api/v1/posts/{id} 이미지 (PostImageResponse) */
export interface PostImageResponse {
  id: number;
  imageUrl: string;
  imageOrder: number;
}

/** GET /api/v1/posts/{id} 응답 (PostDetailResponse) */
export interface PostDetailResponse {
  id: number;
  memberId: number;
  content: string;
  fileUrl: string | null;
  likeCount: number;
  subscriberOnly: boolean;
  createdAt: string;
  updatedAt: string;
  images: PostImageResponse[];
}

/** PUT /api/v1/posts/{id} 요청 (PostUpdateRequest) */
export interface PostUpdateRequest {
  content: string;
  imageUrl: string | null;
}
