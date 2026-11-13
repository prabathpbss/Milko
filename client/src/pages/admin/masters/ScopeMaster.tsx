import { useState } from 'react';
import clsx from 'clsx';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Field } from '@/components/ui/Field';
import { FilterChips } from '@/components/ui/Tabs';
import { SCOPE_LEVELS, scopeStore, userStore, useRoleMaster, type ScopeLevel, type ScopeMaster } from '@/data/access';
import { useRegionNames, type MasterStatus } from '@/data/masters';
import { centers, routes } from '@/data/mock';
import { num } from '@/lib/format';
import { useToast } from '@/context/ToastContext';
import { useLang } from '@/i18n/LanguageContext';
import { CODE_RE, FormActions, MasterLayout, SearchBar, focusFirstError } from './shared';

interface ScopeDraft {
  code: string;
  name: string;
  level: ScopeLevel;
  members: string[];
  description: string;
  status: MasterStatus;
}

const emptyScope: ScopeDraft = { code: '', name: '', level: 'Center', members: [], description: '', status: 'Active' };
const LEVEL_TONE: Record<ScopeLevel, 'brand' | 'info' | 'success' | 'neutral'> = { Company: 'brand', Region: 'info', Center: 'success', Route: 'neutral' };
const CODE_PREFIX: Record<ScopeLevel, string> = { Company: '', Region: 'RG-', Center: 'CC-', Route: 'RT-' };

const centerName = (id: string) => centers.find((c) => c.id === id)?.name ?? id;
const routeName = (id: string) => {
  const r = routes.find((x) => x.id === id);
  return r ? `${r.id} ${r.name}` : id;
};

/** Plain-words list of what a scope covers. */
export function covers(s: Pick<ScopeMaster, 'level' | 'members'>) {
  if (s.level === 'Company') return 'All regions, centers and routes';
  const names = s.members.map((m) => (s.level === 'Center' ? centerName(m) : s.level === 'Route' ? routeName(m) : m));
  return names.join(', ') || '—';
}

type LevelFilter = 'All' | ScopeLevel;

const MEMBER_ERROR: Record<ScopeLevel, string> = {
  Company: 'Pick at least one region.',
  Region: 'Pick at least one region.',
  Center: 'Pick at least one center.',
  Route: 'Pick at least one route.',
};

export default function Scopes({ rows }: { rows: ScopeMaster[] }) {
  const toast = useToast();
  const { t } = useLang();
  /** Covers text and the seeded company-wide scope name are translated; place names stay as they are. */
  const coversLabel = (s: Pick<ScopeMaster, 'level' | 'members'>) => (s.level === 'Company' ? t(covers(s)) : covers(s));
  const scopeName = (n: string) => (n === 'All regions' ? t(n) : n);
  const roles = useRoleMaster();
  const regionNames = useRegionNames();
  const [q, setQ] = useState('');
  const [level, setLevel] = useState<LevelFilter>('All');
  const [selCode, setSelCode] = useState<string | null>(rows[0]?.code ?? null);
  const sel = rows.find((s) => s.code === selCode) ?? null;
  const [d, setD] = useState<ScopeDraft>(sel ? { ...sel } : emptyScope);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isNew = selCode === null;

  const open = (s: ScopeMaster | null) => {
    setSelCode(s?.code ?? null);
    setD(s ? { ...s, members: [...s.members] } : emptyScope);
    setErrors({});
  };
  const set = <K extends keyof ScopeDraft>(k: K, v: ScopeDraft[K]) => setD((x) => ({ ...x, [k]: v }));

  const term = q.trim().toLowerCase();
  const shown = rows.filter(
    (s) => (level === 'All' || s.level === level) && (!term || [s.code, s.name, s.description, covers(s)].some((v) => v.toLowerCase().includes(term))),
  );

  // What can be picked for the chosen level. Inactive regions stay visible if already selected.
  const options: { id: string; label: string; sub?: string }[] =
    d.level === 'Region'
      ? Array.from(new Set([...regionNames, ...d.members])).map((r) => ({ id: r, label: r }))
      : d.level === 'Center'
        ? centers.map((c) => ({ id: c.id, label: c.name, sub: c.region }))
        : d.level === 'Route'
          ? routes.map((r) => ({ id: r.id, label: `${r.id} · ${r.name}`, sub: centerName(r.centerId) }))
          : [];

  const changeLevel = (l: ScopeLevel) => setD((x) => ({ ...x, level: l, members: [] }));
  /** Toggle a region/center/route. On a new scope, the first pick suggests a code and name if they're empty. */
  const toggleMember = (id: string) =>
    setD((x) => {
      const members = x.members.includes(id) ? x.members.filter((m) => m !== id) : [...x.members, id];
      if (!isNew || members.length !== 1) return { ...x, members };
      const m = members[0];
      const code =
        x.level === 'Center' ? m : x.level === 'Route' ? `RT-${m.replace(/^R-/, '')}` : `RG-${m.split(' ').map((w) => w[0]).join('').toUpperCase()}`;
      const name = x.level === 'Center' ? centerName(m) : x.level === 'Route' ? `Route ${m}` : m;
      return { ...x, members, code: x.code || code, name: x.name || name };
    });

  const rolesAllowing = roles.filter((r) => r.status === 'Active' && r.levels.includes(d.level)).map((r) => r.name);

  const save = () => {
    const code = d.code.trim().toUpperCase();
    const name = d.name.trim();
    const e: Record<string, string> = {};
    if (!CODE_RE.test(code)) e.code = t('Letters, digits or "-", e.g. {code}.', { code: 'CC-HNG' });
    else if (rows.some((s) => s.code === code && s.code !== selCode)) e.code = t('This code is already used.');
    if (!name) e.name = t('Enter the scope name.');
    else if (rows.some((s) => s.name.toLowerCase() === name.toLowerCase() && s.code !== selCode)) e.name = t('This scope already exists.');
    if (d.level !== 'Company' && !d.members.length) e.members = t(MEMBER_ERROR[d.level]);
    setErrors(e);
    if (Object.keys(e).length) return focusFirstError();

    const next: ScopeMaster = {
      code,
      name,
      level: d.level,
      members: d.level === 'Company' ? [] : d.members,
      description: d.description.trim(),
      users: sel?.users ?? 0,
      status: d.status,
    };
    scopeStore.set((all) => (isNew ? [...all, next] : all.map((s) => (s.code === selCode ? next : s))));
    if (sel && sel.name !== name) userStore.set((all) => all.map((u) => (u.scope === sel.name ? { ...u, scope: name } : u)));
    setSelCode(code);
    toast(isNew ? t('Scope {name} created.', { name }) : t('Scope {name} saved.', { name }));
  };

  const inUse = !!sel && sel.users > 0;
  const levelCount = (l: ScopeLevel) => rows.filter((s) => s.level === l).length;

  return (
    <MasterLayout
      list={
        <>
          <SearchBar value={q} onChange={setQ} onNew={() => open(null)} placeholder={t('Code, name, region, center or route…')} label={t('New scope')} />
          <div className="border-b border-zinc-100 px-4 py-3">
            <FilterChips<LevelFilter>
              value={level}
              onChange={setLevel}
              options={[{ id: 'All', label: t('All'), count: rows.length }, ...SCOPE_LEVELS.map((l) => ({ id: l, label: t(l), count: levelCount(l) }))]}
            />
          </div>
          <DataTable<ScopeMaster>
            rows={shown}
            rowKey={(s) => s.code}
            selectedKey={selCode}
            onRowClick={open}
            empty={t('No scopes match this search.')}
            columns={[
              { key: 'code', header: t('Code'), mono: true, render: (s) => <span className="font-medium">{s.code}</span> },
              { key: 'name', header: t('Scope'), render: (s) => <span className="font-medium">{scopeName(s.name)}</span> },
              { key: 'level', header: t('Level'), render: (s) => <Badge tone={LEVEL_TONE[s.level]}>{t(s.level)}</Badge> },
              { key: 'covers', header: t('Covers'), className: 'whitespace-normal min-w-[180px] text-zinc-600', render: coversLabel },
              { key: 'users', header: t('Users'), align: 'right', mono: true, render: (s) => num(s.users) },
              { key: 'status', header: t('Status'), render: (s) => <StatusBadge status={s.status} /> },
            ]}
          />
        </>
      }
      form={
        <Card>
          <CardHeader
            title={isNew ? t('New access scope') : scopeName(d.name) || t('Scope')}
            subtitle={isNew ? t('Choose what data the user will see') : t('Code {code}', { code: sel?.code ?? '' })}
            actions={!isNew && <StatusBadge status={d.status} />}
          />
          <CardBody>
            <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
              <fieldset className="space-y-2">
                <legend className="text-sm font-semibold">{t('Level')}</legend>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {SCOPE_LEVELS.map((l) => (
                    <label
                      key={l}
                      className={clsx(
                        'flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-600 has-[:focus-visible]:ring-offset-2',
                        d.level === l ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50',
                      )}
                    >
                      <input type="radio" name="scope-level" className="sr-only" checked={d.level === l} onChange={() => changeLevel(l)} />
                      {t(l)}
                    </label>
                  ))}
                </div>
              </fieldset>

              {d.level === 'Company' ? (
                <p className="rounded-lg bg-zinc-50 p-3 text-sm text-zinc-600">{t('Users with this scope see every region, center, route and farmer.')}</p>
              ) : (
                <fieldset className="space-y-2">
                  <legend className="text-sm font-semibold">
                    {t(d.level === 'Region' ? 'Regions covered' : d.level === 'Center' ? 'Collection centers covered' : 'Routes covered')}
                    <span className="num ml-1 font-normal text-zinc-500">· {t('{n} selected', { n: d.members.length })}</span>
                  </legend>
                  <div className="max-h-64 space-y-1 overflow-y-auto overscroll-contain rounded-lg border border-zinc-200 p-1.5">
                    {options.map((o) => (
                      <label key={o.id} className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-md px-2.5 py-1.5 text-sm hover:bg-zinc-50">
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-brand-600"
                          checked={d.members.includes(o.id)}
                          onChange={() => toggleMember(o.id)}
                        />
                        <span className="min-w-0">
                          <span className="block truncate">{o.label}</span>
                          {o.sub && <span className="block text-xs text-zinc-500">{o.sub}</span>}
                        </span>
                      </label>
                    ))}
                  </div>
                  {errors.members && (
                    <span className="text-xs text-red-600" role="alert" data-field-error>
                      {errors.members}
                    </span>
                  )}
                </fieldset>
              )}

              <div className="grid gap-4 sm:grid-cols-[150px_1fr]">
                <Field label={t('Code')} error={errors.code} hint={!errors.code && CODE_PREFIX[d.level] ? t('e.g. {code}…', { code: CODE_PREFIX[d.level] }) : undefined}>
                  <input
                    className="input num uppercase"
                    value={d.code}
                    onChange={(e) => set('code', e.target.value)}
                    maxLength={10}
                    autoComplete="off"
                    spellCheck={false}
                  />
                </Field>
                <Field label={t('Scope name')} error={errors.name} hint={!errors.name ? t('Shown in the Invite user form') : undefined}>
                  <input className="input" value={d.name} onChange={(e) => set('name', e.target.value)} />
                </Field>
              </div>
              <Field label={t('Description')}>
                <input className="input" value={d.description} onChange={(e) => set('description', e.target.value)} />
              </Field>
              <Field label={t('Status')} hint={t("Inactive scopes can't be given to new users")}>
                <select className="input" value={d.status} onChange={(e) => set('status', e.target.value as MasterStatus)}>
                  <option value="Active">{t('Active')}</option>
                  <option value="Inactive">{t('Inactive')}</option>
                </select>
              </Field>

              <p className="text-xs text-zinc-500">
                {rolesAllowing.length ? (
                  <>
                    {t('Can be given to:')} <span className="text-zinc-700">{rolesAllowing.map((r) => t(r)).join(', ')}</span>.
                  </>
                ) : (
                  <>{t('No active role allows the {level} level yet — tick it on a role in the Roles tab.', { level: t(d.level) })}</>
                )}
              </p>
              {inUse && <p className="text-xs text-zinc-500">{t('{n} users have this scope — it can be deactivated but not deleted.', { n: num(sel!.users) })}</p>}
              <FormActions
                isNew={isNew}
                status={d.status}
                inUse={inUse}
                onSave={save}
                onToggle={() => {
                  const status: MasterStatus = d.status === 'Active' ? 'Inactive' : 'Active';
                  scopeStore.set((all) => all.map((s) => (s.code === selCode ? { ...s, status } : s)));
                  setD((x) => ({ ...x, status }));
                  toast(status === 'Active' ? t('{name} activated.', { name: d.name }) : t('{name} deactivated.', { name: d.name }));
                }}
                onDelete={() => {
                  scopeStore.set((all) => all.filter((s) => s.code !== selCode));
                  toast(t('Scope {name} deleted.', { name: d.name }));
                  open(rows.find((s) => s.code !== selCode) ?? null);
                }}
              />
            </form>
          </CardBody>
        </Card>
      }
    />
  );
}
