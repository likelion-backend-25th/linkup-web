import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { deletePost, updatePost } from '@/api/posts.ts';
import { toErrorMessage } from '@/api/http.ts';
import { postUpdateSchema, type PostUpdateFormValues } from '@/pages/postUpdateSchema.ts';
import type { PostResponse } from '@/types/post.ts';

interface PostOwnerActionsProps {
  post: PostResponse;
  accessToken: string;
  onUpdated: (post: PostResponse) => void;
}

export function PostOwnerActions({ post, accessToken, onUpdated }: PostOwnerActionsProps) {
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PostUpdateFormValues>({
    resolver: zodResolver(postUpdateSchema),
    defaultValues: {
      content: post.content,
      imageUrl: post.imageUrl ?? '',
    },
  });

  async function onSave(values: PostUpdateFormValues) {
    setActionError(null);
    try {
      const updated = await updatePost(
        post.id,
        {
          content: values.content,
          imageUrl: values.imageUrl === '' ? null : values.imageUrl,
        },
        accessToken,
      );
      onUpdated(updated);
      setEditing(false);
    } catch (caught: unknown) {
      setActionError(toErrorMessage(caught));
    }
  }

  async function onDelete() {
    const confirmed = window.confirm('이 게시글을 삭제할까요?');
    if (!confirmed) {
      return;
    }

    setActionError(null);
    setDeleting(true);
    try {
      await deletePost(post.id, accessToken);
      await navigate('/');
    } catch (caught: unknown) {
      setActionError(toErrorMessage(caught));
      setDeleting(false);
    }
  }

  if (!editing) {
    return (
      <div className="mt-6">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-xl border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            수정
          </button>
          <button
            type="button"
            onClick={() => void onDelete()}
            disabled={deleting}
            className="rounded-xl border border-red-100 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
          >
            {deleting ? '삭제 중...' : '삭제'}
          </button>
        </div>
        {actionError && <p className="mt-2 text-sm text-red-600">{actionError}</p>}
      </div>
    );
  }

  return (
    <form className="mt-6 flex flex-col gap-3" onSubmit={handleSubmit(onSave)}>
      <label htmlFor="content" className="text-sm font-medium text-zinc-700">
        본문
      </label>
      <textarea
        id="content"
        rows={6}
        className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-900 outline-none focus:border-linkup focus:bg-white"
        {...register('content')}
      />
      {errors.content && <p className="text-sm text-red-600">{errors.content.message}</p>}

      <label htmlFor="imageUrl" className="text-sm font-medium text-zinc-700">
        이미지 URL
      </label>
      <input
        id="imageUrl"
        className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-900 outline-none focus:border-linkup focus:bg-white"
        {...register('imageUrl')}
      />
      {errors.imageUrl && <p className="text-sm text-red-600">{errors.imageUrl.message}</p>}

      {actionError && <p className="text-sm text-red-600">{actionError}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-xl bg-linkup px-3 py-2 text-sm font-medium text-white hover:bg-[#5b4ee8] disabled:opacity-60"
        >
          {isSubmitting ? '저장 중...' : '저장'}
        </button>
        <button
          type="button"
          onClick={() => {
            setEditing(false);
            setActionError(null);
          }}
          className="rounded-xl border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          취소
        </button>
      </div>
    </form>
  );
}
