import { useState } from 'react';

const reasons = ['스팸', '혐오/괴롭힘', '부적절한 내용', '기타'];

interface ReportDialogProps {
  title: string;
  onClose: () => void;
  onSubmit: (reason: string, content: string) => Promise<void>;
}

export function ReportDialog({ title, onClose, onSubmit }: ReportDialogProps) {
  const [reason, setReason] = useState(reasons[0]);
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit() {
    setPending(true);
    setError(null);
    try {
      await onSubmit(reason, content.trim());
      onClose();
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : '알 수 없는 오류');
      setPending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-title"
        className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-lg"
      >
        <h2 id="report-title" className="text-base font-semibold text-zinc-900">
          {title}
        </h2>
        <label htmlFor="report-reason" className="mt-4 block text-sm text-zinc-600">
          사유
        </label>
        <select
          id="report-reason"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-linkup"
        >
          {reasons.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <label htmlFor="report-content" className="mt-3 block text-sm text-zinc-600">
          내용
        </label>
        <textarea
          id="report-content"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows={4}
          maxLength={1000}
          placeholder="자세한 내용을 적어 주세요."
          className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-linkup"
        />
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-600"
          >
            취소
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => void handleSubmit()}
            className="rounded-xl bg-linkup px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {pending ? '보내는 중...' : '신고'}
          </button>
        </div>
      </div>
    </div>
  );
}
