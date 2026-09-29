import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router';
import { fetchPost } from '@/api/posts.ts';
import { isAbortError, toErrorMessage } from '@/api/http.ts';
import { PostDetailPanel } from '@/components/PostDetailPanel.tsx';
import { PostImageGallery } from '@/components/PostImageGallery.tsx';
import { useAuthStore } from '@/stores/useAuthStore.ts';
import type { PostDetailResponse } from '@/types/post.ts';

function sortedImages(post: PostDetailResponse) {
  return [...post.images].sort((left, right) => left.imageOrder - right.imageOrder);
}

export function PostDetailPage() {
  const { id } = useParams();
  const postId = Number(id);
  const hasValidId = Number.isInteger(postId) && postId > 0;

  const accessToken = useAuthStore((state) => state.accessToken);
  const viewerId = useAuthStore((state) => state.profile?.id ?? null);

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
        <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.9fr)] lg:overflow-hidden">
          <div className="min-h-72 bg-zinc-50 p-4 lg:h-full lg:min-h-0">
            <PostImageGallery key={post.id} images={sortedImages(post)} />
          </div>
          <PostDetailPanel
            key={post.id}
            post={post}
            accessToken={accessToken}
            viewerId={viewerId}
            onPostChange={setPost}
          />
        </div>
      )}
    </section>
  );
}
