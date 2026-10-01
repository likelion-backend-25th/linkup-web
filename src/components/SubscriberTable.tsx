import { Link } from 'react-router';
import { MemberAvatar } from '@/components/MemberAvatar.tsx';
import type { SubscriberResponse } from '@/types/creator.ts';
import { formatDotDate } from '@/utils/formatDateTime.ts';

interface SubscriberTableProps {
  subscribers: SubscriberResponse[];
}

export function SubscriberTable({ subscribers }: SubscriberTableProps) {
  return (
    <table className="w-full table-fixed text-left text-sm">
      <thead className="border-b border-zinc-100 text-xs text-zinc-500">
        <tr>
          <th className="px-4 py-3 font-medium">이름</th>
          <th className="px-4 py-3 font-medium">아이디</th>
          <th className="px-4 py-3 font-medium">구독 시작일</th>
          <th className="px-4 py-3 font-medium">다음 결제일</th>
          <th className="w-32 px-4 py-3" aria-label="관리" />
        </tr>
      </thead>
      <tbody>
        {subscribers.map((subscriber) => (
          <tr key={subscriber.subscriptionId} className="border-b border-zinc-50 last:border-b-0">
            <td className="px-4 py-3">
              <span className="flex min-w-0 items-center gap-2">
                <MemberAvatar
                  name={subscriber.memberName}
                  imageUrl={subscriber.profileImage}
                  size="sm"
                />
                <span className="truncate font-medium text-zinc-900">{subscriber.memberName}</span>
              </span>
            </td>
            <td className="truncate px-4 py-3 text-zinc-600">@{subscriber.memberUniqueId}</td>
            <td className="px-4 py-3 text-zinc-600">{formatDotDate(subscriber.startDate)}</td>
            <td className="px-4 py-3 text-zinc-600">{formatDotDate(subscriber.nextBillingAt)}</td>
            <td className="px-4 py-3 text-right">
              <Link
                to={`/members/${subscriber.memberId}`}
                state={{
                  name: subscriber.memberName,
                  uniqueId: subscriber.memberUniqueId,
                  profileImage: subscriber.profileImage,
                }}
                className="inline-block rounded-xl border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
              >
                프로필 이동
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
