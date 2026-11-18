import type { CSSProperties, ReactNode } from 'react';
import clsx from 'clsx';
import { Milk, ShieldCheck, Truck } from 'lucide-react';
import logo from '@/assets/milco-logo.jpg';
import { presetSize, type AppearanceSettings } from '@/lib/appearance';
import { useLang } from '@/i18n/LanguageContext';

const HIGHLIGHT_ICONS = [Milk, Truck, ShieldCheck];

/** Logo in a white tile (the MILCO logo has a white background). */
export function LogoTile({ look, className }: { look: AppearanceSettings; className?: string }) {
  return <img src={look.logoImage ?? logo} alt={look.companyName} className={clsx('block w-auto max-w-full rounded-lg bg-[#fff] object-contain p-2', className)} />;
}

/**
 * Sign-in page frame, drawn from the Appearance settings: where the panel sits, what it shows and the words.
 * Used by the real sign-in page and, scaled down, by the Appearance preview.
 */
export default function LoginLayout({ look, children, preview }: { look: AppearanceSettings; children: ReactNode; preview?: boolean }) {
  const { t } = useLang();
  const L = look.login;
  const words = L.visual !== 'image';
  const image = L.visual !== 'text' && L.background ? L.background : '';
  const centred = L.layout === 'center';
  const card = centred || L.formStyle === 'card';
  const highlights = L.highlights.map((s) => s.trim()).filter(Boolean);

  // Brand colour, optionally laid over the background image at the chosen strength
  const fill: CSSProperties = image
    ? {
        backgroundImage: `linear-gradient(rgb(var(--brand-700) / ${L.overlay / 100}), rgb(var(--brand-700) / ${L.overlay / 100})), ${image}`,
        backgroundSize: `auto, ${presetSize(image)}`,
        backgroundPosition: 'center',
      }
    : {};

  const hero = words && (
    <div className={clsx('relative', L.textAlign === 'center' && !centred && 'text-center', centred && 'text-center')}>
      {L.eyebrow.trim() && <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-brand-100">{t(L.eyebrow)}</p>}
      <h1 className={clsx('whitespace-pre-line font-semibold leading-tight tracking-tight', centred ? 'text-3xl' : 'text-4xl')}>{t(L.headline)}</h1>
      {L.description.trim() && <p className={clsx('mt-4 text-base leading-relaxed text-brand-100', (centred || L.textAlign === 'center') && 'mx-auto max-w-md')}>{t(L.description)}</p>}
      {highlights.length > 0 && !centred && (
        <ul className={clsx('mt-8 space-y-4 text-sm', L.textAlign === 'center' && 'mx-auto inline-block text-left')}>
          {highlights.map((text, i) => {
            const Icon = HIGHLIGHT_ICONS[i % HIGHLIGHT_ICONS.length];
            return (
              <li key={i} className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="pt-1.5 text-brand-50">{t(text)}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );

  const decor = !image && (
    <>
      <div aria-hidden className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-600 opacity-60" />
      <div aria-hidden className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-brand-800 opacity-70" />
    </>
  );

  const form = (
    <div className={clsx('w-full max-w-[400px]', card && 'rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl sm:p-8')}>
      {/* Logo above the form when the panel does not show it */}
      <LogoTile look={look} className={clsx('mb-8 h-16', L.layout === 'left' || L.layout === 'right' ? (words ? 'lg:hidden' : '') : '')} />
      {children}
    </div>
  );

  const height = preview ? 'h-full' : 'min-h-screen';

  if (centred) {
    return (
      <div className={clsx('relative flex flex-col items-center justify-center gap-8 overflow-hidden bg-brand-700 px-4 py-10 text-white', height)} style={fill}>
        {decor}
        {hero && <div className="relative max-w-xl">{hero}</div>}
        <div className="relative w-full max-w-[400px] text-zinc-900">{form}</div>
        {L.footer.trim() && words && <p className="relative text-xs text-brand-100">{t(L.footer)}</p>}
      </div>
    );
  }

  if (L.layout === 'minimal') {
    return (
      <div className={clsx('flex items-center justify-center px-4 py-10', height)}>
        {form}
      </div>
    );
  }

  return (
    <div className={clsx('flex bg-white', L.layout === 'right' && 'flex-row-reverse', height)}>
      <section
        className={clsx(
          'relative hidden flex-col overflow-hidden bg-brand-700 p-12 text-white lg:flex',
          words ? 'justify-between' : 'justify-end',
          L.textAlign === 'center' && words && 'items-center',
        )}
        style={{ ...fill, width: `${L.panelWidth}%` }}
      >
        {decor}
        {words && <LogoTile look={look} className={clsx('relative h-20 shadow-lg', L.textAlign === 'center' ? 'self-center' : 'self-start')} />}
        {hero}
        {words && L.footer.trim() ? <p className="relative text-xs text-brand-100">{t(L.footer)}</p> : <span />}
      </section>
      <section className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">{form}</section>
    </div>
  );
}
