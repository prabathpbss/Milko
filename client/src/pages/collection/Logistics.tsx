import { useState } from 'react';
import clsx from 'clsx';
import { CheckCircle2, Circle, CircleDot, Phone, Plus, Thermometer } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import FakeMap from '@/components/ui/FakeMap';
import { Modal, Progress } from '@/components/ui/misc';
import { Field } from '@/components/ui/Field';
import { centers, routes, tankers as seed, type Center, type Tanker } from '@/data/mock';
import { num } from '@/lib/format';
import { useToast } from '@/context/ToastContext';

type TabId = 'tracking' | 'routes' | 'centers';
const tone = (s: Tanker['status']) =>
  s === 'Delayed' ? 'warning' : s === 'At plant' ? 'info' : s === 'Unassigned' ? 'neutral' : 'success';

export default function Logistics() {
  const toast = useToast();
  const [tab, setTab] = useState<TabId>('tracking');
  const [tankers, setTankers] = useState(seed);
  const [selId, setSelId] = useState('TK-14');
  const [assignFor, setAssignFor] = useState<Tanker | null>(null);
  const [driver, setDriver] = useState('K. Perera');
  const sel = tankers.find((t) => t.id === selId)!;

  return (
    <>
      <PageHeader
        breadcrumb={[{ label: 'Collection' }, { label: 'Centers & tankers' }]}
        title="Logistics"
        description="Collection centers, routes, tanker assignment and live tracking."
        actions={
          <>
            <button className="btn btn-secondary" onClick={() => toast('New center form opened', 'info')}>
              <Plus className="h-4 w-4" /> Center
            </button>
            <button className="btn btn-secondary" onClick={() => toast('New route form opened', 'info')}>
              <Plus className="h-4 w-4" /> Route
            </button>
            <button className="btn btn-primary" onClick={() => toast("Tomorrow's tanker plan generated for 31 tankers")}>
              Plan tomorrow
            </button>
          </>
        }
      />

      <Tabs<TabId>
        value={tab}
        onChange={setTab}
        className="mb-6"
        tabs={[
          { id: 'tracking', label: 'Tankers & tracking', count: tankers.length },
          { id: 'routes', label: 'Routes', count: routes.length },
          { id: 'centers', label: 'Collection centers', count: centers.length },
        ]}
      />

      {tab === 'tracking' && (
        <>
          <div className="mb-6 grid gap-6 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <CardHeader
                title="Live map"
                actions={
                  <div className="flex flex-wrap gap-1.5">
                    <Badge tone="success" dot>On time {tankers.filter((t) => t.status === 'On time').length}</Badge>
                    <Badge tone="warning" dot>Delayed {tankers.filter((t) => t.status === 'Delayed').length}</Badge>
                    <Badge tone="info" dot>At plant {tankers.filter((t) => t.status === 'At plant').length}</Badge>
                  </div>
                }
              />
              <CardBody>
                <FakeMap
                  height={380}
                  markers={[
                    ...centers.map((c) => ({ id: c.id, x: c.x, y: c.y, label: c.name.replace(' CC', ''), kind: 'center' as const })),
                    ...tankers
                      .filter((t) => t.status !== 'Unassigned')
                      .map((t) => ({
                        id: t.id,
                        x: t.x,
                        y: t.y,
                        label: `${t.plate} · ${t.route}`,
                        tone: tone(t.status) as 'warning' | 'info' | 'success',
                        active: t.id === selId,
                        onClick: () => setSelId(t.id),
                      })),
                  ]}
                />
              </CardBody>
            </Card>

            <Card>
              <CardHeader
                title={`${sel.plate} · ${sel.route}`}
                subtitle={sel.driver ? `${sel.driver} · ${sel.phone}` : 'No driver assigned'}
                actions={<StatusBadge status={sel.status} />}
              />
              <CardBody className="space-y-5">
                {sel.delayMin && (
                  <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
                    {sel.delayMin} minutes behind schedule. Center supervisor notified.
                  </p>
                )}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-zinc-500">
                    <span>Load</span>
                    <span className="num">{num(sel.loaded)} / {num(sel.capacity)} L</span>
                  </div>
                  <Progress value={sel.loaded} max={sel.capacity} label="Tanker load" />
                  {sel.temp > 0 && (
                    <p className="flex items-center gap-1 text-xs text-zinc-500">
                      <Thermometer className="h-3.5 w-3.5" /> Compartment {sel.temp.toFixed(1)} °C
                    </p>
                  )}
                </div>
                <ol className="space-y-3">
                  {sel.stops.map((s) => (
                    <li key={s.name} className="flex items-start gap-3">
                      {s.status === 'Done' ? (
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      ) : s.status === 'Next' ? (
                        <CircleDot className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                      ) : (
                        <Circle className="mt-0.5 h-4 w-4 shrink-0 text-zinc-300" />
                      )}
                      <div className="flex min-w-0 flex-1 justify-between gap-2 text-sm">
                        <span className={clsx(s.status === 'Next' && 'font-semibold')}>{s.name}</span>
                        <span className="num shrink-0 text-xs text-zinc-500">
                          {s.litres ? `${num(s.litres)} L` : s.eta ? `ETA ${s.eta}` : ''}
                        </span>
                      </div>
                    </li>
                  ))}
                </ol>
                <div className="flex gap-2">
                  {sel.phone && (
                    <span className="btn btn-secondary flex-1 select-all">
                      <Phone className="h-4 w-4" /> {sel.phone}
                    </span>
                  )}
                  <button className="btn btn-secondary flex-1" onClick={() => setAssignFor(sel)}>
                    {sel.driver ? 'Reassign' : 'Assign'}
                  </button>
                </div>
              </CardBody>
            </Card>
          </div>

          <Card>
            <CardHeader title="Tanker assignments · 12 Nov 2026" />
            <DataTable<Tanker>
              rows={tankers}
              rowKey={(t) => t.id}
              selectedKey={selId}
              onRowClick={(t) => setSelId(t.id)}
              columns={[
                { key: 'plate', header: 'Tanker', render: (t) => <span className="num font-medium">{t.plate}</span> },
                { key: 'cap', header: 'Capacity', align: 'right', mono: true, render: (t) => `${num(t.capacity)} L` },
                { key: 'driver', header: 'Driver', render: (t) => t.driver || <span className="text-zinc-500">Not assigned</span> },
                { key: 'route', header: 'Route', mono: true },
                { key: 'stops', header: 'Stops', align: 'right', mono: true, render: (t) => `${t.stops.filter((s) => s.status === 'Done').length} / ${t.stops.length}` },
                { key: 'dep', header: 'Departed', mono: true, render: (t) => t.departed },
                { key: 'eta', header: 'ETA plant', mono: true, render: (t) => t.eta },
                { key: 'load', header: 'Loaded', align: 'right', mono: true, render: (t) => `${num(t.loaded)} L` },
                { key: 'status', header: 'Status', render: (t) => <StatusBadge status={t.status} /> },
                {
                  key: 'act',
                  header: '',
                  render: (t) =>
                    t.status === 'Unassigned' ? (
                      <button className="btn btn-primary btn-sm" onClick={(e) => { e.stopPropagation(); setAssignFor(t); }}>
                        Assign
                      </button>
                    ) : null,
                },
              ]}
            />
          </Card>
        </>
      )}

      {tab === 'routes' && (
        <Card>
          <CardHeader title="Collection routes" subtitle="Each route is a fixed sequence of FMS pickup points ending at a center or plant" />
          <DataTable
            rows={routes}
            rowKey={(r) => r.id}
            columns={[
              { key: 'id', header: 'Route', mono: true },
              { key: 'name', header: 'Name', render: (r) => <span className="font-medium">{r.name}</span> },
              { key: 'center', header: 'Center', render: (r) => centers.find((c) => c.id === r.centerId)?.name },
              { key: 'stops', header: 'Stops', align: 'right', mono: true },
              { key: 'km', header: 'Distance', align: 'right', mono: true, render: (r) => `${r.distanceKm} km` },
              { key: 'farmers', header: 'Farmers', align: 'right', mono: true, render: (r) => num(r.farmers) },
              { key: 'tanker', header: 'Tanker today', mono: true },
            ]}
          />
        </Card>
      )}

      {tab === 'centers' && (
        <Card>
          <CardHeader title="Collection centers" subtitle="146 centers in 9 regions · showing 6" />
          <DataTable<Center>
            rows={centers}
            rowKey={(c) => c.id}
            columns={[
              {
                key: 'name',
                header: 'Center',
                render: (c) => (
                  <div>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-zinc-500">{c.region} · {c.district}</div>
                  </div>
                ),
              },
              { key: 'gps', header: 'GPS', mono: true },
              { key: 'cap', header: 'Capacity', align: 'right', mono: true, render: (c) => `${num(c.capacity)} L` },
              { key: 'ch', header: 'Chillers', align: 'right', mono: true, render: (c) => c.chillers },
              { key: 'hours', header: 'Operating hours' },
              { key: 'fms', header: 'FMS locations', render: (c) => <span className="text-zinc-600">{c.fms.join(', ')}</span> },
              { key: 'sup', header: 'Supervisor', render: (c) => c.supervisor },
              { key: 'farmers', header: 'Farmers', align: 'right', mono: true, render: (c) => num(c.farmers) },
              { key: 'status', header: 'Status', render: (c) => <StatusBadge status={c.status} /> },
            ]}
          />
        </Card>
      )}

      <Modal
        open={!!assignFor}
        onClose={() => setAssignFor(null)}
        title={`Assign driver · ${assignFor?.plate ?? ''}`}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setAssignFor(null)}>Cancel</button>
            <button
              className="btn btn-primary"
              onClick={() => {
                if (!assignFor) return;
                setTankers((ts) =>
                  ts.map((t) =>
                    t.id === assignFor.id
                      ? { ...t, driver, phone: '+94 77 555 0192', status: t.status === 'Unassigned' ? 'On time' : t.status, departed: t.departed === '—' ? '06:10' : t.departed }
                      : t,
                  ),
                );
                setSelId(assignFor.id);
                setAssignFor(null);
                toast(`${driver} assigned to ${assignFor.plate}. Route sent to the driver app.`);
              }}
            >
              Assign
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Driver">
            <select className="input" value={driver} onChange={(e) => setDriver(e.target.value)}>
              <option>K. Perera</option>
              <option>L. Fernando</option>
              <option>N. Gunasekara</option>
            </select>
          </Field>
          <Field label="Route">
            <input className="input" readOnly value={assignFor?.route ?? ''} />
          </Field>
          <p className="text-sm text-zinc-500">The driver gets the route and stops on the tanker driver app.</p>
        </div>
      </Modal>
    </>
  );
}
