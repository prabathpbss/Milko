/**
 * Milk deliveries by date and center. Field collection writes here; Daily collection reads it.
 * Maps to the future Prisma model Delivery (date + center + shift + farmer).
 */
import { useMemo } from 'react';
import { createStore, useStore } from '@/lib/store';
import { deliveries as todaySeed, farmers, type Delivery } from '@/data/mock';
import { evaluateDelivery } from '@/lib/pricing';

export interface CollectionRecord extends Delivery {
  /** YYYY-MM-DD */
  date: string;
  centerId: string;
}

/** The demo's "today" (matches TODAY in mock.ts). */
export const TODAY_ISO = '2026-11-12';
/** How many days of history the demo holds. */
export const HISTORY_DAYS = 30;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** 2026-11-12 → 12 Nov 2026 */
export const fmtDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
};
/** Add days to an ISO date (UTC, so no time-zone drift). */
export const addDays = (iso: string, n: number) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
export const FIRST_DAY = addDays(TODAY_ISO, -(HISTORY_DAYS - 1));

/* ───── Demo history: deterministic so every reload shows the same numbers ───── */

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const COUNTERS = ['Counter 1', 'Counter 2', 'Counter 3'];

function generateHistory(): CollectionRecord[] {
  const out: CollectionRecord[] = [];
  const rand = rng(20261112);
  let n = 1;
  const suppliers = farmers.filter((f) => f.status === 'Active');
  for (let day = HISTORY_DAYS - 1; day >= 0; day--) {
    const date = addDays(TODAY_ISO, -day);
    for (const shift of ['AM', 'PM'] as const) {
      // Today: only the morning shift has happened; Hingurakgoda's morning comes from the live seed below.
      if (date === TODAY_ISO && shift === 'PM') continue;
      for (const f of suppliers) {
        if (date === TODAY_ISO && f.centerId === 'CC-HNG') continue;
        if (rand() < 0.06) continue; // did not supply this shift
        const farm = rand() < 0.04;
        const litres = Math.round((f.avgLitres / 2) * (0.82 + rand() * 0.34) * 2) / 2;
        const fat = +(f.fat + (rand() - 0.5) * 0.3).toFixed(2);
        const snf = +(f.snf + (rand() - 0.5) * 0.24).toFixed(2);
        const temp = +(farm ? 8 + rand() * 4 : 4 + rand() * 5.5).toFixed(1);
        const alcohol = rand() < 0.02 ? 'Fail' : 'Pass';
        const adulteration = rand() < 0.015 ? 'Water' : 'None found';
        const ev = evaluateDelivery({ litres, fat, snf, temp, alcohol, adulteration, category: f.category });
        const mm = Math.floor(rand() * 50);
        const time = shift === 'AM' ? `0${6 + Math.floor(mm / 30)}:${String(mm % 30 * 2).padStart(2, '0')}` : `1${6 + Math.floor(mm / 30)}:${String(mm % 30 * 2).padStart(2, '0')}`;
        out.push({
          id: `D-${String(n++).padStart(5, '0')}`,
          date,
          centerId: f.centerId,
          time,
          shift,
          farmerId: f.id,
          farmerName: f.name,
          litres,
          fat,
          snf,
          temp,
          alcohol,
          adulteration,
          result: ev.result,
          by: farm ? 'Farm visit · K. Dissanayake' : COUNTERS[Math.floor(rand() * COUNTERS.length)],
          value: ev.value,
          ...(farm ? { source: 'Farm' as const, location: f.address, visitReason: 'Farmer cannot travel' } : { source: 'Center' as const }),
        });
      }
    }
  }
  // Today's Hingurakgoda morning shift as recorded on the counters
  for (const d of todaySeed) out.push({ ...d, date: TODAY_ISO, centerId: 'CC-HNG' });
  return out;
}

export const deliveryStore = createStore<CollectionRecord[]>(generateHistory());
export const useDeliveries = () => useStore(deliveryStore);

/** Save a delivery from Field collection. */
export function addDelivery(d: Omit<CollectionRecord, 'id'>) {
  const rec = { ...d, id: `D-${String(deliveryStore.get().length + 1).padStart(5, '0')}` };
  deliveryStore.set((all) => [...all, rec]);
  return rec;
}

/** Deliveries for one date, optionally one center and one shift. */
export function useDayDeliveries(date: string, centerId: string | 'all', shift: 'all' | 'AM' | 'PM') {
  const all = useDeliveries();
  return useMemo(
    () => all.filter((d) => d.date === date && (centerId === 'all' || d.centerId === centerId) && (shift === 'all' || d.shift === shift)),
    [all, date, centerId, shift],
  );
}
