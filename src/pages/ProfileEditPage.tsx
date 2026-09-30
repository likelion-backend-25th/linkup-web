import { useEffect, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Camera } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
import { fetchMyProfile } from '@/api/auth.ts';
import { isAbortError, isHttpStatusError, toErrorMessage } from '@/api/http.ts';
import { updateMyProfile } from '@/api/members.ts';
import { ImageCropDialog } from '@/components/ImageCropDialog.tsx';
import { MemberAvatar } from '@/components/MemberAvatar.tsx';
import { useRequiredAccessToken } from '@/hooks/useRequiredAccessToken.ts';
import {
  profileEditSchema,
  type ProfileEditFormValues,
} from '@/pages/profileEditSchema.ts';
import { useAuthStore } from '@/stores/useAuthStore.ts';

interface CropTarget {
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

export function ProfileEditPage() {
  const navigate = useNavigate();
  const accessToken = useRequiredAccessToken();
  const setProfile = useAuthStore((state) => state.setProfile);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [remoteImage, setRemoteImage] = useState<string | null>(null);
  const [localImage, setLocalImage] = useState<{ file: File; url: string } | null>(null);
  const [cropTarget, setCropTarget] = useState<CropTarget | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProfileEditFormValues>({
    resolver: zodResolver(profileEditSchema),
    defaultValues: {
      name: '',
      uniqueId: '',
      introduction: '',
    },
  });

  const name = watch('name');

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const me = await fetchMyProfile(accessToken, controller.signal);
        reset({
          name: me.nickname,
          uniqueId: me.uniqueId ?? '',
          introduction: me.introduction ?? '',
        });
        setRemoteImage(me.profileImage);
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

    void load();
    return () => controller.abort();
  }, [accessToken, reset]);

  useEffect(() => {
    return () => {
      if (localImage) {
        URL.revokeObjectURL(localImage.url);
      }
    };
  }, [localImage]);

  async function onPickImage(file: File) {
    const imageUrl = URL.createObjectURL(file);
    try {
      const size = await loadImageSize(imageUrl);
      setCropTarget({
        imageUrl,
        fileName: file.name,
        originalAspect: size.width / size.height,
      });
    } catch (caught: unknown) {
      URL.revokeObjectURL(imageUrl);
      setError(toErrorMessage(caught));
    }
  }

  function applyCroppedImage(file: File) {
    if (cropTarget) {
      URL.revokeObjectURL(cropTarget.imageUrl);
    }
    if (localImage) {
      URL.revokeObjectURL(localImage.url);
    }
    setLocalImage({
      file,
      url: URL.createObjectURL(file),
    });
    setCropTarget(null);
  }

  async function onSave(values: ProfileEditFormValues) {
    setError(null);
    try {
      await updateMyProfile(
        {
          name: values.name,
          uniqueId: values.uniqueId,
          introduction: values.introduction.trim(),
        },
        localImage?.file ?? null,
        accessToken,
      );
      const next = await fetchMyProfile(accessToken);
      setProfile(next);
      await navigate('/profile');
    } catch (caught: unknown) {
      setError(
        isHttpStatusError(caught, 409)
          ? '이미 사용 중인 아이디입니다.'
          : toErrorMessage(caught),
      );
    }
  }

  return (
    <section className="flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm">
      <div className="shrink-0 border-b border-zinc-100 px-5 py-3">
        <Link
          to="/profile"
          className="inline-flex items-center gap-1 text-sm font-medium text-zinc-500 hover:text-linkup"
        >
          <ArrowLeft className="size-4" aria-hidden />
          뒤로
        </Link>
      </div>

      {loading ? (
        <p className="flex flex-1 items-center justify-center text-sm text-zinc-400">
          프로필을 불러오는 중...
        </p>
      ) : (
        <form
          className="flex-1 overflow-y-auto p-6"
          onSubmit={(event) => void handleSubmit(onSave)(event)}
        >
          <h1 className="text-lg font-semibold text-zinc-900">프로필 수정</h1>

          <div className="mt-6 flex flex-col items-center">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="relative"
              aria-label="프로필 이미지 변경"
            >
              <MemberAvatar
                name={name.trim() || '회원'}
                imageUrl={localImage?.url ?? remoteImage}
                size="lg"
              />
              <span className="absolute bottom-0 right-0 flex size-7 items-center justify-center rounded-full bg-linkup text-white shadow">
                <Camera className="size-3.5" aria-hidden />
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = '';
                if (file) {
                  void onPickImage(file);
                }
              }}
            />
            <p className="mt-2 text-xs text-zinc-400">프로필 사진을 눌러 변경</p>
          </div>

          <label className="mt-6 block text-sm font-medium text-zinc-700">
            이름
            <input
              {...register('name')}
              className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-linkup"
              maxLength={30}
            />
          </label>
          {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}

          <label className="mt-4 block text-sm font-medium text-zinc-700">
            아이디
            <input
              {...register('uniqueId')}
              className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-linkup"
              maxLength={30}
              autoComplete="off"
            />
          </label>
          {errors.uniqueId ? (
            <p className="mt-1 text-xs text-red-500">{errors.uniqueId.message}</p>
          ) : (
            <p className="mt-1 text-xs text-zinc-400">
              영문, 숫자, 마침표, 밑줄만. 다른 사람과 겹칠 수 없습니다.
            </p>
          )}

          <label className="mt-4 block text-sm font-medium text-zinc-700">
            소개
            <textarea
              {...register('introduction')}
              rows={4}
              className="mt-1.5 w-full resize-none rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-linkup"
              maxLength={200}
            />
          </label>
          {errors.introduction && (
            <p className="mt-1 text-xs text-red-500">{errors.introduction.message}</p>
          )}

          {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-6 w-full rounded-xl bg-linkup px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isSubmitting ? '저장 중...' : '저장'}
          </button>
        </form>
      )}

      {cropTarget && (
        <ImageCropDialog
          imageUrl={cropTarget.imageUrl}
          fileName={cropTarget.fileName}
          originalAspect={cropTarget.originalAspect}
          initialRatio="square"
          lockRatio
          onClose={() => {
            URL.revokeObjectURL(cropTarget.imageUrl);
            setCropTarget(null);
          }}
          onSave={applyCroppedImage}
        />
      )}
    </section>
  );
}
