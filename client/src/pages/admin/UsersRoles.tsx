import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, UserPlus } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { Field } from '@/components/ui/Field';
import { Avatar, Modal } from '@/components/ui/misc';
import type { AppUser } from '@/data/mock';
import {
  approvalText,
  mfaFor,
  useActiveRoles,
  useRoleMaster,
  useScopesForRole,
  userStore,
  useUsers,
  type RoleMaster,
} from '@/data/access';
import { num } from '@/lib/format';
import { useToast } from '@/context/ToastContext';
import { useLang } from '@/i18n/LanguageContext';

type TabId = 'users' | 'roles';
type T = ReturnType<typeof useLang>['t'];

/** English keys; translated with t() at render. */
const SIGN_IN_TEXT: Record<AppUser['signIn'], string> = {
  SSO: 'Company account (SSO)',
  Password: 'Email and password',
  'Mobile OTP': 'Mobile number + SMS code',
};

/** Last-active text from data: "2 min ago", "1 h ago", "3 days ago", "Yesterday", "Today" or a time. */
function lastActiveText(v: string, t: T) {
  const m = /^(\d+) (min|h|days?) ago$/.exec(v);
  if (m) return t(m[2] === 'min' ? '{n} min ago' : m[2] === 'h' ? '{n} h ago' : '{n} days ago', { n: m[1] });
  return v === 'Yesterday' || v === 'Today' ? t(v) : v;
}

/** Device text from data: "Samsung A15 · bound" or "Binds on first sign-in". */
function deviceText(v: string, t: T) {
  const m = /^(.*) · bound$/.exec(v);
  if (m) return t('{device} · bound', { device: m[1] });
  return v === 'Binds on first sign-in' ? t(v) : v;
}

export default function UsersRoles() {
  const toast = useToast();
  const { t } = useLang();
  const navigate = useNavigate();
  const users = useUsers();
  const roles = useRoleMaster();
  const activeRoles = useActiveRoles();
  const [tab, setTab] = useState<TabId>('users');
  const [q, setQ] = useState('');
  const [invite, setInvite] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const firstRole = activeRoles.find((r) => r.name === 'Field officer')?.name ?? activeRoles[0]?.name ?? '';
  const [newUser, setNewUser] = useState({ name: '', email: '', role: firstRole, scope: '' });

  const scopes = useScopesForRole(newUser.role);
  const inviteRole = roles.find((r) => r.name === newUser.role);
  // Keep the chosen scope valid for the chosen role.
  const scope = scopes.some((s) => s.name === newUser.scope) ? newUser.scope : scopes[0]?.name ?? '';

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return users.filter((u) => !term || [u.name, u.email, u.role, u.scope].some((v) => v.toLowerCase().includes(term)));
  }, [q, users]);

  /** Seeded company-wide scope names are translated; region/center/route names stay as they are. */
  const scopeName = (n: string) => (n === 'All regions' || n === 'All' ? t(n) : n);
  const approvalLabel = (r: RoleMaster) =>
    r.approvalMode === 'Limit' ? t('Rs {amount}', { amount: r.approvalLimit.toLocaleString('en-LK') }) : t(approvalText(r));

  const openInvite = () => {
    setNewUser({ name: '', email: '', role: firstRole, scope: '' });
    setErrors({});
    setInvite(true);
  };

  const sendInvite = () => {
    const otp = inviteRole?.signIn === 'Mobile OTP';
    const e: Record<string, string> = {};
    if (!newUser.name.trim()) e.name = t('Enter the full name.');
    if (otp ? !/^\+?\d[\d\s]{8,}$/.test(newUser.email.trim()) : !/^\S+@\S+\.\S+$/.test(newUser.email.trim()))
      e.email = otp ? t('Enter a mobile number, e.g. {phone}.', { phone: '+94 77 123 4567' }) : t('Enter a valid email.');
    if (!inviteRole) e.role = t('Pick a role.');
    if (!scope) e.scope = t('No active scope fits this role — add one in the Access scope master.');
    setErrors(e);
    if (Object.keys(e).length || !inviteRole) return;

    userStore.set((all) => [
      ...all,
      {
        id: `U-${String(100 + all.length).padStart(3, '0')}`,
        name: newUser.name.trim(),
        email: otp ? '—' : newUser.email.trim(),
        role: inviteRole.name,
        scope,
        signIn: inviteRole.signIn,
        mfa: mfaFor(inviteRole),
        device: otp && inviteRole.bindDevice ? 'Binds on first sign-in' : '—',
        lastActive: '—',
        status: 'Invited',
      },
    ]);
    setInvite(false);
    toast(otp ? t('SMS invitation sent to {to}', { to: newUser.email.trim() }) : t('Invitation sent to {to}', { to: newUser.email.trim() }));
  };

  const usersWithRole = (name: string) => users.filter((u) => u.role === name).length;

  return (
    <>
      <PageHeader
        breadcrumb={[{ label: t('Administration') }, { label: t('Users & roles') }]}
        title={t('Users, roles & permissions')}
        description={t('Who can sign in, what they can see and which approvals they can make.')}
        actions={
          <>
            <button className="btn btn-secondary" onClick={() => navigate('/masters/roles', { state: { newRole: true } })}>
              <Plus className="h-4 w-4" /> {t('New role')}
            </button>
            <button className="btn btn-primary" onClick={openInvite}>
              <UserPlus className="h-4 w-4" /> {t('Invite user')}
            </button>
          </>
        }
      />

      <Tabs<TabId>
        value={tab}
        onChange={setTab}
        className="mb-6"
        tabs={[
          { id: 'users', label: t('Users'), count: users.length },
          { id: 'roles', label: t('Roles'), count: roles.length },
        ]}
      />

      {tab === 'users' && (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 p-4">
            <label className="relative w-full sm:w-80">
              <span className="sr-only">{t('Search users')}</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input className="input pl-9" placeholder={t('Name, email, role or scope')} value={q} onChange={(e) => setQ(e.target.value)} />
            </label>
            <div className="flex flex-wrap gap-1.5">
              <Badge tone="success" dot>{t('Active')} {users.filter((u) => u.status === 'Active').length}</Badge>
              <Badge tone="warning" dot>{t('Invited')} {users.filter((u) => u.status === 'Invited').length}</Badge>
              <Badge tone="danger" dot>{t('Locked')} {users.filter((u) => u.status === 'Locked').length}</Badge>
            </div>
          </div>
          <DataTable<AppUser>
            rows={shown}
            rowKey={(u) => u.id}
            columns={[
              {
                key: 'name',
                header: t('User'),
                render: (u) => (
                  <div className="flex items-center gap-3">
                    <Avatar name={u.name} size="sm" />
                    <div>
                      <div className="font-medium">{u.name}</div>
                      <div className="text-xs text-zinc-500">{u.email}</div>
                    </div>
                  </div>
                ),
              },
              { key: 'role', header: t('Role'), render: (u) => t(u.role) },
              { key: 'scope', header: t('Scope'), className: 'text-zinc-600', render: (u) => scopeName(u.scope) },
              { key: 'signIn', header: t('Sign-in'), render: (u) => t(u.signIn) },
              { key: 'mfa', header: t('2-step'), render: (u) => <Badge tone={u.mfa === 'Off' ? 'warning' : 'success'}>{t(u.mfa)}</Badge> },
              { key: 'device', header: t('Mobile device'), className: 'text-zinc-600', render: (u) => deviceText(u.device, t) },
              { key: 'last', header: t('Last active'), render: (u) => lastActiveText(u.lastActive, t) },
              { key: 'status', header: t('Status'), render: (u) => <StatusBadge status={u.status} /> },
              {
                key: 'act',
                header: '',
                render: (u) =>
                  u.status === 'Locked' ? (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        userStore.set((all) => all.map((x) => (x.id === u.id ? { ...x, status: 'Active' } : x)));
                        toast(t('{name} unlocked', { name: u.name }));
                      }}
                    >
                      {t('Unlock')}
                    </button>
                  ) : (
                    <button className="btn btn-ghost btn-sm" onClick={() => toast(t('Editing {name}', { name: u.name }), 'info')}>
                      {t('Edit')}
                    </button>
                  ),
              },
            ]}
          />
        </Card>
      )}

      {tab === 'roles' && (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 p-4 text-sm text-zinc-600">
            <p>{t('Roles, permissions and access scopes are maintained in the masters. Click a role to edit it.')}</p>
            <div className="flex gap-2">
              <Link to="/masters/roles" className="btn btn-secondary btn-sm">{t('Role master')}</Link>
              <Link to="/masters/scopes" className="btn btn-secondary btn-sm">{t('Access scope master')}</Link>
            </div>
          </div>
          <DataTable<RoleMaster>
            rows={roles}
            rowKey={(r) => r.code}
            onRowClick={(r) => navigate('/masters/roles', { state: { code: r.code } })}
            columns={[
              { key: 'name', header: t('Role'), render: (r) => <span className="font-medium">{t(r.name)}</span> },
              { key: 'levels', header: t('Allowed scopes'), className: 'text-zinc-600', render: (r) => r.levels.map((l) => t(l)).join(', ') },
              { key: 'limit', header: t('Approval limit'), align: 'right', mono: true, render: approvalLabel },
              { key: 'signIn', header: t('Sign-in'), render: (r) => t(r.signIn) },
              { key: 'users', header: t('Users'), align: 'right', mono: true, render: (r) => num(r.users) },
              { key: 'listed', header: t('In this list'), align: 'right', mono: true, render: (r) => usersWithRole(r.name) },
              { key: 'status', header: t('Status'), render: (r) => <StatusBadge status={r.status} /> },
            ]}
          />
        </Card>
      )}

      <Modal
        open={invite}
        onClose={() => setInvite(false)}
        title={t('Invite a user')}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setInvite(false)}>{t('Cancel')}</button>
            <button className="btn btn-primary" onClick={sendInvite}>{t('Send invitation')}</button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('Full name')} className="sm:col-span-2" error={errors.name}>
            <input className="input" value={newUser.name} onChange={(e) => setNewUser((u) => ({ ...u, name: e.target.value }))} />
          </Field>
          <Field label={t('Role')} error={errors.role}>
            <select className="input" value={newUser.role} onChange={(e) => setNewUser((u) => ({ ...u, role: e.target.value, scope: '' }))}>
              {activeRoles.map((r) => (
                <option key={r.code} value={r.name}>{t(r.name)}</option>
              ))}
            </select>
          </Field>
          <Field
            label={t('Scope')}
            error={errors.scope}
            hint={inviteRole ? t('{levels} scopes only', { levels: inviteRole.levels.map((l) => t(l)).join(' / ') }) : undefined}
          >
            <select className="input" value={scope} onChange={(e) => setNewUser((u) => ({ ...u, scope: e.target.value }))} disabled={!scopes.length}>
              {!scopes.length && <option value="">{t('No scope available')}</option>}
              {(['Company', 'Region', 'Center', 'Route'] as const).map((lvl) => {
                const group = scopes.filter((s) => s.level === lvl);
                return group.length ? (
                  <optgroup key={lvl} label={t(lvl)}>
                    {group.map((s) => (
                      <option key={s.code} value={s.name}>{scopeName(s.name)}</option>
                    ))}
                  </optgroup>
                ) : null;
              })}
            </select>
          </Field>
          <Field
            label={inviteRole?.signIn === 'Mobile OTP' ? t('Mobile number') : t('Email')}
            className="sm:col-span-2"
            error={errors.email}
          >
            <input
              className="input"
              type={inviteRole?.signIn === 'Mobile OTP' ? 'tel' : 'email'}
              inputMode={inviteRole?.signIn === 'Mobile OTP' ? 'tel' : 'email'}
              value={newUser.email}
              onChange={(e) => setNewUser((u) => ({ ...u, email: e.target.value }))}
            />
          </Field>
          {inviteRole && (
            <div className="space-y-2 rounded-lg bg-zinc-50 p-3 text-xs text-zinc-600 sm:col-span-2">
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
              <dt className="font-medium text-zinc-700">{t('Sign-in')}</dt>
              <dd>
                {t(SIGN_IN_TEXT[inviteRole.signIn])}
                {inviteRole.signIn === 'Mobile OTP'
                  ? inviteRole.bindDevice
                    ? ` · ${t('bound to one phone')}`
                    : ''
                  : ` · ${inviteRole.twoStep ? t('2-step on') : t('2-step off')}`}
              </dd>
              <dt className="font-medium text-zinc-700">{t('Approvals')}</dt>
              <dd>{approvalLabel(inviteRole)}</dd>
              </dl>
              <p>
                <Link to="/masters/roles" state={{ code: inviteRole.code }} className="font-medium text-brand-700 hover:underline">
                  {t('Change this role')}
                </Link>
                {' · '}
                <Link to="/masters/scopes" className="font-medium text-brand-700 hover:underline">
                  {t('Manage scopes')}
                </Link>
              </p>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
