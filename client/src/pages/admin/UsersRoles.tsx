import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { Plus, Search, UserPlus } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { Field } from '@/components/ui/Field';
import { Avatar, Modal } from '@/components/ui/misc';
import { centers, permissionActions, permissionModules, roles as seedRoles, users as seedUsers, type AppUser } from '@/data/mock';
import { useToast } from '@/context/ToastContext';

type TabId = 'users' | 'roles';

export default function UsersRoles() {
  const toast = useToast();
  const [tab, setTab] = useState<TabId>('users');
  const [users, setUsers] = useState(seedUsers);
  const [roles, setRoles] = useState(seedRoles);
  const [q, setQ] = useState('');
  const [roleName, setRoleName] = useState('Regional manager');
  const [invite, setInvite] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'Field officer', scope: 'Hingurakgoda CC' });

  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    return users.filter((u) => !t || [u.name, u.email, u.role, u.scope].some((v) => v.toLowerCase().includes(t)));
  }, [q, users]);

  const role = roles.find((r) => r.name === roleName)!;

  const togglePerm = (m: string, a: string) =>
    setRoles((rs) =>
      rs.map((r) => (r.name === roleName ? { ...r, perms: { ...r.perms, [m]: { ...r.perms[m], [a]: !r.perms[m][a] } } } : r)),
    );

  const sendInvite = () => {
    if (!newUser.name.trim() || !newUser.email.includes('@')) return toast('Enter a name and a valid email.', 'error');
    setUsers((u) => [
      ...u,
      { id: `U-${100 + u.length}`, ...newUser, signIn: 'Password', mfa: 'Off', device: '—', lastActive: '—', status: 'Invited' },
    ]);
    setInvite(false);
    setNewUser({ name: '', email: '', role: 'Field officer', scope: 'Hingurakgoda CC' });
    toast(`Invitation sent to ${newUser.email}`);
  };

  return (
    <>
      <PageHeader
        breadcrumb={[{ label: 'Administration' }, { label: 'Users & roles' }]}
        title="Users, roles & permissions"
        description="Who can sign in, what they can see and which approvals they can make."
        actions={
          <>
            <button className="btn btn-secondary" onClick={() => toast('New role created', 'info')}>
              <Plus className="h-4 w-4" /> New role
            </button>
            <button className="btn btn-primary" onClick={() => setInvite(true)}>
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
          { id: 'roles', label: 'Roles & permissions', count: roles.length },
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
                        setUsers((all) => all.map((x) => (x.id === u.id ? { ...x, status: 'Active' } : x)));
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
        <div className="grid gap-6 xl:grid-cols-4">
          <Card className="h-fit">
            <ul className="p-2">
              {roles.map((r) => (
                <li key={r.name}>
                  <button
                    type="button"
                    onClick={() => setRoleName(r.name)}
                    className={clsx(
                      'flex min-h-[44px] w-full items-center justify-between rounded-lg px-3 text-left text-sm transition-colors',
                      r.name === roleName ? 'bg-brand-50 font-medium text-brand-700' : 'text-zinc-700 hover:bg-zinc-100',
                    )}
                  >
                    {r.name}
                    <span className="num text-xs text-zinc-500">{r.users}</span>
                  </button>
                </li>
              ))}
            </ul>
          </Card>
          <Card className="xl:col-span-3">
            <CardHeader
              title={role.name}
              subtitle={`Data scope: ${role.scope} · approval limit ${role.limit}`}
              actions={
                <button className="btn btn-primary btn-sm" onClick={() => toast(`${role.name} permissions saved`)}>
                  Save role
                </button>
              }
            />
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50/80">
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Module</th>
                    {permissionActions.map((a) => (
                      <th key={a} className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        {a}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {permissionModules.map((m) => (
                    <tr key={m} className="hover:bg-zinc-50">
                      <td className="whitespace-nowrap px-4 py-2.5 font-medium">{m}</td>
                      {permissionActions.map((a) => (
                        <td key={a} className="px-3 py-2.5 text-center">
                          <input
                            type="checkbox"
                            className="h-4 w-4 accent-brand-600"
                            aria-label={`${m}: ${a}`}
                            checked={role.perms[m][a]}
                            onChange={() => togglePerm(m, a)}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <CardBody className="border-t border-zinc-100 text-xs text-zinc-500">
              Field officers and tanker drivers sign in with a mobile number and SMS code, and each phone is bound to one user.
            </CardBody>
          </Card>
        </div>
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
          <Field label="Full name" className="sm:col-span-2">
            <input className="input" value={newUser.name} onChange={(e) => setNewUser((u) => ({ ...u, name: e.target.value }))} />
          </Field>
          <Field label="Email" className="sm:col-span-2">
            <input className="input" type="email" value={newUser.email} onChange={(e) => setNewUser((u) => ({ ...u, email: e.target.value }))} />
          </Field>
          <Field label="Role">
            <select className="input" value={newUser.role} onChange={(e) => setNewUser((u) => ({ ...u, role: e.target.value }))}>
              {roles.map((r) => <option key={r.name}>{r.name}</option>)}
            </select>
          </Field>
          <Field label="Scope">
            <select className="input" value={newUser.scope} onChange={(e) => setNewUser((u) => ({ ...u, scope: e.target.value }))}>
              <option>All regions</option>
              {centers.map((c) => <option key={c.id}>{c.name}</option>)}
            </select>
          </Field>
        </div>
      </Modal>
    </>
  );
}
