import { useEffect, useRef } from 'react';
import { CreatorStatCard } from '@/components/CreatorStatCard.tsx';
import { SubscriberTable } from '@/components/SubscriberTable.tsx';
import { useRequiredAccessToken } from '@/hooks/useRequiredAccessToken.ts';
import { useSubscribers } from '@/hooks/useSubscribers.ts';
import { useAuthStore } from '@/stores/useAuthStore.ts';
import { isCreatorAccount } from '@/utils/authRole.ts';

const SUBSCRIPTION_PRICE = 4900;

export function CreatorPage() {
  const accessToken = useRequiredAccessToken();
  const profile = useAuthStore((state) => state.profile);
  const isCreator = isCreatorAccount(profile);
  const { subscribers, totalCount, hasNext, loading, error, loadMore } = useSubscribers(
    accessToken,
    isCreator,
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // 크리에이터가 아니면 와이어프레임대로 0 으로 표시한다.
  const subscriberCount = isCreator ? totalCount : 0;
  // 판매 금액 = 현재 구독자 수 × 구독 가격
  const salesAmount = subscriberCount * SUBSCRIPTION_PRICE;

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
  }, [error, hasNext, loadMore, loading, subscribers.length]);

  return (
    <section className="flex h-full min-h-0 flex-col rounded-2xl bg-white px-6 py-5 shadow-sm">
      <header className="shrink-0">
        <h1 className="text-lg font-bold text-zinc-900">크리에이터 페이지</h1>
        <p className="mt-1 text-sm text-zinc-500">나만의 특별한 이야기를 구독으로 공유해보세요</p>
      </header>

      <div className="mt-5 grid shrink-0 grid-cols-1 gap-3 sm:grid-cols-3">
        <CreatorStatCard label="현재 구독자 수" value={`${subscriberCount.toLocaleString('ko-KR')}명`} />
        <CreatorStatCard label="이번 달 판매 금액" value={`${salesAmount.toLocaleString('ko-KR')}원`} />
        {/* 크리에이터 신청 API 연동 전이라 비활성 */}
        <button
          type="button"
          disabled
          title={isCreator ? '이미 크리에이터입니다.' : '준비 중인 기능'}
          className="rounded-2xl border border-zinc-200 px-5 py-4 text-sm font-semibold text-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          크리에이터 신청하기
          <span className="mt-1 block text-xs font-normal text-zinc-500">조건: 팔로워 10명</span>
        </button>
      </div>

      <div className="mt-6 flex shrink-0 items-baseline gap-2">
        <h2 className="text-base font-semibold text-zinc-900">구독자 목록</h2>
        <span className="text-xs text-zinc-500">총 {subscriberCount.toLocaleString('ko-KR')}명</span>
      </div>

      <div
        ref={scrollRef}
        className="mt-3 min-h-0 flex-1 overflow-y-auto rounded-2xl border border-zinc-200"
      >
        {!isCreator ? (
          <p className="py-10 text-center text-sm text-zinc-400">
            크리에이터 권한이 있어야 구독자 목록을 볼 수 있습니다.
          </p>
        ) : loading && subscribers.length === 0 ? (
          <p className="py-10 text-center text-sm text-zinc-400">구독자 목록을 불러오는 중...</p>
        ) : error && subscribers.length === 0 ? (
          <p className="py-10 text-center text-sm text-red-500">{error}</p>
        ) : subscribers.length === 0 ? (
          <p className="py-10 text-center text-sm text-zinc-400">아직 구독자가 없습니다.</p>
        ) : (
          <SubscriberTable subscribers={subscribers} />
        )}

        <div ref={sentinelRef} className="h-4" />
        {loading && subscribers.length > 0 && (
          <p className="py-3 text-center text-xs text-zinc-400">더 불러오는 중...</p>
        )}
        {error && subscribers.length > 0 && (
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
