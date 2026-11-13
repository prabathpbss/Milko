import clsx from 'clsx';
import { Languages } from 'lucide-react';
import { LANGUAGES, useLang } from '@/i18n/LanguageContext';

/** English / සිංහල switch. Two large buttons so it works with a thumb on a phone. */
export default function LanguageSwitch({ className, full }: { className?: string; full?: boolean }) {
  const { lang, setLang, t } = useLang();
  return (
    <div
      role="group"
      aria-label={t('Language')}
      className={clsx('inline-flex h-9 items-center gap-0.5 rounded-lg border border-zinc-200 bg-white p-0.5 text-xs font-medium', className)}
    >
      <Languages className="mx-1 hidden h-4 w-4 text-zinc-400 sm:block" aria-hidden />
      {LANGUAGES.map((l) => (
        <button
          key={l.id}
          type="button"
          lang={l.id}
          title={l.label}
          aria-pressed={lang === l.id}
          onClick={() => setLang(l.id)}
          className={clsx(
            'h-full min-w-[2.5rem] rounded-md px-2 transition-colors',
            lang === l.id ? 'bg-brand-600 text-white' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900',
          )}
        >
          {full ? l.label : l.short}
        </button>
      ))}
    </div>
  );
}
