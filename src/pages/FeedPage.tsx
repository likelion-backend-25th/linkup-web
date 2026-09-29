import { useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { FollowingFeedList } from '@/components/FollowingFeedList.tsx';
import { SuggestedUsers } from '@/components/SuggestedUsers.tsx';
import type { PostFeedItem } from '@/types/feed.ts';

type FeedTab = 'following' | 'subscribe' | 'popular';

const tabs: { id: FeedTab; label: string }[] = [
  { id: 'following', label: '팔로잉' },
  { id: 'subscribe', label: '구독' },
  { id: 'popular', label: '인기' },
];

export function FeedPage() {
  const [tab, setTab] = useState<FeedTab>('following');
  const [query, setQuery] = useState('');
  const [followingPosts, setFollowingPosts] = useState<PostFeedItem[]>([]);
  const feedScrollRef = useRef<HTMLDivElement>(null);

  const suggestedUsers = useMemo(() => {
    const seen = new Set<number>();
    return followingPosts
      .filter((post) => {
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
              onClick={() => setTab(item.id)}
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

        <div ref={feedScrollRef} className="min-h-0 flex-1 overflow-y-auto">
          {tab === 'following' && (
            <FollowingFeedList
              enabled
              feedType="following"
              query={query}
              scrollRoot={feedScrollRef}
              onPostsChange={setFollowingPosts}
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
          {tab === 'popular' && (
            <p className="py-8 text-sm text-zinc-400">이 피드는 곧 열려요.</p>
          )}
        </div>
      </section>

      <aside className="flex w-full shrink-0 flex-col gap-4 xl:h-full xl:w-72">
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
