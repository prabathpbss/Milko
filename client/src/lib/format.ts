const LOCALE = 'en-US';

export const num = (n: number, decimals = 0) =>
  n.toLocaleString(LOCALE, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

export const lkr = (n: number, decimals = 0) => {
  const sign = n < 0 ? '−' : '';
  return `${sign}Rs ${num(Math.abs(n), decimals)}`;
};

export const compact = (n: number) => {
  const a = Math.abs(n);
  if (a >= 1e6) return `${(n / 1e6).toFixed(1)} M`;
  if (a >= 1e3) return `${(n / 1e3).toFixed(1)} K`;
  return String(n);
};

export const initials = (name: string) =>
  name
    .replace(/[^A-Za-z ]/g, ' ')
    .split(' ')
    .filter((p) => p.length > 1)
    .slice(-2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();

export const pct = (n: number, decimals = 0) => `${n.toFixed(decimals)}%`;
