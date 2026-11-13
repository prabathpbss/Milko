import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import clsx from 'clsx';
import { Lock } from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Field } from '@/components/ui/Field';
import {
  PERM_ACTIONS,
  PERM_MODULES,
  SCOPE_LEVELS,
  approvalText,
  emptyPerms,
  roleStore,
  userStore,
  type ApprovalMode,
  type RoleMaster,
  type ScopeLevel,
  type SignIn,
} from '@/data/access';
import type { MasterStatus } from '@/data/masters';
import type { PermissionMatrix } from '@/data/mock';
import { num } from '@/lib/format';
import { useToast } from '@/context/ToastContext';
import { useLang } from '@/i18n/LanguageContext';
import { CODE_RE, FormActions, MasterLayout, SearchBar, focusFirstError } from './shared';

interface RoleDraft {
  code: string;
  name: string;
  description: string;
  levels: ScopeLevel[];
  approvalMode: ApprovalMode;
  approvalLimit: string;
  signIn: SignIn;
  twoStep: boolean;
  bindDevice: boolean;
  perms: PermissionMatrix;
  status: MasterStatus;
}

const emptyRole = (): RoleDraft => ({
  code: '', name: '', description: '', levels: ['Center'], approvalMode: 'None', approvalLimit: '0',
  signIn: 'Password', twoStep: true, bindDevice: false, perms: emptyPerms(), status: 'Active',
});
const toDraft = (r: RoleMaster): RoleDraft => ({ ...r, approvalLimit: String(r.approvalLimit), perms: structuredClone(r.perms) });

const LEVEL_HINT: Record<ScopeLevel, string> = {
  Company: 'Whole company',
  Region: 'One or more regions',
  Center: 'One or more centers',
  Route: 'One or more routes',
};

const countPerms = (p: PermissionMatrix) => Object.values(p).reduce((n, row) => n + Object.values(row).filter(Boolean).length, 0);

export default function Roles({ rows }: { rows: RoleMaster[] }) {
  const toast = useToast();
  const { t } = useLang();
  const location = useLocation();
  const nav = location.state as { newRole?: boolean; code?: string } | null;
  const startNew = nav?.newRole === true;
  const [q, setQ] = useState('');
  const [selCode, setSelCode] = useState<string | null>(startNew ? null : rows.find((r) => r.code === nav?.code)?.code ?? rows[0]?.code ?? null);
  const sel = rows.find((r) => r.code === selCode) ?? null;
  const [d, setD] = useState<RoleDraft>(sel ? toDraft(sel) : emptyRole());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isNew = selCode === null;

  const open = (r: RoleMaster | null) => {
    setSelCode(r?.code ?? null);
    setD(r ? toDraft(r) : emptyRole());
    setErrors({});
  };
  const set = <K extends keyof RoleDraft>(k: K, v: RoleDraft[K]) => setD((x) => ({ ...x, [k]: v }));

  const term = q.trim().toLowerCase();
  const shown = rows.filter((r) => !term || [r.code, r.name, r.description].some((v) => v.toLowerCase().includes(term)));

  const togglePerm = (m: string, a: string) =>
    setD((x) => ({ ...x, perms: { ...x.perms, [m]: { ...x.perms[m], [a]: !x.perms[m][a] } } }));
  const setRow = (m: string, on: boolean) =>
    setD((x) => ({ ...x, perms: { ...x.perms, [m]: Object.fromEntries(PERM_ACTIONS.map((a) => [a, on])) } }));
  const preset = (kind: 'read' | 'clear') =>
    setD((x) => ({
      ...x,
      perms: Object.fromEntries(
        PERM_MODULES.map((m) => [m, Object.fromEntries(PERM_ACTIONS.map((a) => [a, kind === 'read' && (a === 'View' || a === 'Export')]))]),
      ),
    }));

  const canApproveSomething = PERM_MODULES.some((m) => d.perms[m]?.Approve);

  const save = () => {
    const code = d.code.trim().toUpperCase();
    const name = d.name.trim();
    const e: Record<string, string> = {};
    if (!CODE_RE.test(code)) e.code = t('Letters, digits or "-", e.g. {code}.', { code: 'FIN-MGR' });
    else if (rows.some((r) => r.code === code && r.code !== selCode)) e.code = t('This code is already used.');
    if (!name) e.name = t('Enter the role name.');
    else if (rows.some((r) => r.name.toLowerCase() === name.toLowerCase() && r.code !== selCode)) e.name = t('This role already exists.');
    if (!d.levels.length) e.levels = t('Pick at least one scope level.');
    if (d.approvalMode === 'Limit') {
      const v = Number(d.approvalLimit);
      if (d.approvalLimit.trim() === '' || Number.isNaN(v) || v <= 0) e.approvalLimit = t('Enter an amount above 0.');
    }
    if (canApproveSomething && d.approvalMode === 'None') e.approvalMode = t('This role has Approve ticked — set a limit or untick Approve.');
    if (!countPerms(d.perms)) e.perms = t('Tick at least one permission.');
    setErrors(e);
    if (Object.keys(e).length) return focusFirstError();

    const next: RoleMaster = {
      code,
      name,
      description: d.description.trim(),
      levels: SCOPE_LEVELS.filter((l) => d.levels.includes(l)),
      approvalMode: d.approvalMode,
      approvalLimit: d.approvalMode === 'Limit' ? Number(d.approvalLimit) : 0,
      signIn: d.signIn,
      twoStep: d.signIn === 'Mobile OTP' ? true : d.twoStep,
      bindDevice: d.signIn === 'Mobile OTP' && d.bindDevice,
      perms: d.perms,
      users: sel?.users ?? 0,
      system: sel?.system ?? false,
      status: sel?.system ? 'Active' : d.status,
    };
    roleStore.set((all) => (isNew ? [...all, next] : all.map((r) => (r.code === selCode ? next : r))));
    // Keep users pointing at a renamed role.
    if (sel && sel.name !== name) userStore.set((all) => all.map((u) => (u.role === sel.name ? { ...u, role: name } : u)));
    setSelCode(code);
    toast(isNew ? t('Role {name} created.', { name }) : t('Role {name} saved.', { name }));
  };

  const inUse = !!sel && sel.users > 0;
  const approvalLabel = (r: RoleMaster) => (r.approvalMode === 'Limit' ? t('Rs {amount}', { amount: r.approvalLimit.toLocaleString('en-LK') }) : t(approvalText(r)));

  return (
    <MasterLayout
      wide
      list={
        <>
          <SearchBar value={q} onChange={setQ} onNew={() => open(null)} placeholder={t('Code, name or description…')} label={t('New role')} />
          <DataTable<RoleMaster>
            rows={shown}
            rowKey={(r) => r.code}
            selectedKey={selCode}
            onRowClick={open}
            empty={t('No roles match this search.')}
            columns={[
              {
                key: 'name',
                header: t('Role'),
                render: (r) => (
                  <div>
                    <div className="flex items-center gap-1.5 font-medium">
                      {t(r.name)}
                      {r.system && <Lock className="h-3.5 w-3.5 text-zinc-400" aria-label={t('Built-in role')} />}
                    </div>
                    <div className="num text-xs text-zinc-500">{r.code}</div>
                  </div>
                ),
              },
              { key: 'levels', header: t('Scope'), className: 'text-zinc-600', render: (r) => r.levels.map((l) => t(l)).join(', ') },
              { key: 'limit', header: t('Approval limit'), align: 'right', mono: true, render: (r) => <span className={clsx(r.approvalMode === 'None' && 'text-zinc-500')}>{approvalLabel(r)}</span> },
              { key: 'users', header: t('Users'), align: 'right', mono: true, render: (r) => num(r.users) },
              { key: 'status', header: t('Status'), render: (r) => <StatusBadge status={r.status} /> },
            ]}
          />
        </>
      }
      form={
        <Card>
          <CardHeader
            title={isNew ? t('New role') : t(d.name) || t('Role')}
            subtitle={isNew ? t('Add a role and its permissions') : sel?.system ? t('Code {code} · built-in', { code: sel.code }) : t('Code {code}', { code: sel?.code ?? '' })}
            actions={!isNew && <StatusBadge status={d.status} />}
          />
          <CardBody>
            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
                <Field label={t('Code')} error={errors.code}>
                  <input
                    className="input num uppercase"
                    value={d.code}
                    onChange={(e) => set('code', e.target.value)}
                    maxLength={10}
                    autoComplete="off"
                    spellCheck={false}
                  />
                </Field>
                <Field label={t('Role name')} error={errors.name}>
                  <input className="input" value={d.name} onChange={(e) => set('name', e.target.value)} />
                </Field>
              </div>
              <Field label={t('Description')}>
                <input className="input" value={d.description} onChange={(e) => set('description', e.target.value)} />
              </Field>

              <fieldset className="space-y-2">
                <legend className="text-sm font-semibold">{t('Allowed access scopes')}</legend>
                <p className="text-xs text-zinc-500">{t('Users with this role can only be given scopes of these levels.')}</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {SCOPE_LEVELS.map((l) => (
                    <label
                      key={l}
                      className={clsx(
                        'flex min-h-[44px] cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-colors',
                        d.levels.includes(l) ? 'border-brand-300 bg-brand-50' : 'border-zinc-200 hover:bg-zinc-50',
                      )}
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-brand-600"
                        checked={d.levels.includes(l)}
                        onChange={() => set('levels', d.levels.includes(l) ? d.levels.filter((x) => x !== l) : [...d.levels, l])}
                      />
                      <span>
                        <span className="font-medium">{t(l)}</span>
                        <span className="block text-xs text-zinc-500">{t(LEVEL_HINT[l])}</span>
                      </span>
                    </label>
                  ))}
                </div>
                {errors.levels && (
                  <span className="text-xs text-red-600" role="alert" data-field-error>
                    {errors.levels}
                  </span>
                )}
              </fieldset>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t('Approvals')} error={errors.approvalMode}>
                  <select className="input" value={d.approvalMode} onChange={(e) => set('approvalMode', e.target.value as ApprovalMode)}>
                    <option value="None">{t('Cannot approve')}</option>
                    <option value="Limit">{t('Up to a limit')}</option>
                    <option value="Unlimited">{t('No limit')}</option>
                  </select>
                </Field>
                {d.approvalMode === 'Limit' && (
                  <Field label={t('Approval limit (Rs)')} error={errors.approvalLimit} hint={t('Per payment run, advance or adjustment')}>
                    <input className="input num" inputMode="numeric" value={d.approvalLimit} onChange={(e) => set('approvalLimit', e.target.value)} />
                  </Field>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t('Sign-in method')}>
                  <select className="input" value={d.signIn} onChange={(e) => set('signIn', e.target.value as SignIn)}>
                    <option value="SSO">{t('Company account (SSO)')}</option>
                    <option value="Password">{t('Email and password')}</option>
                    <option value="Mobile OTP">{t('Mobile number + SMS code')}</option>
                  </select>
                </Field>
                <div className="flex flex-col justify-end gap-2 pb-1 text-sm">
                  {d.signIn === 'Mobile OTP' ? (
                    <label className="flex min-h-[44px] items-center gap-3">
                      <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={d.bindDevice} onChange={(e) => set('bindDevice', e.target.checked)} />
                      {t('Bind each user to one phone')}
                    </label>
                  ) : (
                    <label className="flex min-h-[44px] items-center gap-3">
                      <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={d.twoStep} onChange={(e) => set('twoStep', e.target.checked)} />
                      {t('Require 2-step verification')}
                    </label>
                  )}
                </div>
              </div>

              <fieldset className="space-y-2">
                <legend className="sr-only">{t('Permissions')}</legend>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold" aria-hidden="true">
                    {t('Permissions')} <span className="num font-normal text-zinc-500">· {t('{n} ticked', { n: countPerms(d.perms) })}</span>
                  </p>
                  <div className="flex gap-2">
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => preset('read')}>
                      {t('Read only')}
                    </button>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => preset('clear')}>
                      {t('Clear all')}
                    </button>
                  </div>
                </div>
                <div className="-mx-4 overflow-x-auto border-y border-zinc-100 sm:mx-0 sm:rounded-lg sm:border">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-200 bg-zinc-50/80">
                        <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">{t('Module')}</th>
                        {PERM_ACTIONS.map((a) => (
                          <th key={a} className="px-2 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-zinc-500">
                            {t(a)}
                          </th>
                        ))}
                        <th className="px-2 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-zinc-500">{t('All')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {PERM_MODULES.map((m) => {
                        const row = d.perms[m] ?? {};
                        const all = PERM_ACTIONS.every((a) => row[a]);
                        return (
                          <tr key={m} className="hover:bg-zinc-50">
                            <td className="whitespace-nowrap px-3 py-2 font-medium">{t(m)}</td>
                            {PERM_ACTIONS.map((a) => (
                              <td key={a} className="px-2 py-2 text-center">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 accent-brand-600"
                                  aria-label={`${t(m)}: ${t(a)}`}
                                  checked={!!row[a]}
                                  onChange={() => togglePerm(m, a)}
                                />
                              </td>
                            ))}
                            <td className="px-2 py-2 text-center">
                              <input type="checkbox" className="h-4 w-4 accent-brand-600" aria-label={`${t(m)}: ${t('All')}`} checked={all} onChange={() => setRow(m, !all)} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {errors.perms && (
                  <span className="text-xs text-red-600" role="alert" data-field-error>
                    {errors.perms}
                  </span>
                )}
              </fieldset>

              {!sel?.system && (
                <Field label={t('Status')} hint={t("Inactive roles can't be given to new users")}>
                  <select className="input" value={d.status} onChange={(e) => set('status', e.target.value as MasterStatus)}>
                    <option value="Active">{t('Active')}</option>
                    <option value="Inactive">{t('Inactive')}</option>
                  </select>
                </Field>
              )}
              {sel?.system ? (
                <p className="text-xs text-zinc-500">
                  <Badge tone="neutral">{t('Built-in')}</Badge> {t('This role can be edited but not deactivated or deleted.')}
                </p>
              ) : (
                inUse && <p className="text-xs text-zinc-500">{t('{n} users have this role — it can be deactivated but not deleted.', { n: num(sel!.users) })}</p>
              )}
              <FormActions
                isNew={isNew}
                status={d.status}
                inUse={inUse}
                locked={sel?.system}
                onSave={save}
                onToggle={() => {
                  const status: MasterStatus = d.status === 'Active' ? 'Inactive' : 'Active';
                  roleStore.set((all) => all.map((r) => (r.code === selCode ? { ...r, status } : r)));
                  setD((x) => ({ ...x, status }));
                  toast(status === 'Active' ? t('{name} activated.', { name: d.name }) : t('{name} deactivated.', { name: d.name }));
                }}
                onDelete={() => {
                  roleStore.set((all) => all.filter((r) => r.code !== selCode));
                  toast(t('Role {name} deleted.', { name: d.name }));
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
