import { useEffect, useRef } from 'react';
import {
  SubscriptionCard,
  type SubscriptionDisplayStatus,
} from '@/components/SubscriptionCard.tsx';
import { useSubscriptions } from '@/hooks/useSubscriptions.ts';
import { useAuthStore } from '@/stores/useAuthStore.ts';
import type { SubscribeCreatorListResponse } from '@/types/subscription.ts';

// TODO: 로그인 API 완성 후 제거하고 비로그인 시 /login 으로 리다이렉트한다.
const FALLBACK_MEMBER_ID = 1;

// 해지(CANCELLED)여도 종료일 전까지는 혜택이 유지되므로 '종료 예정'으로 구분한다.
function toDisplayStatus(item: SubscribeCreatorListResponse): SubscriptionDisplayStatus {
  if (item.status === 'ACTIVE') {
    return 'active';
  }
  if (item.endDate !== null && new Date(item.endDate).getTime() > Date.now()) {
    return 'ending';
  }
  return 'ended';
}

export function SubscriptionsPage() {
  const memberId = useAuthStore((state) => state.profile?.id ?? FALLBACK_MEMBER_ID);
  const accessToken = useAuthStore((state) => state.accessToken);
  const { subscriptions, hasNext, loading, error, loadMore } = useSubscriptions(
    memberId,
    accessToken,
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // 하단 sentinel 이 보이면 다음 페이지를 요청한다. 에러 시 자동 재시도하지 않는다.
  useEffect(() => {
    const root = scrollRef.current;
    const sentinel = sentinelRef.current;
    if (!root || !sentinel || !hasNext || loading || error) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void loadMore();
        }
      },
      { root, rootMargin: '200px 0px' },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [error, hasNext, loadMore, loading, subscriptions.length]);

  const items = subscriptions.map((item) => ({ item, status: toDisplayStatus(item) }));
  const activeCount = items.filter(({ status }) => status === 'active').length;
  const endingCount = items.filter(({ status }) => status === 'ending').length;
  const countSuffix = hasNext ? '+' : '';

  return (
    <section className="flex h-full min-h-0 flex-col rounded-2xl bg-white px-5 py-4 shadow-sm">
      <header className="shrink-0 border-b border-zinc-100 pb-4">
        <h1 className="text-lg font-bold text-zinc-900">내가 구독한 크리에이터</h1>
        <p className="mt-1 text-sm text-zinc-500">
          구독 중{' '}
          <span className="font-semibold text-linkup">
            {activeCount}
            {countSuffix}
          </span>
          <span className="mx-2 text-zinc-300">·</span>
          종료 예정{' '}
          <span className="font-semibold text-zinc-700">
            {endingCount}
            {countSuffix}
          </span>
        </p>
      </header>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto pt-4">
        {loading && items.length === 0 ? (
          <p className="py-8 text-sm text-zinc-400">구독 목록을 불러오는 중...</p>
        ) : error && items.length === 0 ? (
          <p className="py-8 text-sm text-red-500">{error}</p>
        ) : items.length === 0 ? (
          <p className="py-8 text-sm text-zinc-400">구독 중인 크리에이터가 없습니다.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {items.map(({ item, status }) => (
              <li key={item.subscriptionId}>
                <SubscriptionCard subscription={item} displayStatus={status} />
              </li>
            ))}
          </ul>
        )}

        <div ref={sentinelRef} className="h-8" />
        {loading && items.length > 0 && (
          <p className="py-3 text-center text-xs text-zinc-400">더 불러오는 중...</p>
        )}
        {error && items.length > 0 && (
          <div className="flex items-center justify-center gap-2 py-3 text-xs">
            <span className="text-red-500">{error}</span>
            <button
              type="button"
              onClick={() => void loadMore()}
              className="rounded-full bg-zinc-100 px-3 py-1 font-medium text-zinc-600 hover:bg-zinc-200"
            >
              다시 시도
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
