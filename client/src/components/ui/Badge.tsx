import clsx from 'clsx';
import type { ReactNode } from 'react';
import { toneFor } from '@/lib/status';

export type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'brand';

const tones: Record<Tone, string> = {
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  warning: 'bg-amber-50 text-amber-800 ring-amber-600/25',
  danger: 'bg-red-50 text-red-700 ring-red-600/20',
  info: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  neutral: 'bg-zinc-100 text-zinc-700 ring-zinc-500/20',
  brand: 'bg-brand-50 text-brand-700 ring-brand-600/20',
};

export function Badge({
  tone = 'neutral',
  dot,
  children,
  className,
}: {
  tone?: Tone;
  dot?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
        tones[tone],
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />}
      {children}
    </span>
  );
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <Badge tone={toneFor(status)} dot className={className}>
      {status}
    </Badge>
  );
}

/** Response-target badge for disputes: hours left, or hours overdue when negative. */
export function SlaBadge({ hours, resolved }: { hours: number; resolved?: boolean }) {
  if (resolved) return <Badge tone="neutral">Closed</Badge>;
  if (hours < 0) return <Badge tone="danger" dot>{Math.abs(hours)} h over</Badge>;
  if (hours < 24) return <Badge tone="warning" dot>{hours} h left</Badge>;
  return <Badge tone="success" dot>{hours} h left</Badge>;
}
