import clsx from 'clsx';
import type { LucideIcon } from 'lucide-react';
import { TrendingDown, TrendingUp } from 'lucide-react';

export default function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  trend,
  tone = 'default',
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
  trend?: { value: string; up: boolean; good?: boolean };
  tone?: 'default' | 'danger';
}) {
  const good = trend ? trend.good ?? trend.up : false;
  return (
    <div className="card flex min-w-0 flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</span>
        {Icon && (
          <span
            className={clsx(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
              tone === 'danger' ? 'bg-red-50 text-red-600' : 'bg-brand-50 text-brand-600',
            )}
          >
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <span className="num text-2xl font-semibold tracking-tight text-zinc-900">{value}</span>
      <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
        {trend && (
          <span
            className={clsx(
              'inline-flex items-center gap-0.5 font-medium',
              good ? 'text-emerald-700' : 'text-red-700',
            )}
          >
            {trend.up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            {trend.value}
          </span>
        )}
        {hint && <span>{hint}</span>}
      </div>
    </div>
  );
}
