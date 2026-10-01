import { create } from 'zustand';

interface BlockMemoryState {
  blockedIds: number[];
  postAuthors: Record<number, number>;
  markBlocked: (memberId: number) => void;
  markUnblocked: (memberId: number) => void;
  rememberPostAuthor: (postId: number, memberId: number) => void;
}

export const useBlockMemoryStore = create<BlockMemoryState>((set) => ({
  blockedIds: [],
  postAuthors: {},
  markBlocked: (memberId) =>
    set((state) =>
      state.blockedIds.includes(memberId)
        ? state
        : { blockedIds: [...state.blockedIds, memberId] },
    ),
  markUnblocked: (memberId) =>
    set((state) => ({
      blockedIds: state.blockedIds.filter((id) => id !== memberId),
    })),
  rememberPostAuthor: (postId, memberId) =>
    set((state) => ({
      postAuthors: { ...state.postAuthors, [postId]: memberId },
    })),
}));
