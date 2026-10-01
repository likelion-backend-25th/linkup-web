import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

export type CancelDialogTone = 'neutral' | 'danger' | 'info' | 'success';

interface CancelDialogFrameProps {
  tone: CancelDialogTone;
  icon: ReactNode;
  title: string;
  description?: ReactNode;
  /** true 면 닫기(X·바깥 클릭·Esc)를 막는다. */
  busy?: boolean;
  children?: ReactNode;
  onClose: () => void;
}

const toneRing: Record<CancelDialogTone, string> = {
  neutral: 'border-zinc-800 text-zinc-800',
  danger: 'border-red-500 text-red-500',
  info: 'border-blue-500 text-blue-500',
  success: 'border-green-500 text-green-500',
};

export function CancelDialogFrame({
  tone,
  icon,
  title,
  description,
  busy = false,
  children,
  onClose,
}: CancelDialogFrameProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [busy, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={busy ? undefined : onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-dialog-title"
        aria-busy={busy}
        className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          aria-label="닫기"
          className="absolute right-4 top-4 rounded-full p-1 text-zinc-500 hover:bg-zinc-100 disabled:opacity-40"
        >
          <X className="size-5" />
        </button>

        <div className="flex flex-col items-center text-center">
          <span
            className={`flex size-14 items-center justify-center rounded-full border-2 ${toneRing[tone]}`}
          >
            {icon}
          </span>
          <h2 id="cancel-dialog-title" className="mt-4 text-base font-bold text-zinc-900">
            {title}
          </h2>
          {description && (
            <div className="mt-2 text-sm leading-relaxed text-zinc-500">{description}</div>
          )}
        </div>

        {children && <div className="mt-6">{children}</div>}
      </div>
    </div>
  );
}
