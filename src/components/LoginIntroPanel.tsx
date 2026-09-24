export function LoginIntroPanel() {
  return (
    <section className="relative min-h-64 overflow-hidden rounded-2xl bg-zinc-200 shadow-sm lg:min-h-0">
      <img
        src="https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?auto=format&fit=crop&w=1600&q=80"
        alt="산토리니 흰색 건물과 푸른 바다"
        className="absolute inset-0 size-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
      <p className="absolute bottom-6 left-6 text-sm font-medium text-white">
        취향이 맞는 사람들과 이어지는 여행 같은 피드
      </p>
    </section>
  );
}
