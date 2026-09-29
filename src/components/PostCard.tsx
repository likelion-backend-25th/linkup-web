import { Heart, MessageCircle } from 'lucide-react';
import { Link } from 'react-router';
import type { PostFeedItem } from '@/types/feed.ts';
import { formatRelativeTime } from '@/utils/formatDateTime.ts';
import { toMediaUrl } from '@/utils/mediaUrl.ts';

interface PostCardProps {
  post: PostFeedItem;
}

export function PostCard({ post }: PostCardProps) {
  return (
    <article className="border-b border-zinc-100 py-5 last:border-b-0">
      <Link to={`/posts/${post.postId}`} className="block">
        <div className="flex items-start gap-3">
          {post.profileImageUrl ? (
            <img
              src={toMediaUrl(post.profileImageUrl)}
              alt=""
              className="size-9 shrink-0 rounded-full object-cover"
            />
          ) : (
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-linkup-soft text-sm font-semibold text-linkup">
              {post.memberName.slice(0, 1)}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold text-zinc-900">{post.memberName}</span>
              <span className="text-zinc-400">@{post.uniqueId}</span>
              <span className="ml-auto text-xs text-zinc-400">
                {formatRelativeTime(post.createdAt)}
              </span>
            </div>

            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-800">
              {post.content}
            </p>

            {post.mainImageUrl ? (
              <img
                src={toMediaUrl(post.mainImageUrl)}
                alt=""
                className="mt-3 h-48 w-full rounded-xl object-cover"
              />
            ) : null}

            <div className="mt-3 flex items-center gap-4 text-xs text-zinc-400">
              <span className="inline-flex items-center gap-1">
                <Heart className="size-3.5" aria-hidden />
                {post.likeCount}
              </span>
              <span className="inline-flex items-center gap-1">
                <MessageCircle className="size-3.5" aria-hidden />
                {post.commentCount}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}
