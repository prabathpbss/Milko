import { useCallback, useRef, useState } from 'react';
import clsx from 'clsx';
import { Check, Monitor, Moon, Sun } from 'lucide-react';
import { useTheme, type ThemeMode } from '@/context/ThemeContext';
import { useClickOutside } from '@/hooks/useClickOutside';
import { useLang } from "@/i18n/LanguageContext";

const options: { id: ThemeMode; label: string; icon: typeof Sun }[] = [
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'system', label: 'System', icon: Monitor },
];

export default function ThemeToggle({ className }: { className?: string }) {
  const { mode, resolved, setMode } = useTheme();
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(ref, close, open);
  const Icon = resolved === 'dark' ? Moon : Sun;

  return (
    <div className={clsx('relative', className)} ref={ref}>
      <button
        type="button"
        className="btn btn-ghost btn-icon"
        aria-label={t("Theme: {mode}. Change theme", { mode: t(options.find((o) => o.id === mode)?.label ?? mode) })}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Icon className="h-5 w-5" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-12 z-40 w-40 overflow-hidden rounded-xl border border-zinc-200 bg-white py-1 shadow-xl">
          {options.map((o) => (
            <button
              key={o.id}
              type="button"
              role="menuitemradio"
              aria-checked={mode === o.id}
              onClick={() => {
                setMode(o.id);
                close();
              }}
              className={clsx(
                'flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-zinc-100',
                mode === o.id ? 'font-medium text-brand-700' : 'text-zinc-700',
              )}
            >
              <o.icon className="h-4 w-4" />
              {t(o.label)}
              {mode === o.id && <Check className="ml-auto h-4 w-4" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
