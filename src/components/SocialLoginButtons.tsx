const oauthOrigin = (import.meta.env.VITE_OAUTH_ORIGIN ?? '').replace(/\/$/, '');
const oauthBase = `${oauthOrigin}/oauth2/authorization`;

export function SocialLoginButtons() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-2.5">
      <a
        href={`${oauthBase}/google`}
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
      >
        <GoogleMark />
        구글 계정으로 로그인
      </a>
      <a
        href={`${oauthBase}/kakao`}
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#f3e06a] bg-[#fee500] px-4 py-2.5 text-sm font-medium text-zinc-900 hover:bg-[#f7dc00]"
      >
        <KakaoMark />
        카카오 계정으로 로그인
      </a>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5c-.3 1.5-1.2 2.8-2.5 3.6v3h4c2.4-2.2 3.5-5.5 3.5-8.7z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-4-3c-1.1.8-2.5 1.2-3.9 1.2-3 0-5.6-2-6.5-4.8H1.4v3.1C3.4 21.4 7.4 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.5 14.5c-.2-.7-.4-1.4-.4-2.2s.1-1.5.4-2.2V7H1.4C.5 8.8 0 10.4 0 12.3s.5 3.5 1.4 5.3l4.1-3.1z"
      />
      <path
        fill="#EA4335"
        d="M12 4.8c1.7 0 3.3.6 4.5 1.8l3.4-3.4C17.9 1.1 15.2 0 12 0 7.4 0 3.4 2.6 1.4 6.5L5.5 9.6C6.4 6.8 9 4.8 12 4.8z"
      />
    </svg>
  );
}

function KakaoMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path
        fill="#191919"
        d="M12 3C6.5 3 2 6.6 2 11c0 2.8 1.8 5.3 4.6 6.7-.2.7-.7 2.5-.8 2.9 0 0-.2.9.5.5.6-.3 2.6-1.8 3.6-2.5.7.1 1.4.2 2.1.2 5.5 0 10-3.6 10-8S17.5 3 12 3z"
      />
    </svg>
  );
}
