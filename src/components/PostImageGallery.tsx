import { useState } from 'react';
import { MediaImage } from '@/components/MediaImage.tsx';
import type { PostImageResponse } from '@/types/post.ts';

interface PostImageGalleryProps {
  images: PostImageResponse[];
}

export function PostImageGallery({ images }: PostImageGalleryProps) {
  const [index, setIndex] = useState(0);
  const current = images[index];

  if (!current) {
    return (
      <div className="flex min-h-72 items-center justify-center rounded-2xl bg-zinc-100 text-sm text-zinc-400">
        등록된 사진이 없습니다.
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="relative min-h-80 flex-1 overflow-hidden rounded-2xl bg-zinc-100">
        <MediaImage
          src={current.imageUrl}
          alt={`사진 ${current.imageOrder}`}
          className="h-full w-full object-contain"
        />
        <span className="absolute right-3 bottom-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white">
          {index + 1} / {images.length}
        </span>
      </div>

      {images.length > 1 && (
        <ul className="mt-3 flex gap-2 overflow-x-auto">
          {images.map((image, imageIndex) => (
            <li key={image.id} className="shrink-0">
              <button
                type="button"
                onClick={() => setIndex(imageIndex)}
                aria-label={`사진 ${image.imageOrder} 보기`}
                aria-current={imageIndex === index ? 'true' : undefined}
                className={
                  imageIndex === index
                    ? 'block size-16 overflow-hidden rounded-xl ring-2 ring-linkup'
                    : 'block size-16 overflow-hidden rounded-xl ring-1 ring-zinc-200'
                }
              >
                <MediaImage src={image.imageUrl} alt="" className="size-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
