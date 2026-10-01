import { useEffect, useState, type FormEvent } from 'react';
import { fetchAdminPayment, fetchAdminPayments } from '@/api/admin.ts';
import { isAbortError, toErrorMessage } from '@/api/http.ts';
import type { AdminPaymentDetailResponse, AdminPaymentResponse } from '@/types/admin.ts';
import { formatDateTime } from '@/utils/formatDateTime.ts';

const PAGE_SIZE = 10;

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

export function AdminPaymentsPage() {
  const [draft, setDraft] = useState<PaymentQuery>(emptyQuery);
  const [query, setQuery] = useState<PaymentQuery>(emptyQuery);
  const [page, setPage] = useState(0);
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

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(0);
    setQuery(draft);
  }

  const hasNext = payments.length === PAGE_SIZE;

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl bg-white shadow-sm">
      <header className="shrink-0 border-b border-zinc-100 px-5 py-4">
        <h1 className="text-lg font-bold text-zinc-900">구독 / 결제</h1>
        <form onSubmit={submitSearch} className="mt-4 flex flex-wrap items-center gap-2">
          <input
            type="search"
            value={draft.keyword}
            onChange={(event) => setDraft((current) => ({ ...current, keyword: event.target.value }))}
            placeholder="닉네임 또는 아이디"
            aria-label="결제 검색"
            className="min-w-40 flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-linkup"
          />
          <select
            value={draft.paymentStatus}
            onChange={(event) =>
              setDraft((current) => ({ ...current, paymentStatus: event.target.value }))
            }
            aria-label="결제 상태"
            className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-linkup"
          >
            <option value="">결제 상태 전체</option>
            <option value="PAID">결제 완료</option>
            <option value="FAILED">실패</option>
            <option value="CANCELLED">취소</option>
          </select>
          <input
            type="date"
            value={draft.startDate}
            onChange={(event) => setDraft((current) => ({ ...current, startDate: event.target.value }))}
            aria-label="시작일"
            className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-linkup"
          />
          <input
            type="date"
            value={draft.endDate}
            onChange={(event) => setDraft((current) => ({ ...current, endDate: event.target.value }))}
            aria-label="종료일"
            className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-linkup"
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
        <div className="flex min-h-0 min-w-0 flex-1 flex-col border-b border-zinc-100 lg:border-r lg:border-b-0">
          <div className="linkup-scrollbar min-h-0 flex-1 overflow-auto">
            {loading && payments.length === 0 ? (
              <p className="px-5 py-8 text-sm text-zinc-400">결제 목록을 불러오는 중...</p>
            ) : error && payments.length === 0 ? (
              <p className="px-5 py-8 text-sm text-red-500">{error}</p>
            ) : payments.length === 0 ? (
              <p className="px-5 py-8 text-sm text-zinc-400">결제 내역이 없습니다.</p>
            ) : (
              <table className="w-full min-w-[40rem] text-left text-sm">
                <thead className="sticky top-0 bg-white text-xs text-zinc-400">
                  <tr className="border-b border-zinc-100">
                    <th className="px-4 py-3 font-medium">결제 일시</th>
                    <th className="px-4 py-3 font-medium">판매자</th>
                    <th className="px-4 py-3 font-medium">구매자</th>
                    <th className="px-4 py-3 font-medium">금액</th>
                    <th className="px-4 py-3 font-medium">상태</th>
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
                        <td className="whitespace-nowrap px-4 py-3 text-zinc-700">
                          {formatDateTime(payment.paymentDate)}
                        </td>
                        <td className="px-4 py-3 text-zinc-900">{payment.sellerNickname}</td>
                        <td className="px-4 py-3 text-zinc-700">
                          {payment.buyerNickname}
                          <span className="ml-1 text-xs text-zinc-400">@{payment.buyerId}</span>
                        </td>
                        <td className="px-4 py-3 text-zinc-700">
                          {payment.amount.toLocaleString('ko-KR')}원
                        </td>
                        <td className="px-4 py-3 text-zinc-700">{payment.paymentStatus}</td>
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
              disabled={page === 0 || loading}
              onClick={() => setPage((current) => current - 1)}
              className="rounded-xl border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 disabled:opacity-60"
            >
              이전
            </button>
            <span className="text-sm text-zinc-500">{page + 1}</span>
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

        <aside className="linkup-scrollbar min-h-0 w-full overflow-y-auto p-5 lg:w-80 lg:shrink-0">
          <h2 className="text-base font-semibold text-zinc-900">결제 상세</h2>
          {selectedId === null ? (
            <p className="mt-4 text-sm text-zinc-400">목록에서 결제를 선택하세요.</p>
          ) : detailLoading ? (
            <p className="mt-4 text-sm text-zinc-400">상세를 불러오는 중...</p>
          ) : detailError ? (
            <p className="mt-4 text-sm text-red-500">{detailError}</p>
          ) : detail ? (
            <PaymentDetail detail={detail} />
          ) : null}
        </aside>
      </div>
    </section>
  );
}

function PaymentDetail({ detail }: { detail: AdminPaymentDetailResponse }) {
  return (
    <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 text-sm">
      <dt className="text-zinc-400">결제 번호</dt>
      <dd className="text-zinc-800">{detail.paymentId}</dd>
      <dt className="text-zinc-400">결제 일시</dt>
      <dd className="text-zinc-800">{formatDateTime(detail.paymentDate)}</dd>
      <dt className="text-zinc-400">금액</dt>
      <dd className="text-zinc-800">{detail.amount.toLocaleString('ko-KR')}원</dd>
      <dt className="text-zinc-400">결제 상태</dt>
      <dd className="text-zinc-800">{detail.paymentStatus}</dd>
      <dt className="text-zinc-400">결제 수단</dt>
      <dd className="text-zinc-800">{detail.paymentMethod}</dd>
      <dt className="text-zinc-400">판매자</dt>
      <dd className="text-zinc-800">
        {detail.sellerNickname} @{detail.sellerId}
      </dd>
      <dt className="text-zinc-400">구매자</dt>
      <dd className="text-zinc-800">
        {detail.buyerNickname} @{detail.buyerId}
      </dd>
      <dt className="text-zinc-400">구독 시작</dt>
      <dd className="text-zinc-800">{formatDateTime(detail.subStartDate)}</dd>
      <dt className="text-zinc-400">구독 종료</dt>
      <dd className="text-zinc-800">{formatDateTime(detail.subEndDate)}</dd>
      <dt className="text-zinc-400">다음 결제</dt>
      <dd className="text-zinc-800">{formatDateTime(detail.nextBillingAt)}</dd>
      <dt className="text-zinc-400">구독 상태</dt>
      <dd className="text-zinc-800">{detail.subStatus}</dd>
    </dl>
  );
}
