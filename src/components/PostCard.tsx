import { Heart, MessageCircle } from 'lucide-react';
import { Link } from 'react-router';
import { MediaImage } from '@/components/MediaImage.tsx';
import { MemberAvatar } from '@/components/MemberAvatar.tsx';
import type { PostFeedItem } from '@/types/feed.ts';
import { formatRelativeTime } from '@/utils/formatDateTime.ts';

interface PostCardProps {
  post: PostFeedItem;
}

export function PostCard({ post }: PostCardProps) {
  const profileState = {
    name: post.memberName,
    uniqueId: post.uniqueId,
    profileImage: post.profileImageUrl,
  };

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
                className="mt-3 h-48 w-full rounded-xl object-cover"
              />
            ) : null}
          </Link>

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
    </article>
  );
}
