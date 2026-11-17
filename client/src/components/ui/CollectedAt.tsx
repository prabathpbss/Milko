import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { Loader2, LocateFixed, MapPin, Warehouse } from 'lucide-react';
import { Field } from '@/components/ui/Field';
import type { CollectionSource } from '@/data/mock';
import { useLang } from '@/i18n/LanguageContext';

export interface CollectedAtValue {
  source: CollectionSource;
  /** Farm visit: house no. and road */
  address: string;
  /** Farm visit: village / area */
  village: string;
  /** Farm visit: optional landmark to find the farm */
  landmark: string;
  /** Farm visit: GPS, typed or from the device; both or neither */
  lat: string;
  lng: string;
  /** Farm visit: why staff went to the farm */
  reason: string;
  /** Farm visit: details, required when the reason is "Other" */
  note: string;
}

export const VISIT_REASONS = ['Farmer cannot travel', 'Large volume', 'Remote farm', 'Sick animal / vet visit', 'Other'];

export const atCenter = (): CollectedAtValue => ({ source: 'Center', address: '', village: '', landmark: '', lat: '', lng: '', reason: '', note: '' });

/** Sri Lanka, with a little margin. */
const LAT_RANGE = [5.8, 10] as const;
const LNG_RANGE = [79.4, 82] as const;
const NUM_RE = /^-?\d{1,3}(\.\d+)?$/;

type T = (s: string, v?: Record<string, string | number>) => string;

/** Inline errors for the GPS fields (checked as the user types). */
function gpsErrors(v: CollectedAtValue, t: T) {
  const e: { lat?: string; lng?: string } = {};
  const lat = v.lat.trim();
  const lng = v.lng.trim();
  if (lat && (!NUM_RE.test(lat) || +lat < LAT_RANGE[0] || +lat > LAT_RANGE[1]))
    e.lat = t('Latitude in Sri Lanka is {min}–{max}.', { min: LAT_RANGE[0], max: LAT_RANGE[1] });
  if (lng && (!NUM_RE.test(lng) || +lng < LNG_RANGE[0] || +lng > LNG_RANGE[1]))
    e.lng = t('Longitude in Sri Lanka is {min}–{max}.', { min: LNG_RANGE[0], max: LNG_RANGE[1] });
  if (lat && !lng && !e.lat) e.lng = t('Enter the longitude too.');
  if (lng && !lat && !e.lng) e.lat = t('Enter the latitude too.');
  return e;
}

/** Returns an error message, or '' when the value is complete. */
export function collectedAtError(v: CollectedAtValue, t: T) {
  if (v.source !== 'Farm') return '';
  if (!v.address.trim() && !v.village.trim()) return t('Enter the farm address or village for a farm visit.');
  const g = gpsErrors(v, t);
  if (g.lat || g.lng) return g.lat || g.lng || '';
  if (!v.reason) return t('Pick why the milk was collected at the farm.');
  if (v.reason === 'Other' && !v.note.trim()) return t('Describe the reason for the farm visit.');
  return '';
}

/** One-line location for lists and receipts, e.g. "No. 42, Yaya 4 · Near the temple · 8.04120, 80.95120". */
export function formatLocation(v: CollectedAtValue) {
  const place = [v.address, v.village].map((s) => s.trim()).filter(Boolean).join(', ');
  const parts = [place, v.landmark.trim() && `Near ${v.landmark.trim()}`, v.lat.trim() && v.lng.trim() ? `${v.lat.trim()}, ${v.lng.trim()}` : ''];
  return parts.filter(Boolean).join(' · ');
}

/** Visit reason as stored: "Other: <details>" when details are given. */
export const formatReason = (v: CollectedAtValue) => (v.note.trim() ? `${v.reason}: ${v.note.trim()}` : v.reason);

/**
 * "Collected at" switch for a milk delivery. Most farmers hand milk over at the center counter (default);
 * occasionally staff visit the farm, which needs the pickup location and a reason for the supervisor.
 */
export default function CollectedAt({
  value,
  onChange,
  farmAddress,
  farmGps,
  disabled,
  large,
}: {
  value: CollectedAtValue;
  onChange: (v: CollectedAtValue) => void;
  /** Registered address of the chosen farmer; pre-fills the address on a farm visit */
  farmAddress?: string;
  /** Registered GPS of the farm, "lat, lng"; pre-fills the coordinates */
  farmGps?: string;
  disabled?: boolean;
  /** Bigger touch targets for the phone form */
  large?: boolean;
}) {
  const { t } = useLang();
  const [locating, setLocating] = useState(false);
  const [gpsMsg, setGpsMsg] = useState('');

  /** Registered farm details, used to pre-fill empty fields. */
  const registered = () => {
    const [lat = '', lng = ''] = (farmGps ?? '').split(',').map((s) => s.trim());
    return { address: farmAddress ?? '', lat, lng };
  };
  const fillBlanks = (v: CollectedAtValue): CollectedAtValue => {
    const r = registered();
    const noGps = !v.lat.trim() && !v.lng.trim();
    return { ...v, address: v.address || (v.village ? '' : r.address), lat: noGps ? r.lat : v.lat, lng: noGps ? r.lng : v.lng };
  };

  // Farm visit picked before the farmer: fill the location once the farmer is known.
  useEffect(() => {
    if (value.source === 'Farm' && (farmAddress || farmGps)) {
      const next = fillBlanks(value);
      if (next.address !== value.address || next.lat !== value.lat || next.lng !== value.lng) onChange(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [farmAddress, farmGps, value.source]);

  const pick = (source: CollectionSource) => {
    setGpsMsg('');
    onChange(source === 'Center' ? atCenter() : fillBlanks({ ...value, source }));
  };
  const set = (k: keyof CollectedAtValue) => (e: { target: { value: string } }) => onChange({ ...value, [k]: e.target.value });

  const useMyLocation = () => {
    if (!navigator.geolocation) return setGpsMsg(t('This device cannot share its location.'));
    setLocating(true);
    setGpsMsg('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        onChange({ ...value, lat: pos.coords.latitude.toFixed(5), lng: pos.coords.longitude.toFixed(5) });
        setGpsMsg(t('Filled from this device (±{m} m).', { m: Math.round(pos.coords.accuracy) }));
      },
      () => {
        setLocating(false);
        setGpsMsg(t('Location not available. Type the latitude and longitude instead.'));
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const gErr = gpsErrors(value, t);
  const reg = registered();
  const isRegistered = !!reg.lat && value.lat.trim() === reg.lat && value.lng.trim() === reg.lng;
  const input = clsx('input', large && 'h-12');

  const options = [
    { id: 'Center' as const, label: t('At center'), sub: t('Farmer brought the milk'), icon: Warehouse },
    { id: 'Farm' as const, label: t('Farm visit'), sub: t('Collected at the farmer’s place'), icon: MapPin },
  ];

  return (
    <fieldset className="space-y-3" disabled={disabled}>
      <legend className="label mb-1.5">{t('Collected at')}</legend>
      <div role="radiogroup" aria-label={t('Collected at')} className="grid grid-cols-2 gap-2">
        {options.map((o) => {
          const on = value.source === o.id;
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => pick(o.id)}
              className={clsx(
                'flex items-center gap-2.5 rounded-lg border px-3 text-left transition disabled:opacity-60',
                large ? 'h-14' : 'h-12',
                on ? 'border-brand-600 bg-brand-50 text-brand-700 ring-2 ring-brand-600/15' : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50',
              )}
            >
              <o.icon className="h-5 w-5 shrink-0" />
              <span className="min-w-0">
                <span className="block text-sm font-semibold leading-tight">{o.label}</span>
                <span className="block truncate text-xs leading-tight opacity-75">{o.sub}</span>
              </span>
            </button>
          );
        })}
      </div>

      {value.source === 'Farm' && (
        <div className="space-y-4 rounded-lg border border-amber-200 bg-amber-50 p-3 sm:p-4">
          <div className="space-y-3">
            <p className="text-sm font-semibold">{t('Farm location')}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t('House no. & road')}>
                <input className={input} value={value.address} onChange={set('address')} placeholder={t('e.g. No. 42, Temple Road')} autoComplete="off" />
              </Field>
              <Field label={t('Village / area')}>
                <input className={input} value={value.village} onChange={set('village')} placeholder={t('e.g. Yaya 4, Hingurakgoda')} autoComplete="off" />
              </Field>
            </div>
            <Field label={t('Landmark (optional)')} hint={t('Helps the next visit find the farm')}>
              <input className={input} value={value.landmark} onChange={set('landmark')} placeholder={t('e.g. Behind the Yaya 4 temple')} autoComplete="off" />
            </Field>
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold">
                {t('GPS (optional)')}
                {isRegistered && <span className="ml-2 text-xs font-normal text-zinc-500">{t('Registered farm location')}</span>}
              </p>
              <button type="button" className="btn btn-secondary btn-sm" onClick={useMyLocation} disabled={locating}>
                {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
                {t('Use my location')}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('Latitude')} error={gErr.lat}>
                <input className={clsx(input, 'num')} inputMode="decimal" value={value.lat} onChange={set('lat')} placeholder="8.04120" autoComplete="off" />
              </Field>
              <Field label={t('Longitude')} error={gErr.lng}>
                <input className={clsx(input, 'num')} inputMode="decimal" value={value.lng} onChange={set('lng')} placeholder="80.95120" autoComplete="off" />
              </Field>
            </div>
            {gpsMsg && <p className="text-xs text-zinc-500">{gpsMsg}</p>}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t('Reason for farm visit')}>
              <select className={input} value={value.reason} onChange={set('reason')}>
                <option value="">{t('Pick a reason')}</option>
                {VISIT_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {t(r)}
                  </option>
                ))}
              </select>
            </Field>
            {value.reason && (
              <Field label={value.reason === 'Other' ? t('Details') : t('Details (optional)')}>
                <input className={input} value={value.note} onChange={set('note')} placeholder={t('e.g. Lorry broke down on the way')} />
              </Field>
            )}
          </div>
          <p className="text-xs text-amber-800">{t('Farm visits are listed for the center supervisor to review.')}</p>
        </div>
      )}
    </fieldset>
  );
}
