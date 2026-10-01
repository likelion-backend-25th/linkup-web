import { Lock } from 'lucide-react';
import { Link } from 'react-router';

interface SubscriberOnlyGateProps {
  creatorName: string;
  loggedIn: boolean;
}

export function SubscriberOnlyGate({ creatorName, loggedIn }: SubscriberOnlyGateProps) {
  return (
    <div className="relative mt-6 overflow-hidden rounded-3xl bg-gradient-to-b from-linkup-soft to-white">
      <div className="pointer-events-none absolute inset-0 grid grid-cols-3 gap-2 p-4 opacity-40 sm:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="aspect-square rounded-2xl bg-white/80" />
        ))}
      </div>

      <div className="relative flex flex-col items-center px-6 py-14 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-linkup/15">
          <Lock className="size-6 text-linkup" aria-hidden />
        </span>
        <p className="mt-4 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-linkup">
          구독자 전용
        </p>
        <h3 className="mt-3 text-lg font-semibold text-zinc-900">구독해야 볼 수 있어요</h3>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-zinc-500">
          {creatorName}님의 구독자 전용 게시글입니다. 구독하면 이 크리에이터의 전용 콘텐츠를 확인할 수
          있어요.
        </p>
        {loggedIn ? (
          <p className="mt-6 rounded-xl bg-white px-4 py-3 text-sm text-zinc-600 shadow-sm">
            위쪽 <span className="font-semibold text-linkup">구독</span> 버튼으로 구독할 수 있어요.
          </p>
        ) : (
          <Link
            to="/login"
            className="mt-6 rounded-xl bg-linkup px-5 py-2.5 text-sm font-semibold text-white hover:bg-linkup/90"
          >
            로그인하고 구독하기
          </Link>
        )}
      </div>
    </div>
  );
}
