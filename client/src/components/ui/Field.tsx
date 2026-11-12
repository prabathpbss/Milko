import clsx from 'clsx';
import type { ReactNode } from 'react';

export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={clsx('flex min-w-0 flex-col gap-1.5', className)}>
      <span className="label">{label}</span>
      {children}
      {error ? (
        <span className="text-xs text-red-600">{error}</span>
      ) : hint ? (
        <span className="text-xs text-zinc-500">{hint}</span>
      ) : null}
    </label>
  );
}

export function FormGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx('grid gap-4 sm:grid-cols-2 xl:grid-cols-3', className)}>{children}</div>;
}
