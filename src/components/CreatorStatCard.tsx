interface CreatorStatCardProps {
  label: string;
  value: string;
  hint?: string;
}

export function CreatorStatCard({ label, value, hint }: CreatorStatCardProps) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white px-5 py-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-zinc-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-zinc-400">{hint}</p>}
    </div>
  );
}
