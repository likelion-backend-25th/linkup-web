import { useEffect, useMemo, useRef } from 'react';
import { Search } from 'lucide-react';
import { FollowingFeedList } from '@/components/FollowingFeedList.tsx';
import { SuggestedUsers } from '@/components/SuggestedUsers.tsx';
import { useAuthStore } from '@/stores/useAuthStore.ts';
import { useFeedViewStore, type FeedTab } from '@/stores/useFeedViewStore.ts';
import { useLoginPromptStore } from '@/stores/useLoginPromptStore.ts';
import type { PostFeedItem } from '@/types/feed.ts';

const tabs: { id: FeedTab; label: string }[] = [
  { id: 'popular', label: '인기' },
  { id: 'following', label: '팔로잉' },
  { id: 'subscribe', label: '구독' },
];

const EMPTY_POSTS: PostFeedItem[] = [];

export function FeedPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const showLoginPrompt = useLoginPromptStore((state) => state.show);
  const tab = useFeedViewStore((state) => state.tab);
  const setTab = useFeedViewStore((state) => state.setTab);
  const query = useFeedViewStore((state) => state.query);
  const setQuery = useFeedViewStore((state) => state.setQuery);
  const followingPosts = useFeedViewStore(
    (state) => state.snapshots.following?.posts ?? EMPTY_POSTS,
  );
  const feedScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scroller = feedScrollRef.current;
    if (scroller === null) {
      return;
    }

    function persistScroll() {
      const node = feedScrollRef.current;
      if (node === null) {
        return;
      }
      useFeedViewStore.getState().setScrollTop(node.scrollTop);
    }

    scroller.addEventListener('scroll', persistScroll, { passive: true });
    return () => {
      persistScroll();
      scroller.removeEventListener('scroll', persistScroll);
    };
  }, [tab]);

  useEffect(() => {
    if (!accessToken && (tab === 'following' || tab === 'subscribe')) {
      setTab('popular');
    }
  }, [accessToken, setTab, tab]);

  function selectTab(nextTab: FeedTab) {
    if ((nextTab === 'following' || nextTab === 'subscribe') && !accessToken) {
      showLoginPrompt();
      return;
    }
    setTab(nextTab);
  }

  const suggestedUsers = useMemo(() => {
    const seen = new Set<number>();
    return followingPosts
      .filter((post: PostFeedItem) => {
        if (seen.has(post.memberId)) {
          return false;
        }
        seen.add(post.memberId);
        return true;
      })
      .slice(0, 5)
      .map((post) => ({
        memberId: post.memberId,
        nickname: post.memberName,
        uniqueId: post.uniqueId,
        profileImage: post.profileImageUrl,
      }));
  }, [followingPosts]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 xl:flex-row">
      <section className="flex min-h-0 min-w-0 flex-1 flex-col rounded-2xl bg-white px-5 py-4 shadow-sm">
        <div className="mb-2 flex shrink-0 gap-5 border-b border-zinc-100">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => selectTab(item.id)}
              className={
                tab === item.id
                  ? 'border-b-2 border-linkup py-3 text-sm font-semibold text-linkup'
                  : 'py-3 text-sm font-medium text-zinc-400 hover:text-zinc-700'
              }
            >
              {item.label}
            </button>
          ))}
        </div>

        <div
          ref={feedScrollRef}
          className="linkup-scrollbar min-h-0 flex-1 overflow-y-auto pr-1"
        >
          {tab === 'popular' && (
            <FollowingFeedList
              enabled
              feedType="popular"
              query={query}
              scrollRoot={feedScrollRef}
            />
          )}
          {tab === 'following' && (
            <FollowingFeedList
              enabled
              feedType="following"
              query={query}
              scrollRoot={feedScrollRef}
            />
          )}
          {tab === 'subscribe' && (
            <FollowingFeedList
              enabled
              feedType="subscription"
              query={query}
              scrollRoot={feedScrollRef}
            />
          )}
        </div>
      </section>

      <aside className="flex w-full shrink-0 flex-col gap-4 xl:h-full xl:w-80">
        <label className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-sm">
          <Search className="size-4 text-zinc-400" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="검색"
            className="w-full bg-transparent text-sm text-zinc-800 outline-none placeholder:text-zinc-400"
          />
        </label>
        <SuggestedUsers users={suggestedUsers} />
      </aside>
    </div>
  );
}
