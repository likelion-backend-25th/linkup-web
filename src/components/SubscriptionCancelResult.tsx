import { Check } from 'lucide-react';
import { CancelDialogFrame } from '@/components/CancelDialogFrame.tsx';
import type { RefundSubscriptionResponse } from '@/types/subscription.ts';
import { formatDateTime } from '@/utils/formatDateTime.ts';

const DAY_MS = 24 * 60 * 60 * 1000;
const confirmButton =
  'w-full rounded-xl border py-2.5 text-sm font-medium hover:bg-zinc-50';

function remainingDays(endDate: string | null): number | null {
  const end = endDate ? new Date(endDate).getTime() : Number.NaN;
  return Number.isNaN(end) ? null : Math.max(0, Math.ceil((end - Date.now()) / DAY_MS));
}

interface CancelDoneDialogProps {
  endDate: string | null;
  onClose: () => void;
}

export function CancelDoneDialog({ endDate, onClose }: CancelDoneDialogProps) {
  const days = remainingDays(endDate);
  return (
    <CancelDialogFrame
      tone="success"
      icon={<Check className="size-7" aria-hidden />}
      title="구독 해지가 완료되었습니다."
      description={
        days === null ? undefined : (
          <p>
            현재 남은 구독 일수는 <strong>{days}일</strong> 입니다.
          </p>
        )
      }
      onClose={onClose}
    >
      <button type="button" onClick={onClose} className={`${confirmButton} border-zinc-300 text-zinc-700`}>
        확인
      </button>
    </CancelDialogFrame>
  );
}

interface RefundDoneDialogProps {
  refund: RefundSubscriptionResponse;
  onClose: () => void;
}

export function RefundDoneDialog({ refund, onClose }: RefundDoneDialogProps) {
  return (
    <CancelDialogFrame
      tone="success"
      icon={<Check className="size-7" aria-hidden />}
      title="환불 요청이 완료되었습니다."
      description={
        <p>
          결제 금액(<strong>{refund.totalAmount.toLocaleString('ko-KR')}원</strong>)에 대한 환불이
          요청되었습니다.
          <br />
          환불 진행 상황은 결제 내역에서 확인할 수 있습니다.
        </p>
      }
      onClose={onClose}
    >
      {refund.canceledAt && (
        <p className="mb-4 text-center text-xs text-zinc-400">
          환불 처리 일시 {formatDateTime(refund.canceledAt)}
        </p>
      )}
      <button type="button" onClick={onClose} className={`${confirmButton} border-blue-500 text-blue-600`}>
        확인
      </button>
    </CancelDialogFrame>
  );
}
