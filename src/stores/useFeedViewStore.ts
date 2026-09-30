import { create } from 'zustand';
import type { FeedType, PostFeedItem } from '@/types/feed.ts';

export type FeedTab = 'following' | 'subscribe' | 'popular';

export interface FeedSnapshot {
  posts: PostFeedItem[];
  nextCursor: number | null;
  hasNext: boolean;
}

interface FeedViewState {
  tab: FeedTab;
  query: string;
  scrollTop: number;
  snapshots: Partial<Record<FeedType, FeedSnapshot>>;
  setTab: (tab: FeedTab) => void;
  setQuery: (query: string) => void;
  setScrollTop: (scrollTop: number) => void;
  saveSnapshot: (feedType: FeedType, snapshot: FeedSnapshot) => void;
}

export const useFeedViewStore = create<FeedViewState>((set) => ({
  tab: 'popular',
  query: '',
  scrollTop: 0,
  snapshots: {},
  setTab: (tab) => set({ tab, scrollTop: 0 }),
  setQuery: (query) => set({ query }),
  setScrollTop: (scrollTop) => set({ scrollTop }),
  saveSnapshot: (feedType, snapshot) =>
    set((state) => ({
      snapshots: { ...state.snapshots, [feedType]: snapshot },
    })),
}));
