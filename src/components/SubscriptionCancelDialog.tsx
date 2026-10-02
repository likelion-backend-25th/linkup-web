import { useEffect, useState } from 'react';
import { LoaderCircle, RotateCcw } from 'lucide-react';
import { isAbortError, toErrorMessage } from '@/api/http.ts';
import {
  cancelSubscription,
  fetchCancelBillingDate,
  fetchSubscriptionDetail,
  refundSubscription,
} from '@/api/subscriptions.ts';
import { CancelDialogFrame } from '@/components/CancelDialogFrame.tsx';
import { CancelDoneDialog, RefundDoneDialog } from '@/components/SubscriptionCancelResult.tsx';
import type { RefundSubscriptionResponse } from '@/types/subscription.ts';

interface SubscriptionCancelDialogProps {
  subscriptionId: number;
  accessToken: string;
  onClose: () => void;
  /** 해지 성공 시 CANCELED, 환불 성공 시 REMOVED */
  onStatusChange: (subscriptionId: number, status: string) => void;
}

type Step =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'refund'; price: number; submitting: boolean; error: string | null }
  | { kind: 'confirm'; nextBillingAt: string | null; submitting: boolean; error: string | null }
  | { kind: 'cancelDone'; endDate: string | null }
  | { kind: 'refundDone'; refund: RefundSubscriptionResponse };

const DAY_MS = 24 * 60 * 60 * 1000;
const outlineButton =
  'rounded-xl border py-2.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50';
const cancelButton = `${outlineButton} border-zinc-300 text-zinc-700 hover:bg-zinc-50`;
const exclamation = (
  <span className="text-2xl font-bold leading-none" aria-hidden>
    !
  </span>
);

function formatDot(value: string | null): string | null {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) {
    return null;
  }
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`;
}

export function SubscriptionCancelDialog({
  subscriptionId,
  accessToken,
  onClose,
  onStatusChange,
}: SubscriptionCancelDialogProps) {
  const [step, setStep] = useState<Step>({ kind: 'loading' });

  // 최근 결제일 기준 24시간 이내면 환불, 이후면 해지 흐름. 금액·다음 결제일은 상세 조회로 채운다.
  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      fetchCancelBillingDate(subscriptionId, accessToken, controller.signal),
      fetchSubscriptionDetail(subscriptionId, accessToken, controller.signal),
    ])
      .then(([{ billingDate }, detail]) => {
        const elapsed = Date.now() - new Date(billingDate).getTime();
        setStep(
          elapsed < DAY_MS
            ? { kind: 'refund', price: detail.price, submitting: false, error: null }
            : { kind: 'confirm', nextBillingAt: detail.nextBillingAt, submitting: false, error: null },
        );
      })
      .catch((caught: unknown) => {
        if (!isAbortError(caught)) {
          setStep({ kind: 'error', message: toErrorMessage(caught) });
        }
      });
    return () => controller.abort();
  }, [subscriptionId, accessToken]);

  async function submitCancel(nextBillingAt: string | null) {
    setStep({ kind: 'confirm', nextBillingAt, submitting: true, error: null });
    try {
      const { endDate } = await cancelSubscription(subscriptionId, accessToken);
      onStatusChange(subscriptionId, 'CANCELED');
      // 해지 시 end_date = next_billing_at 이므로 응답이 비면 다음 결제일로 남은 일수를 계산한다.
      setStep({ kind: 'cancelDone', endDate: endDate ?? nextBillingAt });
    } catch (caught: unknown) {
      setStep({ kind: 'confirm', nextBillingAt, submitting: false, error: toErrorMessage(caught) });
    }
  }

  async function submitRefund(price: number) {
    setStep({ kind: 'refund', price, submitting: true, error: null });
    try {
      const refund = await refundSubscription(subscriptionId, accessToken);
      onStatusChange(subscriptionId, 'REMOVED');
      setStep({ kind: 'refundDone', refund });
    } catch (caught: unknown) {
      setStep({ kind: 'refund', price, submitting: false, error: toErrorMessage(caught) });
    }
  }

  switch (step.kind) {
    case 'loading':
      return (
        <CancelDialogFrame
          tone="neutral"
          icon={<LoaderCircle className="size-7 animate-spin" aria-hidden />}
          title="구독 정보를 확인하는 중..."
          onClose={onClose}
        />
      );
    case 'error':
      return (
        <CancelDialogFrame
          tone="danger"
          icon={exclamation}
          title="구독 정보를 불러오지 못했습니다."
          description={step.message}
          onClose={onClose}
        />
      );
    case 'refund':
      return (
        <CancelDialogFrame
          tone="info"
          icon={<RotateCcw className="size-7" aria-hidden />}
          title="결제 금액을 환불하시겠습니까?"
          busy={step.submitting}
          description={
            <p>
              이번 결제 건(<strong>{step.price.toLocaleString('ko-KR')}원</strong>)에 대해 환불을
              요청합니다.
              <br />
              환불은 토스페이먼츠를 통해 진행되며, 처리에는 시간이 소요될 수 있습니다.
            </p>
          }
          onClose={onClose}
        >
          {step.error && <p className="mb-3 text-center text-sm text-red-500">{step.error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={onClose} disabled={step.submitting} className={cancelButton}>
              취소
            </button>
            <button
              type="button"
              onClick={() => void submitRefund(step.price)}
              disabled={step.submitting}
              className={`${outlineButton} border-blue-500 text-blue-600 hover:bg-blue-50`}
            >
              {step.submitting ? '환불 요청 중...' : '환불 요청하기'}
            </button>
          </div>
        </CancelDialogFrame>
      );
    case 'confirm': {
      const nextDate = formatDot(step.nextBillingAt);
      return (
        <CancelDialogFrame
          tone="danger"
          icon={exclamation}
          title="구독을 해지하시겠습니까?"
          busy={step.submitting}
          description={
            <p>
              구독을 해지하면{' '}
              {nextDate ? <>다음 결제일(<strong>{nextDate}</strong>)부터</> : '다음 결제일부터'} 자동
              결제가 중지되며, 구독 혜택을 더 이상 이용할 수 없습니다.
            </p>
          }
          onClose={onClose}
        >
          {step.error && <p className="mb-3 text-center text-sm text-red-500">{step.error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={onClose} disabled={step.submitting} className={cancelButton}>
              취소
            </button>
            <button
              type="button"
              onClick={() => void submitCancel(step.nextBillingAt)}
              disabled={step.submitting}
              className={`${outlineButton} border-red-500 text-red-500 hover:bg-red-50`}
            >
              {step.submitting ? '해지 중...' : '구독 해지하기'}
            </button>
          </div>
        </CancelDialogFrame>
      );
    }
    case 'cancelDone':
      return <CancelDoneDialog endDate={step.endDate} onClose={onClose} />;
    case 'refundDone':
      return <RefundDoneDialog refund={step.refund} onClose={onClose} />;
  }
}
