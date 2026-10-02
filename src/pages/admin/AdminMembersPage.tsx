import { useEffect, useState, type FormEvent } from 'react';
import { fetchAdminMember, fetchAdminMembers } from '@/api/admin.ts';
import { isAbortError, toErrorMessage } from '@/api/http.ts';
import { AdminDetailPane } from '@/components/AdminDetailPane.tsx';
import { MemberAvatar } from '@/components/MemberAvatar.tsx';
import type { AdminMemberDetailResponse, AdminMemberResponse } from '@/types/admin.ts';
import { formatDateTime } from '@/utils/formatDateTime.ts';

const PAGE_SIZE = 20;

const memberStatusLabel: Record<string, string> = {
  ACTIVE: '온라인',
  INACTIVE: '오프라인',
  SUSPENDED: 'STOP',
};

const creatorStatusLabel: Record<string, string> = {
  CREATOR: '크리에이터',
  USER: '일반 회원',
  NONE: '-',
};

function statusLabel(labels: Record<string, string>, value: string): string {
  return labels[value] ?? value;
}

interface MemberQuery {
  keyword: string;
  memberStatus: string;
  creatorStatus: string;
}

const emptyQuery: MemberQuery = { keyword: '', memberStatus: '', creatorStatus: '' };

export function AdminMembersPage() {
  const [draft, setDraft] = useState<MemberQuery>(emptyQuery);
  const [query, setQuery] = useState<MemberQuery>(emptyQuery);
  const [page, setPage] = useState(1);
  const [members, setMembers] = useState<AdminMemberResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<AdminMemberDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setMembers([]);

    fetchAdminMembers(
      {
        keyword: query.keyword || undefined,
        memberStatus: query.memberStatus || undefined,
        creatorStatus: query.creatorStatus || undefined,
        page,
        size: PAGE_SIZE,
      },
      controller.signal,
    )
      .then((data) => setMembers(data))
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

    fetchAdminMember(selectedId, controller.signal)
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

  function applyQuery(next: MemberQuery) {
    setDraft(next);
    setPage(1);
    setQuery(next);
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    applyQuery(draft);
  }

  const hasNext = members.length === PAGE_SIZE;

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl bg-white shadow-sm">
      <header className="shrink-0 border-b border-zinc-100 px-5 py-4">
        <h1 className="text-lg font-bold text-zinc-900">회원 / 구독 판매자</h1>
        <form onSubmit={submitSearch} className="mt-4 flex flex-wrap items-center gap-2">
          <input
            type="search"
            value={draft.keyword}
            onChange={(event) => setDraft((current) => ({ ...current, keyword: event.target.value }))}
            placeholder="닉네임 또는 아이디"
            aria-label="회원 검색"
            className="min-w-40 flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-linkup"
          />
          <select
            value={draft.memberStatus}
            onChange={(event) => applyQuery({ ...draft, memberStatus: event.target.value })}
            aria-label="회원 상태"
            className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-linkup"
          >
            <option value="">회원 상태 전체</option>
            <option value="ACTIVE">온라인</option>
            <option value="SUSPENDED">정지</option>
          </select>
          <select
            value={draft.creatorStatus}
            onChange={(event) => applyQuery({ ...draft, creatorStatus: event.target.value })}
            aria-label="크리에이터 상태"
            className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-linkup"
          >
            <option value="">크리에이터 전체</option>
            <option value="CREATOR">크리에이터</option>
            <option value="USER">일반</option>
            <option value="NONE">그 외</option>
          </select>
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
          <div className="linkup-scrollbar min-h-0 flex-1 overflow-auto">
            {loading && members.length === 0 ? (
              <p className="px-5 py-8 text-sm text-zinc-400">회원 목록을 불러오는 중...</p>
            ) : error && members.length === 0 ? (
              <p className="px-5 py-8 text-sm text-red-500">{error}</p>
            ) : members.length === 0 ? (
              <p className="px-5 py-8 text-sm text-zinc-400">회원이 없습니다.</p>
            ) : (
              <table className="w-full min-w-[40rem] text-left text-sm">
                <thead className="sticky top-0 bg-white text-xs text-zinc-400">
                  <tr className="border-b border-zinc-100">
                    <th className="px-4 py-3 font-medium">회원</th>
                    <th className="px-4 py-3 font-medium">아이디</th>
                    <th className="px-4 py-3 font-medium">회원 상태</th>
                    <th className="px-4 py-3 font-medium">크리에이터</th>
                    <th className="px-4 py-3 font-medium">가입일</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => {
                    const selected = member.id === selectedId;
                    return (
                      <tr
                        key={member.id}
                        onClick={() => setSelectedId(member.id)}
                        className={
                          selected ? 'cursor-pointer bg-linkup-soft' : 'cursor-pointer hover:bg-zinc-50'
                        }
                      >
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-2">
                            <MemberAvatar
                              name={member.nickname}
                              imageUrl={member.profileImage || null}
                              size="sm"
                            />
                            <span className="truncate text-zinc-900">{member.nickname}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3 text-zinc-700">@{member.userId}</td>
                        <td className="px-4 py-3 text-zinc-700">
                          <span className="inline-flex items-center gap-2">
                            <span
                              className={`h-2 w-2 shrink-0 rounded-full ${member.memberStatus === 'ACTIVE' ? 'bg-green-500' : 'bg-red-500'}`}
                              aria-hidden
                            />
                            {statusLabel(memberStatusLabel, member.memberStatus)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-zinc-700">
                          {statusLabel(creatorStatusLabel, member.creatorStatus)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-zinc-500">
                          {formatDateTime(member.createdAt)}
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

        <AdminDetailPane label="회원 상세">
          <h2 className="text-base font-semibold text-zinc-900">회원 상세</h2>
          {selectedId === null ? (
            <p className="mt-4 text-sm text-zinc-400">목록에서 회원을 선택하세요.</p>
          ) : detailLoading ? (
            <p className="mt-4 text-sm text-zinc-400">상세를 불러오는 중...</p>
          ) : detailError ? (
            <p className="mt-4 text-sm text-red-500">{detailError}</p>
          ) : detail ? (
            <MemberDetail detail={detail} />
          ) : null}
        </AdminDetailPane>
      </div>
    </section>
  );
}

function MemberDetail({ detail }: { detail: AdminMemberDetailResponse }) {
  return (
    <div className="mt-4">
      <MemberAvatar name={detail.nickname} imageUrl={detail.profileImage || null} />
      <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 text-sm">
        <dt className="text-zinc-400">닉네임</dt>
        <dd className="text-zinc-800">{detail.nickname}</dd>
        <dt className="text-zinc-400">아이디</dt>
        <dd className="text-zinc-800">@{detail.userId}</dd>
        <dt className="text-zinc-400">이메일</dt>
        <dd className="break-all text-zinc-800">{detail.email}</dd>
        <dt className="text-zinc-400">가입일</dt>
        <dd className="text-zinc-800">{formatDateTime(detail.createdAt)}</dd>
        <dt className="text-zinc-400">회원 상태</dt>
        <dd className="text-zinc-800">{statusLabel(memberStatusLabel, detail.memberStatus)}</dd>
        <dt className="text-zinc-400">크리에이터</dt>
        <dd className="text-zinc-800">{statusLabel(creatorStatusLabel, detail.creatorStatus)}</dd>
        <dt className="text-zinc-400">월 구독 가격</dt>
        <dd className="text-zinc-800">
          {detail.subscriptionPrice === null
            ? '-'
            : `${detail.subscriptionPrice.toLocaleString('ko-KR')}원`}
        </dd>
        <dt className="text-zinc-400">구독자 수</dt>
        <dd className="text-zinc-800">{detail.subscriberCount.toLocaleString('ko-KR')}</dd>
      </dl>
    </div>
  );
}
