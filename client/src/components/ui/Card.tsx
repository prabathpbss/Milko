import clsx from 'clsx';
import type { ReactNode } from 'react';

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={clsx('card min-w-0', className)}>{children}</section>;
}

export function CardHeader({
  title,
  subtitle,
  actions,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        'flex flex-wrap items-start justify-between gap-3 border-b border-zinc-100 px-4 py-3.5 sm:px-5',
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="text-[15px] font-semibold text-zinc-900">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-zinc-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function CardBody({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={clsx('p-4 sm:p-5', className)}>{children}</div>;
}
