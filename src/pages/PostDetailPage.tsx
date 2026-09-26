import { useEffect, useState } from 'react';
import { ArrowLeft, Download, Heart } from 'lucide-react';
import { Link, useParams } from 'react-router';
import { fetchPost } from '@/api/posts.ts';
import { isAbortError, toErrorMessage } from '@/api/http.ts';
import { PostImageGallery } from '@/components/PostImageGallery.tsx';
import { PostOwnerActions } from '@/components/PostOwnerActions.tsx';
import { useAuthStore } from '@/stores/useAuthStore.ts';
import type { PostDetailResponse, PostResponse } from '@/types/post.ts';
import { formatRelativeTime } from '@/utils/formatDateTime.ts';

function sortedImages(post: PostDetailResponse) {
  return [...post.images].sort((left, right) => left.imageOrder - right.imageOrder);
}

function toEditablePost(post: PostDetailResponse): PostResponse {
  return {
    id: post.id,
    memberId: post.memberId,
    content: post.content,
    imageUrl: null,
    likeCount: post.likeCount,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  };
}

export function PostDetailPage() {
  const { id } = useParams();
  const postId = Number(id);
  const hasValidId = Number.isInteger(postId) && postId > 0;

  const accessToken = useAuthStore((state) => state.accessToken);
  const profile = useAuthStore((state) => state.profile);

  const [post, setPost] = useState<PostDetailResponse | null>(null);
  const [loading, setLoading] = useState(hasValidId);
  const [error, setError] = useState<string | null>(
    hasValidId ? null : '게시글을 찾을 수 없습니다.',
  );

  useEffect(() => {
    if (!hasValidId) {
      return;
    }

    const controller = new AbortController();

    // 경로의 게시글 ID로 단건 조회하고, 페이지를 벗어나면 요청을 취소한다.
    async function loadPost() {
      setLoading(true);
      setError(null);
      setPost(null);
      try {
        const data = await fetchPost(postId, controller.signal);
        setPost(data);
      } catch (caught: unknown) {
        if (isAbortError(caught)) {
          return;
        }
        setError(toErrorMessage(caught));
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadPost();
    return () => controller.abort();
  }, [hasValidId, postId]);

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl bg-white shadow-sm">
      <div className="shrink-0 border-b border-zinc-100 px-5 py-3">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm font-medium text-zinc-500 hover:text-linkup"
        >
          <ArrowLeft className="size-4" aria-hidden />
          피드
        </Link>
      </div>

      {loading && <p className="px-5 py-6 text-sm text-zinc-400">게시글을 불러오는 중...</p>}
      {error && (
        <div className="px-5 py-6">
          <h2 className="text-lg font-semibold text-zinc-900">게시글을 불러오지 못했습니다</h2>
          <p className="mt-2 text-sm text-red-500">{error}</p>
        </div>
      )}

      {!loading && !error && post && (
        <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[minmax(0,1.15fr)_minmax(17rem,0.85fr)] lg:overflow-hidden">
          <div className="min-h-72 bg-zinc-50 p-4 lg:h-full lg:min-h-0">
            <PostImageGallery key={post.id} images={sortedImages(post)} />
          </div>

          <div className="flex min-h-0 flex-col gap-4 overflow-y-auto px-5 py-5">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-full bg-linkup-soft text-sm font-semibold text-linkup">
                {String(post.memberId).slice(-1)}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-zinc-900">회원 {post.memberId}</p>
                <p className="text-xs text-zinc-400">
                  @{post.memberId}
                  <span className="mx-1">·</span>
                  <time dateTime={post.createdAt}>{formatRelativeTime(post.createdAt)}</time>
                </p>
              </div>
              {post.subscriberOnly && (
                <span className="ml-auto rounded-full bg-linkup-soft px-2 py-1 text-xs font-medium text-linkup">
                  구독자 전용
                </span>
              )}
            </div>

            <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-800">{post.content}</p>

            {post.fileUrl && (
              <a
                href={post.fileUrl}
                className="inline-flex items-center gap-2 text-sm font-medium text-linkup hover:underline"
              >
                <Download className="size-4" aria-hidden />
                첨부 파일
              </a>
            )}

            <div className="flex items-center gap-1.5 text-sm text-zinc-500">
              <Heart className="size-4" aria-hidden />
              <span>{post.likeCount}</span>
            </div>

            {accessToken && profile?.id === post.memberId && (
              <PostOwnerActions
                key={post.updatedAt}
                post={toEditablePost(post)}
                accessToken={accessToken}
                onUpdated={(updated) =>
                  setPost({
                    ...post,
                    content: updated.content,
                    likeCount: updated.likeCount,
                    updatedAt: updated.updatedAt,
                  })
                }
              />
            )}
          </div>
        </div>
      )}
    </section>
  );
}
