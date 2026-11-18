import { useSyncExternalStore } from 'react';

/**
 * Admin-controlled look and feel for every user (Administration › Appearance).
 * Applied through CSS variables in one <style> tag, so every screen follows without code changes.
 * Prototype: saved in this browser (localStorage). Live system: GET/PUT /settings/appearance.
 */
export type ThemeMode = 'light' | 'dark' | 'system';
export type FontId = 'inter' | 'noto' | 'plex' | 'lato' | 'poppins' | 'roboto' | 'system';
export type LoginLayout = 'left' | 'right' | 'center' | 'minimal';
export type LoginVisual = 'both' | 'text' | 'image';

export interface AppearanceSettings {
  /** Default theme; a user's own sun/moon choice overrides it for them */
  theme: ThemeMode;
  /** #rrggbb: buttons, active menu, links, login panel */
  brandColor: string;
  /** #rrggbb or '' = default. Light theme only */
  backgroundColor: string;
  fontFamily: FontId;
  /** % of the browser's base size, 85–125 */
  fontScale: number;
  companyName: string;
  /** Text next to the logo at the top of the menu */
  appName: string;
  /** Data URL (prototype) or server URL; null = MILCO logo */
  logoImage: string | null;
  /** CSS background-image value or '' (none) */
  appBackground: string;
  /** % of page colour laid over the app background, 0–95 */
  appBackgroundOverlay: number;
  login: {
    layout: LoginLayout;
    visual: LoginVisual;
    panelWidth: 40 | 50 | 60;
    textAlign: 'left' | 'center';
    formStyle: 'plain' | 'card';
    formTitle: string;
    formSubtitle: string;
    eyebrow: string;
    headline: string;
    description: string;
    /** One line each; empty list hides them */
    highlights: string[];
    footer: string;
    /** CSS background-image value or '' = brand colour */
    background: string;
    /** % brand colour laid over the background image, 0–95 */
    overlay: number;
  };
}

export const LOGIN_LAYOUTS: { id: LoginLayout; label: string; hint: string }[] = [
  { id: 'left', label: 'Panel left', hint: 'Panel on the left, sign-in box on the right.' },
  { id: 'right', label: 'Panel right', hint: 'Sign-in box on the left, panel on the right.' },
  { id: 'center', label: 'Centred', hint: 'Sign-in box in the middle of a full-screen background, words above it.' },
  { id: 'minimal', label: 'Sign-in only', hint: 'No panel: just the sign-in box on the page colour.' },
];
export const LOGIN_VISUALS: { id: LoginVisual; label: string }[] = [
  { id: 'both', label: 'Text and image' },
  { id: 'text', label: 'Text only' },
  { id: 'image', label: 'Image only' },
];

/** Every font keeps the Sinhala and Tamil fallbacks so local text still renders. */
const LOCAL = '"Noto Sans Sinhala", "Nirmala UI", "Iskoola Pota", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
export const FONTS: { id: FontId; label: string; css: string; google: string | null }[] = [
  { id: 'inter', label: 'Inter (default)', css: `Inter, ${LOCAL}`, google: null /* already in index.html */ },
  { id: 'noto', label: 'Noto Sans', css: `"Noto Sans", ${LOCAL}`, google: 'Noto+Sans:wght@400;500;600;700' },
  { id: 'plex', label: 'IBM Plex Sans', css: `"IBM Plex Sans", ${LOCAL}`, google: 'IBM+Plex+Sans:wght@400;500;600;700' },
  { id: 'lato', label: 'Lato', css: `Lato, ${LOCAL}`, google: 'Lato:wght@400;700' },
  { id: 'poppins', label: 'Poppins', css: `Poppins, ${LOCAL}`, google: 'Poppins:wght@400;500;600;700' },
  { id: 'roboto', label: 'Roboto', css: `Roboto, ${LOCAL}`, google: 'Roboto:wght@400;500;700' },
  { id: 'system', label: 'System font', css: LOCAL, google: null },
];

/** Built-in backgrounds (no upload needed). */
export const BACKGROUND_PRESETS: { id: string; label: string; css: string; size?: string }[] = [
  { id: 'pasture', label: 'Pasture', css: 'radial-gradient(circle at 15% 10%, #dcfce7 0, transparent 45%), radial-gradient(circle at 85% 0%, #fde2e1 0, transparent 40%), radial-gradient(circle at 50% 100%, #e0f2fe 0, transparent 50%)' },
  { id: 'lines', label: 'Lines', css: 'repeating-linear-gradient(115deg, transparent 0 22px, rgba(120,140,170,.12) 22px 23px)' },
  { id: 'dots', label: 'Dots', css: 'radial-gradient(rgba(120,120,120,.22) 1px, transparent 1px)', size: '18px 18px' },
];
export const presetSize = (css: string) => BACKGROUND_PRESETS.find((p) => p.css === css)?.size ?? 'cover';

export const DEFAULT_APPEARANCE: AppearanceSettings = {
  theme: 'system',
  brandColor: '#d71920',
  backgroundColor: '',
  fontFamily: 'inter',
  fontScale: 100,
  companyName: 'MILCO',
  appName: 'Farmer & Milk Collection',
  logoImage: null,
  appBackground: '',
  appBackgroundOverlay: 85,
  login: {
    layout: 'left',
    visual: 'both',
    panelWidth: 50,
    textAlign: 'left',
    formStyle: 'plain',
    formTitle: 'Sign in',
    formSubtitle: 'Use your MILCO account.',
    eyebrow: '',
    headline: 'Farmer & Milk Collection Management',
    description: 'Farmers, daily collection, quality, payments and approvals in one place, posted straight to your ERP.',
    highlights: [
      '182,000+ litres recorded every day across 146 collection centers',
      'Live tanker tracking from farm to plant',
      'Odoo, SAP Business One and SAP S/4HANA connectors',
    ],
    footer: '© 2026 Milk Industries of Lanka Company Ltd.',
    background: '',
    overlay: 70,
  },
};

const HEX = /^#[0-9a-f]{6}$/i;

/** Returns the first problem with the settings, or null when they can be saved. */
export function validateAppearance(s: AppearanceSettings): string | null {
  if (!HEX.test(s.brandColor)) return 'Brand colour must be a colour like #d71920.';
  if (s.backgroundColor && !HEX.test(s.backgroundColor)) return 'Page background must be a colour like #fafafa, or empty for the default.';
  if (s.fontScale < 85 || s.fontScale > 125) return 'Text size must be between 85% and 125%.';
  if (!s.companyName.trim()) return 'Enter the company name.';
  if (!s.appName.trim()) return 'Enter the app title.';
  if (!s.login.formTitle.trim()) return 'Enter the sign-in title.';
  if (s.login.formTitle.length > 40 || s.login.formSubtitle.length > 120) return 'Keep the sign-in title under 40 characters and the subtitle under 120.';
  if (s.login.visual !== 'image' && s.login.layout !== 'minimal' && !s.login.headline.trim()) return 'Enter the login headline.';
  if (s.login.headline.length > 80 || s.login.description.length > 240) return 'Keep the login headline under 80 characters and the description under 240.';
  return null;
}

/* ───── colour helpers ───── */

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];
const lin = (c: number) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
export const luminance = (hex: string) => {
  const [r, g, b] = rgb(hex).map(lin);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const contrast = (a: string, b: string) => {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};
/** White or near-black text, whichever reads better on the colour. */
export const textOn = (hex: string) => (contrast(hex, '#ffffff') >= contrast(hex, '#18181b') ? '#ffffff' : '#18181b');

const mix = (a: [number, number, number], b: [number, number, number], w: number) => a.map((v, i) => Math.round(v * w + b[i] * (1 - w))) as [number, number, number];
const triple = (c: [number, number, number]) => c.join(' ');

/** The original MILCO red scale, kept exactly when the brand colour is the default. */
const MILCO_SCALE: Record<number, string> = {
  50: '#FEF2F2', 100: '#FDE3E3', 200: '#FBCBCB', 300: '#F7A4A5', 400: '#F06E70', 500: '#E5393C', 600: '#D71920', 700: '#B3141A', 800: '#94151A', 900: '#7A171B',
};
/** 50–900 shades from one colour (it becomes 600). */
export function brandScale(hex: string): Record<number, string> {
  if (hex.toLowerCase() === '#d71920') return Object.fromEntries(Object.entries(MILCO_SCALE).map(([k, v]) => [k, triple(rgb(v))]));
  const c = rgb(hex);
  const W: [number, number, number] = [255, 255, 255];
  const K: [number, number, number] = [0, 0, 0];
  return {
    50: triple(mix(c, W, 0.06)),
    100: triple(mix(c, W, 0.12)),
    200: triple(mix(c, W, 0.24)),
    300: triple(mix(c, W, 0.4)),
    400: triple(mix(c, W, 0.62)),
    500: triple(mix(c, W, 0.84)),
    600: triple(c),
    700: triple(mix(c, K, 0.83)),
    800: triple(mix(c, K, 0.69)),
    900: triple(mix(c, K, 0.57)),
  };
}

/* ───── apply ───── */

function loadFont(id: FontId) {
  const f = FONTS.find((x) => x.id === id);
  if (!f?.google || document.querySelector(`link[data-font="${f.id}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.dataset.font = f.id;
  link.href = `https://fonts.googleapis.com/css2?family=${f.google}&display=swap`;
  document.head.appendChild(link);
}

/** Writes the settings as CSS variables. Safe to call repeatedly. */
export function applyAppearance(s: AppearanceSettings) {
  if (typeof document === 'undefined') return;
  const scale = brandScale(HEX.test(s.brandColor) ? s.brandColor : DEFAULT_APPEARANCE.brandColor);
  const font = FONTS.find((f) => f.id === s.fontFamily) ?? FONTS[0];
  loadFont(font.id);
  const page = s.backgroundColor && HEX.test(s.backgroundColor) ? triple(rgb(s.backgroundColor)) : '250 250 250';
  const css = `
:root {
  ${Object.entries(scale).map(([k, v]) => `--brand-${k}: ${v};`).join('\n  ')}
  --brand-fg: ${textOn(HEX.test(s.brandColor) ? s.brandColor : '#d71920')};
  --font-sans: ${font.css};
  --page-rgb: ${page};
  --app-bg-image: ${s.appBackground || 'none'};
  --app-bg-size: ${presetSize(s.appBackground)};
  --app-bg-overlay: ${s.appBackgroundOverlay / 100};
}
html { font-size: ${s.fontScale}%; }`;
  let tag = document.getElementById('milco-appearance') as HTMLStyleElement | null;
  if (!tag) {
    tag = document.createElement('style');
    tag.id = 'milco-appearance';
    document.head.appendChild(tag);
  }
  tag.textContent = css;
}

/* ───── store: saved settings + an unsaved draft for live preview ───── */

const KEY = 'milco.appearance';

function merge(s: Partial<AppearanceSettings> | null): AppearanceSettings {
  return { ...DEFAULT_APPEARANCE, ...s, login: { ...DEFAULT_APPEARANCE.login, ...s?.login } };
}
function readCache(): Partial<AppearanceSettings> | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

let saved: AppearanceSettings = merge(readCache());
let draft: AppearanceSettings | null = null;
const subs = new Set<() => void>();
const emit = () => {
  applyAppearance(draft ?? saved);
  subs.forEach((f) => f());
};
applyAppearance(saved); // before the first screen is drawn

export const appearanceStore = {
  get: () => draft ?? saved,
  getSaved: () => saved,
  hasDraft: () => draft !== null,
  preview(next: AppearanceSettings) {
    draft = next;
    emit();
  },
  discard() {
    draft = null;
    emit();
  },
  /** Saves for everyone. Returns false when the browser could not keep it (e.g. images too large). */
  commit(next: AppearanceSettings) {
    saved = next;
    draft = null;
    let kept = true;
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      kept = false;
    }
    emit();
    return kept;
  },
  subscribe(f: () => void) {
    subs.add(f);
    return () => {
      subs.delete(f);
    };
  },
};

export function useAppearance() {
  return useSyncExternalStore(appearanceStore.subscribe, appearanceStore.get, appearanceStore.get);
}
