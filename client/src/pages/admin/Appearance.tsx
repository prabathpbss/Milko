import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import clsx from 'clsx';
import { AlertTriangle, ImagePlus, Lock, Monitor, Moon, RotateCcw, Save, Sun, Trash2, Undo2 } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Field } from '@/components/ui/Field';
import { Tabs } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import LoginLayout from '@/components/layout/LoginLayout';
import {
  BACKGROUND_PRESETS,
  DEFAULT_APPEARANCE,
  FONTS,
  LOGIN_LAYOUTS,
  LOGIN_VISUALS,
  appearanceStore,
  contrast,
  presetSize,
  validateAppearance,
  type AppearanceSettings,
  type LoginLayout as Layout,
  type ThemeMode,
} from '@/lib/appearance';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useLang } from '@/i18n/LanguageContext';

type TabId = 'theme' | 'text' | 'login' | 'logo';
type Login = AppearanceSettings['login'];

const BRAND_SWATCHES = ['#d71920', '#1d4ed8', '#0f766e', '#15803d', '#7c3aed', '#ea580c', '#0f172a'];
const PAGE_SWATCHES = ['#fafafa', '#f5f7fb', '#f7f5f0', '#f3f6f4'];
const HEX = /^#[0-9a-f]{6}$/i;
const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
const MAX_BYTES = 2 * 1024 * 1024;

/** Only the System admin changes the look for everyone; others see it read-only. */
const canEdit = (role?: string) => role === 'System admin';

export default function Appearance() {
  const { t } = useLang();
  const toast = useToast();
  const { user } = useAuth();
  const editable = canEdit(user?.role);
  const [tab, setTab] = useState<TabId>('theme');
  const [d, setD] = useState<AppearanceSettings>(() => appearanceStore.get());
  const [savedJson, setSavedJson] = useState(() => JSON.stringify(appearanceStore.getSaved()));
  const dirty = JSON.stringify(d) !== savedJson;

  // Leaving the screen with an unsaved draft puts the saved look back.
  useEffect(() => () => appearanceStore.discard(), []);

  const change = (next: AppearanceSettings) => {
    if (!editable) return;
    setD(next);
    appearanceStore.preview(next); // whole app previews it, for this admin only
  };
  const set = <K extends keyof AppearanceSettings>(k: K, v: AppearanceSettings[K]) => change({ ...d, [k]: v });
  const setL = <K extends keyof Login>(k: K, v: Login[K]) => change({ ...d, login: { ...d.login, [k]: v } });

  const discard = () => {
    appearanceStore.discard();
    setD(appearanceStore.getSaved());
    toast(t('Appearance changes discarded'));
  };
  const save = () => {
    const err = validateAppearance(d);
    if (err) return toast(t(err), 'error');
    const clean = { ...d, login: { ...d.login, highlights: d.login.highlights.map((s) => s.trim()).filter(Boolean) } };
    const kept = appearanceStore.commit(clean);
    setD(clean);
    setSavedJson(JSON.stringify(clean));
    if (kept) toast(t('Appearance saved. Prototype: kept in this browser; the live system saves it on the server for all users.'));
    else toast(t('Appearance applied, but the images are too large to keep in this browser after a reload.'), 'error');
  };
  const reset = () => {
    change(DEFAULT_APPEARANCE);
    toast(t('MILCO defaults loaded. Press Save for everyone to keep them.'), 'info');
  };

  /** Reads an image file as a data URL after checking type and size. */
  const readImage = (file: File, done: (url: string) => void) => {
    if (!IMAGE_TYPES.includes(file.type)) return toast(t('Use a PNG, JPEG, WebP or SVG image.'), 'error');
    if (file.size > MAX_BYTES) return toast(t('That image is {n} MB. Use one under 2 MB.', { n: (file.size / 1024 / 1024).toFixed(1) }), 'error');
    const r = new FileReader();
    r.onload = () => done(String(r.result));
    r.readAsDataURL(file);
  };

  const brandContrast = HEX.test(d.brandColor) ? contrast(d.brandColor, '#ffffff') : 21;

  return (
    <div className="pb-24">
      <PageHeader
        breadcrumb={[{ label: t('Administration') }, { label: t('Appearance') }]}
        title={t('Appearance')}
        description={t('Theme, colours, font, logo, backgrounds and sign-in page words for every user. Changes preview live; Save applies them.')}
        actions={
          editable && (
            <button type="button" className="btn btn-secondary" onClick={reset}>
              <RotateCcw className="h-4 w-4" /> {t('Reset to MILCO defaults')}
            </button>
          )
        }
      />

      {!editable && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <Lock className="h-4 w-4 shrink-0" />
          {t('View only for {role}. Appearance can be changed by the System admin.', { role: t(user?.role ?? '') })}
        </div>
      )}

      <Tabs<TabId>
        value={tab}
        onChange={setTab}
        className="mb-6"
        tabs={[
          { id: 'theme', label: t('Theme & colours') },
          { id: 'text', label: t('Text') },
          { id: 'login', label: t('Login page') },
          { id: 'logo', label: t('Logo & backgrounds') },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-5">
        {/* Form */}
        <Card className="h-fit xl:col-span-2">
          <CardBody>
            <fieldset disabled={!editable} className="space-y-5">
              {tab === 'theme' && (
                <>
                  <Group label={t('Default theme')} hint={t('Users can still switch for themselves with the sun/moon button in the top bar.')}>
                    <Segmented<ThemeMode>
                      value={d.theme}
                      onChange={(v) => set('theme', v)}
                      options={[
                        { id: 'light', label: t('Light'), icon: Sun },
                        { id: 'dark', label: t('Dark'), icon: Moon },
                        { id: 'system', label: t('Follow device'), icon: Monitor },
                      ]}
                    />
                  </Group>
                  <ColourField
                    label={t('Brand colour')}
                    value={d.brandColor}
                    onChange={(v) => set('brandColor', v)}
                    swatches={BRAND_SWATCHES}
                    hint={t('Buttons, active menu item, links and the sign-in panel.')}
                  />
                  {brandContrast < 3 && (
                    <p className="-mt-3 flex items-start gap-1.5 text-xs text-amber-800">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      {t('Links and highlights in this colour are hard to read on white (contrast {n}:1). Choose a darker or stronger colour.', { n: brandContrast.toFixed(1) })}
                    </p>
                  )}
                  <ColourField
                    label={t('Page background')}
                    value={d.backgroundColor}
                    onChange={(v) => set('backgroundColor', v)}
                    swatches={PAGE_SWATCHES}
                    allowEmpty
                    hint={t('Light theme only. Leave empty for the default.')}
                  />
                </>
              )}

              {tab === 'text' && (
                <>
                  <Field label={t('Font')} hint={t('Sinhala and Tamil text keep their own font.')}>
                    <select className="input" value={d.fontFamily} onChange={(e) => set('fontFamily', e.target.value as AppearanceSettings['fontFamily'])}>
                      {FONTS.map((f) => (
                        <option key={f.id} value={f.id}>
                          {t(f.label)}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Slider label={t('Text and interface size')} value={d.fontScale} min={85} max={125} step={5} onChange={(v) => set('fontScale', v)} />
                  <Field label={t('Company name')} hint={t('Used as the logo text and in the menu footer.')}>
                    <input className="input" value={d.companyName} onChange={(e) => set('companyName', e.target.value)} maxLength={40} />
                  </Field>
                  <Field label={t('App title')} hint={t('Next to the logo at the top of the menu.')}>
                    <input className="input" value={d.appName} onChange={(e) => set('appName', e.target.value)} maxLength={40} />
                  </Field>
                </>
              )}

              {tab === 'login' && (
                <>
                  <Group label={t('Layout')} hint={t(LOGIN_LAYOUTS.find((l) => l.id === d.login.layout)?.hint ?? '')}>
                    <div role="radiogroup" aria-label={t('Login layout')} className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {LOGIN_LAYOUTS.map((l) => (
                        <button
                          key={l.id}
                          type="button"
                          role="radio"
                          aria-checked={d.login.layout === l.id}
                          onClick={() => setL('layout', l.id)}
                          className={clsx(
                            'flex flex-col items-center gap-2 rounded-lg border p-2 text-xs font-medium transition disabled:opacity-60',
                            d.login.layout === l.id ? 'border-brand-600 bg-brand-50 text-brand-700 ring-2 ring-brand-600/15' : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50',
                          )}
                        >
                          <LayoutDrawing layout={l.id} />
                          {t(l.label)}
                        </button>
                      ))}
                    </div>
                  </Group>

                  {d.login.layout !== 'minimal' && (
                    <Group label={t('Panel shows')} hint={d.login.visual === 'text' ? t('The background image is not used.') : d.login.visual === 'image' && !d.login.background ? t('No image yet: add one below, or the brand colour is shown.') : undefined}>
                      <Segmented value={d.login.visual} onChange={(v) => setL('visual', v)} options={LOGIN_VISUALS.map((v) => ({ id: v.id, label: t(v.label) }))} />
                    </Group>
                  )}
                  {(d.login.layout === 'left' || d.login.layout === 'right') && (
                    <div className="grid gap-5 sm:grid-cols-2">
                      <Group label={t('Panel width')}>
                        <Segmented<string>
                          value={String(d.login.panelWidth)}
                          onChange={(v) => setL('panelWidth', Number(v) as Login['panelWidth'])}
                          options={[
                            { id: '40', label: t('Narrow') },
                            { id: '50', label: t('Half') },
                            { id: '60', label: t('Wide') },
                          ]}
                        />
                      </Group>
                      {d.login.visual !== 'image' && (
                        <Group label={t('Text alignment')}>
                          <Segmented<Login['textAlign']>
                            value={d.login.textAlign}
                            onChange={(v) => setL('textAlign', v)}
                            options={[
                              { id: 'left', label: t('Left') },
                              { id: 'center', label: t('Centre') },
                            ]}
                          />
                        </Group>
                      )}
                    </div>
                  )}
                  {d.login.layout !== 'center' && (
                    <Group label={t('Sign-in box')}>
                      <Segmented<Login['formStyle']>
                        value={d.login.formStyle}
                        onChange={(v) => setL('formStyle', v)}
                        options={[
                          { id: 'plain', label: t('Plain') },
                          { id: 'card', label: t('Card') },
                        ]}
                      />
                    </Group>
                  )}

                  <div className="space-y-4 border-t border-zinc-100 pt-5">
                    <p className="text-sm font-semibold">{t('Sign-in box words')}</p>
                    <Field label={t('Sign-in title')}>
                      <input className="input" value={d.login.formTitle} onChange={(e) => setL('formTitle', e.target.value)} maxLength={40} />
                    </Field>
                    <Field label={t('Sign-in subtitle (optional)')}>
                      <input className="input" value={d.login.formSubtitle} onChange={(e) => setL('formSubtitle', e.target.value)} maxLength={120} />
                    </Field>
                  </div>

                  {d.login.layout !== 'minimal' && d.login.visual !== 'image' && (
                    <div className="space-y-4 border-t border-zinc-100 pt-5">
                      <p className="text-sm font-semibold">{t('Panel words')}</p>
                      <Field label={t('Small heading (optional)')}>
                        <input className="input" value={d.login.eyebrow} onChange={(e) => setL('eyebrow', e.target.value)} maxLength={60} />
                      </Field>
                      <Field label={t('Headline (Enter = new line)')} hint={t('{n} / 80', { n: d.login.headline.length })}>
                        <textarea className="input h-auto py-2" rows={2} value={d.login.headline} onChange={(e) => setL('headline', e.target.value)} maxLength={80} />
                      </Field>
                      <Field label={t('Description')} hint={t('{n} / 240', { n: d.login.description.length })}>
                        <textarea className="input h-auto py-2" rows={3} value={d.login.description} onChange={(e) => setL('description', e.target.value)} maxLength={240} />
                      </Field>
                      {d.login.layout !== 'center' && (
                        <Field label={t('Highlights (one per line; empty hides them)')}>
                          <textarea
                            className="input h-auto py-2"
                            rows={3}
                            value={d.login.highlights.join('\n')}
                            onChange={(e) => setL('highlights', e.target.value.split('\n'))}
                          />
                        </Field>
                      )}
                      <Field label={t('Footer')}>
                        <input className="input" value={d.login.footer} onChange={(e) => setL('footer', e.target.value)} maxLength={120} />
                      </Field>
                    </div>
                  )}

                  {d.login.layout !== 'minimal' && d.login.visual !== 'text' && (
                    <div className="space-y-4 border-t border-zinc-100 pt-5">
                      <BackgroundPicker
                        label={t('Login background image')}
                        hint={t('Shown behind the panel words on the sign-in page.')}
                        value={d.login.background}
                        onChange={(v) => setL('background', v)}
                        readImage={readImage}
                        disabled={!editable}
                      />
                      <Slider label={t('Brand colour over the image')} value={d.login.overlay} min={0} max={95} step={5} onChange={(v) => setL('overlay', v)} />
                    </div>
                  )}
                </>
              )}

              {tab === 'logo' && (
                <>
                  <Group label={t('Company logo')} hint={t('Shown on the sign-in page and at the top of the menu. Transparent PNG or SVG works best.')}>
                    <div className="flex flex-wrap items-center gap-3">
                      <img src={d.logoImage ?? undefined} alt="" className={clsx('h-16 w-28 rounded-lg border border-zinc-200 bg-[#fff] object-contain p-2', !d.logoImage && 'hidden')} />
                      {!d.logoImage && <span className="flex h-16 w-28 items-center justify-center rounded-lg border border-dashed border-zinc-300 text-xs text-zinc-500">{t('MILCO logo')}</span>}
                      <UploadButton label={t('Upload logo')} onFile={(f) => readImage(f, (url) => set('logoImage', url))} disabled={!editable} />
                      {d.logoImage && (
                        <button type="button" className="btn btn-ghost btn-sm text-red-700" onClick={() => set('logoImage', null)}>
                          <Trash2 className="h-4 w-4" /> {t('Remove')}
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500">{t('PNG, JPEG, WebP or SVG up to 2 MB.')}</p>
                  </Group>
                  <div className="space-y-4 border-t border-zinc-100 pt-5">
                    <BackgroundPicker
                      label={t('App background image')}
                      hint={t('Behind every app page. Panels stay solid, so data remains readable.')}
                      value={d.appBackground}
                      onChange={(v) => set('appBackground', v)}
                      readImage={readImage}
                      disabled={!editable}
                    />
                    <Slider label={t('Page colour over the background')} value={d.appBackgroundOverlay} min={0} max={95} step={5} onChange={(v) => set('appBackgroundOverlay', v)} />
                  </div>
                </>
              )}
            </fieldset>
          </CardBody>
        </Card>

        {/* Preview */}
        <div className="space-y-6 xl:col-span-3">
          <Card>
            <CardHeader title={t('Login page preview')} subtitle={t(LOGIN_LAYOUTS.find((l) => l.id === d.login.layout)?.label ?? '')} />
            <CardBody>
              <ScaledPreview>
                <LoginLayout look={d} preview>
                  <h2 className="text-2xl font-semibold tracking-tight">{t(d.login.formTitle)}</h2>
                  {d.login.formSubtitle.trim() && <p className="mt-1 text-sm text-zinc-500">{t(d.login.formSubtitle)}</p>}
                  <div className="mt-6 space-y-4">
                    <div className="input flex h-11 items-center text-zinc-500">{t('Username or email')}</div>
                    <div className="input flex h-11 items-center text-zinc-500">{t('Password')}</div>
                    <div className="btn btn-primary h-11 w-full">{t('Sign in')}</div>
                  </div>
                </LoginLayout>
              </ScaledPreview>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title={t('Sample controls')} />
            <CardBody className="flex flex-wrap items-center gap-3">
              <button type="button" className="btn btn-primary">{t('Primary')}</button>
              <button type="button" className="btn btn-secondary">{t('Secondary')}</button>
              <Badge tone="brand">{t('Badge')}</Badge>
              <Badge tone="success" dot>{t('Approved')}</Badge>
              <a className="text-sm font-medium text-brand-700 hover:underline" href="#appearance">{t('A link')}</a>
              <p className="w-full text-xs text-zinc-500">
                {editable ? t('The whole app is previewing these settings now, for you only.') : t('This is the look everyone sees.')}
              </p>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Sticky save bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur lg:left-64">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <p className={clsx('text-sm', dirty ? 'font-medium text-amber-800' : 'text-zinc-500')}>
            {dirty ? t('Unsaved appearance changes are previewing for you only.') : t('All appearance changes saved.')}
          </p>
          <div className="flex gap-2">
            <button type="button" className="btn btn-secondary" disabled={!editable || !dirty} onClick={discard}>
              <Undo2 className="h-4 w-4" /> {t('Discard')}
            </button>
            <button type="button" className="btn btn-primary" disabled={!editable || !dirty} onClick={save}>
              <Save className="h-4 w-4" /> {t('Save for everyone')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────── Small building blocks ───────────── */

function Group({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <span className="label block">{label}</span>
      {children}
      {hint && <p className="text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}

function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { id: T; label: string; icon?: typeof Sun }[];
}) {
  return (
    <div className="inline-flex flex-wrap rounded-lg bg-zinc-100 p-1">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={value === o.id}
          onClick={() => onChange(o.id)}
          className={clsx(
            'flex h-8 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition disabled:opacity-60',
            value === o.id ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-600 hover:text-zinc-900',
          )}
        >
          {o.icon && <o.icon className="h-4 w-4" />}
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Slider({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  return (
    <label className="block space-y-2">
      <span className="flex items-center justify-between">
        <span className="label">{label}</span>
        <span className="num text-sm font-semibold">{value}%</span>
      </span>
      <input type="range" className="w-full accent-brand-600" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

function ColourField({
  label,
  value,
  onChange,
  swatches,
  hint,
  allowEmpty,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  swatches: string[];
  hint: string;
  allowEmpty?: boolean;
}) {
  const { t } = useLang();
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  return (
    <div className="space-y-2">
      <span className="label block">{label}</span>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="color"
          aria-label={t('{field} picker', { field: label })}
          className="h-10 w-12 cursor-pointer rounded-lg border border-zinc-300 bg-white p-1"
          value={HEX.test(value) ? value : '#fafafa'}
          onChange={(e) => onChange(e.target.value)}
        />
        <input
          aria-label={t('{field} hex', { field: label })}
          className="input num w-28"
          value={text}
          placeholder={allowEmpty ? t('Default') : '#rrggbb'}
          onChange={(e) => {
            const v = e.target.value.trim();
            setText(v);
            if (HEX.test(v) || (allowEmpty && v === '')) onChange(v.toLowerCase());
          }}
        />
        <div className="flex flex-wrap gap-1.5">
          {swatches.map((s) => (
            <button
              key={s}
              type="button"
              aria-label={t('Use {hex}', { hex: s })}
              aria-pressed={value.toLowerCase() === s}
              onClick={() => onChange(s)}
              className={clsx('h-7 w-7 rounded-full border border-zinc-300 transition', value.toLowerCase() === s && 'ring-2 ring-brand-600 ring-offset-2')}
              style={{ background: s }}
            />
          ))}
        </div>
        {allowEmpty && value && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onChange('')}>
            {t('Use default')}
          </button>
        )}
      </div>
      <p className="text-xs text-zinc-500">{hint}</p>
    </div>
  );
}

function UploadButton({ label, onFile, disabled }: { label: string; onFile: (f: File) => void; disabled?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <button type="button" className="btn btn-secondary btn-sm" onClick={() => ref.current?.click()} disabled={disabled}>
        <ImagePlus className="h-4 w-4" /> {label}
      </button>
      <input
        ref={ref}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = '';
        }}
      />
    </>
  );
}

/** Background value is a CSS background-image: a preset gradient or url("data:…"). */
function BackgroundPicker({
  label,
  hint,
  value,
  onChange,
  readImage,
  disabled,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
  readImage: (f: File, done: (url: string) => void) => void;
  disabled?: boolean;
}) {
  const { t } = useLang();
  return (
    <Group label={label} hint={hint}>
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={clsx('h-16 w-28 rounded-lg border border-zinc-200 bg-white', !value && 'flex items-center justify-center border-dashed text-xs text-zinc-500')}
          style={value ? { backgroundImage: value, backgroundSize: presetSize(value), backgroundPosition: 'center' } : undefined}
        >
          {!value && t('None')}
        </span>
        <UploadButton label={t('Upload image')} onFile={(f) => readImage(f, (url) => onChange(`url("${url}")`))} disabled={disabled} />
        {BACKGROUND_PRESETS.map((p) => (
          <button key={p.id} type="button" className={clsx('btn btn-sm', value === p.css ? 'btn-dark' : 'btn-ghost')} onClick={() => onChange(p.css)}>
            {t(p.label)}
          </button>
        ))}
        {value && (
          <button type="button" className="btn btn-ghost btn-sm text-red-700" onClick={() => onChange('')}>
            <Trash2 className="h-4 w-4" /> {t('Remove')}
          </button>
        )}
      </div>
      <p className="text-xs text-zinc-500">{t('PNG, JPEG, WebP or SVG up to 2 MB.')}</p>
    </Group>
  );
}

/** Tiny drawing of each login layout. */
function LayoutDrawing({ layout }: { layout: Layout }) {
  const box = 'rounded-sm bg-current opacity-25';
  return (
    <span aria-hidden className="flex h-10 w-16 overflow-hidden rounded border border-current/30 bg-white">
      {layout === 'left' && (
        <>
          <span className="w-1/2 bg-brand-600" />
          <span className="flex flex-1 items-center justify-center"><span className={clsx(box, 'h-4 w-5')} /></span>
        </>
      )}
      {layout === 'right' && (
        <>
          <span className="flex flex-1 items-center justify-center"><span className={clsx(box, 'h-4 w-5')} /></span>
          <span className="w-1/2 bg-brand-600" />
        </>
      )}
      {layout === 'center' && (
        <span className="flex flex-1 items-center justify-center bg-brand-600"><span className="h-5 w-6 rounded-sm bg-white" /></span>
      )}
      {layout === 'minimal' && (
        <span className="flex flex-1 items-center justify-center"><span className={clsx(box, 'h-5 w-6')} /></span>
      )}
    </span>
  );
}

/** Draws children at desktop size (1280 × 800) and scales them to the card's width. */
function ScaledPreview({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setScale(el.clientWidth / 1280));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={ref} className="relative w-full overflow-hidden rounded-lg border border-zinc-200" style={{ height: 800 * scale }} aria-label="Login preview">
      <div className="pointer-events-none absolute left-0 top-0 h-[800px] w-[1280px] origin-top-left bg-white" style={{ transform: `scale(${scale})` }} aria-hidden>
        {children}
      </div>
    </div>
  );
}
