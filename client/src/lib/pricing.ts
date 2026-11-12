/**
 * Milk pricing rules. In production these come from the contract / price template
 * tables in PostgreSQL; the values here mirror the default North Central template.
 */
export type Category = 'Platinum' | 'Gold' | 'Silver' | 'Standard';

export const fatBands = [
  { label: '3.0–3.29', min: 3.0, max: 3.3 },
  { label: '3.3–3.59', min: 3.3, max: 3.6 },
  { label: '3.6–3.99', min: 3.6, max: 4.0 },
  { label: '4.0–4.49', min: 4.0, max: 4.5 },
  { label: '≥ 4.5', min: 4.5, max: 99 },
];

export const snfBands = [
  { label: '< 8.0', min: 0, max: 8.0 },
  { label: '8.0–8.29', min: 8.0, max: 8.3 },
  { label: '8.3–8.59', min: 8.3, max: 8.6 },
  { label: '≥ 8.6', min: 8.6, max: 99 },
];

/** Rs per litre, rows = FAT band, columns = SNF band */
export const priceMatrix: number[][] = [
  [112, 116, 119, 121],
  [120, 128, 131, 133],
  [125, 133, 137, 140],
  [129, 138, 142, 146],
  [132, 142, 147, 152],
];

export const categoryPremium: Record<Category, number> = {
  Platinum: 6,
  Gold: 4,
  Silver: 2,
  Standard: 0,
};

export const qualityLimits = {
  minFat: 3.0,
  minSnf: 7.8,
  chillTemp: 8,
  chillBonus: 2.5,
  flagTemp: 10,
};

export function bandIndex(value: number, bands: { min: number; max: number }[]) {
  return bands.findIndex((b) => value >= b.min && value < b.max);
}

export function ratePerLitre(fat: number, snf: number): number | null {
  if (fat < qualityLimits.minFat || snf < qualityLimits.minSnf) return null;
  const r = bandIndex(fat, fatBands);
  const c = bandIndex(snf, snfBands);
  if (r < 0 || c < 0) return null;
  return priceMatrix[r][c];
}

export interface DeliveryInput {
  litres: number;
  fat: number;
  snf: number;
  temp: number;
  alcohol: 'Pass' | 'Fail';
  adulteration: string;
  category: Category;
}

export interface DeliveryResult {
  result: 'Accepted' | 'Rejected' | 'Flagged';
  reasons: string[];
  rate: number;
  value: number;
}

export function evaluateDelivery(d: DeliveryInput): DeliveryResult {
  const reasons: string[] = [];
  if (d.alcohol === 'Fail') reasons.push('Alcohol test failed');
  if (d.adulteration !== 'None found') reasons.push(`Adulteration: ${d.adulteration}`);
  const base = ratePerLitre(d.fat, d.snf);
  if (base === null) reasons.push(`Below minimum (FAT ${qualityLimits.minFat} / SNF ${qualityLimits.minSnf})`);

  if (reasons.length > 0 || base === null) {
    return { result: 'Rejected', reasons, rate: 0, value: 0 };
  }

  const chill = d.temp <= qualityLimits.chillTemp ? qualityLimits.chillBonus : 0;
  const rate = base + categoryPremium[d.category] + chill;
  const flagged = d.temp > qualityLimits.flagTemp;
  if (flagged) reasons.push(`Temperature ${d.temp} °C above ${qualityLimits.flagTemp} °C`);

  return {
    result: flagged ? 'Flagged' : 'Accepted',
    reasons,
    rate,
    value: Math.round(d.litres * rate),
  };
}
