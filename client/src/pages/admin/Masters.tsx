import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import { useRoleMaster, useScopeMaster } from '@/data/access';
import { num } from '@/lib/format';
import { useToast } from '@/context/ToastContext';
import { useLang } from '@/i18n/LanguageContext';
import { FormActions, MasterLayout, SearchBar, focusFirstError } from './masters/shared';
import Roles from './masters/RoleMaster';
import Scopes from './masters/ScopeMaster';

type TabId = 'regions' | 'categories' | 'roles' | 'scopes';
type T = ReturnType<typeof useLang>['t'];

/** Strings are English keys; translated at render with t(). */
const META: Record<TabId, { crumb: string; title: string; description: string }> = {
  regions: {
    crumb: 'Regions',
    title: 'Region master',
    description: 'Regions group districts and collection centers. Used for price templates, reports, user access and filters.',
  },
  categories: {
    crumb: 'Farmer categories',
    title: 'Farmer category master',
    description: 'Categories rank farmers by volume, quality and reliability. They set the default premium and advance limit.',
  },
  roles: {
    crumb: 'Roles',
    title: 'Role master',
    description: 'What each job can do: screens and actions, approval limit, sign-in method and which access scopes it may have.',
  },
  scopes: {
    crumb: 'Access scopes',
    title: 'Access scope master',
    description: 'Which data a user can see — the whole company, some regions, some centers or some routes. Picked when inviting a user.',
  },
};

export default function Masters() {
  const { tab = 'regions' } = useParams();
  const navigate = useNavigate();
  const { t } = useLang();
  const regions = useRegionMaster();
  const categories = useCategoryMaster();
  const roles = useRoleMaster();
  const scopes = useScopeMaster();
  const active: TabId = tab in META ? (tab as TabId) : 'regions';
  const m = META[active];

  return (
    <>
      <PageHeader breadcrumb={[{ label: t('Masters') }, { label: t(m.crumb) }]} title={t(m.title)} description={t(m.description)} />
      <Tabs<TabId>
        value={active}
        onChange={(id) => navigate(`/masters/${id}`)}
        className="mb-6"
        tabs={[
          { id: 'regions', label: t('Regions'), count: regions.length },
          { id: 'categories', label: t('Farmer categories'), count: categories.length },
          { id: 'roles', label: t('Roles'), count: roles.length },
          { id: 'scopes', label: t('Access scopes'), count: scopes.length },
        ]}
      />
      {active === 'regions' && <Regions rows={regions} />}
      {active === 'categories' && <Categories rows={categories} />}
      {active === 'roles' && <Roles rows={roles} />}
      {active === 'scopes' && <Scopes rows={scopes} />}
    </>
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
  const { t } = useLang();
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
    if (!/^[A-Z]{2,4}$/.test(code)) e.code = t('Use 2–4 letters, e.g. {code}.', { code: 'NC' });
    else if (rows.some((r) => r.code === code && r.code !== selCode)) e.code = t('This code is already used.');
    if (!name) e.name = t('Enter the region name.');
    else if (rows.some((r) => r.name.toLowerCase() === name.toLowerCase() && r.code !== selCode)) e.name = t('This region already exists.');
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
    toast(isNew ? t('Region {name} created.', { name }) : t('Region {name} saved.', { name }));
  };

  const inUse = !!sel && (sel.centers > 0 || sel.farmers > 0);

  return (
    <MasterLayout
      list={
        <>
          <SearchBar value={q} onChange={setQ} onNew={() => open(null)} placeholder={t('Code, name, district or manager…')} label={t('New region')} />
          <DataTable<RegionMaster>
            rows={shown}
            rowKey={(r) => r.code}
            selectedKey={selCode}
            onRowClick={open}
            empty={t('No regions match this search.')}
            columns={[
              { key: 'code', header: t('Code'), mono: true, render: (r) => <span className="font-medium">{r.code}</span> },
              { key: 'name', header: t('Region'), render: (r) => <span className="font-medium">{r.name}</span> },
              { key: 'districts', header: t('Districts'), className: 'whitespace-normal min-w-[180px] text-zinc-600', render: (r) => r.districts.join(', ') || '—' },
              { key: 'manager', header: t('Regional manager'), render: (r) => r.manager || <span className="text-zinc-500">{t('Not assigned')}</span> },
              { key: 'centers', header: t('Centers'), align: 'right', mono: true, render: (r) => num(r.centers) },
              { key: 'farmers', header: t('Farmers'), align: 'right', mono: true, render: (r) => num(r.farmers) },
              { key: 'status', header: t('Status'), render: (r) => <StatusBadge status={r.status} /> },
            ]}
          />
        </>
      }
      form={
        <Card>
          <CardHeader
            title={isNew ? t('New region') : d.name || t('Region')}
            subtitle={isNew ? t('Add a region') : t('Code {code}', { code: sel?.code ?? '' })}
            actions={!isNew && <StatusBadge status={d.status} />}
          />
          <CardBody>
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div className="grid gap-4 sm:grid-cols-[120px_1fr]">
                <Field label={t('Code')} error={errors.code} hint={!errors.code ? t('2–4 letters') : undefined}>
                  <input className="input num uppercase" value={d.code} onChange={set('code')} maxLength={4} autoComplete="off" spellCheck={false} />
                </Field>
                <Field label={t('Region name')} error={errors.name}>
                  <input className="input" value={d.name} onChange={set('name')} />
                </Field>
              </div>
              <Field label={t('Districts')} hint={t('Separate with commas')}>
                <input className="input" value={d.districts} onChange={set('districts')} placeholder={t('e.g. Anuradhapura, Polonnaruwa')} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t('Regional manager')}>
                  <input className="input" value={d.manager} onChange={set('manager')} />
                </Field>
                <Field label={t('Office phone')}>
                  <input className="input" inputMode="tel" value={d.phone} onChange={set('phone')} />
                </Field>
              </div>
              <Field label={t('Status')} hint={t('Inactive regions are hidden from dropdowns but kept for history')}>
                <select className="input" value={d.status} onChange={set('status')}>
                  <option value="Active">{t('Active')}</option>
                  <option value="Inactive">{t('Inactive')}</option>
                </select>
              </Field>
              {inUse && (
                <p className="text-xs text-zinc-500">
                  {t('Used by {centers} centers and {farmers} farmers — it can be deactivated but not deleted.', {
                    centers: num(sel!.centers),
                    farmers: num(sel!.farmers),
                  })}
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
                  toast(status === 'Active' ? t('{name} activated.', { name: d.name }) : t('{name} deactivated.', { name: d.name }));
                }}
                onDelete={() => {
                  regionStore.set((all) => all.filter((r) => r.code !== selCode));
                  toast(t('Region {name} deleted.', { name: d.name }));
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

const REVIEW_OPTIONS: CategoryMaster['review'][] = ['Monthly', 'Quarterly', 'Half-yearly', 'Yearly'];

function rule(c: CategoryMaster, t: T) {
  if (!c.minLitres && !c.minScore && !c.minReliability) return t('All other active farmers');
  const parts = [
    t('≥ {n} L/day', { n: c.minLitres }),
    t('score ≥ {n}', { n: c.minScore }),
    t('on time ≥ {n}%', { n: c.minReliability }),
  ];
  parts.push(c.maxRejections === 0 ? t('no rejections') : t('≤ {n} rejections', { n: c.maxRejections }));
  return parts.join(', ');
}

function Categories({ rows }: { rows: CategoryMaster[] }) {
  const toast = useToast();
  const { t } = useLang();
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
    if (!/^[A-Z]{2,4}$/.test(code)) e.code = t('Use 2–4 letters, e.g. {code}.', { code: 'GLD' });
    else if (rows.some((c) => c.code === code && c.code !== selCode)) e.code = t('This code is already used.');
    if (!name) e.name = t('Enter the category name.');
    else if (rows.some((c) => c.name.toLowerCase() === name.toLowerCase() && c.code !== selCode)) e.name = t('This category already exists.');
    for (const k of NUM_FIELDS) {
      const v = Number(d[k]);
      if (d[k].trim() === '' || Number.isNaN(v) || v < 0) e[k] = t('Enter a number (0 or more).');
    }
    if (!e.minScore && Number(d.minScore) > 100) e.minScore = t('Score is out of 100.');
    if (!e.minReliability && Number(d.minReliability) > 100) e.minReliability = t('Use a percentage up to 100.');
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
    toast(isNew ? t('Category {name} created.', { name }) : t('Category {name} saved.', { name }));
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
          <SearchBar value={q} onChange={setQ} onNew={() => open(null)} placeholder={t('Code, name or description…')} label={t('New category')} />
          <DataTable<CategoryMaster>
            rows={shown}
            rowKey={(c) => c.code}
            selectedKey={selCode}
            onRowClick={open}
            empty={<EmptyState title={t('No categories match this search.')} />}
            columns={[
              { key: 'rank', header: t('Tier'), align: 'right', mono: true },
              { key: 'name', header: t('Category'), render: (c) => <Badge tone={c.rank <= 2 ? 'brand' : 'neutral'}>{t(c.name)}</Badge> },
              { key: 'code', header: t('Code'), mono: true },
              { key: 'rule', header: t('Rule to qualify (last 3 months)'), className: 'whitespace-normal min-w-[220px] text-zinc-600', render: (c) => rule(c, t) },
              { key: 'prem', header: t('Premium Rs / L'), align: 'right', mono: true, render: (c) => c.defaultPremium.toFixed(2) },
              { key: 'adv', header: t('Max advance'), align: 'right', mono: true, render: (c) => t('Rs {amount}', { amount: num(c.maxAdvance) }) },
              { key: 'farmers', header: t('Farmers'), align: 'right', mono: true, render: (c) => num(c.farmers) },
              { key: 'status', header: t('Status'), render: (c) => <StatusBadge status={c.status} /> },
            ]}
          />
        </>
      }
      form={
        <Card>
          <CardHeader
            title={isNew ? t('New category') : t(d.name) || t('Category')}
            subtitle={isNew ? t('Add a farmer category') : t('Code {code}', { code: sel?.code ?? '' })}
            actions={!isNew && <StatusBadge status={d.status} />}
          />
          <CardBody>
            <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
              <div className="grid gap-4 sm:grid-cols-[110px_1fr_90px]">
                <Field label={t('Code')} error={errors.code}>
                  <input className="input num uppercase" value={d.code} onChange={set('code')} maxLength={4} autoComplete="off" spellCheck={false} />
                </Field>
                <Field label={t('Category name')} error={errors.name}>
                  <input className="input" value={d.name} onChange={set('name')} />
                </Field>
                {numField('rank', t('Tier'), t('1 = highest'))}
              </div>
              <Field label={t('Description')}>
                <input className="input" value={d.description} onChange={set('description')} />
              </Field>

              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold">{t('Rules to qualify')}</legend>
                <p className="text-xs text-zinc-500">{t('Checked on the last 3 months at every review. Set all to 0 for the entry category.')}</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {numField('minLitres', t('Min. average litres / day'))}
                  {numField('minScore', t('Min. quality score (0–100)'))}
                  {numField('minReliability', t('Min. on-time deliveries (%)'))}
                  {numField('maxRejections', t('Max. rejections'))}
                </div>
              </fieldset>

              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold">{t('Benefits')}</legend>
                <div className="grid gap-4 sm:grid-cols-2">
                  {numField('defaultPremium', t('Default premium (Rs / L)'), t('Pre-filled in new price templates'))}
                  {numField('maxAdvance', t('Max. cash advance (Rs)'))}
                </div>
              </fieldset>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t('Review frequency')}>
                  <select className="input" value={d.review} onChange={set('review')}>
                    {REVIEW_OPTIONS.map((o) => (
                      <option key={o} value={o}>
                        {t(o)}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={t('Status')}>
                  <select className="input" value={d.status} onChange={set('status')}>
                    <option value="Active">{t('Active')}</option>
                    <option value="Inactive">{t('Inactive')}</option>
                  </select>
                </Field>
              </div>
              {inUse && (
                <p className="text-xs text-zinc-500">
                  {t('{n} farmers are in this category — it can be deactivated but not deleted.', { n: num(sel!.farmers) })}
                </p>
              )}
              <FormActions
                isNew={isNew}
                status={d.status}
                inUse={inUse}
                onSave={save}
                onToggle={() => {
                  const status: MasterStatus = d.status === 'Active' ? 'Inactive' : 'Active';
                  categoryStore.set((all) => all.map((c) => (c.code === selCode ? { ...c, status } : c)));
                  setD((x) => ({ ...x, status }));
                  toast(status === 'Active' ? t('{name} activated.', { name: d.name }) : t('{name} deactivated.', { name: d.name }));
                }}
                onDelete={() => {
                  categoryStore.set((all) => all.filter((c) => c.code !== selCode));
                  toast(t('Category {name} deleted.', { name: d.name }));
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
