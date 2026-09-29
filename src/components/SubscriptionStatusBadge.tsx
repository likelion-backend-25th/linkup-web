export type SubscriptionDisplayStatus = 'active' | 'ending' | 'ended';

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

interface SubscriptionStatusBadgeProps {
  status: SubscriptionDisplayStatus;
  className?: string;
}

export function SubscriptionStatusBadge({ status, className = '' }: SubscriptionStatusBadgeProps) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClassName[status]} ${className}`}
    >
      {statusLabel[status]}
    </span>
  );
}
