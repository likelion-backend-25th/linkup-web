export type MemberSearchFilter = 'ALL' | 'FOLLOWING' | 'SUBSCRIBING';

export interface MemberSearchItem {
  id: number;
  name: string;
  uniqueId: string;
  profileImage: string | null;
}

export interface MemberSearchResponse {
  content: MemberSearchItem[];
  nextCursor: number | null;
  hasNext: boolean;
}
