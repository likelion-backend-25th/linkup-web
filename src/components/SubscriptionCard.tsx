import { Link } from 'react-router';
import {
  SubscriptionStatusBadge,
  type SubscriptionDisplayStatus,
} from '@/components/SubscriptionStatusBadge.tsx';
import type { SubscribeCreatorListResponse } from '@/types/subscription.ts';
import { toMediaUrl } from '@/utils/mediaUrl.ts';

interface SubscriptionCardProps {
  subscription: SubscribeCreatorListResponse;
  displayStatus: SubscriptionDisplayStatus;
  onOpenDetail: (subscriptionId: number) => void;
}

export function SubscriptionCard({
  subscription,
  displayStatus,
  onOpenDetail,
}: SubscriptionCardProps) {
  const profilePath = `/profile/${subscription.creatorId}`;

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-zinc-100 bg-white">
      <div className="relative h-24 bg-linkup-soft">
        <SubscriptionStatusBadge status={displayStatus} className="absolute right-3 top-3" />
        <Link to={profilePath} className="absolute -bottom-7 left-5">
          {subscription.profileImage ? (
            <img
              src={toMediaUrl(subscription.profileImage)}
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

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onOpenDetail(subscription.subscriptionId)}
            className="rounded-xl border border-zinc-200 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
          >
            상세 내역
          </button>
          {/* 구독 해지 API 가 아직 없어 비활성화 */}
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
