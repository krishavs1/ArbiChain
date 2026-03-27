'use client';

export default function StatusDot({ status, label }: { status: 'connected' | 'loading' | 'error'; label: string }) {
  const colors = {
    connected: 'bg-emerald-400',
    loading: 'bg-amber-400 animate-pulse',
    error: 'bg-red-400',
  };

  return (
    <div className="flex items-center gap-2 text-sm text-[#a1a1aa]">
      <span className={`w-2 h-2 rounded-full ${colors[status]}`} />
      {label}
    </div>
  );
}
