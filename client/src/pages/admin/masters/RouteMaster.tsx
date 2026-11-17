import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ArrowDown, ArrowUp, Flag, Plus, X } from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Field } from '@/components/ui/Field';
import { FilterChips } from '@/components/ui/Tabs';
import {
  ROUTE_SHIFTS,
  centerName,
  plantName,
  routeStore,
  useCenterMaster,
  usePlantMaster,
  type MasterStatus,
  type RouteMaster,
  type RouteShift,
} from '@/data/masters';
import { scopeStore, useScopeMaster } from '@/data/access';
import { tankers } from '@/data/mock';
import { num } from '@/lib/format';
import { useToast } from '@/context/ToastContext';
import { useLang } from '@/i18n/LanguageContext';
import { FormActions, MasterLayout, SearchBar, focusFirstError } from './shared';

interface RouteDraft {
  code: string;
  name: string;
  centerId: string;
  shift: RouteShift;
  departure: string;
  arriveBy: string;
  stops: string[];
  destination: string;
  distanceKm: string;
  tanker: string;
  status: MasterStatus;
}

const emptyRoute = (): RouteDraft => ({
  code: '', name: '', centerId: '', shift: 'Morning', departure: '05:30', arriveBy: '09:00',
  stops: [''], destination: '', distanceKm: '', tanker: '', status: 'Active',
});
const toDraft = (r: RouteMaster): RouteDraft => ({ ...r, stops: [...r.stops], distanceKm: String(r.distanceKm) });

const ROUTE_CODE_RE = /^R-\d{2,3}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const minutes = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3));
const shiftsOverlap = (a: RouteShift, b: RouteShift) => a === b || a === 'Both' || b === 'Both';

type ShiftFilter = 'All' | RouteShift;

export default function Routes({ rows }: { rows: RouteMaster[] }) {
  const toast = useToast();
  const { t } = useLang();
  const scopes = useScopeMaster();
  const allCenters = useCenterMaster();
  const allPlants = usePlantMaster();
  const nav =useLocation().state as { newRoute?: boolean; code?: string } | null;
  const [q, setQ] = useState('');
  const [shift, setShift] = useState<ShiftFilter>('All');
  const initial = nav?.newRoute ? null : rows.find((r) => r.code === nav?.code) ?? rows[0] ?? null;
  const [selCode, setSelCode] = useState<string | null>(initial?.code ?? null);
  const sel = rows.find((r) => r.code === selCode) ?? null;
  const [d, setD] = useState<RouteDraft>(sel ? toDraft(sel) : emptyRoute());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isNew = selCode === null;

  const open = (r: RouteMaster | null) => {
    setSelCode(r?.code ?? null);
    setD(r ? toDraft(r) : emptyRoute());
    setErrors({});
  };
  const set = (k: keyof RouteDraft) => (e: { target: { value: string } }) => setD((x) => ({ ...x, [k]: e.target.value }));

  /* Stops: edit, add, remove and reorder */
  const setStop = (i: number, v: string) => setD((x) => ({ ...x, stops: x.stops.map((s, j) => (j === i ? v : s)) }));
  const addStop = () => setD((x) => ({ ...x, stops: [...x.stops, ''] }));
  const removeStop = (i: number) => setD((x) => ({ ...x, stops: x.stops.length > 1 ? x.stops.filter((_, j) => j !== i) : [''] }));
  const moveStop = (i: number, dir: -1 | 1) =>
    setD((x) => {
      const s = [...x.stops];
      [s[i], s[i + dir]] = [s[i + dir], s[i]];
      return { ...x, stops: s };
    });

  /** Picking a center on a new route pre-fills its pickup points and default plant if none are entered yet. */
  const changeCenter = (id: string) =>
    setD((x) => {
      const c = allCenters.find((cc) => cc.code === id);
      const blank = x.stops.every((s) => !s.trim());
      const plantOk = !!c?.plant && allPlants.some((p) => p.code === c.plant && p.status === 'Active');
      return {
        ...x,
        centerId: id,
        stops: isNew && blank && c ? [...c.fms.map((f) => `${f} FMS`), c.name] : x.stops,
        destination: !x.destination && plantOk ? c!.plant : x.destination,
      };
    });

  // Dropdowns list active records, plus the one already on this route so an inactive pick still shows.
  const centerOptions = allCenters.filter((c) => c.status === 'Active' || c.code === d.centerId);
  const plantOptions = allPlants.filter((p) => p.status === 'Active' || p.code === d.destination);
  const center = allCenters.find((c) => c.code === d.centerId);
  const stopSuggestions = center ? [...center.fms.map((f) => `${f} FMS`), center.name] : centerOptions.map((c) => c.name);

  const term = q.trim().toLowerCase();
  const shown = rows.filter(
    (r) =>
      (shift === 'All' || r.shift === shift) &&
      (!term || [r.code, r.name, centerName(r.centerId), r.tanker, plantName(r.destination), ...r.stops].some((v) => v.toLowerCase().includes(term))),
  );

  const save = () => {
    const code = d.code.trim().toUpperCase();
    const name = d.name.trim();
    const stops = d.stops.map((s) => s.trim()).filter(Boolean);
    const km = Number(d.distanceKm);
    const e: Record<string, string> = {};
    if (!ROUTE_CODE_RE.test(code)) e.code = t('Use R- and 2–3 digits, e.g. {code}.', { code: 'R-07' });
    else if (rows.some((r) => r.code === code && r.code !== selCode)) e.code = t('This code is already used.');
    if (!name) e.name = t('Enter the route name.');
    else if (rows.some((r) => r.name.toLowerCase() === name.toLowerCase() && r.code !== selCode)) e.name = t('This route already exists.');
    if (!d.centerId) e.centerId = t('Pick the collection center.');
    if (!stops.length) e.stops = t('Add at least one pickup point.');
    else if (new Set(stops.map((s) => s.toLowerCase())).size !== stops.length) e.stops = t('Each pickup point can be used once.');
    if (!d.destination) e.destination = t('Pick the plant.');
    if (!TIME_RE.test(d.departure)) e.departure = t('Use 24-hour time, e.g. {time}.', { time: '05:30' });
    if (!TIME_RE.test(d.arriveBy)) e.arriveBy = t('Use 24-hour time, e.g. {time}.', { time: '09:00' });
    else if (!e.departure && minutes(d.arriveBy) <= minutes(d.departure)) e.arriveBy = t('Must be after the departure time.');
    if (d.distanceKm.trim() === '' || Number.isNaN(km) || km <= 0) e.distanceKm = t('Enter the distance in km.');
    if (d.tanker && d.status === 'Active') {
      const clash = rows.find((r) => r.code !== selCode && r.status === 'Active' && r.tanker === d.tanker && shiftsOverlap(r.shift, d.shift));
      if (clash) e.tanker = t('This tanker already runs route {code} in the same shift.', { code: clash.code });
    }
    setErrors(e);
    if (Object.keys(e).length) return focusFirstError();

    const next: RouteMaster = {
      code,
      name,
      centerId: d.centerId,
      shift: d.shift,
      departure: d.departure,
      arriveBy: d.arriveBy,
      stops,
      destination: d.destination,
      distanceKm: km,
      tanker: d.tanker,
      farmers: sel?.farmers ?? 0,
      status: d.status,
    };
    routeStore.set((all) => (isNew ? [...all, next] : all.map((r) => (r.code === selCode ? next : r))));
    // A renamed code follows into the access scopes that list this route.
    if (!isNew && selCode && selCode !== code) {
      scopeStore.set((all) => all.map((s) => (s.level === 'Route' ? { ...s, members: s.members.map((m) => (m === selCode ? code : m)) } : s)));
    }
    setSelCode(code);
    setD((x) => ({ ...x, code, name, stops }));
    toast(isNew ? t('Route {name} created.', { name: `${code} ${name}` }) : t('Route {name} saved.', { name: `${code} ${name}` }));
  };

  const inScopes = sel ? scopes.filter((s) => s.level === 'Route' && s.members.includes(sel.code)) : [];
  const inUse = !!sel && (sel.farmers > 0 || inScopes.length > 0);
  const tanker = tankers.find((tk) => tk.plate === d.tanker);
  const filledStops = d.stops.filter((s) => s.trim());

  return (
    <MasterLayout
      list={
        <>
          <SearchBar value={q} onChange={setQ} onNew={() => open(null)} placeholder={t('Code, name, center, stop or tanker…')} label={t('New route')} />
          <div className="border-b border-zinc-100 px-4 py-3">
            <FilterChips<ShiftFilter>
              value={shift}
              onChange={setShift}
              options={[
                { id: 'All', label: t('All'), count: rows.length },
                ...ROUTE_SHIFTS.map((s) => ({ id: s, label: t(s), count: rows.filter((r) => r.shift === s).length })),
              ]}
            />
          </div>
          <DataTable<RouteMaster>
            rows={shown}
            rowKey={(r) => r.code}
            selectedKey={selCode}
            onRowClick={open}
            empty={t('No routes match this search.')}
            columns={[
              {
                key: 'code',
                header: t('Route'),
                render: (r) => (
                  <div>
                    <div className="font-medium">
                      <span className="num">{r.code}</span> · {r.name}
                    </div>
                    <div className="text-xs text-zinc-500">
                      {centerName(r.centerId)} → {t(plantName(r.destination))}
                    </div>
                  </div>
                ),
              },
              { key: 'shift', header: t('Shift'), render: (r) => <Badge tone={r.shift === 'Evening' ? 'info' : r.shift === 'Both' ? 'brand' : 'neutral'}>{t(r.shift)}</Badge> },
              { key: 'time', header: t('Run time'), mono: true, render: (r) => `${r.departure}–${r.arriveBy}` },
              { key: 'stops', header: t('Stops'), align: 'right', mono: true, render: (r) => r.stops.length },
              { key: 'km', header: t('Distance'), align: 'right', mono: true, render: (r) => `${r.distanceKm} km` },
              { key: 'tanker', header: t('Tanker'), mono: true, render: (r) => r.tanker || <span className="text-zinc-500">{t('Not assigned')}</span> },
              { key: 'farmers', header: t('Farmers'), align: 'right', mono: true, render: (r) => num(r.farmers) },
              { key: 'status', header: t('Status'), render: (r) => <StatusBadge status={r.status} /> },
            ]}
          />
        </>
      }
      form={
        <Card>
          <CardHeader
            title={isNew ? t('New route') : `${sel?.code ?? ''} · ${d.name || t('Route')}`}
            subtitle={isNew ? t('Add a collection route') : centerName(d.centerId)}
            actions={!isNew && <StatusBadge status={d.status} />}
          />
          <CardBody>
            <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
              <div className="grid gap-4 sm:grid-cols-[120px_1fr]">
                <Field label={t('Code')} error={errors.code} hint={!errors.code ? t('e.g. {code}', { code: 'R-07' }) : undefined}>
                  <input className="input num uppercase" value={d.code} onChange={set('code')} maxLength={5} autoComplete="off" spellCheck={false} />
                </Field>
                <Field label={t('Route name')} error={errors.name}>
                  <input className="input" value={d.name} onChange={set('name')} placeholder={t('e.g. Yaya 1–6')} />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t('Collection center')} error={errors.centerId}>
                  <select className="input" value={d.centerId} onChange={(e) => changeCenter(e.target.value)}>
                    <option value="">{t('Pick a center')}</option>
                    {centerOptions.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name} · {t(c.region)}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={t('Delivers to')} error={errors.destination}>
                  <select className="input" value={d.destination} onChange={set('destination')}>
                    <option value="">{t('Pick the plant')}</option>
                    {plantOptions.map((p) => (
                      <option key={p.code} value={p.code}>
                        {t(p.name)}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold">{t('Schedule')}</legend>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label={t('Shift')}>
                    <select className="input" value={d.shift} onChange={set('shift')}>
                      {ROUTE_SHIFTS.map((s) => (
                        <option key={s} value={s}>
                          {t(s)}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label={t('Departs')} error={errors.departure}>
                    <input className="input num" type="time" value={d.departure} onChange={set('departure')} />
                  </Field>
                  <Field label={t('Arrives at plant by')} error={errors.arriveBy}>
                    <input className="input num" type="time" value={d.arriveBy} onChange={set('arriveBy')} />
                  </Field>
                </div>
              </fieldset>

              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold">
                  {t('Pickup points in driving order')} <span className="num font-normal text-zinc-500">· {filledStops.length}</span>
                </legend>
                <p className="text-xs text-zinc-500">{t('The driver form shows the stops in this order. Use the arrows to reorder.')}</p>
                <datalist id="route-stop-suggestions">
                  {stopSuggestions.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
                <ol className="space-y-2">
                  {d.stops.map((s, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="num flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-700">{i + 1}</span>
                      <label className="min-w-0 flex-1">
                        <span className="sr-only">{t('Pickup point {n}', { n: i + 1 })}</span>
                        <input
                          id={`route-stop-${i}`}
                          className="input"
                          list="route-stop-suggestions"
                          value={s}
                          onChange={(e) => setStop(i, e.target.value)}
                          placeholder={t('e.g. Yaya 1 FMS')}
                        />
                      </label>
                      <button type="button" className="btn btn-ghost btn-sm px-2" disabled={i === 0} onClick={() => moveStop(i, -1)} aria-label={t('Move up')}>
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button type="button" className="btn btn-ghost btn-sm px-2" disabled={i === d.stops.length - 1} onClick={() => moveStop(i, 1)} aria-label={t('Move down')}>
                        <ArrowDown className="h-4 w-4" />
                      </button>
                      <button type="button" className="btn btn-ghost btn-sm px-2 text-red-700" onClick={() => removeStop(i)} aria-label={t('Remove stop')}>
                        <X className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                  <li className="flex items-center gap-2 text-sm text-zinc-600">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                      <Flag className="h-3.5 w-3.5" />
                    </span>
                    {d.destination ? t(plantName(d.destination)) :<span className="text-zinc-500">{t('Plant not picked yet')}</span>}
                  </li>
                </ol>
                {errors.stops && (
                  <p className="text-xs text-red-700" data-field-error>
                    {errors.stops}
                  </p>
                )}
                <button type="button" className="btn btn-secondary btn-sm" onClick={addStop}>
                  <Plus className="h-4 w-4" /> {t('Add stop')}
                </button>
              </fieldset>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t('Distance (km)')} error={errors.distanceKm}>
                  <input className="input num" inputMode="decimal" value={d.distanceKm} onChange={set('distanceKm')} />
                </Field>
                <Field
                  label={t('Default tanker')}
                  error={errors.tanker}
                  hint={!errors.tanker && tanker ? t('{capacity} L · driver {driver}', { capacity: num(tanker.capacity), driver: tanker.driver || t('Not assigned') }) : undefined}
                >
                  <select className="input" value={d.tanker} onChange={set('tanker')}>
                    <option value="">{t('Not assigned')}</option>
                    {tankers.map((tk) => (
                      <option key={tk.id} value={tk.plate}>
                        {tk.plate} · {num(tk.capacity)} L
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label={t('Status')} hint={t('Inactive routes are hidden from dropdowns but kept for history')}>
                <select className="input" value={d.status} onChange={set('status')}>
                  <option value="Active">{t('Active')}</option>
                  <option value="Inactive">{t('Inactive')}</option>
                </select>
              </Field>

              {inUse && (
                <div className="space-y-1 text-xs text-zinc-500">
                  {sel!.farmers > 0 && <p>{t('{n} farmers supply on this route — it can be deactivated but not deleted.', { n: num(sel!.farmers) })}</p>}
                  {inScopes.length > 0 && <p>{t('Used in access scopes: {list}', { list: inScopes.map((s) => s.code).join(', ') })}</p>}
                </div>
              )}

              <FormActions
                isNew={isNew}
                status={d.status}
                inUse={inUse}
                onSave={save}
                onToggle={() => {
                  const status: MasterStatus = d.status === 'Active' ? 'Inactive' : 'Active';
                  routeStore.set((all) => all.map((r) => (r.code === selCode ? { ...r, status } : r)));
                  setD((x) => ({ ...x, status }));
                  toast(status === 'Active' ? t('{name} activated.', { name: d.name }) : t('{name} deactivated.', { name: d.name }));
                }}
                onDelete={() => {
                  routeStore.set((all) => all.filter((r) => r.code !== selCode));
                  toast(t('Route {name} deleted.', { name: `${selCode} ${d.name}` }));
                  open(rows.find((r) => r.code !== selCode) ?? null);
                }}
              />
            </form>
          </CardBody>
        </Card>
      }
    />
  );
}
