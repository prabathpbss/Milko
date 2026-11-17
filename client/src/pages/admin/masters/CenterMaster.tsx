import { useState } from 'react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/Badge';
import { Field } from '@/components/ui/Field';
import { FilterChips } from '@/components/ui/Tabs';
import {
  centerStore,
  plantName,
  routeStore,
  useActivePlants,
  useRegionNames,
  useRouteMaster,
  type CenterMaster,
  type MasterStatus,
} from '@/data/masters';
import { scopeStore, useScopeMaster } from '@/data/access';
import { num } from '@/lib/format';
import { useToast } from '@/context/ToastContext';
import { useLang } from '@/i18n/LanguageContext';
import { FormActions, MasterLayout, SearchBar, focusFirstError } from './shared';

interface CenterDraft {
  code: string;
  name: string;
  region: string;
  district: string;
  gps: string;
  capacity: string;
  chillers: string;
  hours: string;
  fms: string;
  supervisor: string;
  phone: string;
  plant: string;
  status: MasterStatus;
}

const emptyCenter: CenterDraft = {
  code: 'CC-', name: '', region: '', district: '', gps: '', capacity: '', chillers: '1', hours: '05:30–09:00 · 16:00–19:00',
  fms: '', supervisor: '', phone: '', plant: '', status: 'Active',
};
const toDraft = (c: CenterMaster): CenterDraft => ({
  ...c,
  capacity: String(c.capacity),
  chillers: String(c.chillers),
  fms: c.fms.join(', '),
});

const CENTER_CODE_RE = /^CC-[A-Z]{2,5}$/;
const GPS_RE = /^-?\d{1,2}(\.\d+)?,\s*-?\d{1,3}(\.\d+)?$/;

export default function Centers({ rows }: { rows: CenterMaster[] }) {
  const toast = useToast();
  const { t } = useLang();
  const regionNames = useRegionNames();
  const plants = useActivePlants();
  const routes = useRouteMaster();
  const scopes = useScopeMaster();
  const [q, setQ] = useState('');
  const [region, setRegion] = useState('All');
  const [selCode, setSelCode] = useState<string | null>(rows[0]?.code ?? null);
  const sel = rows.find((c) => c.code === selCode) ?? null;
  const [d, setD] = useState<CenterDraft>(sel ? toDraft(sel) : emptyCenter);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isNew = selCode === null;

  const open = (c: CenterMaster | null) => {
    setSelCode(c?.code ?? null);
    setD(c ? toDraft(c) : emptyCenter);
    setErrors({});
  };
  const set = (k: keyof CenterDraft) => (e: { target: { value: string } }) => setD((x) => ({ ...x, [k]: e.target.value }));

  const term = q.trim().toLowerCase();
  const shown = rows.filter(
    (c) =>
      (region === 'All' || c.region === region) &&
      (!term || [c.code, c.name, c.district, c.supervisor, ...c.fms].some((v) => v.toLowerCase().includes(term))),
  );
  const rowRegions = Array.from(new Set(rows.map((c) => c.region)));

  const save = () => {
    const code = d.code.trim().toUpperCase();
    const name = d.name.trim();
    const capacity = Number(d.capacity);
    const chillers = Number(d.chillers);
    const fms = d.fms.split(',').map((s) => s.trim()).filter(Boolean);
    const e: Record<string, string> = {};
    if (!CENTER_CODE_RE.test(code)) e.code = t('Use CC- and 2–5 letters, e.g. {code}.', { code: 'CC-HNG' });
    else if (rows.some((c) => c.code === code && c.code !== selCode)) e.code = t('This code is already used.');
    if (!name) e.name = t('Enter the center name.');
    else if (rows.some((c) => c.name.toLowerCase() === name.toLowerCase() && c.code !== selCode)) e.name = t('This center already exists.');
    if (!d.region) e.region = t('Pick the region.');
    if (d.gps.trim() && !GPS_RE.test(d.gps.trim())) e.gps = t('Use latitude, longitude, e.g. {gps}.', { gps: '8.0412, 80.9512' });
    if (d.capacity.trim() === '' || Number.isNaN(capacity) || capacity <= 0) e.capacity = t('Enter the capacity in litres.');
    if (d.chillers.trim() === '' || !Number.isInteger(chillers) || chillers < 0) e.chillers = t('Enter a whole number (0 or more).');
    if (new Set(fms.map((f) => f.toLowerCase())).size !== fms.length) e.fms = t('Each FMS can be listed once.');
    setErrors(e);
    if (Object.keys(e).length) return focusFirstError();

    const next: CenterMaster = {
      code,
      name,
      region: d.region,
      district: d.district.trim(),
      gps: d.gps.trim(),
      capacity,
      chillers,
      hours: d.hours.trim(),
      fms,
      supervisor: d.supervisor.trim(),
      phone: d.phone.trim(),
      plant: d.plant,
      farmers: sel?.farmers ?? 0,
      status: d.status,
    };
    centerStore.set((all) => (isNew ? [...all, next] : all.map((c) => (c.code === selCode ? next : c))));
    // A renamed code follows into the routes and access scopes that use this center.
    if (!isNew && selCode && selCode !== code) {
      routeStore.set((all) => all.map((r) => (r.centerId === selCode ? { ...r, centerId: code } : r)));
      scopeStore.set((all) => all.map((s) => (s.level === 'Center' ? { ...s, members: s.members.map((m) => (m === selCode ? code : m)) } : s)));
    }
    setSelCode(code);
    setD(toDraft(next));
    toast(isNew ? t('Center {name} created.', { name }) : t('Center {name} saved.', { name }));
  };

  const onRoutes = sel ? routes.filter((r) => r.centerId === sel.code) : [];
  const inScopes = sel ? scopes.filter((s) => s.level === 'Center' && s.members.includes(sel.code)) : [];
  const inUse = !!sel && (sel.farmers > 0 || onRoutes.length > 0 || inScopes.length > 0);
  // Keep an inactive region/plant visible if this center already uses it.
  const regionOptions = Array.from(new Set([...regionNames, ...(d.region ? [d.region] : [])]));
  const plantOptions = [...plants, ...(d.plant && !plants.some((p) => p.code === d.plant) ? [{ code: d.plant, name: plantName(d.plant) }] : [])];

  return (
    <MasterLayout
      list={
        <>
          <SearchBar value={q} onChange={setQ} onNew={() => open(null)} placeholder={t('Code, name, district, supervisor or FMS…')} label={t('New center')} />
          <div className="border-b border-zinc-100 px-4 py-3">
            <FilterChips<string>
              value={region}
              onChange={setRegion}
              options={[
                { id: 'All', label: t('All'), count: rows.length },
                ...rowRegions.map((r) => ({ id: r, label: t(r), count: rows.filter((c) => c.region === r).length })),
              ]}
            />
          </div>
          <DataTable<CenterMaster>
            rows={shown}
            rowKey={(c) => c.code}
            selectedKey={selCode}
            onRowClick={open}
            empty={t('No centers match this search.')}
            columns={[
              {
                key: 'name',
                header: t('Center'),
                render: (c) => (
                  <div>
                    <div className="font-medium">{c.name}</div>
                    <div className="num text-xs text-zinc-500">{c.code}</div>
                  </div>
                ),
              },
              {
                key: 'region',
                header: t('Region'),
                render: (c) => (
                  <div>
                    <div>{t(c.region)}</div>
                    <div className="text-xs text-zinc-500">{c.district || '—'}</div>
                  </div>
                ),
              },
              { key: 'fms', header: t('FMS'), align: 'right', mono: true, render: (c) => c.fms.length },
              { key: 'cap', header: t('Capacity'), align: 'right', mono: true, render: (c) => `${num(c.capacity)} L` },
              { key: 'plant', header: t('Default plant'), render: (c) => (c.plant ? t(plantName(c.plant)) : <span className="text-zinc-500">{t('Not assigned')}</span>) },
              { key: 'farmers', header: t('Farmers'), align: 'right', mono: true, render: (c) => num(c.farmers) },
              { key: 'status', header: t('Status'), render: (c) => <StatusBadge status={c.status} /> },
            ]}
          />
        </>
      }
      form={
        <Card>
          <CardHeader
            title={isNew ? t('New center') : d.name || t('Center')}
            subtitle={isNew ? t('Add a collection center') : t('Code {code}', { code: sel?.code ?? '' })}
            actions={!isNew && <StatusBadge status={d.status} />}
          />
          <CardBody>
            <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
              <div className="grid gap-4 sm:grid-cols-[130px_1fr]">
                <Field label={t('Code')} error={errors.code} hint={!errors.code ? t('e.g. {code}', { code: 'CC-HNG' }) : undefined}>
                  <input className="input num uppercase" value={d.code} onChange={set('code')} maxLength={8} autoComplete="off" spellCheck={false} />
                </Field>
                <Field label={t('Center name')} error={errors.name}>
                  <input className="input" value={d.name} onChange={set('name')} placeholder={t('e.g. Hingurakgoda CC')} />
                </Field>
              </div>

              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold">{t('Location')}</legend>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={t('Region')} error={errors.region}>
                    <select className="input" value={d.region} onChange={set('region')}>
                      <option value="">{t('Pick a region')}</option>
                      {regionOptions.map((r) => (
                        <option key={r} value={r}>
                          {t(r)}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label={t('District')}>
                    <input className="input" value={d.district} onChange={set('district')} />
                  </Field>
                </div>
                <Field label={t('GPS')} error={errors.gps} hint={!errors.gps ? t('Latitude, longitude') : undefined}>
                  <input className="input num" value={d.gps} onChange={set('gps')} placeholder="8.0412, 80.9512" />
                </Field>
              </fieldset>

              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold">{t('Operations')}</legend>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={t('Chilling capacity (L)')} error={errors.capacity}>
                    <input className="input num" inputMode="numeric" value={d.capacity} onChange={set('capacity')} />
                  </Field>
                  <Field label={t('Chillers')} error={errors.chillers}>
                    <input className="input num" inputMode="numeric" value={d.chillers} onChange={set('chillers')} />
                  </Field>
                </div>
                <Field label={t('Collection hours')} hint={t('e.g. {hours}', { hours: '05:30–09:00 · 16:00–19:00' })}>
                  <input className="input num" value={d.hours} onChange={set('hours')} />
                </Field>
                <Field label={t('FMS pickup points')} error={errors.fms} hint={!errors.fms ? t('Separate with commas. Suggested as stops when building a route.') : undefined}>
                  <input className="input" value={d.fms} onChange={set('fms')} placeholder={t('e.g. Yaya 1, Yaya 3, Yaya 4')} />
                </Field>
                <Field label={t('Default plant')} hint={t('Pre-filled on new routes from this center')}>
                  <select className="input" value={d.plant} onChange={set('plant')}>
                    <option value="">{t('Not assigned')}</option>
                    {plantOptions.map((p) => (
                      <option key={p.code} value={p.code}>
                        {t(p.name)}
                      </option>
                    ))}
                  </select>
                </Field>
              </fieldset>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t('Supervisor')}>
                  <input className="input" value={d.supervisor} onChange={set('supervisor')} />
                </Field>
                <Field label={t('Phone')}>
                  <input className="input" inputMode="tel" value={d.phone} onChange={set('phone')} />
                </Field>
              </div>

              <Field label={t('Status')} hint={t('Inactive centers are hidden from dropdowns but kept for history')}>
                <select className="input" value={d.status} onChange={set('status')}>
                  <option value="Active">{t('Active')}</option>
                  <option value="Inactive">{t('Inactive')}</option>
                </select>
              </Field>

              {inUse && (
                <div className="space-y-1 text-xs text-zinc-500">
                  {sel!.farmers > 0 && <p>{t('{n} farmers supply this center — it can be deactivated but not deleted.', { n: num(sel!.farmers) })}</p>}
                  {onRoutes.length > 0 && <p>{t('Used by routes: {list}', { list: onRoutes.map((r) => r.code).join(', ') })}</p>}
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
                  centerStore.set((all) => all.map((c) => (c.code === selCode ? { ...c, status } : c)));
                  setD((x) => ({ ...x, status }));
                  toast(status === 'Active' ? t('{name} activated.', { name: d.name }) : t('{name} deactivated.', { name: d.name }));
                }}
                onDelete={() => {
                  centerStore.set((all) => all.filter((c) => c.code !== selCode));
                  toast(t('Center {name} deleted.', { name: d.name }));
                  open(rows.find((c) => c.code !== selCode) ?? null);
                }}
              />
            </form>
          </CardBody>
        </Card>
      }
    />
  );
}
