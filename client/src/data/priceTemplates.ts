/**
 * Price template master.
 * MILCO owns milk pricing (FAT × SNF matrix + premiums + quality rules). The ERP only receives the
 * calculated price on the purchase documents.
 * Maps to the future Prisma models PriceTemplate / PriceTemplateVersion.
 */
import { fatBands, snfBands } from '@/lib/pricing';

export type TemplateStatus = 'Draft' | 'Pending approval' | 'Active' | 'Expired';
/** A farmer category name from the category master, or 'Society' for bulk society pricing. */
export type TemplateCategory = string;

export interface PriceTemplate {
  id: string;
  name: string;
  region: string;
  category: TemplateCategory;
  version: number;
  status: TemplateStatus;
  validFrom: string; // yyyy-mm-dd
  validTo: string;
  /** Rs per litre — rows = FAT bands, columns = SNF bands */
  matrix: number[][];
  premium: number;
  chillBonus: number;
  chillTemp: number;
  flagTemp: number;
  minFat: number;
  minSnf: number;
  farmers: number;
  notes: string;
  updatedBy: string;
  updatedAt: string;
  history: { when: string; who: string; text: string }[];
}

export const FAT_BANDS = fatBands.map((b) => b.label);
export const SNF_BANDS = snfBands.map((b) => b.label);

const NC: number[][] = [
  [112, 116, 119, 121],
  [120, 128, 131, 133],
  [125, 133, 137, 140],
  [129, 138, 142, 146],
  [132, 142, 147, 152],
];
const shift = (m: number[][], by: number) => m.map((r) => r.map((v) => v + by));

const base = {
  chillBonus: 2.5,
  chillTemp: 8,
  flagTemp: 10,
  minFat: 3.0,
  minSnf: 7.8,
  notes: '',
};

export const priceTemplates: PriceTemplate[] = [
  {
    ...base, id: 'PT-NC-GOLD-26', name: 'Gold · North Central 2026', region: 'North Central', category: 'Gold', version: 1, status: 'Active',
    validFrom: '2026-01-01', validTo: '2026-12-31', matrix: NC, premium: 4, farmers: 1840,
    updatedBy: 'S. Jaya', updatedAt: '2025-12-18',
    history: [
      { when: '18 Dec 2025', who: 'S. Jaya (Procurement)', text: 'Created v1 from Gold · North Central 2025 (+Rs 3.00 / L).' },
      { when: '22 Dec 2025', who: 'General manager', text: 'Approved v1. Effective 01 Jan 2026.' },
    ],
  },
  {
    ...base, id: 'PT-NC-GOLD-26-V2', name: 'Gold · North Central 2026', region: 'North Central', category: 'Gold', version: 2, status: 'Pending approval',
    validFrom: '2026-11-16', validTo: '2026-12-31',
    matrix: NC.map((r, i) => (i === 3 ? r.map((v) => v + 2) : r)), premium: 4, farmers: 0,
    updatedBy: 'S. Jaya', updatedAt: '2026-11-12',
    notes: '+Rs 2.00 / L on FAT 4.0–4.49 to keep high-FAT suppliers from switching to private collectors.',
    history: [
      { when: '12 Nov 2026', who: 'S. Jaya (Procurement)', text: 'Created v2 from v1. FAT 4.0–4.49 row +Rs 2.00 / L.' },
      { when: '12 Nov 2026', who: 'S. Jaya (Procurement)', text: 'Submitted for approval (AP-0979).' },
    ],
  },
  {
    ...base, id: 'PT-NC-SILV-26', name: 'Silver · North Central 2026', region: 'North Central', category: 'Silver', version: 1, status: 'Active',
    validFrom: '2026-01-01', validTo: '2026-12-31', matrix: NC, premium: 2, farmers: 2310,
    updatedBy: 'S. Jaya', updatedAt: '2025-12-18',
    history: [{ when: '22 Dec 2025', who: 'General manager', text: 'Approved v1.' }],
  },
  {
    ...base, id: 'PT-NC-STD-26', name: 'Standard · North Central 2026', region: 'North Central', category: 'Standard', version: 1, status: 'Active',
    validFrom: '2026-01-01', validTo: '2026-12-31', matrix: NC, premium: 0, farmers: 3105,
    updatedBy: 'S. Jaya', updatedAt: '2025-12-18',
    history: [{ when: '22 Dec 2025', who: 'General manager', text: 'Approved v1.' }],
  },
  {
    ...base, id: 'PT-NC-STD-25', name: 'Standard · North Central 2025', region: 'North Central', category: 'Standard', version: 3, status: 'Expired',
    validFrom: '2025-01-01', validTo: '2025-12-31', matrix: shift(NC, -3), premium: 0, farmers: 12,
    updatedBy: 'S. Jaya', updatedAt: '2025-06-30',
    notes: '12 farmers still on this template — renew their contracts.',
    history: [{ when: '31 Dec 2025', who: 'System', text: 'Expired at end of validity.' }],
  },
  {
    ...base, id: 'PT-NW-GOLD-26', name: 'Gold · North Western 2026', region: 'North Western', category: 'Gold', version: 1, status: 'Active',
    validFrom: '2026-01-01', validTo: '2026-12-31', matrix: shift(NC, 1), premium: 4, farmers: 760,
    updatedBy: 'P. Wickrama', updatedAt: '2025-12-20',
    history: [{ when: '23 Dec 2025', who: 'General manager', text: 'Approved v1.' }],
  },
  {
    ...base, id: 'PT-CE-PLAT-26', name: 'Platinum · Central 2026', region: 'Central', category: 'Platinum', version: 1, status: 'Active',
    validFrom: '2026-02-01', validTo: '2027-01-31', matrix: shift(NC, 4), premium: 6, chillBonus: 3, farmers: 214,
    updatedBy: 'S. Herath', updatedAt: '2026-01-20',
    history: [{ when: '25 Jan 2026', who: 'General manager', text: 'Approved v1.' }],
  },
  {
    ...base, id: 'PT-SOC-26', name: 'Society bulk · 2026', region: 'All regions', category: 'Society', version: 1, status: 'Active',
    validFrom: '2026-01-01', validTo: '2026-12-31', matrix: shift(NC, -2), premium: 3, chillBonus: 0, farmers: 38,
    updatedBy: 'S. Jaya', updatedAt: '2025-12-18',
    notes: 'Societies chill at their own center, so there is no chill bonus; bulk premium Rs 3 / L instead.',
    history: [{ when: '22 Dec 2025', who: 'General manager', text: 'Approved v1.' }],
  },
  {
    ...base, id: 'PT-EA-STD-27', name: 'Standard · Eastern 2027', region: 'Eastern', category: 'Standard', version: 1, status: 'Draft',
    validFrom: '2027-01-01', validTo: '2027-12-31', matrix: shift(NC, 2), premium: 0, farmers: 0,
    updatedBy: 'M. Ismail', updatedAt: '2026-11-10',
    history: [{ when: '10 Nov 2026', who: 'M. Ismail (Ampara)', text: 'Draft created from Standard · North Central 2026 (+Rs 2.00 / L).' }],
  },
];

/** Active templates — used by contract and onboarding dropdowns. */
export const activeTemplateNames = () =>
  Array.from(new Set(priceTemplates.filter((t) => t.status === 'Active').map((t) => t.name)));

/** Rate for one delivery under a template. Returns null when the milk is below minimums (rejected). */
export function templateRate(t: PriceTemplate, fat: number, snf: number, temp: number) {
  if (fat < t.minFat || snf < t.minSnf) return null;
  const r = fatBands.findIndex((b) => fat >= b.min && fat < b.max);
  const c = snfBands.findIndex((b) => snf >= b.min && snf < b.max);
  if (r < 0 || c < 0) return null;
  const baseRate = t.matrix[r][c];
  const chill = temp <= t.chillTemp ? t.chillBonus : 0;
  return { r, c, base: baseRate, premium: t.premium, chill, rate: baseRate + t.premium + chill, flagged: temp > t.flagTemp };
}
