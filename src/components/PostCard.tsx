import { useState } from 'react';
import { Heart, MessageCircle } from 'lucide-react';
import { Link } from 'react-router';
import { setPostLike } from '@/api/posts.ts';
import { toErrorMessage } from '@/api/http.ts';
import { MediaImage } from '@/components/MediaImage.tsx';
import { MemberAvatar } from '@/components/MemberAvatar.tsx';
import { useAuthStore } from '@/stores/useAuthStore.ts';
import type { PostFeedItem } from '@/types/feed.ts';
import { formatRelativeTime } from '@/utils/formatDateTime.ts';

interface PostCardProps {
  post: PostFeedItem;
}

export function PostCard({ post }: PostCardProps) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [likedByMe, setLikedByMe] = useState(post.likedByMe);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [error, setError] = useState<string | null>(null);
  const profileState = {
    name: post.memberName,
    uniqueId: post.uniqueId,
    profileImage: post.profileImageUrl,
  };

  async function toggleLike() {
    if (!accessToken) {
      setError('로그인 후 이용할 수 있습니다.');
      return;
    }
    const next = !likedByMe;
    try {
      await setPostLike(post.postId, next, accessToken);
      setLikedByMe(next);
      setLikeCount((count) => Math.max(0, count + (next ? 1 : -1)));
      setError(null);
    } catch (caught: unknown) {
      setError(toErrorMessage(caught));
    }
  }

  return (
    <article className="border-b border-zinc-100 py-5 last:border-b-0">
      <div className="flex items-start gap-3">
        <Link to={`/members/${post.memberId}`} state={profileState} aria-label={`${post.memberName} 프로필`}>
          <MemberAvatar name={post.memberName} imageUrl={post.profileImageUrl} size="sm" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-sm">
            <Link
              to={`/members/${post.memberId}`}
              state={profileState}
              className="flex min-w-0 items-center gap-2 hover:text-linkup"
            >
              <span className="font-semibold text-zinc-900">{post.memberName}</span>
              <span className="text-zinc-400">@{post.uniqueId}</span>
            </Link>
            <span className="ml-auto text-xs text-zinc-400">
              {formatRelativeTime(post.createdAt)}
            </span>
          </div>
          <Link to={`/posts/${post.postId}`} className="block">
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-800">
              {post.content}
            </p>

            {post.mainImageUrl ? (
              <MediaImage
                src={post.mainImageUrl}
                alt=""
                className="mt-3 h-auto w-full rounded-xl object-contain"
              />
            ) : null}
          </Link>

          <div className="mt-3 flex items-center gap-4 text-xs text-zinc-400">
            <button
              type="button"
              onClick={() => void toggleLike()}
              className="inline-flex items-center gap-1 hover:text-linkup"
              aria-pressed={likedByMe}
              aria-label="좋아요"
            >
              <Heart
                className={likedByMe ? 'size-3.5 fill-linkup text-linkup' : 'size-3.5'}
                aria-hidden
              />
              {likeCount}
            </button>
            <Link
              to={`/posts/${post.postId}`}
              className="inline-flex items-center gap-1 hover:text-linkup"
              aria-label="댓글"
            >
              <MessageCircle className="size-3.5" aria-hidden />
              {post.commentCount}
            </Link>
          </div>
          {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
        </div>
      </div>
    </article>
  );
}
