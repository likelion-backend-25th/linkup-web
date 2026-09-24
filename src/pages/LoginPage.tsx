import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Navigate, useNavigate } from 'react-router';
import { fetchMyProfile, loginRequest } from '@/api/auth.ts';
import { toErrorMessage } from '@/api/http.ts';
import { LinkUpSideNav } from '@/components/LinkUpSideNav.tsx';
import { LoginIntroPanel } from '@/components/LoginIntroPanel.tsx';
import { SocialLoginButtons } from '@/components/SocialLoginButtons.tsx';
import { loginSchema, type LoginFormValues } from '@/pages/loginSchema.ts';
import { useAuthStore } from '@/stores/useAuthStore.ts';

export function LoginPage() {
  const navigate = useNavigate();
  const accessToken = useAuthStore((state) => state.accessToken);
  const setSession = useAuthStore((state) => state.setSession);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  if (accessToken) {
    return <Navigate to="/" replace />;
  }

  async function onSubmit(values: LoginFormValues) {
    setSubmitError(null);
    try {
      const tokens = await loginRequest(values);
      const profile = await fetchMyProfile(tokens.accessToken);
      setSession(tokens, profile);
      await navigate('/');
    } catch (caught: unknown) {
      setSubmitError(toErrorMessage(caught));
    }
  }

  return (
    <div className="min-h-svh bg-canvas p-4 md:p-6">
      <div className="mx-auto grid min-h-[calc(100svh-2rem)] max-w-6xl gap-4 md:min-h-[calc(100svh-3rem)] lg:grid-cols-[13rem_minmax(20rem,1fr)_minmax(22rem,1.15fr)]">
        <LinkUpSideNav />

        <main className="flex flex-col items-center justify-center rounded-2xl bg-white px-6 py-12 shadow-sm">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
            LinkUp
          </h1>
          <p className="mt-2 mb-8 max-w-[16rem] text-center text-sm text-zinc-500">
            취향이 맞는 사람들과 이어지는 공간입니다.
          </p>

          <SocialLoginButtons />

          <form
            className="mt-8 flex w-full max-w-xs flex-col gap-3"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
          >
            <p className="text-center text-xs text-zinc-400">또는 이메일로 로그인</p>
            <label className="sr-only" htmlFor="email">
              이메일
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="이메일"
              className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-linkup focus:bg-white"
              {...register('email')}
            />
            {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
            <label className="sr-only" htmlFor="password">
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="비밀번호"
              className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-linkup focus:bg-white"
              {...register('password')}
            />
            {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
            {submitError && <p className="text-sm text-red-500">{submitError}</p>}
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-linkup px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#5b4ee8] disabled:opacity-60"
            >
              {isSubmitting ? '로그인 중...' : '이메일로 로그인'}
            </button>
          </form>
        </main>

        <LoginIntroPanel />
      </div>
    </div>
  );
}
