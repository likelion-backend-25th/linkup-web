import { useEffect, useState } from 'react';
import { ArrowLeft, Heart } from 'lucide-react';
import { Link, useParams } from 'react-router';
import { fetchPost } from '@/api/posts.ts';
import { isAbortError, toErrorMessage } from '@/api/http.ts';
import { PostOwnerActions } from '@/components/PostOwnerActions.tsx';
import { useAuthStore } from '@/stores/useAuthStore.ts';
import type { PostResponse } from '@/types/post.ts';
import { formatDateTime } from '@/utils/formatDateTime.ts';

export function PostDetailPage() {
  const { id } = useParams();
  const postId = Number(id);
  const hasValidId = Number.isInteger(postId) && postId > 0;

  const accessToken = useAuthStore((state) => state.accessToken);
  const profile = useAuthStore((state) => state.profile);

  const [post, setPost] = useState<PostResponse | null>(null);
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
    <section className="h-full overflow-y-auto rounded-2xl bg-white p-6 shadow-sm">
      <Link
        to="/"
        className="mb-5 inline-flex items-center gap-1 text-sm font-medium text-zinc-500 hover:text-linkup"
      >
        <ArrowLeft className="size-4" aria-hidden />
        피드
      </Link>

      {loading && <p className="text-sm text-zinc-400">게시글을 불러오는 중...</p>}
      {error && (
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">게시글을 불러오지 못했습니다</h2>
          <p className="mt-2 text-sm text-red-500">{error}</p>
        </div>
      )}

      {!loading && !error && post && (
        <article>
          <div className="mb-4 flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-linkup-soft text-sm font-semibold text-linkup">
              {String(post.memberId).slice(-1)}
            </span>
            <div>
              <p className="text-sm font-semibold text-zinc-900">회원{post.memberId}</p>
              <p className="text-xs text-zinc-400">@{post.memberId}</p>
            </div>
          </div>

          {post.imageUrl ? (
            <img
              src={post.imageUrl}
              alt=""
              className="mb-4 h-64 w-full rounded-xl object-cover"
            />
          ) : null}

          <p className="whitespace-pre-wrap text-base leading-relaxed text-zinc-900">
            {post.content}
          </p>

          <div className="mt-6 flex items-center gap-2 text-sm text-zinc-400">
            <Heart className="size-4" aria-hidden />
            <span>{post.likeCount}</span>
          </div>

          <dl className="mt-6 space-y-1 text-xs text-zinc-400">
            <div>
              <dt className="inline">등록 </dt>
              <dd className="inline">
                <time dateTime={post.createdAt}>{formatDateTime(post.createdAt)}</time>
              </dd>
            </div>
            <div>
              <dt className="inline">수정 </dt>
              <dd className="inline">
                <time dateTime={post.updatedAt}>{formatDateTime(post.updatedAt)}</time>
              </dd>
            </div>
          </dl>

          {accessToken && profile?.id === post.memberId && (
            <PostOwnerActions
              key={post.updatedAt}
              post={post}
              accessToken={accessToken}
              onUpdated={setPost}
            />
          )}
        </article>
      )}
    </section>
  );
}
