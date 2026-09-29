import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import {
  createReply,
  deleteReply,
  fetchReplies,
  setReplyLike,
  updateReply,
} from '@/api/replies.ts';
import { isAbortError, toErrorMessage } from '@/api/http.ts';
import { ActionMenu } from '@/components/ActionMenu.tsx';
import { MemberAvatar } from '@/components/MemberAvatar.tsx';
import type { ReplyResponse } from '@/types/reply.ts';
import { formatRelativeTime } from '@/utils/formatDateTime.ts';

interface PostReplySectionProps {
  postId: number;
  viewerId: number | null;
  accessToken: string | null;
  onCount: (count: number) => void;
  onReport: (replyId: number) => void;
}

function loginMessage() {
  return '로그인 후 이용할 수 있습니다.';
}

export function PostReplySection({
  postId,
  viewerId,
  accessToken,
  onCount,
  onReport,
}: PostReplySectionProps) {
  const [replies, setReplies] = useState<ReplyResponse[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');
  const [likedIds, setLikedIds] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const page = await fetchReplies(postId, null, controller.signal);
        setReplies(page.replies);
        setCursor(page.nextCursor);
        setHasNext(page.hasNext);
        onCount(page.replies.length);
      } catch (caught: unknown) {
        if (isAbortError(caught)) {
          return;
        }
        setError(toErrorMessage(caught));
      }
    }

    void load();
    return () => controller.abort();
  }, [onCount, postId]);

  async function reload() {
    const page = await fetchReplies(postId, null);
    setReplies(page.replies);
    setCursor(page.nextCursor);
    setHasNext(page.hasNext);
    onCount(page.replies.length);
  }

  async function loadMore() {
    if (!hasNext) {
      return;
    }
    const page = await fetchReplies(postId, cursor);
    const next = [...replies, ...page.replies];
    setReplies(next);
    setCursor(page.nextCursor);
    setHasNext(page.hasNext);
    onCount(next.length);
  }

  async function submitReply() {
    if (!accessToken) {
      setError(loginMessage());
      return;
    }
    const content = draft.trim();
    if (content === '') {
      return;
    }
    setError(null);
    try {
      await createReply(postId, content, accessToken);
      setDraft('');
      await reload();
    } catch (caught: unknown) {
      setError(toErrorMessage(caught));
    }
  }

  async function saveReply(replyId: number) {
    if (!accessToken) {
      setError(loginMessage());
      return;
    }
    try {
      await updateReply(postId, replyId, editingText.trim(), accessToken);
      setEditingId(null);
      await reload();
    } catch (caught: unknown) {
      setError(toErrorMessage(caught));
    }
  }

  async function removeReply(replyId: number) {
    if (!accessToken) {
      setError(loginMessage());
      return;
    }
    if (!window.confirm('이 댓글을 삭제할까요?')) {
      return;
    }
    try {
      await deleteReply(postId, replyId, accessToken);
      await reload();
    } catch (caught: unknown) {
      setError(toErrorMessage(caught));
    }
  }

  async function toggleReplyLike(reply: ReplyResponse) {
    if (!accessToken) {
      setError(loginMessage());
      return;
    }
    const nextLiked = !likedIds[reply.id];
    try {
      await setReplyLike(postId, reply.id, nextLiked, accessToken);
      setLikedIds((current) => ({ ...current, [reply.id]: nextLiked }));
      setReplies((current) =>
        current.map((item) =>
          item.id === reply.id
            ? { ...item, likeCount: item.likeCount + (nextLiked ? 1 : -1) }
            : item,
        ),
      );
    } catch (caught: unknown) {
      setError(toErrorMessage(caught));
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <ul className="flex flex-col gap-4 py-2">
          {replies.map((reply) => (
            <li key={reply.id} className="flex gap-2">
              <MemberAvatar name={reply.name} imageUrl={reply.profileImage} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-2">
                  <p className="min-w-0 text-sm">
                    <span className="font-semibold text-zinc-900">{reply.name}</span>
                    <span className="ml-1 text-zinc-400">@{reply.uniqueId}</span>
                    <span className="ml-1 text-xs text-zinc-400">
                      {formatRelativeTime(reply.createdAt)}
                    </span>
                  </p>
                  <ActionMenu
                    label="댓글 메뉴"
                    items={
                      viewerId === reply.memberId
                        ? [
                            {
                              label: '수정하기',
                              onSelect: () => {
                                setEditingId(reply.id);
                                setEditingText(reply.content);
                              },
                            },
                            {
                              label: '삭제하기',
                              danger: true,
                              onSelect: () => void removeReply(reply.id),
                            },
                          ]
                        : [{ label: '신고하기', onSelect: () => onReport(reply.id) }]
                    }
                  />
                </div>
                {editingId === reply.id ? (
                  <div className="mt-1 flex gap-2">
                    <input
                      value={editingText}
                      onChange={(event) => setEditingText(event.target.value)}
                      className="min-w-0 flex-1 rounded-xl border border-zinc-200 px-2 py-1 text-sm outline-none focus:border-linkup"
                    />
                    <button
                      type="button"
                      onClick={() => void saveReply(reply.id)}
                      className="text-sm font-medium text-linkup"
                    >
                      저장
                    </button>
                  </div>
                ) : (
                  <p className="mt-1 text-sm leading-relaxed text-zinc-800">{reply.content}</p>
                )}
                <button
                  type="button"
                  onClick={() => void toggleReplyLike(reply)}
                  className="mt-1 inline-flex items-center gap-1 text-xs text-zinc-400"
                >
                  <Heart
                    className={likedIds[reply.id] ? 'size-3.5 fill-linkup text-linkup' : 'size-3.5'}
                    aria-hidden
                  />
                  {reply.likeCount}
                </button>
              </div>
            </li>
          ))}
        </ul>
        {hasNext && (
          <button type="button" onClick={() => void loadMore()} className="text-sm text-linkup">
            댓글 더 보기
          </button>
        )}
        {error && <p className="py-2 text-sm text-red-500">{error}</p>}
      </div>

      <form
        className="flex gap-2 border-t border-zinc-100 pt-3"
        onSubmit={(event) => {
          event.preventDefault();
          void submitReply();
        }}
      >
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={500}
          placeholder="댓글을 남겨주세요."
          className="min-w-0 flex-1 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-linkup focus:bg-white"
        />
        <button
          type="submit"
          className="rounded-full bg-linkup px-4 py-2 text-sm font-medium text-white"
        >
          등록
        </button>
      </form>
    </div>
  );
}
