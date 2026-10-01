import type { CreateSubscriptionResponse } from '@/types/subscription.ts';
import { formatDateTime } from '@/utils/formatDateTime.ts';

interface PaymentReceiptProps {
  payment: CreateSubscriptionResponse;
}

const paymentStatusLabel: Record<string, string> = {
  DONE: '결제 완료',
  READY: '결제 대기',
  IN_PROGRESS: '결제 진행 중',
  WAITING_FOR_DEPOSIT: '입금 대기',
  CANCELED: '결제 취소',
  PARTIAL_CANCELED: '부분 취소',
  ABORTED: '결제 실패',
  EXPIRED: '결제 만료',
};

export function PaymentReceipt({ payment }: PaymentReceiptProps) {
  const status = payment.status?.toUpperCase() ?? null;
  const rows: { label: string; value: string }[] = [
    { label: '주문명', value: payment.orderName ?? '-' },
    { label: '결제 금액', value: `${payment.totalAmount.toLocaleString('ko-KR')}원` },
    { label: '결제 상태', value: status ? (paymentStatusLabel[status] ?? status) : '-' },
    { label: '승인 일시', value: payment.approvedAt ? formatDateTime(payment.approvedAt) : '-' },
  ];

  return (
    <div className="mt-4 rounded-xl bg-zinc-50 p-4">
      <dl className="flex flex-col gap-2 text-sm">
        {rows.map((row) => (
          <div key={row.label} className="flex justify-between gap-4">
            <dt className="shrink-0 text-zinc-400">{row.label}</dt>
            <dd className="min-w-0 truncate text-right font-medium text-zinc-800">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
