import { useState } from 'react';
import Cropper, { type Area, type Point } from 'react-easy-crop';
import { cropImage, type CropArea } from '@/utils/cropImage.ts';

type CropRatio = 'original' | 'square' | 'portrait';

interface ImageCropDialogProps {
  imageUrl: string;
  fileName: string;
  originalAspect: number;
  initialRatio?: CropRatio;
  lockRatio?: boolean;
  onClose: () => void;
  onSave: (file: File) => void;
}

const ratioOptions: { id: CropRatio; label: string }[] = [
  { id: 'original', label: '원본' },
  { id: 'square', label: '1:1' },
  { id: 'portrait', label: '4:5' },
];

function aspectFor(ratio: CropRatio, originalAspect: number): number {
  if (ratio === 'square') {
    return 1;
  }
  if (ratio === 'portrait') {
    return 4 / 5;
  }
  return originalAspect;
}

export function ImageCropDialog({
  imageUrl,
  fileName,
  originalAspect,
  initialRatio = 'original',
  lockRatio = false,
  onClose,
  onSave,
}: ImageCropDialogProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [ratio, setRatio] = useState<CropRatio>(initialRatio);
  const [croppedArea, setCroppedArea] = useState<CropArea | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!croppedArea) {
      return;
    }
    setPending(true);
    setError(null);
    try {
      const file = await cropImage(imageUrl, croppedArea, fileName);
      onSave(file);
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : '사진을 편집하지 못했습니다.');
      setPending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="crop-title"
        className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-xl"
      >
        <h2 id="crop-title" className="text-base font-semibold text-zinc-900">
          사진 편집
        </h2>

        <div className="relative mt-4 h-96 overflow-hidden rounded-xl bg-zinc-950">
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={aspectFor(ratio, originalAspect)}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_, pixels: Area) => setCroppedArea(pixels)}
            showGrid
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {lockRatio
            ? null
            : ratioOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    setRatio(option.id);
                    setCrop({ x: 0, y: 0 });
                    setZoom(1);
                    setCroppedArea(null);
                  }}
                  className={
                    ratio === option.id
                      ? 'rounded-full bg-linkup px-3 py-1.5 text-xs font-semibold text-white'
                      : 'rounded-full border border-zinc-200 px-3 py-1.5 text-xs text-zinc-600'
                  }
                >
                  {option.label}
                </button>
              ))}
          <label className="ml-auto flex min-w-44 items-center gap-2 text-xs text-zinc-500">
            확대
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
              className="w-full accent-linkup"
            />
          </label>
        </div>

        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={onClose}
            className="rounded-xl border border-zinc-200 px-4 py-2 text-sm text-zinc-600 disabled:opacity-60"
          >
            취소
          </button>
          <button
            type="button"
            disabled={pending || !croppedArea}
            onClick={() => void handleSave()}
            className="rounded-xl bg-linkup px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {pending ? '적용 중...' : '편집 적용'}
          </button>
        </div>
      </div>
    </div>
  );
}
