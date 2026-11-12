import clsx from 'clsx';
import { Check } from 'lucide-react';

export default function Stepper({
  steps,
  current,
  onStep,
}: {
  steps: string[];
  current: number;
  onStep?: (i: number) => void;
}) {
  return (
    <ol className="scrollbar-none flex gap-2 overflow-x-auto pb-1">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        const clickable = onStep && i <= current;
        return (
          <li key={label} className="min-w-[140px] flex-1">
            <button
              type="button"
              disabled={!clickable}
              onClick={() => onStep?.(i)}
              className={clsx(
                'flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors',
                active && 'border-zinc-900 bg-zinc-900 text-white',
                done && 'border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100',
                !active && !done && 'border-zinc-200 bg-white text-zinc-500',
                !clickable && 'cursor-default',
              )}
            >
              <span
                className={clsx(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                  active && 'bg-white text-zinc-900',
                  done && 'bg-emerald-600 text-white',
                  !active && !done && 'bg-zinc-100 text-zinc-500',
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span className="text-[13px] font-medium leading-tight">{label}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
