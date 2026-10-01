export function LoginIntroPanel() {
  return (
    <section className="relative min-h-64 overflow-hidden rounded-2xl bg-zinc-200 shadow-sm lg:min-h-0">
      <img
        src="/login-intro.jpg"
        alt="서로 이어진 링크"
        className="absolute inset-0 size-full scale-105 object-cover object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
    </section>
  );
}
