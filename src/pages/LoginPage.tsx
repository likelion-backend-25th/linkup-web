import { Navigate } from 'react-router';
import { LinkUpSideNav } from '@/components/LinkUpSideNav.tsx';
import { LoginIntroPanel } from '@/components/LoginIntroPanel.tsx';
import { SocialLoginButtons } from '@/components/SocialLoginButtons.tsx';
import { useAuthStore } from '@/stores/useAuthStore.ts';

export function LoginPage() {
  const accessToken = useAuthStore((state) => state.accessToken);

  if (accessToken) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-svh bg-canvas p-3 md:p-5 lg:h-svh lg:overflow-hidden">
      <div className="mx-auto grid min-h-[calc(100svh-1.5rem)] max-w-[92rem] gap-4 md:min-h-[calc(100svh-2.5rem)] lg:h-full lg:min-h-0 lg:grid-cols-[14rem_minmax(20rem,24rem)_minmax(0,1fr)]">
        <div className="lg:h-full lg:min-h-0">
          <LinkUpSideNav />
        </div>

        <main className="flex min-h-[28rem] flex-col items-center rounded-2xl bg-white px-8 py-12 shadow-sm lg:h-full lg:min-h-0">
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-zinc-900">LinkUp</h1>
          <p className="mt-2 mb-10 text-center text-sm text-zinc-500">
            취향이 맞는 사람들과 이어지는 공간입니다.
          </p>
          <div className="w-full">
            <SocialLoginButtons />
          </div>
        </main>

        <LoginIntroPanel />
      </div>
    </div>
  );
}
