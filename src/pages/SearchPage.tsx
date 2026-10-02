import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Search } from 'lucide-react';
import { Link } from 'react-router';
import { isAbortError, toErrorMessage } from '@/api/http.ts';
import { searchMembers, searchPosts } from '@/api/search.ts';
import { MemberAvatar } from '@/components/MemberAvatar.tsx';
import { PostCard } from '@/components/PostCard.tsx';
import { useAuthStore } from '@/stores/useAuthStore.ts';
import type { PostFeedItem } from '@/types/feed.ts';
import type { MemberSearchItem, SearchFilter, SearchTab } from '@/types/search.ts';

const filters: { value: SearchFilter; label: string }[] = [
  { value: 'ALL', label: '모든 사용자' },
  { value: 'FOLLOWING', label: '팔로우 사용자' },
  { value: 'SUBSCRIBING', label: '구독 사용자' },
];

export function SearchPage() {
  const memberId = useAuthStore((state) => state.profile?.id ?? null);
  const controllerRef = useRef<AbortController | null>(null);
  const [tab, setTab] = useState<SearchTab>('posts');
  const [query, setQuery] = useState('');
  const [keyword, setKeyword] = useState('');
  const [filter, setFilter] = useState<SearchFilter>('ALL');
  const [members, setMembers] = useState<MemberSearchItem[]>([]);
  const [posts, setPosts] = useState<PostFeedItem[]>([]);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => controllerRef.current?.abort();
  }, []);

  async function runSearch(
    nextTab: SearchTab,
    nextKeyword: string,
    nextFilter: SearchFilter,
    cursor: number | null,
    append: boolean,
  ) {
    const trimmed = nextKeyword.trim();
    if (trimmed === '') {
      setMembers([]);
      setPosts([]);
      setKeyword('');
      setHasNext(false);
      setNextCursor(null);
      setError(null);
      return;
    }

    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setLoading(true);
    setError(null);
    try {
      if (nextTab === 'posts') {
        const response = await searchPosts(
          trimmed,
          nextFilter,
          memberId,
          cursor,
          controller.signal,
        );
        setPosts((current) => (append ? [...current, ...response.content] : response.content));
        if (!append) {
          setMembers([]);
        }
        setNextCursor(response.nextCursor);
        setHasNext(response.hasNext);
      } else {
        const response = await searchMembers(
          trimmed,
          nextFilter,
          memberId,
          cursor,
          controller.signal,
        );
        setMembers((current) => (append ? [...current, ...response.content] : response.content));
        if (!append) {
          setPosts([]);
        }
        setNextCursor(response.nextCursor);
        setHasNext(response.hasNext);
      }
      setKeyword(trimmed);
    } catch (caught: unknown) {
      if (!isAbortError(caught)) {
        setError(toErrorMessage(caught));
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void runSearch(tab, query, filter, null, false);
  }

  function selectTab(nextTab: SearchTab) {
    if (nextTab === tab) {
      return;
    }
    setTab(nextTab);
    setError(null);
    if (keyword !== '') {
      void runSearch(nextTab, keyword, filter, null, false);
    }
  }

  function selectFilter(nextFilter: SearchFilter) {
    setFilter(nextFilter);
    if (keyword !== '') {
      void runSearch(tab, keyword, nextFilter, null, false);
    }
  }

  const hasResults = tab === 'posts' ? posts.length > 0 : members.length > 0;

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 xl:flex-row">
      <section className="flex min-h-0 min-w-0 flex-1 flex-col rounded-2xl bg-white p-5 shadow-sm">
        <form onSubmit={submitSearch} className="relative shrink-0">
          <Search
            className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-zinc-400"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="검색 키워드"
            aria-label="검색 키워드"
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-3 pr-4 pl-11 text-sm outline-none focus:border-linkup focus:bg-white"
          />
        </form>

        <div className="mt-4 flex gap-6 border-b border-zinc-100">
          <button
            type="button"
            onClick={() => selectTab('posts')}
            className={
              tab === 'posts'
                ? 'border-b-2 border-zinc-900 py-3 text-sm font-semibold text-zinc-900'
                : 'py-3 text-sm font-medium text-zinc-400'
            }
          >
            게시글
          </button>
          <button
            type="button"
            onClick={() => selectTab('members')}
            className={
              tab === 'members'
                ? 'border-b-2 border-zinc-900 py-3 text-sm font-semibold text-zinc-900'
                : 'py-3 text-sm font-medium text-zinc-400'
            }
          >
            사용자
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {keyword === '' && !loading && (
            <p className="py-10 text-center text-sm text-zinc-400">검색어를 입력해 주세요.</p>
          )}
          {loading && !hasResults && (
            <p className="py-10 text-center text-sm text-zinc-400">검색 중...</p>
          )}
          {error && !hasResults && (
            <p className="py-10 text-center text-sm text-red-500">{error}</p>
          )}
          {!loading && !error && keyword !== '' && !hasResults && (
            <p className="py-10 text-center text-sm text-zinc-400">검색 결과가 없습니다.</p>
          )}

          {tab === 'posts' && posts.length > 0 && (
            <ul>
              {posts.map((post) => (
                <li key={post.postId}>
                  <PostCard post={post} />
                </li>
              ))}
            </ul>
          )}

          {tab === 'members' && members.length > 0 && (
            <ul className="divide-y divide-zinc-100">
              {members.map((member) => (
                <li key={member.id}>
                  <Link
                    to={`/members/${member.id}`}
                    state={{
                      name: member.name,
                      uniqueId: member.uniqueId,
                      profileImage: member.profileImage,
                      introduction: member.introduction,
                    }}
                    className="flex items-start gap-3 px-2 py-4 hover:bg-zinc-50"
                  >
                    <MemberAvatar name={member.name} imageUrl={member.profileImage} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-zinc-900">{member.name}</p>
                      <p className="truncate text-xs text-zinc-400">@{member.uniqueId}</p>
                      {member.introduction && (
                        <p className="mt-1 truncate text-xs text-zinc-500">{member.introduction}</p>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {hasNext && nextCursor !== null && (
            <button
              type="button"
              disabled={loading}
              onClick={() => void runSearch(tab, keyword, filter, nextCursor, true)}
              className="mx-auto my-4 block rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 disabled:opacity-50"
            >
              {loading ? '불러오는 중...' : '더 보기'}
            </button>
          )}
          {error && hasResults && (
            <p className="py-3 text-center text-sm text-red-500">{error}</p>
          )}
        </div>
      </section>

      <aside className="w-full shrink-0 rounded-2xl bg-white p-5 shadow-sm xl:h-fit xl:w-64">
        <h2 className="text-sm font-semibold text-zinc-900">검색 필터</h2>
        <div className="mt-4 flex flex-col gap-3">
          {filters.map((item) => (
            <label key={item.value} className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700">
              <input
                type="radio"
                name="search-filter"
                value={item.value}
                checked={filter === item.value}
                disabled={item.value !== 'ALL' && memberId === null}
                onChange={() => selectFilter(item.value)}
                className="size-4 accent-linkup"
              />
              {item.label}
            </label>
          ))}
        </div>
        {memberId === null && (
          <p className="mt-3 text-xs text-zinc-400">팔로우·구독 필터는 로그인 후 사용할 수 있어요.</p>
        )}
      </aside>
    </div>
  );
}
