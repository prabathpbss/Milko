import clsx from 'clsx';
import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { initials } from '@/lib/format';

export function Progress({
  value,
  max = 100,
  tone = 'dark',
  className,
  label,
}: {
  value: number;
  max?: number;
  tone?: 'dark' | 'brand' | 'warning' | 'success';
  className?: string;
  label?: string;
}) {
  const pctValue = Math.min(100, Math.max(0, (value / max) * 100));
  const color = {
    dark: 'bg-zinc-900',
    brand: 'bg-brand-600',
    warning: 'bg-amber-500',
    success: 'bg-emerald-600',
  }[tone];
  return (
    <div
      className={clsx('h-2 w-full overflow-hidden rounded-full bg-zinc-200', className)}
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(pctValue)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className={clsx('h-full rounded-full transition-all', color)} style={{ width: `${pctValue}%` }} />
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={clsx(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50',
        checked ? 'bg-brand-600' : 'bg-zinc-300',
      )}
    >
      <span
        className={clsx(
          'inline-block h-5 w-5 rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-[22px]' : 'translate-x-0.5',
        )}
      />
    </button>
  );
}

export function Avatar({ name, size = 'md', className }: { name: string; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const s = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-16 w-16 text-lg' }[size];
  return (
    <span
      className={clsx(
        'flex shrink-0 items-center justify-center rounded-full bg-zinc-900 font-semibold text-white',
        s,
        className,
      )}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}

export function KeyValue({ items, className }: { items: [string, ReactNode][]; className?: string }) {
  return (
    <dl className={clsx('grid grid-cols-[minmax(0,140px)_minmax(0,1fr)] gap-x-4 gap-y-2.5 text-sm', className)}>
      {items.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-zinc-500">{k}</dt>
          <dd className="min-w-0 text-zinc-900">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-[1px]" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative flex max-h-[92vh] w-full flex-col rounded-t-2xl bg-white shadow-xl sm:max-w-lg sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
          <h2 className="text-base font-semibold">{title}</h2>
          <button type="button" className="btn btn-ghost btn-icon -mr-2" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto p-5">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-zinc-100 px-5 py-4">{footer}</div>}
      </div>
    </div>
  );
}

export function EmptyState({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <p className="text-sm font-semibold text-zinc-900">{title}</p>
      {text && <p className="max-w-sm text-sm text-zinc-500">{text}</p>}
      {action}
    </div>
  );
}
