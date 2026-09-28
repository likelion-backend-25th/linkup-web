import { Link } from 'react-router';
import type { SubscribeCreatorListResponse } from '@/types/subscription.ts';

export type SubscriptionDisplayStatus = 'active' | 'ending' | 'ended';

interface SubscriptionCardProps {
  subscription: SubscribeCreatorListResponse;
  displayStatus: SubscriptionDisplayStatus;
}

const statusLabel: Record<SubscriptionDisplayStatus, string> = {
  active: '구독 중',
  ending: '종료 예정',
  ended: '종료',
};

const statusClassName: Record<SubscriptionDisplayStatus, string> = {
  active: 'bg-linkup text-white',
  ending: 'bg-amber-100 text-amber-700',
  ended: 'bg-zinc-100 text-zinc-500',
};

function formatDate(value: string | null): string {
  if (value === null) {
    return '-';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'long' }).format(date);
}

export function SubscriptionCard({ subscription, displayStatus }: SubscriptionCardProps) {
  const profilePath = `/profile/${subscription.creatorId}`;
  const isActive = displayStatus === 'active';

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-zinc-100 bg-white">
      <div className="relative h-24 bg-linkup-soft">
        <span
          className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-xs font-medium ${statusClassName[displayStatus]}`}
        >
          {statusLabel[displayStatus]}
        </span>
        <Link to={profilePath} className="absolute -bottom-7 left-5">
          {subscription.profileImage ? (
            <img
              src={subscription.profileImage}
              alt=""
              className="size-14 rounded-full border-4 border-white object-cover"
            />
          ) : (
            <span className="flex size-14 items-center justify-center rounded-full border-4 border-white bg-white text-lg font-semibold text-linkup">
              {subscription.creatorName.slice(0, 1)}
            </span>
          )}
        </Link>
      </div>

      <div className="flex flex-1 flex-col px-5 pb-5 pt-9">
        <Link to={profilePath} className="flex min-w-0 items-center gap-2 text-sm">
          <span className="truncate font-semibold text-zinc-900">{subscription.creatorName}</span>
          <span className="truncate text-zinc-400">@{subscription.creatorUniqueId}</span>
        </Link>
        <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-relaxed text-zinc-600">
          {subscription.introduction ?? '소개가 없습니다.'}
        </p>

        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
          <dt className="text-zinc-400">구독 시작</dt>
          <dd className="text-zinc-700">{formatDate(subscription.startDate)}</dd>
          <dt className="text-zinc-400">{isActive ? '다음 결제일' : '종료일'}</dt>
          <dd className="text-zinc-700">
            {formatDate(isActive ? subscription.nextBillingAt : subscription.endDate)}
          </dd>
        </dl>

        {/* 결제 내역 / 구독 해지 API 가 아직 없어 비활성화 */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled
            title="준비 중인 기능"
            className="rounded-xl border border-zinc-200 py-2 text-xs font-medium text-zinc-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            결제 내역
          </button>
          <button
            type="button"
            disabled
            title="준비 중인 기능"
            className="rounded-xl border border-zinc-200 py-2 text-xs font-medium text-zinc-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            구독 해지
          </button>
        </div>
      </div>
    </article>
  );
}
