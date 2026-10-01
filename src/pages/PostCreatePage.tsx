import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ImagePlus, Pencil, Plus, X } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import { createPost, deletePost, fetchPost, savePostEdit } from '@/api/posts.ts';
import { isAbortError, isHttpStatusError, toErrorMessage } from '@/api/http.ts';
import { ConfirmDialog } from '@/components/ConfirmDialog.tsx';
import { ImageCropDialog } from '@/components/ImageCropDialog.tsx';
import { MediaImage } from '@/components/MediaImage.tsx';
import { useAuthStore } from '@/stores/useAuthStore.ts';
import { legacyMediaUrl, toMediaUrl } from '@/utils/mediaUrl.ts';

const MAX_IMAGES = 5;
const MAX_CONTENT = 2000;

type PreviewImage =
  | { kind: 'remote'; id: number; url: string }
  | { kind: 'local'; file: File; url: string };

interface CropTarget {
  index: number;
  imageUrl: string;
  fileName: string;
  originalAspect: number;
}

function loadImageSize(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => reject(new Error('사진을 불러오지 못했습니다.'));
    image.src = src;
  });
}

export function PostCreatePage() {
  const navigate = useNavigate();
  const params = useParams();
  const editId = params.id === undefined ? null : Number(params.id);
  const isEdit = editId !== null && Number.isInteger(editId) && editId > 0;

  const accessToken = useAuthStore((state) => state.accessToken);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imagesRef = useRef<PreviewImage[]>([]);

  const [images, setImages] = useState<PreviewImage[]>([]);
  const [selected, setSelected] = useState(0);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [existingFileUrl, setExistingFileUrl] = useState<string | null>(null);
  const [removeExistingFile, setRemoveExistingFile] = useState(false);
  const [content, setContent] = useState('');
  const [subscriberOnly, setSubscriberOnly] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [loadingPost, setLoadingPost] = useState(isEdit);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [cropTarget, setCropTarget] = useState<CropTarget | null>(null);
  imagesRef.current = images;

  useEffect(() => {
    return () => {
      for (const image of imagesRef.current) {
        if (image.kind === 'local') {
          URL.revokeObjectURL(image.url);
        }
      }
    };
  }, []);

  useEffect(() => {
    if (!isEdit || editId === null) {
      return;
    }

    const controller = new AbortController();

    async function loadPost() {
      setLoadingPost(true);
      setError(null);
      try {
        const post = await fetchPost(editId as number, controller.signal);
        const sorted = [...post.images].sort((left, right) => left.imageOrder - right.imageOrder);
        setContent(post.content);
        setSubscriberOnly(post.subscriberOnly);
        setExistingFileUrl(post.fileUrl);
        setRemoveExistingFile(false);
        setImages(
          sorted.map((image) => ({
            kind: 'remote',
            id: image.id,
            url: image.imageUrl,
          })),
        );
        setSelected(0);
      } catch (caught: unknown) {
        if (isAbortError(caught)) {
          return;
        }
        setError(toErrorMessage(caught));
      } finally {
        if (!controller.signal.aborted) {
          setLoadingPost(false);
        }
      }
    }

    void loadPost();
    return () => controller.abort();
  }, [editId, isEdit]);

  const current = images[selected];

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
      next.push({ kind: 'local', file, url: URL.createObjectURL(file) });
    }
    setError(null);
    setImages(next);
    if (images.length === 0 && next.length > 0) {
      setSelected(0);
    }
  }

  function moveImage(from: number, to: number) {
    if (to < 0 || to >= images.length) {
      return;
    }
    const next = [...images];
    const [moved] = next.splice(from, 1);
    if (!moved) {
      return;
    }
    next.splice(to, 0, moved);
    setImages(next);
    setSelected(to);
  }

  function removeImage(index: number) {
    const target = images[index];
    if (target?.kind === 'local') {
      URL.revokeObjectURL(target.url);
    }
    const next = images.filter((_, imageIndex) => imageIndex !== index);
    setImages(next);
    setSelected(Math.max(0, Math.min(selected, next.length - 1)));
  }

  async function openImageEditor(index: number) {
    const image = images[index];
    if (!image) {
      return;
    }

    const preferred = toMediaUrl(image.url);
    const legacy = legacyMediaUrl(image.url);
    let sourceUrl = preferred;
    let size: { width: number; height: number };

    try {
      size = await loadImageSize(preferred);
    } catch {
      sourceUrl = legacy;
      try {
        size = await loadImageSize(legacy);
      } catch (caught: unknown) {
        setError(toErrorMessage(caught));
        return;
      }
    }

    setError(null);
    setCropTarget({
      index,
      imageUrl: sourceUrl,
      fileName: image.kind === 'local' ? image.file.name : `post-image-${image.id}.jpg`,
      originalAspect: size.width / size.height,
    });
  }

  function applyCroppedImage(file: File) {
    if (!cropTarget) {
      return;
    }
    const previous = images[cropTarget.index];
    if (previous?.kind === 'local') {
      URL.revokeObjectURL(previous.url);
    }
    const next = [...images];
    next[cropTarget.index] = {
      kind: 'local',
      file,
      url: URL.createObjectURL(file),
    };
    setImages(next);
    setSelected(cropTarget.index);
    setCropTarget(null);
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
      if (isEdit && editId !== null) {
        let newImageIndex = 0;
        const imageRequest = images.map((image) => {
          if (image.kind === 'remote') {
            return { imageId: image.id, newImageIndex: null };
          }
          const index = newImageIndex;
          newImageIndex += 1;
          return { imageId: null, newImageIndex: index };
        });
        const newImages = images.flatMap((image) => (image.kind === 'local' ? [image.file] : []));
        const removeFile = removeExistingFile;
        await savePostEdit(
          editId,
          content.trim(),
          subscriberOnly,
          removeFile,
          imageRequest,
          newImages,
          attachment,
          accessToken,
        );
        await navigate(`/posts/${editId}`);
        return;
      }

      const id = await createPost(
        content.trim(),
        subscriberOnly,
        images.flatMap((image) => (image.kind === 'local' ? [image.file] : [])),
        attachment,
        accessToken,
      );
      await navigate(`/posts/${id}`);
    } catch (caught: unknown) {
      const usedCreatorFeature = subscriberOnly || attachment !== null;
      setError(
        usedCreatorFeature && isHttpStatusError(caught, 403)
          ? '파일 업로드와 구독자 전용 등록은 크리에이터만 할 수 있습니다.'
          : toErrorMessage(caught),
      );
      setPending(false);
    }
  }

  async function onDelete() {
    if (!isEdit || editId === null || !accessToken) {
      return;
    }
    setPending(true);
    setError(null);
    try {
      await deletePost(editId, accessToken);
      await navigate('/');
    } catch (caught: unknown) {
      setError(toErrorMessage(caught));
      setPending(false);
      setConfirmDelete(false);
    }
  }

  if (loadingPost) {
    return (
      <section className="h-full overflow-y-auto rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-sm text-zinc-400">게시글을 불러오는 중...</p>
      </section>
    );
  }

  return (
    <section className="h-full overflow-y-auto rounded-2xl bg-white p-6 shadow-sm">
      <h1 className="text-lg font-semibold text-zinc-900">새로운 이야기를 공유해보세요</h1>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="relative flex min-h-56 items-center justify-center overflow-hidden rounded-2xl bg-zinc-50">
          {current ? (
            <>
              <MediaImage
                src={current.url}
                alt=""
                className="h-full max-h-72 w-full object-contain"
              />
              <button
                type="button"
                aria-label="선택한 사진 삭제"
                onClick={() => removeImage(selected)}
                className="absolute top-3 right-3 rounded-full bg-white/90 p-1.5 text-zinc-600 shadow-sm"
              >
                <X className="size-4" aria-hidden />
              </button>
              <button
                type="button"
                aria-label="선택한 사진 편집"
                onClick={() => void openImageEditor(selected)}
                className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1.5 text-xs font-medium text-zinc-700 shadow-sm"
              >
                <Pencil className="size-3.5" aria-hidden />
                편집
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
            <li key={image.kind === 'remote' ? `remote-${image.id}` : image.url}>
              <button
                type="button"
                onClick={() => setSelected(index)}
                aria-label={`사진 ${index + 1} 미리보기`}
                className={
                  index === selected
                    ? 'relative block size-14 overflow-hidden rounded-xl ring-2 ring-linkup'
                    : 'relative block size-14 overflow-hidden rounded-xl ring-1 ring-zinc-200'
                }
              >
                <MediaImage src={image.url} alt="" className="size-full object-cover" />
                <span className="absolute bottom-0.5 left-0.5 rounded bg-black/55 px-1 text-[10px] font-medium text-white">
                  {index + 1}
                </span>
              </button>
            </li>
          ))}
        </ul>
        {isEdit && images.length > 1 && (
          <div className="flex gap-1">
            <button
              type="button"
              aria-label="선택한 사진 앞으로"
              disabled={selected === 0}
              onClick={() => moveImage(selected, selected - 1)}
              className="flex size-9 items-center justify-center rounded-xl border border-zinc-200 text-zinc-600 disabled:opacity-40"
            >
              <ChevronLeft className="size-4" aria-hidden />
            </button>
            <button
              type="button"
              aria-label="선택한 사진 뒤로"
              disabled={selected === images.length - 1}
              onClick={() => moveImage(selected, selected + 1)}
              className="flex size-9 items-center justify-center rounded-xl border border-zinc-200 text-zinc-600 disabled:opacity-40"
            >
              <ChevronRight className="size-4" aria-hidden />
            </button>
          </div>
        )}
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
          onClick={() => fileInputRef.current?.click()}
          className="rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-600"
        >
          {attachment ? attachment.name : existingFileUrl ? '기존 첨부 파일' : '파일 업로드'}
        </button>
        {(attachment || existingFileUrl) && (
          <button
            type="button"
            onClick={() => {
              setAttachment(null);
              setExistingFileUrl(null);
              setRemoveExistingFile(true);
            }}
            className="rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-500"
          >
            파일 삭제
          </button>
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
          setRemoveExistingFile(false);
          event.target.value = '';
        }}
      />

      <div className="relative mt-4">
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          maxLength={MAX_CONTENT}
          rows={6}
          placeholder={`최대 ${MAX_CONTENT}자까지 작성할 수 있습니다.`}
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
            onClick={() => setSubscriberOnly(false)}
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
            onClick={() => setSubscriberOnly(true)}
            className={
              subscriberOnly
                ? 'rounded-2xl border border-linkup bg-linkup-soft px-4 py-3 text-left'
                : 'rounded-2xl border border-zinc-200 px-4 py-3 text-left'
            }
          >
            <span className="block text-sm font-semibold text-zinc-900">구독자 전용</span>
            <span className="mt-1 block text-xs text-zinc-500">구독자만 볼 수 있어요</span>
          </button>
        </div>
        <p className="mt-2 text-xs text-zinc-400">구독 판매 시 전용 게시글을 올릴 수 있어요</p>
      </div>

      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

      <div className="mt-4 flex justify-end gap-2">
        {isEdit && (
          <button
            type="button"
            disabled={pending}
            onClick={() => setConfirmDelete(true)}
            className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700 disabled:opacity-60"
          >
            삭제하기
          </button>
        )}
        <button
          type="button"
          disabled={pending}
          onClick={() => void onSubmit()}
          className="rounded-xl bg-linkup px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? '저장 중...' : isEdit ? '저장하기' : '게시하기'}
        </button>
      </div>

      {confirmDelete && (
        <ConfirmDialog
          message="정말 삭제하시겠습니까?"
          pending={pending}
          onClose={() => setConfirmDelete(false)}
          onConfirm={() => void onDelete()}
        />
      )}

      {cropTarget && (
        <ImageCropDialog
          imageUrl={cropTarget.imageUrl}
          fileName={cropTarget.fileName}
          originalAspect={cropTarget.originalAspect}
          onClose={() => setCropTarget(null)}
          onSave={applyCroppedImage}
        />
      )}
    </section>
  );
}
