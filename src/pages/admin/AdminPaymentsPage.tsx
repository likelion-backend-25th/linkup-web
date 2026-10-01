import { ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { fetchAdminPayment, fetchAdminPayments } from '@/api/admin.ts';
import { isAbortError, toErrorMessage } from '@/api/http.ts';
import { AdminDetailPane } from '@/components/AdminDetailPane.tsx';
import type { AdminPaymentDetailResponse, AdminPaymentResponse } from '@/types/admin.ts';
import { formatDateTime } from '@/utils/formatDateTime.ts';

const PAGE_SIZE = 20;

interface PaymentQuery {
  keyword: string;
  paymentStatus: string;
  startDate: string;
  endDate: string;
}

const emptyQuery: PaymentQuery = {
  keyword: '',
  paymentStatus: '',
  startDate: '',
  endDate: '',
};

const paymentStatusLabel: Record<string, string> = {
  PAID: '결제 완료',
  FAILED: '결제 실패',
  CANCELLED: '결제 환불',
};

const subStatusLabel: Record<string, string> = {
  ACTIVE: '구독 중',
  CANCELED: '구독 취소',
};

function paymentLabel(status: string): string {
  return paymentStatusLabel[status] ?? status;
}

function subscriptionLabel(status: string): string {
  return subStatusLabel[status] ?? status;
}

function paymentStatusClass(status: string): string {
  if (status === 'PAID') {
    return 'bg-emerald-600 text-white';
  }
  if (status === 'FAILED') {
    return 'bg-red-600 text-white';
  }
  if (status === 'CANCELLED') {
    return 'bg-zinc-700 text-white';
  }
  return 'bg-zinc-700 text-white';
}

function formatAmount(amount: number): string {
  return `${amount.toLocaleString('ko-KR')}원`;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const periodPresets = [
  { id: '1d', label: '1일' },
  { id: '1w', label: '1주' },
  { id: '1m', label: '1개월' },
  { id: '3m', label: '3개월' },
] as const;

type PeriodPresetId = (typeof periodPresets)[number]['id'];

function formatIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function isIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) {
    return false;
  }
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function presetRange(preset: PeriodPresetId): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  if (preset === '1w') {
    start.setDate(start.getDate() - 6);
  } else if (preset === '1m') {
    start.setMonth(start.getMonth() - 1);
  } else if (preset === '3m') {
    start.setMonth(start.getMonth() - 3);
  }
  return { startDate: formatIsoDate(start), endDate: formatIsoDate(end) };
}

function activePreset(startDate: string, endDate: string): 'all' | PeriodPresetId | '' {
  if (!startDate && !endDate) {
    return 'all';
  }
  const matched = periodPresets.find((preset) => {
    const range = presetRange(preset.id);
    return range.startDate === startDate && range.endDate === endDate;
  });
  return matched?.id ?? '';
}

function periodLabel(startDate: string, endDate: string): string {
  const preset = activePreset(startDate, endDate);
  if (preset === 'all') {
    return '전체기간';
  }
  const presetLabel = periodPresets.find((item) => item.id === preset)?.label;
  if (presetLabel) {
    return presetLabel;
  }
  if (startDate && endDate) {
    return `${startDate} ~ ${endDate}`;
  }
  return startDate ? `${startDate} ~` : `~ ${endDate}`;
}

function PaymentPeriodPicker({
  startDate,
  endDate,
  onApply,
}: {
  startDate: string;
  endDate: string;
  onApply: (startDate: string, endDate: string) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [rangeStart, setRangeStart] = useState(startDate);
  const [rangeEnd, setRangeEnd] = useState(endDate);
  const [rangeError, setRangeError] = useState<string | null>(null);
  const selected = activePreset(startDate, endDate);

  useEffect(() => {
    if (!open) {
      return;
    }
    function closeOnOutside(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', closeOnOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  function openPanel() {
    setRangeStart(startDate);
    setRangeEnd(endDate);
    setRangeError(null);
    setOpen(true);
  }

  function applyRange(nextStart: string, nextEnd: string) {
    onApply(nextStart, nextEnd);
    setOpen(false);
  }

  function applyCustom() {
    const nextStart = rangeStart.trim();
    const nextEnd = rangeEnd.trim();
    if ((nextStart && !isIsoDate(nextStart)) || (nextEnd && !isIsoDate(nextEnd))) {
      setRangeError('날짜는 yyyy-mm-dd 형식이어야 합니다.');
      return;
    }
    if (nextStart && nextEnd && nextStart > nextEnd) {
      setRangeError('시작일이 종료일보다 늦습니다.');
      return;
    }
    applyRange(nextStart, nextEnd);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label="결제 기간"
        aria-expanded={open}
        onClick={() => (open ? setOpen(false) : openPanel())}
        className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 py-2 pr-2 pl-3 text-sm outline-none focus:border-linkup"
      >
        {periodLabel(startDate, endDate)}
        <ChevronDown className="size-4 text-zinc-500" />
      </button>
      {open && (
        <div className="absolute top-full right-0 z-20 mt-1 w-[22rem] rounded-xl border border-zinc-200 bg-white py-2 shadow-lg">
          <button
            type="button"
            onClick={() => applyRange('', '')}
            className={`block w-full px-4 py-2 text-left text-sm hover:bg-zinc-50 ${selected === 'all' ? 'font-medium text-linkup' : 'text-zinc-800'}`}
          >
            전체기간
          </button>
          {periodPresets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => {
                const range = presetRange(preset.id);
                applyRange(range.startDate, range.endDate);
              }}
              className={`block w-full px-4 py-2 text-left text-sm hover:bg-zinc-50 ${selected === preset.id ? 'font-medium text-linkup' : 'text-zinc-800'}`}
            >
              {preset.label}
            </button>
          ))}
          <p className="px-4 pt-2 pb-2 text-xs text-zinc-400">기간 입력</p>
          <div className="flex items-center gap-2 px-4 pb-2">
            <input
              value={rangeStart}
              onChange={(event) => setRangeStart(event.target.value)}
              placeholder="시작일"
              aria-label="시작일"
              inputMode="numeric"
              className="min-w-0 flex-1 rounded-lg border border-zinc-200 px-2 py-1.5 text-sm text-zinc-800 outline-none focus:border-linkup"
            />
            <input
              value={rangeEnd}
              onChange={(event) => setRangeEnd(event.target.value)}
              placeholder="종료일"
              aria-label="종료일"
              inputMode="numeric"
              className="min-w-0 flex-1 rounded-lg border border-zinc-200 px-2 py-1.5 text-sm text-zinc-800 outline-none focus:border-linkup"
            />
            <button
              type="button"
              onClick={applyCustom}
              className="shrink-0 rounded-lg bg-zinc-100 px-3 py-1.5 text-sm text-zinc-700"
            >
              설정
            </button>
          </div>
          {rangeError && <p className="px-4 pb-1 text-xs text-red-500">{rangeError}</p>}
        </div>
      )}
    </div>
  );
}

function displayText(value: string | null): string {
  return value === null || value === '' ? '-' : value;
}

function displayDate(value: string | null): string {
  return value ? formatDateTime(value) : '-';
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${paymentStatusClass(status)}`}
    >
      {paymentLabel(status)}
    </span>
  );
}

export function AdminPaymentsPage() {
  const [draft, setDraft] = useState<PaymentQuery>(emptyQuery);
  const [query, setQuery] = useState<PaymentQuery>(emptyQuery);
  const [page, setPage] = useState(1);
  const [payments, setPayments] = useState<AdminPaymentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<AdminPaymentDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setPayments([]);

    fetchAdminPayments(
      {
        keyword: query.keyword || undefined,
        paymentStatus: query.paymentStatus || undefined,
        startDate: query.startDate || undefined,
        endDate: query.endDate || undefined,
        page,
        size: PAGE_SIZE,
      },
      controller.signal,
    )
      .then((data) => setPayments(data))
      .catch((caught: unknown) => {
        if (!isAbortError(caught)) {
          setError(toErrorMessage(caught));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [page, query]);

  useEffect(() => {
    if (selectedId === null) {
      setDetail(null);
      setDetailError(null);
      setDetailLoading(false);
      return;
    }

    const controller = new AbortController();
    setDetailLoading(true);
    setDetailError(null);

    fetchAdminPayment(selectedId, controller.signal)
      .then((data) => setDetail(data))
      .catch((caught: unknown) => {
        if (!isAbortError(caught)) {
          setDetail(null);
          setDetailError(toErrorMessage(caught));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setDetailLoading(false);
        }
      });

    return () => controller.abort();
  }, [selectedId]);

  function applyQuery(next: PaymentQuery) {
    setDraft(next);
    setPage(1);
    setQuery(next);
    setSelectedId(null);
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    applyQuery(draft);
  }

  const hasNext = payments.length === PAGE_SIZE;

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl bg-white shadow-sm">
      <header className="relative z-10 shrink-0 border-b border-zinc-100 px-5 py-4">
        <h1 className="text-lg font-bold text-zinc-900">결제 관리</h1>
        <form onSubmit={submitSearch} className="mt-4 flex flex-wrap items-center gap-2">
          <input
            type="search"
            value={draft.keyword}
            onChange={(event) => setDraft((current) => ({ ...current, keyword: event.target.value }))}
            placeholder="구매자 닉네임 또는 사용자 ID 검색"
            aria-label="결제 검색"
            className="min-w-40 flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-linkup"
          />
          <select
            value={draft.paymentStatus}
            onChange={(event) => applyQuery({ ...draft, paymentStatus: event.target.value })}
            aria-label="결제 상태"
            className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-linkup"
          >
            <option value="">결제 상태 전체</option>
            <option value="PAID">결제 완료</option>
            <option value="FAILED">결제 실패</option>
            <option value="CANCELLED">결제 환불</option>
          </select>
          <PaymentPeriodPicker
            startDate={draft.startDate}
            endDate={draft.endDate}
            onApply={(startDate, endDate) => applyQuery({ ...draft, startDate, endDate })}
          />
          <button
            type="submit"
            className="rounded-xl bg-linkup px-3 py-2 text-sm font-medium text-white"
          >
            검색
          </button>
        </form>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col border-b border-zinc-100 lg:border-b-0">
          <div className="linkup-scrollbar min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
            {loading && payments.length === 0 ? (
              <p className="px-5 py-8 text-sm text-zinc-400">결제 목록을 불러오는 중...</p>
            ) : error && payments.length === 0 ? (
              <p className="px-5 py-8 text-sm text-red-500">{error}</p>
            ) : payments.length === 0 ? (
              <p className="px-5 py-8 text-sm text-zinc-400">조회된 결제 내역이 없습니다.</p>
            ) : (
              <table className="w-full table-fixed text-left text-sm">
                <thead className="sticky top-0 bg-white text-xs text-zinc-400">
                  <tr className="border-b border-zinc-100">
                    <th className="w-56 py-3 pl-6 pr-4 font-medium">결제일</th>
                    <th className="px-4 py-3 font-medium">판매자</th>
                    <th className="px-4 py-3 font-medium">구매자</th>
                    <th className="px-4 py-3 font-medium">구매자 ID</th>
                    <th className="w-24 whitespace-nowrap px-4 py-3 font-medium">결제 금액</th>
                    <th className="w-28 whitespace-nowrap py-3 pl-4 pr-5 font-medium">결제 상태</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => {
                    const selected = payment.paymentId === selectedId;
                    return (
                      <tr
                        key={payment.paymentId}
                        onClick={() => setSelectedId(payment.paymentId)}
                        className={
                          selected ? 'cursor-pointer bg-linkup-soft' : 'cursor-pointer hover:bg-zinc-50'
                        }
                      >
                        <td className="whitespace-nowrap py-3 pl-6 pr-4 text-zinc-700">
                          {formatDateTime(payment.paymentDate)}
                        </td>
                        <td className="truncate px-4 py-3 text-zinc-900">{payment.sellerNickname}</td>
                        <td className="truncate px-4 py-3 text-zinc-700">{payment.buyerNickname}</td>
                        <td className="truncate px-4 py-3 text-zinc-700">@{payment.buyerId}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-zinc-700">
                          {formatAmount(payment.amount)}
                        </td>
                        <td className="whitespace-nowrap py-3 pl-4 pr-5">
                          <StatusBadge status={payment.paymentStatus} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-zinc-100 px-4 py-3">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((current) => current - 1)}
              className="rounded-xl border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 disabled:opacity-60"
            >
              이전
            </button>
            <span className="text-sm text-zinc-500">{page}</span>
            <button
              type="button"
              disabled={!hasNext || loading}
              onClick={() => setPage((current) => current + 1)}
              className="rounded-xl border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 disabled:opacity-60"
            >
              다음
            </button>
          </div>
        </div>

        <AdminDetailPane label="결제 상세">
          <h2 className="text-base font-semibold text-zinc-900">결제 상세</h2>
          {selectedId === null ? (
            <p className="mt-4 text-sm text-zinc-400">목록에서 결제를 선택해주세요.</p>
          ) : detailLoading ? (
            <p className="mt-4 text-sm text-zinc-400">상세를 불러오는 중...</p>
          ) : detailError ? (
            <p className="mt-4 text-sm text-red-500">{detailError}</p>
          ) : detail ? (
            <PaymentDetail detail={detail} />
          ) : null}
        </AdminDetailPane>
      </div>
    </section>
  );
}

function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-5">
      <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 text-sm">{children}</dl>
    </section>
  );
}

function PaymentDetail({ detail }: { detail: AdminPaymentDetailResponse }) {
  return (
    <div>
      <DetailSection title="결제 정보">
        <dt className="text-zinc-400">결제 번호</dt>
        <dd className="text-zinc-800">{detail.paymentId}</dd>
        <dt className="text-zinc-400">결제 일시</dt>
        <dd className="text-zinc-800">{displayDate(detail.paymentDate)}</dd>
        <dt className="text-zinc-400">결제 금액</dt>
        <dd className="text-zinc-800">{formatAmount(detail.amount)}</dd>
        <dt className="text-zinc-400">결제 상태</dt>
        <dd>
          <StatusBadge status={detail.paymentStatus} />
        </dd>
        <dt className="text-zinc-400">결제 수단</dt>
        <dd className="text-zinc-800">{detail.paymentMethod}</dd>
        <dt className="text-zinc-400">Merchant UID</dt>
        <dd className="break-all text-zinc-800">{detail.merchantUid}</dd>
        <dt className="text-zinc-400">IMP UID</dt>
        <dd className="break-all text-zinc-800">{displayText(detail.impUid)}</dd>
      </DetailSection>
      <DetailSection title="구매자 정보">
        <dt className="text-zinc-400">구매자 닉네임</dt>
        <dd className="text-zinc-800">{detail.buyerNickname}</dd>
        <dt className="text-zinc-400">구매자 ID</dt>
        <dd className="break-all text-zinc-800">@{detail.buyerId}</dd>
      </DetailSection>
      <DetailSection title="판매자 정보">
        <dt className="text-zinc-400">판매자 닉네임</dt>
        <dd className="text-zinc-800">{detail.sellerNickname}</dd>
        <dt className="text-zinc-400">판매자 ID</dt>
        <dd className="break-all text-zinc-800">@{detail.sellerId}</dd>
      </DetailSection>
      <DetailSection title="구독 정보">
        <dt className="text-zinc-400">구독 시작일</dt>
        <dd className="text-zinc-800">{displayDate(detail.subStartDate)}</dd>
        <dt className="text-zinc-400">구독 종료일</dt>
        <dd className="text-zinc-800">{displayDate(detail.subEndDate)}</dd>
        <dt className="text-zinc-400">다음 결제일</dt>
        <dd className="text-zinc-800">{displayDate(detail.nextBillingAt)}</dd>
        <dt className="text-zinc-400">구독 상태</dt>
        <dd className="text-zinc-800">{subscriptionLabel(detail.subStatus)}</dd>
      </DetailSection>
    </div>
  );
}
