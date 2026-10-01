import { useEffect } from 'react';
import { SocialLoginButtons } from '@/components/SocialLoginButtons.tsx';
import { useAuthStore } from '@/stores/useAuthStore.ts';
import { useLoginPromptStore } from '@/stores/useLoginPromptStore.ts';

export function LoginPromptDialog() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const open = useLoginPromptStore((state) => state.open);
  const hide = useLoginPromptStore((state) => state.hide);

  useEffect(() => {
    if (accessToken) {
      hide();
    }
  }, [accessToken, hide]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={hide}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-prompt-title"
        className="w-full max-w-sm rounded-2xl bg-white px-6 py-7 shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="login-prompt-title" className="text-center text-lg font-semibold text-zinc-900">
          로그인해야 이용할 수 있어요
        </h2>
        <p className="mt-2 text-center text-sm text-zinc-500">
          이 기능은 로그인 후 사용할 수 있습니다.
        </p>
        <div className="mt-6">
          <SocialLoginButtons />
        </div>
        <button
          type="button"
          onClick={hide}
          className="mt-4 w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
        >
          닫기
        </button>
      </div>
    </div>
  );
}
