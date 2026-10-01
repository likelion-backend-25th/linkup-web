import type { PostFeedItem } from '@/types/feed.ts';

export type SearchFilter = 'ALL' | 'FOLLOWING' | 'SUBSCRIBING';
export type MemberSearchFilter = SearchFilter;
export type SearchTab = 'posts' | 'members';

export interface MemberSearchItem {
  id: number;
  name: string;
  uniqueId: string;
  profileImage: string | null;
  introduction: string | null;
}

export interface MemberSearchResponse {
  content: MemberSearchItem[];
  nextCursor: number | null;
  hasNext: boolean;
}

export interface PostSearchResponse {
  content: PostFeedItem[];
  nextCursor: number | null;
  hasNext: boolean;
}
