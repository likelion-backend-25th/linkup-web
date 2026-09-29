import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Plus, X } from 'lucide-react';
import { useNavigate } from 'react-router';
import { createPost } from '@/api/posts.ts';
import { toErrorMessage } from '@/api/http.ts';
import { useAuthStore } from '@/stores/useAuthStore.ts';

const MAX_IMAGES = 5;
const MAX_CONTENT = 2000;

interface PreviewImage {
  file: File;
  url: string;
}

export function PostCreatePage() {
  const navigate = useNavigate();
  const accessToken = useAuthStore((state) => state.accessToken);
  const isCreator = useAuthStore((state) => state.profile?.role === 'ROLE_CREATOR');
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imagesRef = useRef<PreviewImage[]>([]);

  const [images, setImages] = useState<PreviewImage[]>([]);
  const [selected, setSelected] = useState(0);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [content, setContent] = useState('');
  const [subscriberOnly, setSubscriberOnly] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  imagesRef.current = images;

  useEffect(() => {
    return () => {
      for (const image of imagesRef.current) {
        URL.revokeObjectURL(image.url);
      }
    };
  }, []);

  const current = images[selected];
  const canAttachFile = isCreator && subscriberOnly;

  function addImages(fileList: FileList | null) {
    if (!fileList) {
      return;
    }
    const next = [...images];
    for (const file of fileList) {
      if (next.length >= MAX_IMAGES) {
        break;
      }
      if (!file.type.startsWith('image/')) {
        setError('이미지 파일만 올릴 수 있습니다.');
        return;
      }
      next.push({ file, url: URL.createObjectURL(file) });
    }
    setError(null);
    setImages(next);
    if (images.length === 0 && next.length > 0) {
      setSelected(0);
    }
  }

  function removeImage(index: number) {
    URL.revokeObjectURL(images[index].url);
    const next = images.filter((_, imageIndex) => imageIndex !== index);
    setImages(next);
    setSelected(Math.max(0, Math.min(selected, next.length - 1)));
  }

  async function onSubmit() {
    if (!accessToken) {
      setError('로그인 후 이용할 수 있습니다.');
      return;
    }
    if (content.trim() === '') {
      setError('본문을 입력하세요.');
      return;
    }
    if (images.length === 0) {
      setError('사진을 1장 이상 올려 주세요.');
      return;
    }

    setPending(true);
    setError(null);
    try {
      const id = await createPost(
        content.trim(),
        subscriberOnly,
        images.map((image) => image.file),
        canAttachFile ? attachment : null,
        accessToken,
      );
      await navigate(`/posts/${id}`);
    } catch (caught: unknown) {
      setError(toErrorMessage(caught));
      setPending(false);
    }
  }

  return (
    <section className="h-full overflow-y-auto rounded-2xl bg-white p-6 shadow-sm">
      <h1 className="text-lg font-semibold text-zinc-900">새로운 이야기를 공유해보세요</h1>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="relative flex min-h-56 items-center justify-center overflow-hidden rounded-2xl bg-zinc-50">
          {current ? (
            <>
              <img src={current.url} alt="" className="h-full max-h-72 w-full object-cover" />
              <button
                type="button"
                aria-label="선택한 사진 삭제"
                onClick={() => removeImage(selected)}
                className="absolute top-3 right-3 rounded-full bg-white/90 p-1.5 text-zinc-600 shadow-sm"
              >
                <X className="size-4" aria-hidden />
              </button>
            </>
          ) : (
            <p className="text-sm text-zinc-400">사진</p>
          )}
        </div>

        <button
          type="button"
          onClick={() => imageInputRef.current?.click()}
          disabled={images.length >= MAX_IMAGES}
          className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 text-sm text-zinc-500 disabled:opacity-50"
        >
          <ImagePlus className="mb-2 size-5" aria-hidden />
          사진 추가하기
          <span className="mt-1 text-xs text-zinc-400">최대 {MAX_IMAGES}장</span>
        </button>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <ul className="flex gap-2 overflow-x-auto">
          {images.map((image, index) => (
            <li key={image.url}>
              <button
                type="button"
                onClick={() => setSelected(index)}
                aria-label={`사진 ${index + 1} 미리보기`}
                className={
                  index === selected
                    ? 'block size-14 overflow-hidden rounded-xl ring-2 ring-linkup'
                    : 'block size-14 overflow-hidden rounded-xl ring-1 ring-zinc-200'
                }
              >
                <img src={image.url} alt="" className="size-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          aria-label="사진 추가"
          disabled={images.length >= MAX_IMAGES}
          onClick={() => imageInputRef.current?.click()}
          className="flex size-14 items-center justify-center rounded-xl border border-zinc-200 text-zinc-500 disabled:opacity-40"
        >
          <Plus className="size-5" aria-hidden />
        </button>
        <button
          type="button"
          disabled={!canAttachFile}
          onClick={() => fileInputRef.current?.click()}
          className="rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {attachment ? attachment.name : '파일 업로드'}
        </button>
        {!canAttachFile && (
          <p className="text-xs text-zinc-400">크리에이터의 구독자 전용 글만 파일을 올릴 수 있어요.</p>
        )}
      </div>

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => {
          addImages(event.target.files);
          event.target.value = '';
        }}
      />
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(event) => {
          setAttachment(event.target.files?.[0] ?? null);
          event.target.value = '';
        }}
      />

      <div className="relative mt-4">
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          maxLength={MAX_CONTENT}
          rows={6}
          placeholder="오늘도 좋은 하루 보내셨나요? ^^"
          className="w-full resize-none rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none focus:border-linkup focus:bg-white"
        />
        <p className="absolute right-3 bottom-3 text-xs text-zinc-400">
          {content.length}/{MAX_CONTENT}
        </p>
      </div>

      <div className="mt-5">
        <p className="text-sm font-semibold text-zinc-800">공개 범위</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => {
              setSubscriberOnly(false);
              setAttachment(null);
            }}
            className={
              subscriberOnly
                ? 'rounded-2xl border border-zinc-200 px-4 py-3 text-left'
                : 'rounded-2xl border border-linkup bg-linkup-soft px-4 py-3 text-left'
            }
          >
            <span className="block text-sm font-semibold text-zinc-900">전체 공개</span>
            <span className="mt-1 block text-xs text-zinc-500">누구나 볼 수 있어요</span>
          </button>
          <button
            type="button"
            disabled={!isCreator}
            onClick={() => setSubscriberOnly(true)}
            className={
              subscriberOnly
                ? 'rounded-2xl border border-linkup bg-linkup-soft px-4 py-3 text-left disabled:opacity-40'
                : 'rounded-2xl border border-zinc-200 px-4 py-3 text-left disabled:opacity-40'
            }
          >
            <span className="block text-sm font-semibold text-zinc-900">구독자 전용</span>
            <span className="mt-1 block text-xs text-zinc-500">구독자만 볼 수 있어요</span>
          </button>
        </div>
        <p className="mt-2 text-xs text-zinc-400">구독 판매 시 전용 게시글을 올릴 수 있어요</p>
      </div>

      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          disabled={pending}
          onClick={() => void onSubmit()}
          className="rounded-xl bg-linkup px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? '등록 중...' : '게시하기'}
        </button>
      </div>
    </section>
  );
}
