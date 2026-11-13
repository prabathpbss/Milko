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
import { useLang } from '@/i18n/LanguageContext';

type TabId = 'tracking' | 'routes' | 'centers';
const tone = (s: Tanker['status']) =>
  s === 'Delayed' ? 'warning' : s === 'At plant' ? 'info' : s === 'Unassigned' ? 'neutral' : 'success';

export default function Logistics() {
  const toast = useToast();
  const { t } = useLang();
  const [tab, setTab] = useState<TabId>('tracking');
  const [tankers, setTankers] = useState(seed);
  const [selId, setSelId] = useState('TK-14');
  const [assignFor, setAssignFor] = useState<Tanker | null>(null);
  const [driver, setDriver] = useState('K. Perera');
  const sel = tankers.find((tk) => tk.id === selId)!;

  return (
    <>
      <PageHeader
        breadcrumb={[{ label: t('Collection') }, { label: t('Centers & tankers') }]}
        title={t('Logistics')}
        description={t('Collection centers, routes, tanker assignment and live tracking.')}
        actions={
          <>
            <button className="btn btn-secondary" onClick={() => toast(t('New center form opened'), 'info')}>
              <Plus className="h-4 w-4" /> {t('Center')}
            </button>
            <button className="btn btn-secondary" onClick={() => toast(t('New route form opened'), 'info')}>
              <Plus className="h-4 w-4" /> {t('Route')}
            </button>
            <button className="btn btn-primary" onClick={() => toast(t("Tomorrow's tanker plan generated for {n} tankers", { n: 31 }))}>
              {t('Plan tomorrow')}
            </button>
          </>
        }
      />

      <Tabs<TabId>
        value={tab}
        onChange={setTab}
        className="mb-6"
        tabs={[
          { id: 'tracking', label: t('Tankers & tracking'), count: tankers.length },
          { id: 'routes', label: t('Routes'), count: routes.length },
          { id: 'centers', label: t('Collection centers'), count: centers.length },
        ]}
      />

      {tab === 'tracking' && (
        <>
          <div className="mb-6 grid gap-6 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <CardHeader
                title={t('Live map')}
                actions={
                  <div className="flex flex-wrap gap-1.5">
                    <Badge tone="success" dot>{t('On time')} {tankers.filter((tk) => tk.status === 'On time').length}</Badge>
                    <Badge tone="warning" dot>{t('Delayed')} {tankers.filter((tk) => tk.status === 'Delayed').length}</Badge>
                    <Badge tone="info" dot>{t('At plant')} {tankers.filter((tk) => tk.status === 'At plant').length}</Badge>
                  </div>
                }
              />
              <CardBody>
                <FakeMap
                  height={380}
                  markers={[
                    ...centers.map((c) => ({ id: c.id, x: c.x, y: c.y, label: c.name.replace(' CC', ''), kind: 'center' as const })),
                    ...tankers
                      .filter((tk) => tk.status !== 'Unassigned')
                      .map((tk) => ({
                        id: tk.id,
                        x: tk.x,
                        y: tk.y,
                        label: `${tk.plate} · ${tk.route}`,
                        tone: tone(tk.status) as 'warning' | 'info' | 'success',
                        active: tk.id === selId,
                        onClick: () => setSelId(tk.id),
                      })),
                  ]}
                />
              </CardBody>
            </Card>

            <Card>
              <CardHeader
                title={`${sel.plate} · ${sel.route}`}
                subtitle={sel.driver ? `${sel.driver} · ${sel.phone}` : t('No driver assigned')}
                actions={<StatusBadge status={sel.status} />}
              />
              <CardBody className="space-y-5">
                {sel.delayMin && (
                  <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
                    {t('{n} minutes behind schedule. Center supervisor notified.', { n: sel.delayMin })}
                  </p>
                )}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-zinc-500">
                    <span>{t('Load')}</span>
                    <span className="num">{num(sel.loaded)} / {num(sel.capacity)} L</span>
                  </div>
                  <Progress value={sel.loaded} max={sel.capacity} label={t('Tanker load')} />
                  {sel.temp > 0 && (
                    <p className="flex items-center gap-1 text-xs text-zinc-500">
                      <Thermometer className="h-3.5 w-3.5" /> {t('Compartment {temp} °C', { temp: sel.temp.toFixed(1) })}
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
                          {s.litres ? `${num(s.litres)} L` : s.eta ? t('ETA {time}', { time: s.eta }) : ''}
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
                    {sel.driver ? t('Reassign') : t('Assign')}
                  </button>
                </div>
              </CardBody>
            </Card>
          </div>

          <Card>
            <CardHeader title={t('Tanker assignments · {date}', { date: '12 Nov 2026' })} />
            <DataTable<Tanker>
              rows={tankers}
              rowKey={(tk) => tk.id}
              selectedKey={selId}
              onRowClick={(tk) => setSelId(tk.id)}
              columns={[
                { key: 'plate', header: t('Tanker'), render: (tk) => <span className="num font-medium">{tk.plate}</span> },
                { key: 'cap', header: t('Capacity'), align: 'right', mono: true, render: (tk) => `${num(tk.capacity)} L` },
                { key: 'driver', header: t('Driver'), render: (tk) => tk.driver || <span className="text-zinc-500">{t('Not assigned')}</span> },
                { key: 'route', header: t('Route'), mono: true },
                { key: 'stops', header: t('Stops'), align: 'right', mono: true, render: (tk) => `${tk.stops.filter((s) => s.status === 'Done').length} / ${tk.stops.length}` },
                { key: 'dep', header: t('Departed'), mono: true, render: (tk) => tk.departed },
                { key: 'eta', header: t('ETA plant'), mono: true, render: (tk) => (tk.eta === 'Arrived' ? t('Arrived') : tk.eta) },
                { key: 'load', header: t('Loaded'), align: 'right', mono: true, render: (tk) => `${num(tk.loaded)} L` },
                { key: 'status', header: t('Status'), render: (tk) => <StatusBadge status={tk.status} /> },
                {
                  key: 'act',
                  header: '',
                  render: (tk) =>
                    tk.status === 'Unassigned' ? (
                      <button className="btn btn-primary btn-sm" onClick={(e) => { e.stopPropagation(); setAssignFor(tk); }}>
                        {t('Assign')}
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
          <CardHeader title={t('Collection routes')} subtitle={t('Each route is a fixed sequence of FMS pickup points ending at a center or plant')} />
          <DataTable
            rows={routes}
            rowKey={(r) => r.id}
            columns={[
              { key: 'id', header: t('Route'), mono: true },
              { key: 'name', header: t('Name'), render: (r) => <span className="font-medium">{r.name}</span> },
              { key: 'center', header: t('Center'), render: (r) => centers.find((c) => c.id === r.centerId)?.name },
              { key: 'stops', header: t('Stops'), align: 'right', mono: true },
              { key: 'km', header: t('Distance'), align: 'right', mono: true, render: (r) => `${r.distanceKm} km` },
              { key: 'farmers', header: t('Farmers'), align: 'right', mono: true, render: (r) => num(r.farmers) },
              { key: 'tanker', header: t('Tanker today'), mono: true },
            ]}
          />
        </Card>
      )}

      {tab === 'centers' && (
        <Card>
          <CardHeader title={t('Collection centers')} subtitle={t('{total} centers in {regions} regions · showing {n}', { total: 146, regions: 9, n: centers.length })} />
          <DataTable<Center>
            rows={centers}
            rowKey={(c) => c.id}
            columns={[
              {
                key: 'name',
                header: t('Center'),
                render: (c) => (
                  <div>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-zinc-500">{c.region} · {c.district}</div>
                  </div>
                ),
              },
              { key: 'gps', header: 'GPS', mono: true },
              { key: 'cap', header: t('Capacity'), align: 'right', mono: true, render: (c) => `${num(c.capacity)} L` },
              { key: 'ch', header: t('Chillers'), align: 'right', mono: true, render: (c) => c.chillers },
              { key: 'hours', header: t('Operating hours') },
              { key: 'fms', header: t('FMS locations'), render: (c) => <span className="text-zinc-600">{c.fms.join(', ')}</span> },
              { key: 'sup', header: t('Supervisor'), render: (c) => c.supervisor },
              { key: 'farmers', header: t('Farmers'), align: 'right', mono: true, render: (c) => num(c.farmers) },
              { key: 'status', header: t('Status'), render: (c) => <StatusBadge status={c.status} /> },
            ]}
          />
        </Card>
      )}

      <Modal
        open={!!assignFor}
        onClose={() => setAssignFor(null)}
        title={t('Assign driver · {plate}', { plate: assignFor?.plate ?? '' })}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setAssignFor(null)}>{t('Cancel')}</button>
            <button
              className="btn btn-primary"
              onClick={() => {
                if (!assignFor) return;
                setTankers((ts) =>
                  ts.map((tk) =>
                    tk.id === assignFor.id
                      ? { ...tk, driver, phone: '+94 77 555 0192', status: tk.status === 'Unassigned' ? 'On time' : tk.status, departed: tk.departed === '—' ? '06:10' : tk.departed }
                      : tk,
                  ),
                );
                setSelId(assignFor.id);
                setAssignFor(null);
                toast(t('{driver} assigned to {plate}. Route sent to the driver (SMS + Tanker driver form).', { driver, plate: assignFor.plate }));
              }}
            >
              {t('Assign')}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label={t('Driver')}>
            <select className="input" value={driver} onChange={(e) => setDriver(e.target.value)}>
              <option>K. Perera</option>
              <option>L. Fernando</option>
              <option>N. Gunasekara</option>
            </select>
          </Field>
          <Field label={t('Route')}>
            <input className="input" readOnly value={assignFor?.route ?? ''} />
          </Field>
          <p className="text-sm text-zinc-500">{t('The driver gets an SMS and sees the route and stops in the Tanker driver form on their phone.')}</p>
        </div>
      </Modal>
    </>
  );
}
