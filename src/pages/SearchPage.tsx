import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Search } from 'lucide-react';
import { Link } from 'react-router';
import { isAbortError, toErrorMessage } from '@/api/http.ts';
import { searchMembers } from '@/api/search.ts';
import { MemberAvatar } from '@/components/MemberAvatar.tsx';
import { useAuthStore } from '@/stores/useAuthStore.ts';
import type { MemberSearchFilter, MemberSearchItem } from '@/types/search.ts';

const filters: { value: MemberSearchFilter; label: string }[] = [
  { value: 'ALL', label: '모든 사용자' },
  { value: 'FOLLOWING', label: '팔로우 사용자' },
  { value: 'SUBSCRIBING', label: '구독 사용자' },
];

export function SearchPage() {
  const memberId = useAuthStore((state) => state.profile?.id ?? null);
  const controllerRef = useRef<AbortController | null>(null);
  const [query, setQuery] = useState('');
  const [keyword, setKeyword] = useState('');
  const [filter, setFilter] = useState<MemberSearchFilter>('ALL');
  const [members, setMembers] = useState<MemberSearchItem[]>([]);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => controllerRef.current?.abort();
  }, []);

  async function runSearch(
    nextKeyword: string,
    nextFilter: MemberSearchFilter,
    cursor: number | null,
    append: boolean,
  ) {
    const trimmed = nextKeyword.trim();
    if (trimmed === '') {
      setMembers([]);
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
      const response = await searchMembers(
        trimmed,
        nextFilter,
        memberId,
        cursor,
        controller.signal,
      );
      setMembers((current) => (append ? [...current, ...response.content] : response.content));
      setKeyword(trimmed);
      setNextCursor(response.nextCursor);
      setHasNext(response.hasNext);
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
    void runSearch(query, filter, null, false);
  }

  function selectFilter(nextFilter: MemberSearchFilter) {
    setFilter(nextFilter);
    if (keyword !== '') {
      void runSearch(keyword, nextFilter, null, false);
    }
  }

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
            placeholder="이름 또는 아이디 검색"
            aria-label="검색 키워드"
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-3 pr-20 pl-11 text-sm outline-none focus:border-linkup focus:bg-white"
          />
          <button
            type="submit"
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded-lg bg-linkup px-3 py-1.5 text-xs font-semibold text-white"
          >
            검색
          </button>
        </form>

        <div className="mt-4 border-b border-zinc-100">
          <span className="inline-block border-b-2 border-linkup px-1 py-3 text-sm font-semibold text-linkup">
            사용자
          </span>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {keyword === '' && !loading && (
            <p className="py-10 text-center text-sm text-zinc-400">
              이름이나 회원 아이디를 검색해 주세요.
            </p>
          )}
          {loading && members.length === 0 && (
            <p className="py-10 text-center text-sm text-zinc-400">검색 중...</p>
          )}
          {error && members.length === 0 && (
            <p className="py-10 text-center text-sm text-red-500">{error}</p>
          )}
          {!loading && !error && keyword !== '' && members.length === 0 && (
            <p className="py-10 text-center text-sm text-zinc-400">검색 결과가 없습니다.</p>
          )}

          {members.length > 0 && (
            <ul className="divide-y divide-zinc-100">
              {members.map((member) => (
                <li key={member.id}>
                  <Link
                    to={`/members/${member.id}`}
                    state={{
                      name: member.name,
                      uniqueId: member.uniqueId,
                      profileImage: member.profileImage,
                    }}
                    className="flex items-center gap-3 px-2 py-4 hover:bg-zinc-50"
                  >
                    <MemberAvatar name={member.name} imageUrl={member.profileImage} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-zinc-900">{member.name}</p>
                      <p className="truncate text-xs text-zinc-400">@{member.uniqueId}</p>
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
              onClick={() => void runSearch(keyword, filter, nextCursor, true)}
              className="mx-auto my-4 block rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 disabled:opacity-50"
            >
              {loading ? '불러오는 중...' : '더 보기'}
            </button>
          )}
          {error && members.length > 0 && (
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
                name="member-filter"
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
