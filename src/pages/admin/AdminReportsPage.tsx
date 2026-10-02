import { useEffect, useState } from 'react';
import {
  getAdminReportDetail,
  getAdminReportSummary,
  getAdminReports,
  processAdminReport,
} from '@/api/admin.ts';
import { isAbortError, toErrorMessage } from '@/api/http.ts';
import { AdminDetailPane } from '@/components/AdminDetailPane.tsx';
import { ConfirmDialog } from '@/components/ConfirmDialog.tsx';
import type {
  AdminOperationResponse,
  AdminReportDetailResponse,
  AdminReportResponse,
} from '@/types/admin.ts';
import { useFeedViewStore } from '@/stores/useFeedViewStore.ts';
import { formatDateTime } from '@/utils/formatDateTime.ts';

const PAGE_SIZE = 20;

type ReportTargetType = '' | 'POST' | 'REPLY';
type ReportProcessStatus = 'REJECTED' | 'RESOLVED';

const targetTabs: { value: ReportTargetType; label: string }[] = [
  { value: '', label: '전체 신고' },
  { value: 'POST', label: '게시글 신고' },
  { value: 'REPLY', label: '댓글 신고' },
];

const reportStatusLabel: Record<string, string> = {
  WAIT: '처리 대기',
  REJECTED: '반려',
  RESOLVED: '처리 완료',
};

const processLabel: Record<ReportProcessStatus, string> = {
  REJECTED: '반려',
  RESOLVED: '처리 완료',
};

function statusLabel(status: string): string {
  return reportStatusLabel[status] ?? status;
}

function reportStatusClass(status: string): string {
  if (status === 'WAIT') {
    return 'bg-amber-500 text-white';
  }
  if (status === 'REJECTED') {
    return 'bg-red-600 text-white';
  }
  if (status === 'RESOLVED') {
    return 'bg-emerald-600 text-white';
  }
  return 'bg-zinc-700 text-white';
}

function targetTypeLabel(targetType: string): string {
  if (targetType === 'POST') {
    return '게시글';
  }
  if (targetType === 'REPLY') {
    return '댓글';
  }
  return targetType;
}

function displayText(value: string | null): string {
  return value === null || value === '' ? '-' : value;
}

function TargetTypeBadge({ targetType }: { targetType: string }) {
  const isPost = targetType === 'POST';
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${
        isPost ? 'bg-linkup-soft text-linkup' : 'bg-zinc-200 text-zinc-700'
      }`}
    >
      {targetTypeLabel(targetType)}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${reportStatusClass(status)}`}
    >
      {statusLabel(status)}
    </span>
  );
}

export function AdminReportsPage() {
  const [targetType, setTargetType] = useState<ReportTargetType>('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [summary, setSummary] = useState<AdminOperationResponse | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [reports, setReports] = useState<AdminReportResponse[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<AdminReportDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [confirmStatus, setConfirmStatus] = useState<ReportProcessStatus | null>(null);
  const [processing, setProcessing] = useState(false);
  const [processError, setProcessError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setSummaryLoading(true);
    setSummaryError(null);

    getAdminReportSummary(controller.signal)
      .then((data) => setSummary(data))
      .catch((caught: unknown) => {
        if (!isAbortError(caught)) {
          setSummaryError(toErrorMessage(caught));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setSummaryLoading(false);
        }
      });

    return () => controller.abort();
  }, [reloadKey]);

  useEffect(() => {
    const controller = new AbortController();
    setListLoading(true);
    setListError(null);
    setReports([]);

    getAdminReports(
      {
        targetType: targetType || undefined,
        status: status || undefined,
        page,
        size: PAGE_SIZE,
      },
      controller.signal,
    )
      .then((data) => setReports(data))
      .catch((caught: unknown) => {
        if (!isAbortError(caught)) {
          setListError(toErrorMessage(caught));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setListLoading(false);
        }
      });

    return () => controller.abort();
  }, [targetType, status, page, reloadKey]);

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
    setProcessError(null);

    getAdminReportDetail(selectedId, controller.signal)
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
  }, [selectedId, reloadKey]);

  function changeTarget(next: ReportTargetType) {
    setTargetType(next);
    setPage(1);
    setSelectedId(null);
  }

  function changeStatus(next: string) {
    setStatus(next);
    setPage(1);
    setSelectedId(null);
  }

  async function confirmProcess() {
    if (selectedId === null || confirmStatus === null) {
      return;
    }
    setProcessing(true);
    setProcessError(null);
    try {
      await processAdminReport(selectedId, { status: confirmStatus });
      // 게시글 신고를 처리 완료하면 서버가 게시글을 지운다. 홈은 스냅샷을 다시 쓰지 않으므로 여기서 뺀다.
      if (confirmStatus === 'RESOLVED' && detail?.targetType === 'POST' && detail.postId !== null) {
        useFeedViewStore.getState().removePost(detail.postId);
      }
      setConfirmStatus(null);
      // 처리 후 상세, 목록, 대기 수를 다시 받는다.
      setReloadKey((current) => current + 1);
    } catch (caught: unknown) {
      setProcessError(toErrorMessage(caught));
      setConfirmStatus(null);
    } finally {
      setProcessing(false);
    }
  }

  const hasNext = reports.length === PAGE_SIZE;

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl bg-white shadow-sm">
      <header className="shrink-0 border-b border-zinc-100 px-5 py-4">
        <h1 className="text-lg font-bold text-zinc-900">신고 관리</h1>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <SummaryStat
            label="처리 대기 신고 수"
            loading={summaryLoading}
            error={summaryError}
            value={summary?.pendingReportCount}
          />
          <SummaryStat
            label="전체 회원 수"
            loading={summaryLoading}
            error={summaryError}
            value={summary?.totalMember}
          />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {targetTabs.map((tab) => {
            const active = tab.value === targetType;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => changeTarget(tab.value)}
                className={
                  active
                    ? 'rounded-xl bg-linkup-soft px-3 py-2 text-sm font-medium text-linkup'
                    : 'rounded-xl px-3 py-2 text-sm font-medium text-zinc-500 hover:bg-zinc-50'
                }
              >
                {tab.label}
              </button>
            );
          })}
          <select
            value={status}
            onChange={(event) => changeStatus(event.target.value)}
            aria-label="처리 상태"
            className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-linkup"
          >
            <option value="">처리 상태 전체</option>
            <option value="RESOLVED">처리 완료</option>
            <option value="WAIT">처리 대기</option>
            <option value="REJECTED">반려</option>
          </select>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col border-b border-zinc-100 lg:border-b-0">
          <div className="linkup-scrollbar min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
            {listLoading && reports.length === 0 ? (
              <p className="px-5 py-8 text-sm text-zinc-400">신고 목록을 불러오는 중...</p>
            ) : listError && reports.length === 0 ? (
              <p className="px-5 py-8 text-sm text-red-500">{listError}</p>
            ) : reports.length === 0 ? (
              <p className="px-5 py-8 text-sm text-zinc-400">신고가 없습니다.</p>
            ) : (
              <table className="w-full table-fixed text-left text-sm">
                <thead className="sticky top-0 bg-white text-xs text-zinc-400">
                  <tr className="border-b border-zinc-100">
                    <th className="w-24 py-3 pl-6 pr-4 font-medium">신고자</th>
                    <th className="w-24 whitespace-nowrap px-4 py-3 font-medium">신고 유형</th>
                    <th className="w-24 px-4 py-3 font-medium">신고 대상</th>
                    <th className="w-28 px-4 py-3 font-medium">신고 사유</th>
                    <th className="px-4 py-3 font-medium">신고 내용</th>
                    <th className="w-44 whitespace-nowrap px-4 py-3 font-medium">신고 날짜</th>
                    <th className="w-28 whitespace-nowrap py-3 pl-4 pr-5 font-medium">처리 상태</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => {
                    const selected = report.id === selectedId;
                    return (
                      <tr
                        key={report.id}
                        onClick={() => setSelectedId(report.id)}
                        className={
                          selected ? 'cursor-pointer bg-linkup-soft' : 'cursor-pointer hover:bg-zinc-50'
                        }
                      >
                        <td className="truncate py-3 pl-6 pr-4 text-zinc-900">{report.reporterName}</td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <TargetTypeBadge targetType={report.targetType} />
                        </td>
                        <td className="truncate px-4 py-3 text-zinc-700">
                          {displayText(report.targetUserName)}
                        </td>
                        <td className="truncate px-4 py-3 text-zinc-700">{report.reason}</td>
                        <td className="truncate px-4 py-3 text-zinc-700">{displayText(report.content)}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-zinc-500">
                          {formatDateTime(report.createdAt)}
                        </td>
                        <td className="whitespace-nowrap py-3 pl-4 pr-5">
                          <StatusBadge status={report.status} />
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
              disabled={page <= 1 || listLoading}
              onClick={() => setPage((current) => current - 1)}
              className="rounded-xl border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 disabled:opacity-60"
            >
              이전
            </button>
            <span className="text-sm text-zinc-500">{page}</span>
            <button
              type="button"
              disabled={!hasNext || listLoading}
              onClick={() => setPage((current) => current + 1)}
              className="rounded-xl border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 disabled:opacity-60"
            >
              다음
            </button>
          </div>
        </div>

        <AdminDetailPane label="신고 상세">
          <h2 className="text-base font-semibold text-zinc-900">신고 상세</h2>
          {selectedId === null ? (
            <p className="mt-4 text-sm text-zinc-400">목록에서 신고를 선택하세요.</p>
          ) : detailLoading ? (
            <p className="mt-4 text-sm text-zinc-400">상세를 불러오는 중...</p>
          ) : detailError ? (
            <p className="mt-4 text-sm text-red-500">{detailError}</p>
          ) : detail ? (
            <ReportDetail
              detail={detail}
              processError={processError}
              processing={processing}
              onProcess={setConfirmStatus}
            />
          ) : null}
        </AdminDetailPane>
      </div>

      {confirmStatus !== null && (
        <ConfirmDialog
          message={`이 신고를 ${processLabel[confirmStatus]}하시겠습니까?`}
          confirmLabel={processLabel[confirmStatus]}
          pending={processing}
          danger={confirmStatus === 'REJECTED'}
          onClose={() => {
            if (!processing) {
              setConfirmStatus(null);
            }
          }}
          onConfirm={() => void confirmProcess()}
        />
      )}
    </section>
  );
}

function SummaryStat({
  label,
  loading,
  error,
  value,
}: {
  label: string;
  loading: boolean;
  error: string | null;
  value: number | undefined;
}) {
  return (
    <div className="rounded-xl bg-zinc-50 px-4 py-3">
      <p className="text-xs text-zinc-500">{label}</p>
      {loading ? (
        <p className="mt-1 text-sm text-zinc-400">불러오는 중...</p>
      ) : error ? (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      ) : (
        <p className="mt-1 text-xl font-bold text-zinc-900">
          {(value ?? 0).toLocaleString('ko-KR')}
        </p>
      )}
    </div>
  );
}

function ReportDetail({
  detail,
  processError,
  processing,
  onProcess,
}: {
  detail: AdminReportDetailResponse;
  processError: string | null;
  processing: boolean;
  onProcess: (status: ReportProcessStatus) => void;
}) {
  const canProcess = detail.status === 'WAIT';

  return (
    <div className="mt-4">
      <dl className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-3 text-sm">
        <dt className="text-zinc-400">신고 유형</dt>
        <dd className="text-zinc-800">{targetTypeLabel(detail.targetType)}</dd>
        <dt className="text-zinc-400">신고자</dt>
        <dd className="text-zinc-800">{detail.reporterName}</dd>
        <dt className="text-zinc-400">신고 대상</dt>
        <dd className="text-zinc-800">{displayText(detail.targetUserName)}</dd>
        <dt className="text-zinc-400">신고 사유</dt>
        <dd className="text-zinc-800">{detail.reason}</dd>
        <dt className="text-zinc-400">신고 내용</dt>
        <dd className="min-w-0 whitespace-pre-wrap break-all text-zinc-800">{displayText(detail.content)}</dd>
        <dt className="text-zinc-400">신고 상세</dt>
        <dd className="min-w-0 whitespace-pre-wrap break-all text-zinc-800">{displayText(detail.reportContent)}</dd>
        <dt className="text-zinc-400">신고 날짜</dt>
        <dd className="text-zinc-800">{formatDateTime(detail.createdAt)}</dd>
        <dt className="text-zinc-400">처리 상태</dt>
        <dd>
          <StatusBadge status={detail.status} />
        </dd>
      </dl>
      {processError ? <p className="mt-4 text-sm text-red-500">{processError}</p> : null}
      {canProcess ? (
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            disabled={processing}
            onClick={() => onProcess('REJECTED')}
            className="rounded-xl border border-red-500 px-3 py-2 text-sm font-medium text-red-500 disabled:opacity-60"
          >
            반려
          </button>
          <button
            type="button"
            disabled={processing}
            onClick={() => onProcess('RESOLVED')}
            className="rounded-xl bg-linkup px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            처리 완료
          </button>
        </div>
      ) : null}
    </div>
  );
}
