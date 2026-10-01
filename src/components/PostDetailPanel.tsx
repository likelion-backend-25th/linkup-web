import { useState } from 'react';
import { Download, Heart, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router';
import { toErrorMessage } from '@/api/http.ts';
import { deletePost, reportPost, setPostLike } from '@/api/posts.ts';
import { reportReply } from '@/api/replies.ts';
import { ActionMenu } from '@/components/ActionMenu.tsx';
import { ConfirmDialog } from '@/components/ConfirmDialog.tsx';
import { MemberAvatar } from '@/components/MemberAvatar.tsx';
import { MemberProfileLink } from '@/components/MemberProfileLink.tsx';
import { PostReplySection } from '@/components/PostReplySection.tsx';
import { ReportDialog } from '@/components/ReportDialog.tsx';
import { useLoginPromptStore } from '@/stores/useLoginPromptStore.ts';
import type { PostDetailResponse } from '@/types/post.ts';
import { formatRelativeTime } from '@/utils/formatDateTime.ts';
import { toMediaUrl } from '@/utils/mediaUrl.ts';

interface PostDetailPanelProps {
  post: PostDetailResponse;
  accessToken: string | null;
  viewerId: number | null;
  onPostChange: (post: PostDetailResponse) => void;
}

type ReportTarget = { kind: 'post' } | { kind: 'reply'; replyId: number };

function loginMessage() {
  return '로그인 후 이용할 수 있습니다.';
}

export function PostDetailPanel({
  post,
  accessToken,
  viewerId,
  onPostChange,
}: PostDetailPanelProps) {
  const navigate = useNavigate();
  const isOwner = viewerId === post.memberId;
  const [replyCount, setReplyCount] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const promptIfLoggedOut = useLoginPromptStore((state) => state.promptIfLoggedOut);

  async function toggleLike() {
    if (promptIfLoggedOut() || !accessToken) {
      return;
    }
    const next = !post.likedByMe;
    try {
      await setPostLike(post.id, next, accessToken);
      onPostChange({
        ...post,
        likedByMe: next,
        likeCount: post.likeCount + (next ? 1 : -1),
      });
    } catch (caught: unknown) {
      setNotice(toErrorMessage(caught));
    }
  }

  async function removePost() {
    if (!accessToken) {
      setNotice(loginMessage());
      return;
    }
    setDeleting(true);
    try {
      await deletePost(post.id, accessToken);
      await navigate('/');
    } catch (caught: unknown) {
      setNotice(toErrorMessage(caught));
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  async function submitReport(reason: string, content: string) {
    if (!accessToken || !reportTarget) {
      throw new Error(loginMessage());
    }
    if (reportTarget.kind === 'post') {
      await reportPost(post.id, reason, content, accessToken);
    } else {
      await reportReply(post.id, reportTarget.replyId, reason, content, accessToken);
    }
    setNotice('신고했습니다.');
  }

  return (
    <div className="flex h-full min-h-0 flex-col px-5 py-4">
      <div className="flex items-start gap-3">
        <MemberProfileLink
          memberId={post.memberId}
          state={{ name: post.name, uniqueId: post.uniqueId, profileImage: post.profileImage }}
          aria-label={`${post.name} 프로필`}
        >
          <MemberAvatar name={post.name} imageUrl={post.profileImage} />
        </MemberProfileLink>
        <MemberProfileLink
          memberId={post.memberId}
          state={{ name: post.name, uniqueId: post.uniqueId, profileImage: post.profileImage }}
          className="min-w-0 flex-1 hover:text-linkup"
        >
          <p className="truncate text-sm font-semibold text-zinc-900">{post.name}</p>
          <p className="truncate text-xs text-zinc-400">
            @{post.uniqueId}
            <span className="mx-1">·</span>
            <time dateTime={post.createdAt}>{formatRelativeTime(post.createdAt)}</time>
          </p>
        </MemberProfileLink>
        <ActionMenu
          label="게시글 메뉴"
          items={
            isOwner
              ? [
                  { label: '수정하기', onSelect: () => void navigate(`/posts/${post.id}/edit`) },
                  { label: '삭제하기', danger: true, onSelect: () => setConfirmDelete(true) },
                ]
              : [{ label: '신고하기', onSelect: () => setReportTarget({ kind: 'post' }) }]
          }
        />
      </div>

      {post.subscriberOnly && (
        <p className="mt-3 text-xs font-medium text-linkup">구독자 전용</p>
      )}

      <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-zinc-800">{post.content}</p>

      {post.fileUrl && (
        <a
          href={toMediaUrl(post.fileUrl)}
          className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-linkup hover:underline"
        >
          <Download className="size-4" aria-hidden />
          첨부 파일
        </a>
      )}

      <div className="mt-3 flex items-center gap-4 text-sm text-zinc-500">
        <button type="button" onClick={() => void toggleLike()} className="inline-flex items-center gap-1">
          <Heart
            className={post.likedByMe ? 'size-4 fill-linkup text-linkup' : 'size-4'}
            aria-hidden
          />
          {post.likeCount}
        </button>
        <span className="inline-flex items-center gap-1">
          <MessageCircle className="size-4" aria-hidden />
          {replyCount}
        </span>
      </div>
      {notice && <p className="mt-2 text-sm text-red-500">{notice}</p>}

      <div className="mt-4 flex min-h-0 flex-1 flex-col border-t border-zinc-100 pt-3">
        <h2 className="mb-2 text-sm font-semibold text-zinc-900">댓글 {replyCount}</h2>
        <PostReplySection
          postId={post.id}
          postAuthorId={post.memberId}
          viewerId={viewerId}
          accessToken={accessToken}
          subscriberOnly={post.subscriberOnly}
          onCount={setReplyCount}
          onReport={(replyId) => setReportTarget({ kind: 'reply', replyId })}
        />
      </div>

      {confirmDelete && (
        <ConfirmDialog
          message="정말 삭제하시겠습니까?"
          pending={deleting}
          onClose={() => setConfirmDelete(false)}
          onConfirm={() => void removePost()}
        />
      )}

      {reportTarget && (
        <ReportDialog
          title={reportTarget.kind === 'post' ? '게시글 신고' : '댓글 신고'}
          onClose={() => setReportTarget(null)}
          onSubmit={submitReport}
        />
      )}
    </div>
  );
}
