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

type TabId = 'users' | 'roles';

const SIGN_IN_TEXT: Record<AppUser['signIn'], string> = {
  SSO: 'Company account (SSO)',
  Password: 'Email and password',
  'Mobile OTP': 'Mobile number + SMS code',
};

export default function UsersRoles() {
  const toast = useToast();
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
    const t = q.trim().toLowerCase();
    return users.filter((u) => !t || [u.name, u.email, u.role, u.scope].some((v) => v.toLowerCase().includes(t)));
  }, [q, users]);

  const openInvite = () => {
    setNewUser({ name: '', email: '', role: firstRole, scope: '' });
    setErrors({});
    setInvite(true);
  };

  const sendInvite = () => {
    const otp = inviteRole?.signIn === 'Mobile OTP';
    const e: Record<string, string> = {};
    if (!newUser.name.trim()) e.name = 'Enter the full name.';
    if (otp ? !/^\+?\d[\d\s]{8,}$/.test(newUser.email.trim()) : !/^\S+@\S+\.\S+$/.test(newUser.email.trim()))
      e.email = otp ? 'Enter a mobile number, e.g. +94 77 123 4567.' : 'Enter a valid email.';
    if (!inviteRole) e.role = 'Pick a role.';
    if (!scope) e.scope = 'No active scope fits this role — add one in the Access scope master.';
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
    toast(otp ? `SMS invitation sent to ${newUser.email.trim()}` : `Invitation sent to ${newUser.email.trim()}`);
  };

  const usersWithRole = (name: string) => users.filter((u) => u.role === name).length;

  return (
    <>
      <PageHeader
        breadcrumb={[{ label: 'Administration' }, { label: 'Users & roles' }]}
        title="Users, roles & permissions"
        description="Who can sign in, what they can see and which approvals they can make."
        actions={
          <>
            <button className="btn btn-secondary" onClick={() => navigate('/masters/roles', { state: { newRole: true } })}>
              <Plus className="h-4 w-4" /> New role
            </button>
            <button className="btn btn-primary" onClick={openInvite}>
              <UserPlus className="h-4 w-4" /> Invite user
            </button>
          </>
        }
      />

      <Tabs<TabId>
        value={tab}
        onChange={setTab}
        className="mb-6"
        tabs={[
          { id: 'users', label: 'Users', count: users.length },
          { id: 'roles', label: 'Roles', count: roles.length },
        ]}
      />

      {tab === 'users' && (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 p-4">
            <label className="relative w-full sm:w-80">
              <span className="sr-only">Search users</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input className="input pl-9" placeholder="Name, email, role or scope" value={q} onChange={(e) => setQ(e.target.value)} />
            </label>
            <div className="flex flex-wrap gap-1.5">
              <Badge tone="success" dot>Active {users.filter((u) => u.status === 'Active').length}</Badge>
              <Badge tone="warning" dot>Invited {users.filter((u) => u.status === 'Invited').length}</Badge>
              <Badge tone="danger" dot>Locked {users.filter((u) => u.status === 'Locked').length}</Badge>
            </div>
          </div>
          <DataTable<AppUser>
            rows={shown}
            rowKey={(u) => u.id}
            columns={[
              {
                key: 'name',
                header: 'User',
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
              { key: 'role', header: 'Role' },
              { key: 'scope', header: 'Scope', className: 'text-zinc-600' },
              { key: 'signIn', header: 'Sign-in' },
              { key: 'mfa', header: '2-step', render: (u) => <Badge tone={u.mfa === 'Off' ? 'warning' : 'success'}>{u.mfa}</Badge> },
              { key: 'device', header: 'Mobile device', className: 'text-zinc-600' },
              { key: 'last', header: 'Last active', render: (u) => u.lastActive },
              { key: 'status', header: 'Status', render: (u) => <StatusBadge status={u.status} /> },
              {
                key: 'act',
                header: '',
                render: (u) =>
                  u.status === 'Locked' ? (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        userStore.set((all) => all.map((x) => (x.id === u.id ? { ...x, status: 'Active' } : x)));
                        toast(`${u.name} unlocked`);
                      }}
                    >
                      Unlock
                    </button>
                  ) : (
                    <button className="btn btn-ghost btn-sm" onClick={() => toast(`Editing ${u.name}`, 'info')}>
                      Edit
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
            <p>Roles, permissions and access scopes are maintained in the masters. Click a role to edit it.</p>
            <div className="flex gap-2">
              <Link to="/masters/roles" className="btn btn-secondary btn-sm">Role master</Link>
              <Link to="/masters/scopes" className="btn btn-secondary btn-sm">Access scope master</Link>
            </div>
          </div>
          <DataTable<RoleMaster>
            rows={roles}
            rowKey={(r) => r.code}
            onRowClick={(r) => navigate('/masters/roles', { state: { code: r.code } })}
            columns={[
              { key: 'name', header: 'Role', render: (r) => <span className="font-medium">{r.name}</span> },
              { key: 'levels', header: 'Allowed scopes', className: 'text-zinc-600', render: (r) => r.levels.join(', ') },
              { key: 'limit', header: 'Approval limit', align: 'right', mono: true, render: approvalText },
              { key: 'signIn', header: 'Sign-in', render: (r) => r.signIn },
              { key: 'users', header: 'Users', align: 'right', mono: true, render: (r) => num(r.users) },
              { key: 'listed', header: 'In this list', align: 'right', mono: true, render: (r) => usersWithRole(r.name) },
              { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
            ]}
          />
        </Card>
      )}

      <Modal
        open={invite}
        onClose={() => setInvite(false)}
        title="Invite a user"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setInvite(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={sendInvite}>Send invitation</button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" className="sm:col-span-2" error={errors.name}>
            <input className="input" value={newUser.name} onChange={(e) => setNewUser((u) => ({ ...u, name: e.target.value }))} />
          </Field>
          <Field label="Role" error={errors.role}>
            <select className="input" value={newUser.role} onChange={(e) => setNewUser((u) => ({ ...u, role: e.target.value, scope: '' }))}>
              {activeRoles.map((r) => (
                <option key={r.code}>{r.name}</option>
              ))}
            </select>
          </Field>
          <Field
            label="Scope"
            error={errors.scope}
            hint={inviteRole ? `${inviteRole.levels.join(' / ')} scopes only` : undefined}
          >
            <select className="input" value={scope} onChange={(e) => setNewUser((u) => ({ ...u, scope: e.target.value }))} disabled={!scopes.length}>
              {!scopes.length && <option value="">No scope available</option>}
              {(['Company', 'Region', 'Center', 'Route'] as const).map((lvl) => {
                const group = scopes.filter((s) => s.level === lvl);
                return group.length ? (
                  <optgroup key={lvl} label={lvl}>
                    {group.map((s) => (
                      <option key={s.code} value={s.name}>{s.name}</option>
                    ))}
                  </optgroup>
                ) : null;
              })}
            </select>
          </Field>
          <Field
            label={inviteRole?.signIn === 'Mobile OTP' ? 'Mobile number' : 'Email'}
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
              <dt className="font-medium text-zinc-700">Sign-in</dt>
              <dd>
                {SIGN_IN_TEXT[inviteRole.signIn]}
                {inviteRole.signIn === 'Mobile OTP' ? (inviteRole.bindDevice ? ' · bound to one phone' : '') : inviteRole.twoStep ? ' · 2-step on' : ' · 2-step off'}
              </dd>
              <dt className="font-medium text-zinc-700">Approvals</dt>
              <dd>{approvalText(inviteRole)}</dd>
              </dl>
              <p>
                <Link to="/masters/roles" state={{ code: inviteRole.code }} className="font-medium text-brand-700 hover:underline">
                  Change this role
                </Link>
                {' · '}
                <Link to="/masters/scopes" className="font-medium text-brand-700 hover:underline">
                  Manage scopes
                </Link>
              </p>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
