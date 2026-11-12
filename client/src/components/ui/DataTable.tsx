import clsx from 'clsx';
import type { ReactNode } from 'react';

export interface Column<T> {
  key: string;
  header: ReactNode;
  align?: 'left' | 'right' | 'center';
  mono?: boolean;
  className?: string;
  render?: (row: T, index: number) => ReactNode;
}

const alignCls = { left: 'text-left', right: 'text-right', center: 'text-center' };

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  selectedKey,
  empty = 'No records match these filters.',
  footer,
  dense,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  selectedKey?: string | null;
  empty?: ReactNode;
  footer?: ReactNode;
  dense?: boolean;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50/80">
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                className={clsx(
                  'whitespace-nowrap px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500',
                  alignCls[c.align ?? 'left'],
                )}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-sm text-zinc-500">
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => {
              const key = rowKey(row);
              return (
                <tr
                  key={key}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={clsx(
                    'transition-colors',
                    onRowClick && 'cursor-pointer',
                    selectedKey === key ? 'bg-brand-50/60' : 'hover:bg-zinc-50',
                  )}
                >
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={clsx(
                        'whitespace-nowrap px-4 text-zinc-800',
                        dense ? 'py-2' : 'py-3',
                        alignCls[c.align ?? 'left'],
                        c.mono && 'num text-[13px]',
                        c.className,
                      )}
                    >
                      {c.render ? c.render(row, i) : String((row as Record<string, unknown>)[c.key] ?? '')}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
        {footer && <tfoot className="border-t border-zinc-200 bg-zinc-50/80 font-semibold">{footer}</tfoot>}
      </table>
    </div>
  );
}
