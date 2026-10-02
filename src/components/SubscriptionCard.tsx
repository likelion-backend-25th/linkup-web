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
  onCancel: (subscription: SubscribeCreatorListResponse) => void;
}

export function SubscriptionCard({
  subscription,
  displayStatus,
  onOpenDetail,
  onCancel,
}: SubscriptionCardProps) {
  const cancelable = displayStatus === 'active';
  const profilePath = `/members/${subscription.creatorId}`;
  const profileState = {
    name: subscription.creatorName,
    uniqueId: subscription.creatorUniqueId,
    profileImage: subscription.profileImage,
    introduction: subscription.introduction,
  };

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-zinc-100 bg-white">
      <div className="relative h-24 bg-linkup-soft">
        <SubscriptionStatusBadge status={displayStatus} className="absolute right-3 top-3" />
        <Link to={profilePath} state={profileState} className="absolute -bottom-7 left-5">
          {subscription.profileImage ? (
            <img
              src={toMediaUrl(subscription.profileImage)}
              alt=""
              onError={(event) => {
                event.currentTarget.src = '/default-avatar.svg';
              }}
              className="size-14 rounded-full border-4 border-white object-cover"
            />
          ) : (
            <img
              src="/default-avatar.svg"
              alt={`${subscription.creatorName} 기본 프로필`}
              className="size-14 rounded-full border-4 border-white object-cover"
            />
          )}
        </Link>
      </div>

      <div className="flex flex-1 flex-col px-5 pb-5 pt-9">
        <Link to={profilePath} state={profileState} className="flex min-w-0 items-center gap-2 text-sm">
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
          <button
            type="button"
            disabled={!cancelable}
            title={cancelable ? undefined : '이미 해지된 구독입니다.'}
            onClick={() => onCancel(subscription)}
            className="rounded-xl border border-zinc-200 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
          >
            구독 해지
          </button>
        </div>
      </div>
    </article>
  );
}
