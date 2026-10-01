import type { ReactNode } from 'react';

interface AlertDialogProps {
  title: string;
  message: string;
  detail?: string | null;
  pending?: boolean;
  children?: ReactNode;
  onClose: () => void;
}

export function AlertDialog({
  title,
  message,
  detail,
  pending = false,
  children,
  onClose,
}: AlertDialogProps) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4"
      onClick={pending ? undefined : onClose}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="alert-title"
        aria-describedby="alert-message"
        aria-busy={pending}
        className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="alert-title" className="text-base font-semibold text-zinc-900">
          {title}
        </h2>
        <p id="alert-message" className="mt-2 text-sm text-zinc-600">
          {message}
        </p>
        {detail && <p className="mt-1 text-xs text-zinc-400">{detail}</p>}
        {children}
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            autoFocus
            disabled={pending}
            onClick={onClose}
            className="rounded-xl bg-linkup px-4 py-2 text-sm font-medium text-white hover:bg-linkup/90 disabled:opacity-60"
          >
            {pending ? '처리 중...' : '확인'}
          </button>
        </div>
      </div>
    </div>
  );
}
