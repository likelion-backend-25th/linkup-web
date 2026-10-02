import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
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
  DONE: '결제 완료',
  PAID: '결제 완료',
  ABORT: '결제 실패',
  ABORTED: '결제 실패',
  FAILED: '결제 실패',
  CANCELED: '결제 취소',
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
  if (status === 'DONE' || status === 'PAID') {
    return 'bg-emerald-600 text-white';
  }
  if (status === 'ABORT' || status === 'ABORTED' || status === 'FAILED') {
    return 'bg-red-600 text-white';
  }
  if (status === 'CANCELED') {
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

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function monthCells(year: number, month: number): Array<string | null> {
  const leading = new Date(year, month, 1).getDay();
  const count = new Date(year, month + 1, 0).getDate();
  const cells: Array<string | null> = Array.from({ length: leading }, () => null);
  for (let day = 1; day <= count; day += 1) {
    cells.push(formatIsoDate(new Date(year, month, day)));
  }
  return cells;
}

function DateCalendar({
  value,
  onSelect,
}: {
  value: string;
  onSelect: (date: string) => void;
}) {
  const initial = isIsoDate(value) ? value : formatIsoDate(new Date());
  const [yearText, monthText] = initial.split('-');
  const [cursor, setCursor] = useState(() => new Date(Number(yearText), Number(monthText) - 1, 1));
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const today = formatIsoDate(new Date());

  return (
    <div className="px-4 pb-2">
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          aria-label="이전 달"
          onClick={() => setCursor(new Date(year, month - 1, 1))}
          className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-100"
        >
          <ChevronLeft className="size-4" />
        </button>
        <p className="text-sm font-medium text-zinc-800">
          {year}년 {month + 1}월
        </p>
        <button
          type="button"
          aria-label="다음 달"
          onClick={() => setCursor(new Date(year, month + 1, 1))}
          className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-100"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-zinc-400">
        {WEEKDAYS.map((weekday) => (
          <span key={weekday} className="py-1">
            {weekday}
          </span>
        ))}
        {monthCells(year, month).map((date, index) =>
          date === null ? (
            <span key={`empty-${index}`} />
          ) : (
            <button
              key={date}
              type="button"
              onClick={() => onSelect(date)}
              className={`rounded-lg py-1.5 text-sm ${
                date === value
                  ? 'bg-linkup font-medium text-white'
                  : date === today
                    ? 'text-linkup hover:bg-linkup-soft'
                    : 'text-zinc-800 hover:bg-zinc-100'
              }`}
            >
              {Number(date.slice(-2))}
            </button>
          ),
        )}
      </div>
    </div>
  );
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
  const [calendarTarget, setCalendarTarget] = useState<'start' | 'end' | null>(null);
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
    setCalendarTarget(null);
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
            <button
              type="button"
              aria-label="시작일"
              onClick={() => setCalendarTarget((current) => (current === 'start' ? null : 'start'))}
              className={`min-w-0 flex-1 rounded-lg border px-2 py-1.5 text-left text-sm outline-none ${
                calendarTarget === 'start' ? 'border-linkup' : 'border-zinc-200'
              } ${rangeStart ? 'text-zinc-800' : 'text-zinc-400'}`}
            >
              {rangeStart || '시작일'}
            </button>
            <button
              type="button"
              aria-label="종료일"
              onClick={() => setCalendarTarget((current) => (current === 'end' ? null : 'end'))}
              className={`min-w-0 flex-1 rounded-lg border px-2 py-1.5 text-left text-sm outline-none ${
                calendarTarget === 'end' ? 'border-linkup' : 'border-zinc-200'
              } ${rangeEnd ? 'text-zinc-800' : 'text-zinc-400'}`}
            >
              {rangeEnd || '종료일'}
            </button>
            <button
              type="button"
              onClick={applyCustom}
              className="shrink-0 rounded-lg bg-zinc-100 px-3 py-1.5 text-sm text-zinc-700"
            >
              설정
            </button>
          </div>
          {calendarTarget !== null && (
            <DateCalendar
              key={calendarTarget}
              value={calendarTarget === 'start' ? rangeStart : rangeEnd}
              onSelect={(date) => {
                if (calendarTarget === 'start') {
                  setRangeStart(date);
                } else {
                  setRangeEnd(date);
                }
                setRangeError(null);
                setCalendarTarget(null);
              }}
            />
          )}
          {rangeError && <p className="px-4 pb-1 text-xs text-red-500">{rangeError}</p>}
        </div>
      )}
    </div>
  );
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
  const [hasNext, setHasNext] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setHasNext(false);
    setPayments([]);

    const request = {
      keyword: query.keyword || undefined,
      paymentStatus: query.paymentStatus || undefined,
      startDate: query.startDate || undefined,
      endDate: query.endDate || undefined,
      size: PAGE_SIZE,
    };

    fetchAdminPayments({ ...request, page }, controller.signal)
      .then(async (data) => {
        if (controller.signal.aborted) {
          return;
        }
        setPayments(data);
        if (data.length < PAGE_SIZE) {
          setHasNext(false);
          return;
        }

        // 이번 페이지가 꽉 차도 다음이 없으면 버튼을 끈다. 형식 오류도 다음 페이지가 없는 것으로 본다.
        try {
          const nextPage = await fetchAdminPayments(
            { ...request, page: page + 1 },
            controller.signal,
          );
          if (controller.signal.aborted) {
            return;
          }
          const repeated =
            nextPage.length === data.length &&
            nextPage.every((item, index) => item.paymentId === data[index]?.paymentId);
          setHasNext(nextPage.length > 0 && !repeated);
        } catch (caught: unknown) {
          if (!isAbortError(caught)) {
            setHasNext(false);
          }
        }
      })
      .catch((caught: unknown) => {
        if (isAbortError(caught)) {
          return;
        }
        setHasNext(false);
        const message = toErrorMessage(caught);
        // 결제 실패 건은 승인일이 없어 목록 형식 검사에 걸린다. 이때는 빈 조회로 본다.
        if (query.paymentStatus === 'ABORTED' && message === '결제 목록 형식이 올바르지 않습니다.') {
          setPayments([]);
          return;
        }
        setError(message);
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
            <option value="DONE">결제 완료</option>
            <option value="ABORTED">결제 실패</option>
            <option value="CANCELED">결제 취소</option>
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
        <dt className="text-zinc-400">주문 번호</dt>
        <dd className="break-all text-zinc-800">{detail.orderId}</dd>
        <dt className="text-zinc-400">결제 키</dt>
        <dd className="break-all text-zinc-800">{detail.paymentKey}</dd>
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
