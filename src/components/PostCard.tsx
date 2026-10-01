import { useState } from 'react';
import { Heart, MessageCircle } from 'lucide-react';
import { Link } from 'react-router';
import { setPostLike } from '@/api/posts.ts';
import { toErrorMessage } from '@/api/http.ts';
import { MediaImage } from '@/components/MediaImage.tsx';
import { MemberAvatar } from '@/components/MemberAvatar.tsx';
import { useAuthStore } from '@/stores/useAuthStore.ts';
import { useLoginPromptStore } from '@/stores/useLoginPromptStore.ts';
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
  const promptIfLoggedOut = useLoginPromptStore((state) => state.promptIfLoggedOut);
  const profileState = {
    name: post.memberName,
    uniqueId: post.uniqueId,
    profileImage: post.profileImageUrl,
  };

  async function toggleLike() {
    if (promptIfLoggedOut() || !accessToken) {
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
    <article className="border-b border-zinc-100 py-4 last:border-b-0">
      <div className="flex items-start gap-3">
        <Link to={`/members/${post.memberId}`} state={profileState} aria-label={`${post.memberName} 프로필`}>
          <MemberAvatar name={post.memberName} imageUrl={post.profileImageUrl} size="md" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-sm">
            <Link
              to={`/members/${post.memberId}`}
              state={profileState}
              className="flex min-w-0 items-center gap-1.5 hover:text-linkup"
            >
              <span className="truncate font-semibold text-zinc-900">{post.memberName}</span>
              <span className="truncate text-xs text-zinc-400">@{post.uniqueId}</span>
            </Link>
            <span className="ml-auto shrink-0 text-xs text-zinc-400">
              {formatRelativeTime(post.createdAt)}
            </span>
          </div>
          <Link to={`/posts/${post.postId}`} state={{ authorMemberId: post.memberId }} className="block">
            <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">
              {post.content}
            </p>

            {post.mainImageUrl ? (
              <span className="mt-3 block aspect-square w-3/4 overflow-hidden rounded-2xl bg-zinc-100">
                <MediaImage
                  src={post.mainImageUrl}
                  alt=""
                  className="size-full object-cover object-center"
                />
              </span>
            ) : null}
          </Link>

          <div className="mt-3.5 flex items-center gap-6 text-base font-medium text-zinc-500">
            <button
              type="button"
              onClick={() => void toggleLike()}
              className="inline-flex items-center gap-2 hover:text-linkup"
              aria-pressed={likedByMe}
              aria-label="좋아요"
            >
              <Heart
                className={likedByMe ? 'size-6 fill-linkup text-linkup' : 'size-6'}
                aria-hidden
              />
              <span className="tabular-nums">{likeCount}</span>
            </button>
            <Link
              to={`/posts/${post.postId}`}
              state={{ authorMemberId: post.memberId }}
              className="inline-flex items-center gap-2 hover:text-linkup"
              aria-label="댓글"
            >
              <MessageCircle className="size-6" aria-hidden />
              <span className="tabular-nums">{post.commentCount}</span>
            </Link>
          </div>
          {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
        </div>
      </div>
    </article>
  );
}
