import { useState } from 'react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/Badge';
import { Field } from '@/components/ui/Field';
import {
  centerStore,
  plantStore,
  routeStore,
  useCenterMaster,
  useRegionNames,
  useRouteMaster,
  type MasterStatus,
  type PlantMaster,
} from '@/data/masters';
import { num } from '@/lib/format';
import { useToast } from '@/context/ToastContext';
import { useLang } from '@/i18n/LanguageContext';
import { FormActions, MasterLayout, SearchBar, focusFirstError } from './shared';

interface PlantDraft {
  code: string;
  name: string;
  region: string;
  district: string;
  address: string;
  gps: string;
  capacity: string;
  intakeHours: string;
  manager: string;
  phone: string;
  status: MasterStatus;
}

const emptyPlant: PlantDraft = {
  code: 'PL-', name: '', region: '', district: '', address: '', gps: '', capacity: '', intakeHours: '06:00–11:00',
  manager: '', phone: '', status: 'Active',
};
const toDraft = (p: PlantMaster): PlantDraft => ({ ...p, capacity: String(p.capacity) });

const PLANT_CODE_RE = /^PL-[A-Z]{2,5}$/;
const GPS_RE = /^-?\d{1,2}(\.\d+)?,\s*-?\d{1,3}(\.\d+)?$/;

export default function Plants({ rows }: { rows: PlantMaster[] }) {
  const toast = useToast();
  const { t } = useLang();
  const regionNames = useRegionNames();
  const routes = useRouteMaster();
  const centers = useCenterMaster();
  const [q, setQ] = useState('');
  const [selCode, setSelCode] = useState<string | null>(rows[0]?.code ?? null);
  const sel = rows.find((p) => p.code === selCode) ?? null;
  const [d, setD] = useState<PlantDraft>(sel ? toDraft(sel) : emptyPlant);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isNew = selCode === null;

  const open = (p: PlantMaster | null) => {
    setSelCode(p?.code ?? null);
    setD(p ? toDraft(p) : emptyPlant);
    setErrors({});
  };
  const set = (k: keyof PlantDraft) => (e: { target: { value: string } }) => setD((x) => ({ ...x, [k]: e.target.value }));

  const activeRoutesTo = (code: string) => routes.filter((r) => r.destination === code && r.status === 'Active');

  const term = q.trim().toLowerCase();
  const shown = rows.filter((p) => !term || [p.code, p.name, p.region, p.district, p.manager].some((v) => v.toLowerCase().includes(term)));

  const save = () => {
    const code = d.code.trim().toUpperCase();
    const name = d.name.trim();
    const capacity = Number(d.capacity);
    const e: Record<string, string> = {};
    if (!PLANT_CODE_RE.test(code)) e.code = t('Use PL- and 2–5 letters, e.g. {code}.', { code: 'PL-POL' });
    else if (rows.some((p) => p.code === code && p.code !== selCode)) e.code = t('This code is already used.');
    if (!name) e.name = t('Enter the plant name.');
    else if (rows.some((p) => p.name.toLowerCase() === name.toLowerCase() && p.code !== selCode)) e.name = t('This plant already exists.');
    if (!d.region) e.region = t('Pick the region.');
    if (d.gps.trim() && !GPS_RE.test(d.gps.trim())) e.gps = t('Use latitude, longitude, e.g. {gps}.', { gps: '7.9403, 81.0188' });
    if (d.capacity.trim() === '' || Number.isNaN(capacity) || capacity <= 0) e.capacity = t('Enter the capacity in litres.');
    setErrors(e);
    if (Object.keys(e).length) return focusFirstError();

    const next: PlantMaster = {
      code,
      name,
      region: d.region,
      district: d.district.trim(),
      address: d.address.trim(),
      gps: d.gps.trim(),
      capacity,
      intakeHours: d.intakeHours.trim(),
      manager: d.manager.trim(),
      phone: d.phone.trim(),
      status: d.status,
    };
    plantStore.set((all) => (isNew ? [...all, next] : all.map((p) => (p.code === selCode ? next : p))));
    // A renamed code follows into the routes and centers that point at this plant.
    if (!isNew && selCode && selCode !== code) {
      routeStore.set((all) => all.map((r) => (r.destination === selCode ? { ...r, destination: code } : r)));
      centerStore.set((all) => all.map((c) => (c.plant === selCode ? { ...c, plant: code } : c)));
    }
    setSelCode(code);
    setD(toDraft(next));
    toast(isNew ? t('Plant {name} created.', { name }) : t('Plant {name} saved.', { name }));
  };

  const onRoutes = sel ? routes.filter((r) => r.destination === sel.code) : [];
  const fromCenters = sel ? centers.filter((c) => c.plant === sel.code) : [];
  const inUse = onRoutes.length > 0 || fromCenters.length > 0;
  const regionOptions = Array.from(new Set([...regionNames, ...(d.region ? [d.region] : [])]));

  return (
    <MasterLayout
      list={
        <>
          <SearchBar value={q} onChange={setQ} onNew={() => open(null)} placeholder={t('Code, name, region or manager…')} label={t('New plant')} />
          <DataTable<PlantMaster>
            rows={shown}
            rowKey={(p) => p.code}
            selectedKey={selCode}
            onRowClick={open}
            empty={t('No plants match this search.')}
            columns={[
              {
                key: 'name',
                header: t('Plant'),
                render: (p) => (
                  <div>
                    <div className="font-medium">{t(p.name)}</div>
                    <div className="num text-xs text-zinc-500">{p.code}</div>
                  </div>
                ),
              },
              {
                key: 'region',
                header: t('Region'),
                render: (p) => (
                  <div>
                    <div>{t(p.region)}</div>
                    <div className="text-xs text-zinc-500">{p.district || '—'}</div>
                  </div>
                ),
              },
              { key: 'cap', header: t('Intake / day'), align: 'right', mono: true, render: (p) => `${num(p.capacity)} L` },
              { key: 'hours', header: t('Intake hours'), mono: true, className: 'whitespace-normal', render: (p) => p.intakeHours || '—' },
              { key: 'routes', header: t('Active routes'), align: 'right', mono: true, render: (p) => activeRoutesTo(p.code).length },
              { key: 'status', header: t('Status'), render: (p) => <StatusBadge status={p.status} /> },
            ]}
          />
        </>
      }
      form={
        <Card>
          <CardHeader
            title={isNew ? t('New plant') : t(d.name) || t('Plant')}
            subtitle={isNew ? t('Add a processing plant') : t('Code {code}', { code: sel?.code ?? '' })}
            actions={!isNew && <StatusBadge status={d.status} />}
          />
          <CardBody>
            <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
              <div className="grid gap-4 sm:grid-cols-[130px_1fr]">
                <Field label={t('Code')} error={errors.code} hint={!errors.code ? t('e.g. {code}', { code: 'PL-POL' }) : undefined}>
                  <input className="input num uppercase" value={d.code} onChange={set('code')} maxLength={8} autoComplete="off" spellCheck={false} />
                </Field>
                <Field label={t('Plant name')} error={errors.name}>
                  <input className="input" value={d.name} onChange={set('name')} placeholder={t('e.g. Polonnaruwa plant')} />
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
                <Field label={t('Address')}>
                  <input className="input" value={d.address} onChange={set('address')} />
                </Field>
                <Field label={t('GPS')} error={errors.gps} hint={!errors.gps ? t('Latitude, longitude') : undefined}>
                  <input className="input num" value={d.gps} onChange={set('gps')} placeholder="7.9403, 81.0188" />
                </Field>
              </fieldset>

              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold">{t('Milk intake')}</legend>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={t('Intake capacity (L / day)')} error={errors.capacity}>
                    <input className="input num" inputMode="numeric" value={d.capacity} onChange={set('capacity')} />
                  </Field>
                  <Field label={t('Intake hours')} hint={t('Routes should arrive inside this window')}>
                    <input className="input num" value={d.intakeHours} onChange={set('intakeHours')} />
                  </Field>
                </div>
              </fieldset>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t('Plant manager')}>
                  <input className="input" value={d.manager} onChange={set('manager')} />
                </Field>
                <Field label={t('Phone')}>
                  <input className="input" inputMode="tel" value={d.phone} onChange={set('phone')} />
                </Field>
              </div>

              <Field label={t('Status')} hint={t('Inactive plants are hidden from dropdowns but kept for history')}>
                <select className="input" value={d.status} onChange={set('status')}>
                  <option value="Active">{t('Active')}</option>
                  <option value="Inactive">{t('Inactive')}</option>
                </select>
              </Field>

              {inUse && (
                <div className="space-y-1 text-xs text-zinc-500">
                  {onRoutes.length > 0 && <p>{t('Used by routes: {list}', { list: onRoutes.map((r) => r.code).join(', ') })}</p>}
                  {fromCenters.length > 0 && <p>{t('Default plant for: {list}', { list: fromCenters.map((c) => c.name).join(', ') })}</p>}
                  <p>{t('It can be deactivated but not deleted.')}</p>
                </div>
              )}

              <FormActions
                isNew={isNew}
                status={d.status}
                inUse={inUse}
                onSave={save}
                onToggle={() => {
                  const status: MasterStatus = d.status === 'Active' ? 'Inactive' : 'Active';
                  plantStore.set((all) => all.map((p) => (p.code === selCode ? { ...p, status } : p)));
                  setD((x) => ({ ...x, status }));
                  toast(status === 'Active' ? t('{name} activated.', { name: t(d.name) }) : t('{name} deactivated.', { name: t(d.name) }));
                }}
                onDelete={() => {
                  plantStore.set((all) => all.filter((p) => p.code !== selCode));
                  toast(t('Plant {name} deleted.', { name: t(d.name) }));
                  open(rows.find((p) => p.code !== selCode) ?? null);
                }}
              />
            </form>
          </CardBody>
        </Card>
      }
    />
  );
}
