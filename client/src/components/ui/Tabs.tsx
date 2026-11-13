import clsx from 'clsx';

export interface TabItem<T extends string> {
  id: T;
  label: string;
  count?: number;
}

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={clsx('scrollbar-none flex gap-1 overflow-x-auto border-b border-zinc-200', className)}
      onKeyDown={(e) => {
        // WAI-ARIA tabs: arrow keys move between tabs, Home / End jump to the ends
        const i = tabs.findIndex((t) => t.id === value);
        const to =
          e.key === 'ArrowRight' ? (i + 1) % tabs.length
          : e.key === 'ArrowLeft' ? (i - 1 + tabs.length) % tabs.length
          : e.key === 'Home' ? 0
          : e.key === 'End' ? tabs.length - 1
          : -1;
        if (to < 0) return;
        e.preventDefault();
        onChange(tabs[to].id);
        const btns = e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]');
        btns[to]?.focus();
      }}
    >
      {tabs.map((t) => {
        const active = t.id === value;
        return (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(t.id)}
            className={clsx(
              'relative flex min-h-[44px] items-center gap-2 whitespace-nowrap px-3 text-sm font-medium transition-colors',
              active ? 'text-zinc-900' : 'text-zinc-500 hover:text-zinc-800',
            )}
          >
            {t.label}
            {t.count !== undefined && (
              <span
                className={clsx(
                  'rounded-full px-1.5 py-0.5 text-xs leading-none',
                  active ? 'bg-brand-600 text-white' : 'bg-zinc-100 text-zinc-600',
                )}
              >
                {t.count}
              </span>
            )}
            {active && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand-600" />}
          </button>
        );
      })}
    </div>
  );
}

/** Pill-style filter group used above tables */
export function FilterChips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string; count?: number }[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={clsx('chip', o.id === value ? 'chip-on' : 'chip-off')}
          aria-pressed={o.id === value}
        >
          {o.label}
          {o.count !== undefined && <span className="num opacity-70">{o.count}</span>}
        </button>
      ))}
    </div>
  );
}
