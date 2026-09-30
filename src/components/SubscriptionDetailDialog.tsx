import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { fetchSubscriptionDetail } from '@/api/subscriptions.ts';
import { isAbortError, toErrorMessage } from '@/api/http.ts';
import {
  SubscriptionStatusBadge,
  type SubscriptionDisplayStatus,
} from '@/components/SubscriptionStatusBadge.tsx';
import type { SubscriptionDetailResponse } from '@/types/subscription.ts';

interface SubscriptionDetailDialogProps {
  subscriptionId: number;
  accessToken: string;
  onClose: () => void;
}

type DetailState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'success'; detail: SubscriptionDetailResponse };

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

function toDetailStatus(detail: SubscriptionDetailResponse): SubscriptionDisplayStatus {
  if (detail.status === 'ACTIVE') {
    return 'active';
  }
  if (detail.endDate !== null && new Date(detail.endDate).getTime() > Date.now()) {
    return 'ending';
  }
  return 'ended';
}

// 결제 회차 기준: 시작일부터 (종료됐다면 종료일까지) 지난 달 수 + 1
function countSubscribedMonths(detail: SubscriptionDetailResponse): number {
  const start = new Date(detail.startDate);
  const endTime = detail.endDate === null ? Date.now() : Math.min(Date.now(), new Date(detail.endDate).getTime());
  const end = new Date(endTime);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 0;
  }
  let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  if (end.getDate() < start.getDate()) {
    months -= 1;
  }
  return Math.max(months, 0) + 1;
}

export function SubscriptionDetailDialog({
  subscriptionId,
  accessToken,
  onClose,
}: SubscriptionDetailDialogProps) {
  const [state, setState] = useState<DetailState>({ kind: 'loading' });

  useEffect(() => {
    const controller = new AbortController();
    fetchSubscriptionDetail(subscriptionId, accessToken, controller.signal)
      .then((detail) => setState({ kind: 'success', detail }))
      .catch((caught: unknown) => {
        if (!isAbortError(caught)) {
          setState({ kind: 'error', message: toErrorMessage(caught) });
        }
      });
    return () => controller.abort();
  }, [subscriptionId, accessToken]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="subscription-detail-title"
        className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 id="subscription-detail-title" className="text-lg font-bold text-zinc-900">
            구독 상세 정보
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="rounded-full p-1 text-zinc-500 hover:bg-zinc-100"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="mt-4 rounded-xl bg-zinc-50 p-4">
          {state.kind === 'loading' ? (
            <p className="py-6 text-center text-sm text-zinc-400">불러오는 중...</p>
          ) : state.kind === 'error' ? (
            <p className="py-6 text-center text-sm text-red-500">{state.message}</p>
          ) : (
            <DetailList detail={state.detail} />
          )}
        </div>
      </div>
    </div>
  );
}

function DetailList({ detail }: { detail: SubscriptionDetailResponse }) {
  const status = toDetailStatus(detail);
  const isActive = status === 'active';

  return (
    <dl className="grid grid-cols-[auto_1fr] items-center gap-x-5 gap-y-3 text-sm">
      <dt className="text-right text-zinc-400">닉네임</dt>
      <dd className="text-zinc-800">{detail.name}</dd>
      <dt className="text-right text-zinc-400">아이디</dt>
      <dd className="text-zinc-800">@{detail.uniqueId}</dd>
      <dt className="text-right text-zinc-400">이메일</dt>
      <dd className="break-all text-zinc-800">{detail.email}</dd>
      <dt className="text-right text-zinc-400">가격</dt>
      <dd className="text-zinc-800">{detail.price.toLocaleString('ko-KR')}원</dd>
      <dt className="text-right text-zinc-400">구독 개월수</dt>
      <dd className="text-zinc-800">{countSubscribedMonths(detail)} 개월</dd>
      <dt className="text-right text-zinc-400">구독 상태</dt>
      <dd>
        <SubscriptionStatusBadge status={status} />
      </dd>
      <dt className="text-right text-zinc-400">구독 시작일</dt>
      <dd className="text-zinc-800">{formatDate(detail.startDate)}</dd>
      {/* 해지 시 다음 결제일 대신 구독 만료일을 표시한다. */}
      <dt className="text-right text-zinc-400">{isActive ? '다음 결제일' : '구독 만료일'}</dt>
      <dd className="text-zinc-800">
        {formatDate(isActive ? detail.nextBillingAt : detail.endDate)}
      </dd>
    </dl>
  );
}
