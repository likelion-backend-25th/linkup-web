import { useEffect, useRef, useState } from 'react';
import { toErrorMessage } from '@/api/http.ts';
import { AlertDialog } from '@/components/AlertDialog.tsx';
import { CreatorStatCard } from '@/components/CreatorStatCard.tsx';
import { SubscriberTable } from '@/components/SubscriberTable.tsx';
import { CREATOR_MIN_FOLLOWERS, useCreatorStatus } from '@/hooks/useCreatorStatus.ts';
import { useRequiredAccessToken } from '@/hooks/useRequiredAccessToken.ts';
import { useSubscribers } from '@/hooks/useSubscribers.ts';

const SUBSCRIPTION_PRICE = 4900;

interface ApplyDialog {
  title: string;
  message: string;
}

export function CreatorPage() {
  const accessToken = useRequiredAccessToken();
  const { status, error: statusError, applying, apply } = useCreatorStatus(accessToken);
  const isCreator = status?.isCreator ?? false;
  const followerCount = status?.followerCount ?? 0;
  const canApply = status !== null && !isCreator && followerCount >= CREATOR_MIN_FOLLOWERS;
  const [applyDialog, setApplyDialog] = useState<ApplyDialog | null>(null);
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

  const handleApply = async () => {
    try {
      const approved = await apply();
      setApplyDialog(
        approved
          ? { title: '크리에이터 승인 완료', message: '크리에이터가 되었습니다! 이제 구독자를 받을 수 있어요.' }
          : { title: '크리에이터 신청 실패', message: `팔로워 ${CREATOR_MIN_FOLLOWERS}명 이상이어야 신청할 수 있습니다.` },
      );
    } catch (caught: unknown) {
      setApplyDialog({ title: '크리에이터 신청 실패', message: toErrorMessage(caught) });
    }
  };

  const applyLabel = isCreator
    ? '이미 크리에이터입니다'
    : applying
      ? '신청 중...'
      : '크리에이터 신청하기';
  const applyHint =
    status === null
      ? statusError ?? '정보를 불러오는 중...'
      : `조건: 팔로워 ${CREATOR_MIN_FOLLOWERS}명 (현재 ${followerCount.toLocaleString('ko-KR')}명)`;

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
        <button
          type="button"
          disabled={!canApply || applying}
          onClick={() => void handleApply()}
          className="rounded-2xl border border-zinc-200 px-5 py-4 text-sm font-semibold text-zinc-700 enabled:border-linkup enabled:text-linkup enabled:hover:bg-linkup/5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {applyLabel}
          {!isCreator && (
            <span className="mt-1 block text-xs font-normal text-zinc-500">{applyHint}</span>
          )}
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
        {status === null ? (
          <p className="py-10 text-center text-sm text-zinc-400">
            {statusError ?? '정보를 불러오는 중...'}
          </p>
        ) : !isCreator ? (
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

      {applyDialog && (
        <AlertDialog
          title={applyDialog.title}
          message={applyDialog.message}
          onClose={() => setApplyDialog(null)}
        />
      )}
    </section>
  );
}
