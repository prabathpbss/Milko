import { useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Power, Save, Search, Trash2 } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { Field } from '@/components/ui/Field';
import { EmptyState } from '@/components/ui/misc';
import {
  categoryStore,
  regionStore,
  useCategoryMaster,
  useRegionMaster,
  type CategoryMaster,
  type MasterStatus,
  type RegionMaster,
} from '@/data/masters';
import { num } from '@/lib/format';
import { useToast } from '@/context/ToastContext';

type TabId = 'regions' | 'categories';

export default function Masters() {
  const { tab = 'regions' } = useParams();
  const navigate = useNavigate();
  const regions = useRegionMaster();
  const categories = useCategoryMaster();
  const active: TabId = tab === 'categories' ? 'categories' : 'regions';

  return (
    <>
      <PageHeader
        breadcrumb={[{ label: 'Masters' }, { label: active === 'regions' ? 'Regions' : 'Farmer categories' }]}
        title={active === 'regions' ? 'Region master' : 'Farmer category master'}
        description={
          active === 'regions'
            ? 'Regions group districts and collection centers. Used for price templates, reports, user access and filters.'
            : 'Categories rank farmers by volume, quality and reliability. They set the default premium and advance limit.'
        }
      />
      <Tabs<TabId>
        value={active}
        onChange={(t) => navigate(`/masters/${t}`)}
        className="mb-6"
        tabs={[
          { id: 'regions', label: 'Regions', count: regions.length },
          { id: 'categories', label: 'Farmer categories', count: categories.length },
        ]}
      />
      {active === 'regions' ? <Regions rows={regions} /> : <Categories rows={categories} />}
    </>
  );
}

/* ───────────── Shared bits ───────────── */

function MasterLayout({ list, form }: { list: ReactNode; form: ReactNode }) {
  return (
    <div className="grid gap-6 xl:grid-cols-5">
      <Card className="xl:col-span-3">{list}</Card>
      <div className="xl:col-span-2">{form}</div>
    </div>
  );
}

function SearchBar({ value, onChange, onNew, placeholder, label }: { value: string; onChange: (v: string) => void; onNew: () => void; placeholder: string; label: string }) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-zinc-100 p-4">
      <label className="relative min-w-[200px] flex-1">
        <span className="sr-only">Search</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input className="input pl-9" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
      </label>
      <button type="button" className="btn btn-primary" onClick={onNew}>
        <Plus className="h-4 w-4" /> {label}
      </button>
    </div>
  );
}

const focusFirstError = () =>
  requestAnimationFrame(() =>
    document.querySelector('[data-field-error]')?.closest('label')?.querySelector<HTMLElement>('input, select, textarea')?.focus(),
  );

function FormActions({
  isNew,
  status,
  inUse,
  onSave,
  onToggle,
  onDelete,
}: {
  isNew: boolean;
  status: MasterStatus;
  inUse: boolean;
  onSave: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex flex-wrap justify-end gap-2 border-t border-zinc-100 pt-4">
      {!isNew &&
        (inUse ? (
          <button type="button" className="btn btn-secondary" onClick={onToggle}>
            <Power className="h-4 w-4" /> {status === 'Active' ? 'Deactivate' : 'Activate'}
          </button>
        ) : (
          <button type="button" className="btn btn-ghost text-red-700 hover:bg-red-50" onClick={onDelete}>
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        ))}
      <button type="submit" className="btn btn-primary" onClick={onSave}>
        <Save className="h-4 w-4" /> {isNew ? 'Create' : 'Save changes'}
      </button>
    </div>
  );
}

/* ───────────── Regions ───────────── */

interface RegionDraft {
  code: string;
  name: string;
  districts: string;
  manager: string;
  phone: string;
  status: MasterStatus;
}
const emptyRegion: RegionDraft = { code: '', name: '', districts: '', manager: '', phone: '', status: 'Active' };
const regionToDraft = (r: RegionMaster): RegionDraft => ({ ...r, districts: r.districts.join(', ') });

function Regions({ rows }: { rows: RegionMaster[] }) {
  const toast = useToast();
  const [q, setQ] = useState('');
  const [selCode, setSelCode] = useState<string | null>(rows[0]?.code ?? null);
  const sel = rows.find((r) => r.code === selCode) ?? null;
  const [d, setD] = useState<RegionDraft>(sel ? regionToDraft(sel) : emptyRegion);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isNew = selCode === null;

  const open = (r: RegionMaster | null) => {
    setSelCode(r?.code ?? null);
    setD(r ? regionToDraft(r) : emptyRegion);
    setErrors({});
  };
  const set = (k: keyof RegionDraft) => (e: { target: { value: string } }) => setD((x) => ({ ...x, [k]: e.target.value }));

  const term = q.trim().toLowerCase();
  const shown = rows.filter((r) => !term || [r.code, r.name, r.manager, ...r.districts].some((v) => v.toLowerCase().includes(term)));

  const save = () => {
    const code = d.code.trim().toUpperCase();
    const name = d.name.trim();
    const e: Record<string, string> = {};
    if (!/^[A-Z]{2,4}$/.test(code)) e.code = 'Use 2–4 letters, e.g. NC.';
    else if (rows.some((r) => r.code === code && r.code !== selCode)) e.code = 'This code is already used.';
    if (!name) e.name = 'Enter the region name.';
    else if (rows.some((r) => r.name.toLowerCase() === name.toLowerCase() && r.code !== selCode)) e.name = 'This region already exists.';
    setErrors(e);
    if (Object.keys(e).length) return focusFirstError();

    const next: RegionMaster = {
      code,
      name,
      districts: d.districts.split(',').map((s) => s.trim()).filter(Boolean),
      manager: d.manager.trim(),
      phone: d.phone.trim(),
      centers: sel?.centers ?? 0,
      farmers: sel?.farmers ?? 0,
      status: d.status,
    };
    regionStore.set((all) => (isNew ? [...all, next] : all.map((r) => (r.code === selCode ? next : r))));
    setSelCode(code);
    toast(isNew ? `Region ${name} created.` : `Region ${name} saved.`);
  };

  const inUse = !!sel && (sel.centers > 0 || sel.farmers > 0);

  return (
    <MasterLayout
      list={
        <>
          <SearchBar value={q} onChange={setQ} onNew={() => open(null)} placeholder="Code, name, district or manager…" label="New region" />
          <DataTable<RegionMaster>
            rows={shown}
            rowKey={(r) => r.code}
            selectedKey={selCode}
            onRowClick={open}
            empty="No regions match this search."
            columns={[
              { key: 'code', header: 'Code', mono: true, render: (r) => <span className="font-medium">{r.code}</span> },
              { key: 'name', header: 'Region', render: (r) => <span className="font-medium">{r.name}</span> },
              { key: 'districts', header: 'Districts', className: 'whitespace-normal min-w-[180px] text-zinc-600', render: (r) => r.districts.join(', ') || '—' },
              { key: 'manager', header: 'Regional manager', render: (r) => r.manager || <span className="text-zinc-500">Not assigned</span> },
              { key: 'centers', header: 'Centers', align: 'right', mono: true, render: (r) => num(r.centers) },
              { key: 'farmers', header: 'Farmers', align: 'right', mono: true, render: (r) => num(r.farmers) },
              { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
            ]}
          />
        </>
      }
      form={
        <Card>
          <CardHeader title={isNew ? 'New region' : d.name || 'Region'} subtitle={isNew ? 'Add a region' : `Code ${sel?.code}`} actions={!isNew && <StatusBadge status={d.status} />} />
          <CardBody>
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div className="grid gap-4 sm:grid-cols-[120px_1fr]">
                <Field label="Code" error={errors.code} hint={!errors.code ? '2–4 letters' : undefined}>
                  <input className="input num uppercase" value={d.code} onChange={set('code')} maxLength={4} autoComplete="off" spellCheck={false} />
                </Field>
                <Field label="Region name" error={errors.name}>
                  <input className="input" value={d.name} onChange={set('name')} />
                </Field>
              </div>
              <Field label="Districts" hint="Separate with commas">
                <input className="input" value={d.districts} onChange={set('districts')} placeholder="e.g. Anuradhapura, Polonnaruwa" />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Regional manager">
                  <input className="input" value={d.manager} onChange={set('manager')} />
                </Field>
                <Field label="Office phone">
                  <input className="input" inputMode="tel" value={d.phone} onChange={set('phone')} />
                </Field>
              </div>
              <Field label="Status" hint="Inactive regions are hidden from dropdowns but kept for history">
                <select className="input" value={d.status} onChange={set('status')}>
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </Field>
              {inUse && (
                <p className="text-xs text-zinc-500">
                  Used by {num(sel!.centers)} centers and {num(sel!.farmers)} farmers — it can be deactivated but not deleted.
                </p>
              )}
              <FormActions
                isNew={isNew}
                status={d.status}
                inUse={inUse}
                onSave={save}
                onToggle={() => {
                  const status: MasterStatus = d.status === 'Active' ? 'Inactive' : 'Active';
                  regionStore.set((all) => all.map((r) => (r.code === selCode ? { ...r, status } : r)));
                  setD((x) => ({ ...x, status }));
                  toast(`${d.name} ${status === 'Active' ? 'activated' : 'deactivated'}.`);
                }}
                onDelete={() => {
                  regionStore.set((all) => all.filter((r) => r.code !== selCode));
                  toast(`Region ${d.name} deleted.`);
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

/* ───────────── Categories ───────────── */

interface CategoryDraft {
  code: string;
  name: string;
  rank: string;
  description: string;
  minLitres: string;
  minScore: string;
  minReliability: string;
  maxRejections: string;
  defaultPremium: string;
  maxAdvance: string;
  review: CategoryMaster['review'];
  status: MasterStatus;
}
const NUM_FIELDS = ['rank', 'minLitres', 'minScore', 'minReliability', 'maxRejections', 'defaultPremium', 'maxAdvance'] as const;
const emptyCategory: CategoryDraft = {
  code: '', name: '', rank: '', description: '', minLitres: '0', minScore: '0', minReliability: '0', maxRejections: '0',
  defaultPremium: '0', maxAdvance: '0', review: 'Quarterly', status: 'Active',
};
const catToDraft = (c: CategoryMaster): CategoryDraft => ({
  ...c,
  rank: String(c.rank), minLitres: String(c.minLitres), minScore: String(c.minScore), minReliability: String(c.minReliability),
  maxRejections: String(c.maxRejections), defaultPremium: String(c.defaultPremium), maxAdvance: String(c.maxAdvance),
});

function rule(c: CategoryMaster) {
  if (!c.minLitres && !c.minScore && !c.minReliability) return 'All other active farmers';
  const parts = [`≥ ${c.minLitres} L/day`, `score ≥ ${c.minScore}`, `on time ≥ ${c.minReliability}%`];
  parts.push(c.maxRejections === 0 ? 'no rejections' : `≤ ${c.maxRejections} rejections`);
  return parts.join(', ');
}

function Categories({ rows }: { rows: CategoryMaster[] }) {
  const toast = useToast();
  const sorted = [...rows].sort((a, b) => a.rank - b.rank);
  const [selCode, setSelCode] = useState<string | null>(sorted[0]?.code ?? null);
  const sel = rows.find((c) => c.code === selCode) ?? null;
  const [d, setD] = useState<CategoryDraft>(sel ? catToDraft(sel) : emptyCategory);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [q, setQ] = useState('');
  const isNew = selCode === null;

  const open = (c: CategoryMaster | null) => {
    setSelCode(c?.code ?? null);
    setD(c ? catToDraft(c) : { ...emptyCategory, rank: String(Math.max(0, ...rows.map((r) => r.rank)) + 1) });
    setErrors({});
  };
  const set = (k: keyof CategoryDraft) => (e: { target: { value: string } }) => setD((x) => ({ ...x, [k]: e.target.value }));

  const term = q.trim().toLowerCase();
  const shown = sorted.filter((c) => !term || [c.code, c.name, c.description].some((v) => v.toLowerCase().includes(term)));

  const save = () => {
    const code = d.code.trim().toUpperCase();
    const name = d.name.trim();
    const e: Record<string, string> = {};
    if (!/^[A-Z]{2,4}$/.test(code)) e.code = 'Use 2–4 letters, e.g. GLD.';
    else if (rows.some((c) => c.code === code && c.code !== selCode)) e.code = 'This code is already used.';
    if (!name) e.name = 'Enter the category name.';
    else if (rows.some((c) => c.name.toLowerCase() === name.toLowerCase() && c.code !== selCode)) e.name = 'This category already exists.';
    for (const k of NUM_FIELDS) {
      const v = Number(d[k]);
      if (d[k].trim() === '' || Number.isNaN(v) || v < 0) e[k] = 'Enter a number (0 or more).';
    }
    if (!e.minScore && Number(d.minScore) > 100) e.minScore = 'Score is out of 100.';
    if (!e.minReliability && Number(d.minReliability) > 100) e.minReliability = 'Use a percentage up to 100.';
    setErrors(e);
    if (Object.keys(e).length) return focusFirstError();

    const next: CategoryMaster = {
      code,
      name,
      description: d.description.trim(),
      review: d.review,
      status: d.status,
      farmers: sel?.farmers ?? 0,
      rank: Number(d.rank),
      minLitres: Number(d.minLitres),
      minScore: Number(d.minScore),
      minReliability: Number(d.minReliability),
      maxRejections: Number(d.maxRejections),
      defaultPremium: Number(d.defaultPremium),
      maxAdvance: Number(d.maxAdvance),
    };
    categoryStore.set((all) => (isNew ? [...all, next] : all.map((c) => (c.code === selCode ? next : c))));
    setSelCode(code);
    toast(isNew ? `Category ${name} created.` : `Category ${name} saved.`);
  };

  const inUse = !!sel && sel.farmers > 0;
  const numField = (k: (typeof NUM_FIELDS)[number], label: string, hint?: string) => (
    <Field label={label} error={errors[k]} hint={hint}>
      <input className="input num" inputMode="decimal" value={d[k]} onChange={set(k)} />
    </Field>
  );

  return (
    <MasterLayout
      list={
        <>
          <SearchBar value={q} onChange={setQ} onNew={() => open(null)} placeholder="Code, name or description…" label="New category" />
          <DataTable<CategoryMaster>
            rows={shown}
            rowKey={(c) => c.code}
            selectedKey={selCode}
            onRowClick={open}
            empty={<EmptyState title="No categories match this search." />}
            columns={[
              { key: 'rank', header: 'Tier', align: 'right', mono: true },
              { key: 'name', header: 'Category', render: (c) => <Badge tone={c.rank <= 2 ? 'brand' : 'neutral'}>{c.name}</Badge> },
              { key: 'code', header: 'Code', mono: true },
              { key: 'rule', header: 'Rule to qualify (last 3 months)', className: 'whitespace-normal min-w-[220px] text-zinc-600', render: rule },
              { key: 'prem', header: 'Premium Rs / L', align: 'right', mono: true, render: (c) => c.defaultPremium.toFixed(2) },
              { key: 'adv', header: 'Max advance', align: 'right', mono: true, render: (c) => `Rs ${num(c.maxAdvance)}` },
              { key: 'farmers', header: 'Farmers', align: 'right', mono: true, render: (c) => num(c.farmers) },
              { key: 'status', header: 'Status', render: (c) => <StatusBadge status={c.status} /> },
            ]}
          />
        </>
      }
      form={
        <Card>
          <CardHeader title={isNew ? 'New category' : d.name || 'Category'} subtitle={isNew ? 'Add a farmer category' : `Code ${sel?.code}`} actions={!isNew && <StatusBadge status={d.status} />} />
          <CardBody>
            <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
              <div className="grid gap-4 sm:grid-cols-[110px_1fr_90px]">
                <Field label="Code" error={errors.code}>
                  <input className="input num uppercase" value={d.code} onChange={set('code')} maxLength={4} autoComplete="off" spellCheck={false} />
                </Field>
                <Field label="Category name" error={errors.name}>
                  <input className="input" value={d.name} onChange={set('name')} />
                </Field>
                {numField('rank', 'Tier', '1 = highest')}
              </div>
              <Field label="Description">
                <input className="input" value={d.description} onChange={set('description')} />
              </Field>

              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold">Rules to qualify</legend>
                <p className="text-xs text-zinc-500">Checked on the last 3 months at every review. Set all to 0 for the entry category.</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {numField('minLitres', 'Min. average litres / day')}
                  {numField('minScore', 'Min. quality score (0–100)')}
                  {numField('minReliability', 'Min. on-time deliveries (%)')}
                  {numField('maxRejections', 'Max. rejections')}
                </div>
              </fieldset>

              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold">Benefits</legend>
                <div className="grid gap-4 sm:grid-cols-2">
                  {numField('defaultPremium', 'Default premium (Rs / L)', 'Pre-filled in new price templates')}
                  {numField('maxAdvance', 'Max. cash advance (Rs)')}
                </div>
              </fieldset>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Review frequency">
                  <select className="input" value={d.review} onChange={set('review')}>
                    <option>Monthly</option>
                    <option>Quarterly</option>
                    <option>Half-yearly</option>
                    <option>Yearly</option>
                  </select>
                </Field>
                <Field label="Status">
                  <select className="input" value={d.status} onChange={set('status')}>
                    <option>Active</option>
                    <option>Inactive</option>
                  </select>
                </Field>
              </div>
              {inUse && <p className="text-xs text-zinc-500">{num(sel!.farmers)} farmers are in this category — it can be deactivated but not deleted.</p>}
              <FormActions
                isNew={isNew}
                status={d.status}
                inUse={inUse}
                onSave={save}
                onToggle={() => {
                  const status: MasterStatus = d.status === 'Active' ? 'Inactive' : 'Active';
                  categoryStore.set((all) => all.map((c) => (c.code === selCode ? { ...c, status } : c)));
                  setD((x) => ({ ...x, status }));
                  toast(`${d.name} ${status === 'Active' ? 'activated' : 'deactivated'}.`);
                }}
                onDelete={() => {
                  categoryStore.set((all) => all.filter((c) => c.code !== selCode));
                  toast(`Category ${d.name} deleted.`);
                  open(sorted.find((c) => c.code !== selCode) ?? null);
                }}
              />
            </form>
          </CardBody>
        </Card>
      }
    />
  );
}
