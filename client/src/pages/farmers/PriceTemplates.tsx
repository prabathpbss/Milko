import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { AlertTriangle, CopyPlus, GitBranchPlus, Info, Plus, Save, Search, Send, Trash2, Undo2 } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { FilterChips } from '@/components/ui/Tabs';
import { Field, FormGrid } from '@/components/ui/Field';
import { EmptyState } from '@/components/ui/misc';
import { regions } from '@/data/mock';
import {
  FAT_BANDS,
  SNF_BANDS,
  priceTemplates as seed,
  templateRate,
  type PriceTemplate,
  type TemplateCategory,
  type TemplateStatus,
} from '@/data/priceTemplates';
import { num } from '@/lib/format';
import { useToast } from '@/context/ToastContext';

type StatusFilter = 'all' | TemplateStatus;
const CATEGORIES: TemplateCategory[] = ['Platinum', 'Gold', 'Silver', 'Standard', 'Society'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmtDate = (iso: string) => {
  const [y, m, d] = iso.split('-');
  return y && m && d ? `${d} ${MONTHS[Number(m) - 1]} ${y}` : '—';
};
const TODAY = '2026-11-12';
const rs = (v: number) => `Rs ${v.toFixed(2)}`;

/* ───────────── Editor draft (strings so inputs can be cleared while typing) ───────────── */

interface Draft {
  name: string;
  region: string;
  category: TemplateCategory;
  validFrom: string;
  validTo: string;
  notes: string;
  matrix: string[][];
  premium: string;
  chillBonus: string;
  chillTemp: string;
  flagTemp: string;
  minFat: string;
  minSnf: string;
}

const toDraft = (t: PriceTemplate): Draft => ({
  name: t.name,
  region: t.region,
  category: t.category,
  validFrom: t.validFrom,
  validTo: t.validTo,
  notes: t.notes,
  matrix: t.matrix.map((r) => r.map(String)),
  premium: String(t.premium),
  chillBonus: String(t.chillBonus),
  chillTemp: String(t.chillTemp),
  flagTemp: String(t.flagTemp),
  minFat: String(t.minFat),
  minSnf: String(t.minSnf),
});

const n = (s: string) => (s.trim() === '' ? NaN : Number(s));

function fromDraft(t: PriceTemplate, d: Draft): PriceTemplate {
  return {
    ...t,
    name: d.name.trim(),
    region: d.region,
    category: d.category,
    validFrom: d.validFrom,
    validTo: d.validTo,
    notes: d.notes,
    matrix: d.matrix.map((r) => r.map(n)),
    premium: n(d.premium),
    chillBonus: n(d.chillBonus),
    chillTemp: n(d.chillTemp),
    flagTemp: n(d.flagTemp),
    minFat: n(d.minFat),
    minSnf: n(d.minSnf),
  };
}

function validate(d: Draft) {
  const errors: Record<string, string> = {};
  if (!d.name.trim()) errors.name = 'Enter a template name.';
  if (!d.validFrom) errors.validFrom = 'Choose the start date.';
  if (!d.validTo) errors.validTo = 'Choose the end date.';
  if (d.validFrom && d.validTo && d.validFrom > d.validTo) errors.validTo = 'End date must be after the start date.';
  if (d.matrix.some((r) => r.some((v) => !(n(v) > 0)))) errors.matrix = 'Every price must be a number above zero.';
  for (const k of ['premium', 'chillBonus', 'chillTemp', 'flagTemp', 'minFat', 'minSnf'] as const) {
    if (Number.isNaN(n(d[k])) || n(d[k]) < 0) errors[k] = 'Enter a number (0 or more).';
  }
  return errors;
}

/** Richer milk should never pay less: warn when a price drops to the right or downwards. */
function monotonicWarnings(m: string[][]) {
  const out: string[] = [];
  m.forEach((row, r) =>
    row.forEach((v, c) => {
      if (c > 0 && n(v) < n(row[c - 1])) out.push(`FAT ${FAT_BANDS[r]}: SNF ${SNF_BANDS[c]} pays less than ${SNF_BANDS[c - 1]}`);
      if (r > 0 && n(v) < n(m[r - 1][c])) out.push(`SNF ${SNF_BANDS[c]}: FAT ${FAT_BANDS[r]} pays less than ${FAT_BANDS[r - 1]}`);
    }),
  );
  return out;
}

/* ───────────── Page ───────────── */

export default function PriceTemplates() {
  const toast = useToast();
  const [templates, setTemplates] = useState<PriceTemplate[]>(seed);
  const [selId, setSelId] = useState<string>(seed[0].id);
  const [status, setStatus] = useState<StatusFilter>('all');
  const [q, setQ] = useState('');
  const [region, setRegion] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return templates.filter(
      (t) =>
        (status === 'all' || t.status === status) &&
        (!region || t.region === region) &&
        (!term || [t.name, t.id].some((v) => v.toLowerCase().includes(term))),
    );
  }, [templates, status, q, region]);

  const sel = templates.find((t) => t.id === selId);
  const count = (s: StatusFilter) => (s === 'all' ? templates.length : templates.filter((t) => t.status === s).length);

  const select = (id: string) => {
    setSelId(id);
    requestAnimationFrame(() => editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const upsert = (t: PriceTemplate) =>
    setTemplates((all) => (all.some((x) => x.id === t.id) ? all.map((x) => (x.id === t.id ? t : x)) : [t, ...all]));

  const createFrom = (src: PriceTemplate, mode: 'version' | 'clone') => {
    const id = `PT-NEW-${Date.now().toString(36).toUpperCase()}`;
    const next: PriceTemplate = {
      ...src,
      id,
      name: mode === 'clone' ? `${src.name} (copy)` : src.name,
      version: mode === 'version' ? Math.max(...templates.filter((t) => t.name === src.name).map((t) => t.version)) + 1 : 1,
      status: 'Draft',
      validFrom: mode === 'version' ? TODAY : src.validFrom,
      farmers: 0,
      updatedBy: 'You',
      updatedAt: TODAY,
      notes: '',
      history: [],
    };
    next.history = [{ when: fmtDate(TODAY), who: 'You', text: mode === 'version' ? `Created v${next.version} from v${src.version}.` : `Copied from ${src.name} v${src.version}.` }];
    upsert(next);
    setStatus('all');
    select(id);
    toast(mode === 'version' ? `Draft v${next.version} created. Edit prices, then submit for approval.` : 'Copy created as a draft.', 'info');
  };

  const createNew = () => {
    const std = templates.find((t) => t.id === 'PT-NC-STD-26') ?? templates[0];
    const id = `PT-NEW-${Date.now().toString(36).toUpperCase()}`;
    upsert({
      ...std,
      id,
      name: '',
      region: '',
      category: 'Standard',
      version: 1,
      status: 'Draft',
      validFrom: '2027-01-01',
      validTo: '2027-12-31',
      farmers: 0,
      notes: '',
      updatedBy: 'You',
      updatedAt: TODAY,
      history: [{ when: fmtDate(TODAY), who: 'You', text: 'New template started from the Standard · North Central 2026 prices.' }],
    });
    setStatus('all');
    select(id);
  };

  return (
    <>
      <PageHeader
        breadcrumb={[{ label: 'Farmers' }, { label: 'Price templates' }]}
        title="Price templates"
        description="Milk price per litre by FAT and SNF, category premium and quality rules. Every delivery is priced with the farmer's template."
        actions={
          <button className="btn btn-primary" onClick={createNew}>
            <Plus className="h-4 w-4" /> New template
          </button>
        }
      />

      <div className="mb-4">
        <FilterChips<StatusFilter>
          value={status}
          onChange={setStatus}
          options={[
            { id: 'all', label: 'All', count: count('all') },
            { id: 'Active', label: 'Active', count: count('Active') },
            { id: 'Pending approval', label: 'Pending approval', count: count('Pending approval') },
            { id: 'Draft', label: 'Draft', count: count('Draft') },
            { id: 'Expired', label: 'Expired', count: count('Expired') },
          ]}
        />
      </div>

      <Card className="mb-6">
        <div className="grid gap-3 border-b border-zinc-100 p-4 sm:grid-cols-[1fr_220px]">
          <label className="relative">
            <span className="sr-only">Search templates</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input className="input pl-9" placeholder="Template name or code…" value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
          <select className="input" aria-label="Region" value={region} onChange={(e) => setRegion(e.target.value)}>
            <option value="">Any region</option>
            <option>All regions</option>
            {regions.map((r) => <option key={r}>{r}</option>)}
          </select>
        </div>
        <DataTable<PriceTemplate>
          rows={rows}
          rowKey={(t) => t.id}
          selectedKey={selId}
          onRowClick={(t) => select(t.id)}
          empty="No price templates match these filters."
          columns={[
            {
              key: 'name',
              header: 'Template',
              render: (t) => (
                <div>
                  <div className="font-medium">{t.name || <span className="text-zinc-500">Untitled draft</span>}</div>
                  <div className="num text-xs text-zinc-500">{t.id} · v{t.version}</div>
                </div>
              ),
            },
            { key: 'region', header: 'Region', render: (t) => t.region || '—' },
            { key: 'cat', header: 'Category', render: (t) => <Badge tone={t.category === 'Gold' || t.category === 'Platinum' ? 'brand' : 'neutral'}>{t.category}</Badge> },
            { key: 'valid', header: 'Valid', render: (t) => <span className="text-xs">{fmtDate(t.validFrom)} – {fmtDate(t.validTo)}</span> },
            { key: 'range', header: 'Base Rs / L', align: 'right', mono: true, render: (t) => `${Math.min(...t.matrix.flat())}–${Math.max(...t.matrix.flat())}` },
            { key: 'prem', header: 'Premium', align: 'right', mono: true, render: (t) => (t.premium ? `+${t.premium.toFixed(2)}` : '—') },
            { key: 'farmers', header: 'Farmers', align: 'right', mono: true, render: (t) => num(t.farmers) },
            { key: 'status', header: 'Status', render: (t) => <StatusBadge status={t.status} /> },
          ]}
        />
      </Card>

      <div ref={editorRef} className="scroll-mt-20">
        {sel ? (
          <TemplateEditor
            key={sel.id}
            template={sel}
            basis={templates.find((t) => t.name === sel.name && t.status === 'Active' && t.id !== sel.id)}
            onSave={(t, msg) => {
              upsert(t);
              toast(msg);
            }}
            onDelete={() => {
              setTemplates((all) => all.filter((t) => t.id !== sel.id));
              setSelId(templates.find((t) => t.id !== sel.id)?.id ?? '');
              toast('Draft deleted.');
            }}
            onNewVersion={() => createFrom(sel, 'version')}
            onClone={() => createFrom(sel, 'clone')}
          />
        ) : (
          <Card>
            <EmptyState title="Select a template" text="Choose a price template above to view or edit its prices." />
          </Card>
        )}
      </div>
    </>
  );
}

/* ───────────── Editor ───────────── */

function TemplateEditor({
  template: t,
  basis,
  onSave,
  onDelete,
  onNewVersion,
  onClone,
}: {
  template: PriceTemplate;
  /** Currently active version with the same name — changed cells are highlighted against it. */
  basis?: PriceTemplate;
  onSave: (t: PriceTemplate, message: string) => void;
  onDelete: () => void;
  onNewVersion: () => void;
  onClone: () => void;
}) {
  const editable = t.status === 'Draft';
  const [d, setD] = useState<Draft>(() => toDraft(t));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [adjust, setAdjust] = useState('1');
  const [test, setTest] = useState({ fat: '4.1', snf: '8.6', temp: '6' });

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));
  const setCell = (r: number, c: number, v: string) =>
    setD((x) => ({ ...x, matrix: x.matrix.map((row, ri) => (ri === r ? row.map((cell, ci) => (ci === c ? v : cell)) : row)) }));
  const shiftAll = (by: number) =>
    setD((x) => ({ ...x, matrix: x.matrix.map((row) => row.map((v) => (Number.isNaN(n(v)) ? v : String(+(n(v) + by).toFixed(2))))) }));

  const warnings = monotonicWarnings(d.matrix);
  const current = fromDraft(t, d);
  const preview = templateRate(current, Number(test.fat), Number(test.snf), Number(test.temp));

  const stamp = (text: string) => [...t.history, { when: fmtDate(TODAY), who: 'You', text }];

  const save = (submit: boolean) => {
    const e = validate(d);
    setErrors(e);
    if (Object.keys(e).length) {
      requestAnimationFrame(() =>
        document.querySelector('[data-field-error]')?.closest('label')?.querySelector<HTMLElement>('input, select, textarea')?.focus(),
      );
      return;
    }
    const next = fromDraft(t, d);
    if (submit) {
      onSave(
        { ...next, status: 'Pending approval', updatedBy: 'You', updatedAt: TODAY, history: stamp('Submitted for approval (General manager).') },
        `${next.name} v${next.version} sent to the General manager for approval.`,
      );
    } else {
      onSave({ ...next, updatedBy: 'You', updatedAt: TODAY, history: stamp('Draft saved.') }, 'Draft saved.');
    }
  };

  const actions =
    t.status === 'Draft' ? (
      <>
        <button className="btn btn-ghost text-red-700 hover:bg-red-50" onClick={onDelete}>
          <Trash2 className="h-4 w-4" /> Delete draft
        </button>
        <button className="btn btn-secondary" onClick={() => save(false)}>
          <Save className="h-4 w-4" /> Save draft
        </button>
        <button className="btn btn-primary" onClick={() => save(true)}>
          <Send className="h-4 w-4" /> Submit for approval
        </button>
      </>
    ) : t.status === 'Pending approval' ? (
      <>
        <button
          className="btn btn-secondary"
          onClick={() => onSave({ ...t, status: 'Draft', history: stamp('Withdrawn from approval for changes.') }, 'Withdrawn. You can edit the draft again.')}
        >
          <Undo2 className="h-4 w-4" /> Withdraw to draft
        </button>
        <Link to="/approvals" className="btn btn-primary">
          Open approvals
        </Link>
      </>
    ) : t.status === 'Active' ? (
      <>
        <button className="btn btn-secondary" onClick={onClone}>
          <CopyPlus className="h-4 w-4" /> Copy as new template
        </button>
        <button className="btn btn-primary" onClick={onNewVersion}>
          <GitBranchPlus className="h-4 w-4" /> Change prices (new version)
        </button>
      </>
    ) : (
      <button className="btn btn-secondary" onClick={onClone}>
        <CopyPlus className="h-4 w-4" /> Copy as new template
      </button>
    );

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <StatusBadge status={t.status} />
              <span className="num text-xs text-zinc-500">
                {t.id} · version {t.version} · updated {fmtDate(t.updatedAt)} by {t.updatedBy}
              </span>
            </div>
            <h2 className="truncate text-lg font-semibold">{d.name || 'Untitled draft'}</h2>
          </div>
          <div className="flex flex-wrap gap-2">{actions}</div>
        </div>
        {!editable && (
          <p className="flex items-start gap-2 border-t border-zinc-100 bg-zinc-50 px-5 py-3 text-sm text-zinc-600">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            {t.status === 'Active'
              ? `Active templates are locked so past payments stay traceable. ${num(t.farmers)} farmers are paid with this template. To change prices, create a new version — it replaces this one from its start date after approval.`
              : t.status === 'Pending approval'
                ? 'Waiting for General manager approval. Withdraw it to make changes.'
                : 'This template has expired. Farmers still linked to it should have their contracts renewed.'}
          </p>
        )}
      </Card>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHeader title="General" />
            <CardBody>
              <fieldset disabled={!editable} className="contents">
                <FormGrid>
                  <Field label="Template name" error={errors.name} className="sm:col-span-2" hint="Category · Region · Year, e.g. Gold · North Central 2027">
                    <input className="input" value={d.name} onChange={(e) => set('name', e.target.value)} />
                  </Field>
                  <Field label="Category" hint="Sets the default category premium">
                    <select className="input" value={d.category} onChange={(e) => set('category', e.target.value as TemplateCategory)}>
                      {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </Field>
                  <Field label="Region">
                    <select className="input" value={d.region} onChange={(e) => set('region', e.target.value)}>
                      <option value="">Choose a region…</option>
                      <option>All regions</option>
                      {regions.map((r) => <option key={r}>{r}</option>)}
                    </select>
                  </Field>
                  <Field label="Valid from" error={errors.validFrom}>
                    <input type="date" className="input" value={d.validFrom} onChange={(e) => set('validFrom', e.target.value)} />
                  </Field>
                  <Field label="Valid to" error={errors.validTo}>
                    <input type="date" className="input" value={d.validTo} onChange={(e) => set('validTo', e.target.value)} />
                  </Field>
                  <Field label="Reason / notes" className="sm:col-span-2 xl:col-span-3" hint="Shown to the approver">
                    <textarea className="input" rows={2} value={d.notes} onChange={(e) => set('notes', e.target.value)} />
                  </Field>
                </FormGrid>
              </fieldset>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Base price per litre (Rs)"
              subtitle={
                basis && editable
                  ? `Rows = FAT %, columns = SNF %. Highlighted cells differ from the active v${basis.version}.`
                  : 'Rows = FAT %, columns = SNF %.'
              }
              actions={
                editable ? (
                  <div className="flex items-center gap-1.5">
                    <label className="sr-only" htmlFor="adjust">Adjust all prices by Rs</label>
                    <input
                      id="adjust"
                      className="input num h-8 w-20 text-right"
                      inputMode="decimal"
                      value={adjust}
                      onChange={(e) => setAdjust(e.target.value)}
                    />
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => shiftAll(Math.abs(n(adjust) || 0))}>
                      + All
                    </button>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => shiftAll(-Math.abs(n(adjust) || 0))}>
                      − All
                    </button>
                  </div>
                ) : undefined
              }
            />
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50/80">
                    <th scope="col" className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      FAT \ SNF
                    </th>
                    {SNF_BANDS.map((s) => (
                      <th key={s} scope="col" className="num px-3 py-2.5 text-right text-xs font-semibold text-zinc-500">
                        {s}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {d.matrix.map((row, r) => (
                    <tr key={FAT_BANDS[r]}>
                      <th scope="row" className="num whitespace-nowrap px-4 py-2 text-left font-medium">
                        {FAT_BANDS[r]}
                      </th>
                      {row.map((v, c) => {
                        const changed = basis && n(v) !== basis.matrix[r][c];
                        const hit = preview && preview.r === r && preview.c === c;
                        return (
                          <td key={c} className="px-2 py-1.5 text-right">
                            {editable ? (
                              <input
                                aria-label={`Price for FAT ${FAT_BANDS[r]}, SNF ${SNF_BANDS[c]}`}
                                className={clsx(
                                  'input num h-9 w-24 text-right',
                                  changed && 'border-amber-400 bg-amber-50',
                                  hit && 'ring-2 ring-brand-600/40',
                                )}
                                inputMode="decimal"
                                value={v}
                                onChange={(e) => setCell(r, c, e.target.value)}
                              />
                            ) : (
                              <span className={clsx('num inline-block rounded-md px-2 py-1', changed && 'bg-amber-50 text-amber-900', hit && 'bg-brand-50 font-semibold text-brand-700')}>
                                {Number(v).toFixed(2)}
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {(errors.matrix || warnings.length > 0) && (
              <div className="space-y-1 border-t border-zinc-100 px-5 py-3 text-xs">
                {errors.matrix && <p className="text-red-600" role="alert">{errors.matrix}</p>}
                {warnings.slice(0, 3).map((w) => (
                  <p key={w} className="flex items-center gap-1.5 text-amber-800">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {w} — richer milk normally pays more.
                  </p>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <CardHeader title="Premiums & quality rules" />
            <CardBody>
              <fieldset disabled={!editable} className="contents">
                <FormGrid>
                  <Field label="Category premium (Rs / L)" error={errors.premium} hint="Added to every accepted litre">
                    <input className="input num" inputMode="decimal" value={d.premium} onChange={(e) => set('premium', e.target.value)} />
                  </Field>
                  <Field label="Chill bonus (Rs / L)" error={errors.chillBonus}>
                    <input className="input num" inputMode="decimal" value={d.chillBonus} onChange={(e) => set('chillBonus', e.target.value)} />
                  </Field>
                  <Field label="Chill bonus at or below (°C)" error={errors.chillTemp}>
                    <input className="input num" inputMode="decimal" value={d.chillTemp} onChange={(e) => set('chillTemp', e.target.value)} />
                  </Field>
                  <Field label="Flag deliveries above (°C)" error={errors.flagTemp} hint="Creates a quality exception">
                    <input className="input num" inputMode="decimal" value={d.flagTemp} onChange={(e) => set('flagTemp', e.target.value)} />
                  </Field>
                  <Field label="Reject below FAT (%)" error={errors.minFat}>
                    <input className="input num" inputMode="decimal" value={d.minFat} onChange={(e) => set('minFat', e.target.value)} />
                  </Field>
                  <Field label="Reject below SNF (%)" error={errors.minSnf}>
                    <input className="input num" inputMode="decimal" value={d.minSnf} onChange={(e) => set('minSnf', e.target.value)} />
                  </Field>
                </FormGrid>
              </fieldset>
              <p className="mt-4 text-xs text-zinc-500">A failed alcohol test or any adulteration always rejects the delivery, whatever the template.</p>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Check a rate" subtitle="Try a delivery against this template" />
            <CardBody className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {(['fat', 'snf', 'temp'] as const).map((k) => (
                  <Field key={k} label={k === 'fat' ? 'FAT %' : k === 'snf' ? 'SNF %' : 'Temp °C'}>
                    <input className="input num" inputMode="decimal" value={test[k]} onChange={(e) => setTest((x) => ({ ...x, [k]: e.target.value }))} />
                  </Field>
                ))}
              </div>
              {preview ? (
                <dl className="space-y-1.5 rounded-lg border border-zinc-200 p-3 text-sm">
                  <div className="flex justify-between"><dt className="text-zinc-500">Base price</dt><dd className="num">{rs(preview.base)}</dd></div>
                  <div className="flex justify-between"><dt className="text-zinc-500">Category premium</dt><dd className="num">+ {rs(preview.premium)}</dd></div>
                  <div className="flex justify-between"><dt className="text-zinc-500">Chill bonus</dt><dd className="num">+ {rs(preview.chill)}</dd></div>
                  <div className="flex justify-between border-t border-zinc-200 pt-1.5 font-semibold"><dt>Rate per litre</dt><dd className="num">{rs(preview.rate)}</dd></div>
                  {preview.flagged && <p className="pt-1 text-xs text-amber-800">Above {d.flagTemp} °C — accepted but flagged as a quality exception.</p>}
                </dl>
              ) : (
                <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">Rejected — below FAT {d.minFat} % or SNF {d.minSnf} %. Nothing is paid.</p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="History" />
            <CardBody>
              <ol className="relative space-y-4 border-l border-zinc-200 pl-5">
                {[...t.history].reverse().map((h, i) => (
                  <li key={i} className="relative">
                    <span className="absolute -left-[25px] top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-zinc-400" />
                    <p className="text-xs text-zinc-500">{h.when} · {h.who}</p>
                    <p className="text-sm">{h.text}</p>
                  </li>
                ))}
              </ol>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
