import { useEffect, useState } from 'react';
import {
  getAdminReportDetail,
  getAdminReportSummary,
  getAdminReports,
  processAdminReport,
} from '@/api/admin.ts';
import { isAbortError, toErrorMessage } from '@/api/http.ts';
import { ConfirmDialog } from '@/components/ConfirmDialog.tsx';
import type {
  AdminOperationResponse,
  AdminReportDetailResponse,
  AdminReportResponse,
} from '@/types/admin.ts';
import { formatDateTime } from '@/utils/formatDateTime.ts';

const PAGE_SIZE = 10;

type ReportProcessStatus = 'REJECTED' | 'RESOLVED';

const processLabel: Record<ReportProcessStatus, string> = {
  REJECTED: '기각',
  RESOLVED: '처리',
};

function reportStatusLabel(status: string): string {
  if (status === 'PENDING') {
    return '대기 중';
  }
  if (status === 'REJECTED') {
    return '기각';
  }
  if (status === 'RESOLVED') {
    return '처리 완료';
  }
  return status;
}

function reportStatusClass(status: string): string {
  if (status === 'PENDING') {
    return 'bg-amber-100 text-amber-700';
  }
  if (status === 'REJECTED') {
    return 'bg-zinc-100 text-zinc-500';
  }
  if (status === 'RESOLVED') {
    return 'bg-linkup text-white';
  }
  return 'bg-zinc-100 text-zinc-600';
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

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${reportStatusClass(status)}`}>
      {reportStatusLabel(status)}
    </span>
  );
}

export function AdminReportsPage() {
  const [page, setPage] = useState(0);
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
    setListLoading(true);
    setSummaryError(null);
    setListError(null);
    setReports([]);

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

    getAdminReports({ page, size: PAGE_SIZE }, controller.signal)
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
  }, [page, reloadKey]);

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

  async function confirmProcess() {
    if (selectedId === null || confirmStatus === null) {
      return;
    }
    setProcessing(true);
    setProcessError(null);
    try {
      await processAdminReport(selectedId, { status: confirmStatus });
      setConfirmStatus(null);
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
            label="대기 중인 신고"
            loading={summaryLoading}
            error={summaryError}
            value={summary?.pendingReportCount}
          />
          <SummaryStat
            label="전체 회원"
            loading={summaryLoading}
            error={summaryError}
            value={summary?.totalMember}
          />
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <ReportList
          reports={reports}
          selectedId={selectedId}
          loading={listLoading}
          error={listError}
          page={page}
          hasNext={hasNext}
          onSelect={setSelectedId}
          onPage={setPage}
        />

        <aside className="linkup-scrollbar min-h-0 w-full overflow-y-auto p-5 lg:w-80 lg:shrink-0">
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
        </aside>
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

function ReportList({
  reports,
  selectedId,
  loading,
  error,
  page,
  hasNext,
  onSelect,
  onPage,
}: {
  reports: AdminReportResponse[];
  selectedId: number | null;
  loading: boolean;
  error: string | null;
  page: number;
  hasNext: boolean;
  onSelect: (reportId: number) => void;
  onPage: (page: number) => void;
}) {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col border-b border-zinc-100 lg:border-r lg:border-b-0">
      <div className="linkup-scrollbar min-h-0 flex-1 overflow-auto">
        {loading && reports.length === 0 ? (
          <p className="px-5 py-8 text-sm text-zinc-400">신고 목록을 불러오는 중...</p>
        ) : error && reports.length === 0 ? (
          <p className="px-5 py-8 text-sm text-red-500">{error}</p>
        ) : reports.length === 0 ? (
          <p className="px-5 py-8 text-sm text-zinc-400">신고가 없습니다.</p>
        ) : (
          <table className="w-full min-w-[48rem] text-left text-sm">
            <thead className="sticky top-0 bg-white text-xs text-zinc-400">
              <tr className="border-b border-zinc-100">
                <th className="px-4 py-3 font-medium">신고 ID</th>
                <th className="px-4 py-3 font-medium">신고 대상</th>
                <th className="px-4 py-3 font-medium">신고자</th>
                <th className="px-4 py-3 font-medium">대상 사용자</th>
                <th className="px-4 py-3 font-medium">신고 사유</th>
                <th className="px-4 py-3 font-medium">신고 내용</th>
                <th className="px-4 py-3 font-medium">신고 일시</th>
                <th className="px-4 py-3 font-medium">상태</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => {
                const selected = report.id === selectedId;
                return (
                  <tr
                    key={report.id}
                    onClick={() => onSelect(report.id)}
                    className={
                      selected ? 'cursor-pointer bg-linkup-soft' : 'cursor-pointer hover:bg-zinc-50'
                    }
                  >
                    <td className="px-4 py-3 text-zinc-900">{report.id}</td>
                    <td className="px-4 py-3 text-zinc-700">{targetTypeLabel(report.targetType)}</td>
                    <td className="px-4 py-3 text-zinc-700">{report.reporterName}</td>
                    <td className="px-4 py-3 text-zinc-700">{report.targetUserName}</td>
                    <td className="max-w-40 truncate px-4 py-3 text-zinc-700">{report.reason}</td>
                    <td className="max-w-48 truncate px-4 py-3 text-zinc-700">{report.content}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-500">
                      {formatDateTime(report.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={report.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      {error && reports.length > 0 ? (
        <p className="px-5 py-2 text-xs text-red-500">{error}</p>
      ) : null}
      <div className="flex shrink-0 items-center justify-end gap-2 border-t border-zinc-100 px-4 py-3">
        <button
          type="button"
          disabled={page === 0 || loading}
          onClick={() => onPage(page - 1)}
          className="rounded-xl border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 disabled:opacity-60"
        >
          이전
        </button>
        <span className="text-sm text-zinc-500">{page + 1}</span>
        <button
          type="button"
          disabled={!hasNext || loading}
          onClick={() => onPage(page + 1)}
          className="rounded-xl border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 disabled:opacity-60"
        >
          다음
        </button>
      </div>
    </div>
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
  return (
    <div className="mt-4">
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 text-sm">
        <dt className="text-zinc-400">신고 ID</dt>
        <dd className="text-zinc-800">{detail.id}</dd>
        <dt className="text-zinc-400">신고 대상</dt>
        <dd className="text-zinc-800">{targetTypeLabel(detail.targetType)}</dd>
        <dt className="text-zinc-400">게시글 ID</dt>
        <dd className="text-zinc-800">{detail.postId}</dd>
        <dt className="text-zinc-400">댓글 ID</dt>
        <dd className="text-zinc-800">{detail.replyId}</dd>
        <dt className="text-zinc-400">대상 회원 ID</dt>
        <dd className="text-zinc-800">{detail.targetMemberId}</dd>
        <dt className="text-zinc-400">신고자</dt>
        <dd className="text-zinc-800">{detail.reporterName}</dd>
        <dt className="text-zinc-400">대상 사용자</dt>
        <dd className="text-zinc-800">{detail.targetUserName}</dd>
        <dt className="text-zinc-400">신고 사유</dt>
        <dd className="text-zinc-800">{detail.reason}</dd>
        <dt className="text-zinc-400">신고 내용</dt>
        <dd className="whitespace-pre-wrap text-zinc-800">{detail.content}</dd>
        <dt className="text-zinc-400">신고 상세</dt>
        <dd className="whitespace-pre-wrap text-zinc-800">{detail.reportContent}</dd>
        <dt className="text-zinc-400">신고 일시</dt>
        <dd className="text-zinc-800">{formatDateTime(detail.createdAt)}</dd>
        <dt className="text-zinc-400">상태</dt>
        <dd>
          <StatusBadge status={detail.status} />
        </dd>
      </dl>
      {processError ? <p className="mt-4 text-sm text-red-500">{processError}</p> : null}
      <div className="mt-5 flex gap-2">
        <button
          type="button"
          disabled={processing || detail.status === 'REJECTED'}
          onClick={() => onProcess('REJECTED')}
          className="rounded-xl border border-red-500 px-3 py-2 text-sm font-medium text-red-500 disabled:opacity-60"
        >
          기각
        </button>
        <button
          type="button"
          disabled={processing || detail.status === 'RESOLVED'}
          onClick={() => onProcess('RESOLVED')}
          className="rounded-xl bg-linkup px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          처리
        </button>
      </div>
    </div>
  );
}
