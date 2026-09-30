interface ConfirmDialogProps {
  message: string;
  confirmLabel?: string;
  pending?: boolean;
  danger?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ConfirmDialog({
  message,
  confirmLabel = '삭제',
  pending = false,
  danger = false,
  onClose,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="confirm-title" className="text-base font-semibold text-zinc-900">
          {message}
        </h2>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={onClose}
            className="rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-600 disabled:opacity-60"
          >
            취소
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={onConfirm}
            className={
              danger
                ? 'rounded-xl border border-red-500 px-3 py-2 text-sm font-medium text-red-500 disabled:opacity-60'
                : 'rounded-xl bg-linkup px-3 py-2 text-sm font-medium text-white disabled:opacity-60'
            }
          >
            {pending ? `${confirmLabel} 중...` : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
