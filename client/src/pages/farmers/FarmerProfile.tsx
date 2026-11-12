import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { FileText, MapPin, MessageSquare, Pencil, Phone, Plus, ShieldAlert } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { DataTable } from '@/components/ui/DataTable';
import { Avatar, KeyValue, Modal } from '@/components/ui/misc';
import { Field } from '@/components/ui/Field';
import FakeMap from '@/components/ui/FakeMap';
import {
  deliveries,
  farmerAudit,
  farmerById,
  farmerCompliance,
  farmerDeductions,
  farmerDocuments,
  farmerPayments,
  farmers,
  farmerSupplySeries,
} from '@/data/mock';
import { lkr, num } from '@/lib/format';
import { useToast } from '@/context/ToastContext';

type TabId = 'overview' | 'supply' | 'payments' | 'deductions' | 'compliance' | 'documents' | 'audit';

export default function FarmerProfile() {
  const { id } = useParams();
  const toast = useToast();
  const farmer = farmerById(id) ?? farmers[0];
  const [tab, setTab] = useState<TabId>('overview');
  const [dedOpen, setDedOpen] = useState(false);
  const [deductions, setDeductions] = useState(farmerDeductions);

  const series = useMemo(() => farmerSupplySeries(farmer.avgLitres / 2, farmer.fat, farmer.snf), [farmer]);
  const myDeliveries = deliveries.filter((d) => d.farmerId === farmer.id);
  const recent = myDeliveries.length ? myDeliveries : deliveries.slice(0, 4);
  const outstanding = deductions.reduce((s, d) => s + d.outstanding, 0);

  const chart = (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="#E4E4E7" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#71717A' }} tickLine={false} axisLine={false} interval={6} />
        <YAxis yAxisId="l" tick={{ fontSize: 11, fill: '#71717A' }} tickLine={false} axisLine={false} width={36} />
        <YAxis yAxisId="q" orientation="right" domain={[3, 9]} tick={{ fontSize: 11, fill: '#71717A' }} tickLine={false} axisLine={false} width={30} />
        <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E4E4E7', fontSize: 12 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" iconSize={8} />
        <Bar yAxisId="l" dataKey="litres" name="Litres per shift" fill="#D4D4D8" radius={[3, 3, 0, 0]} />
        <Line yAxisId="q" type="monotone" dataKey="fat" name="FAT %" stroke="#D71920" strokeWidth={2} dot={false} />
        <Line yAxisId="q" type="monotone" dataKey="snf" name="SNF %" stroke="#18181B" strokeWidth={2} dot={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );

  return (
    <>
      <PageHeader
        breadcrumb={[{ label: 'Farmers', to: '/farmers' }, { label: farmer.id }]}
        title={farmer.name}
        actions={
          <>
            <button className="btn btn-secondary" onClick={() => toast(`SMS sent to ${farmer.mobile}`)}>
              <MessageSquare className="h-4 w-4" /> Send SMS
            </button>
            <button className="btn btn-secondary" onClick={() => toast('Edit mode opened', 'info')}>
              <Pencil className="h-4 w-4" /> Edit
            </button>
            <Link to="/quality" className="btn btn-primary">
              <ShieldAlert className="h-4 w-4" /> Log dispute
            </Link>
          </>
        }
      />

      <Card className="mb-6">
        <div className="flex flex-col gap-6 p-5 lg:flex-row lg:items-center">
          <div className="flex min-w-0 items-center gap-4 lg:w-[40%]">
            <Avatar name={farmer.name} size="lg" />
            <div className="min-w-0">
              <div className="mb-1.5 flex flex-wrap gap-1.5">
                <Badge tone="brand">{farmer.category}</Badge>
                <StatusBadge status={farmer.status} />
                {farmer.erpVendor ? (
                  <Badge tone="info">ERP vendor {farmer.erpVendor}</Badge>
                ) : (
                  <Badge tone="warning">Not in ERP yet</Badge>
                )}
              </div>
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-500">
                <span className="inline-flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" /> {farmer.mobile}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {farmer.center} · {farmer.route}
                </span>
              </p>
              <p className="mt-0.5 text-sm text-zinc-500">
                NIC {farmer.nic} · supplier since {farmer.since}
              </p>
            </div>
          </div>
          <div className="grid flex-1 grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              ['Avg L / day', num(farmer.avgLitres, 1)],
              ['FAT / SNF', `${farmer.fat.toFixed(2)} / ${farmer.snf.toFixed(2)}`],
              ['Reliability', farmer.reliability ? `${farmer.reliability}%` : '—'],
              ['Balance due', lkr(farmer.balance)],
            ].map(([k, v]) => (
              <div key={k} className="rounded-lg bg-zinc-50 p-3">
                <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">{k}</div>
                <div className="num mt-1 text-lg font-semibold">{v}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="px-5">
          <Tabs<TabId>
            value={tab}
            onChange={setTab}
            className="border-b-0"
            tabs={[
              { id: 'overview', label: 'Overview' },
              { id: 'supply', label: 'Supply & quality' },
              { id: 'payments', label: 'Payments' },
              { id: 'deductions', label: 'Deductions & advances', count: deductions.length },
              { id: 'compliance', label: 'Compliance' },
              { id: 'documents', label: 'Documents' },
              { id: 'audit', label: 'Audit trail' },
            ]}
          />
        </div>
      </Card>

      {tab === 'overview' && (
        <div className="grid gap-6 xl:grid-cols-3">
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader title="Personal details" />
              <CardBody>
                <KeyValue
                  items={[
                    ['Full name', farmer.fullName],
                    ['Address', farmer.address],
                    ['Language', farmer.language],
                    ['Bank account', farmer.bank],
                    ['Mobile', farmer.mobile],
                  ]}
                />
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="Farm profile & capacity" />
              <CardBody className="space-y-4">
                <KeyValue
                  items={[
                    ['GPS', farmer.gps],
                    ['Land', `${farmer.landAcres} acres`],
                    ['Herd', `${farmer.totalCattle} cattle · ${farmer.milkingCows} milking`],
                    ['Breed', farmer.breed],
                    ['Capacity', `${farmer.capacity} L / day`],
                  ]}
                />
                <FakeMap height={150} caption="Farm location" markers={[{ id: 'f', x: 50, y: 45, label: farmer.name, kind: 'center' }]} />
              </CardBody>
            </Card>
          </div>
          <div className="flex flex-col gap-6 xl:col-span-2">
            <Card>
              <CardHeader title="Supply & quality, last 45 days" subtitle="Litres per shift with FAT and SNF %" />
              <CardBody className="h-[280px] pl-1">{chart}</CardBody>
            </Card>
            <Card>
              <CardHeader
                title="Recent deliveries"
                actions={
                  <button className="btn btn-ghost btn-sm" onClick={() => setTab('supply')}>
                    Full history
                  </button>
                }
              />
              <DataTable
                rows={recent}
                rowKey={(d) => d.id}
                columns={[
                  { key: 'time', header: 'Time', mono: true, render: (d) => `12 Nov ${d.time}` },
                  { key: 'litres', header: 'Litres', align: 'right', mono: true, render: (d) => num(d.litres, 1) },
                  { key: 'fat', header: 'FAT', align: 'right', mono: true, render: (d) => d.fat.toFixed(2) },
                  { key: 'snf', header: 'SNF', align: 'right', mono: true, render: (d) => d.snf.toFixed(2) },
                  { key: 'temp', header: '°C', align: 'right', mono: true, render: (d) => d.temp.toFixed(1) },
                  { key: 'result', header: 'Result', render: (d) => <StatusBadge status={d.result} /> },
                  { key: 'value', header: 'Value', align: 'right', mono: true, render: (d) => lkr(d.value) },
                ]}
              />
            </Card>
          </div>
        </div>
      )}

      {tab === 'supply' && (
        <Card>
          <CardHeader title="Supply & quality history" subtitle="Each bar is one delivery shift" />
          <CardBody className="h-[380px] pl-1">{chart}</CardBody>
        </Card>
      )}

      {tab === 'payments' && (
        <Card>
          <CardHeader title="Payment history" subtitle="Posted to SAP Business One" />
          <DataTable
            rows={farmerPayments}
            rowKey={(p) => p.period}
            columns={[
              { key: 'period', header: 'Period' },
              { key: 'litres', header: 'Litres', align: 'right', mono: true, render: (p) => num(p.litres) },
              { key: 'gross', header: 'Gross', align: 'right', mono: true, render: (p) => lkr(p.gross) },
              { key: 'ded', header: 'Deductions', align: 'right', mono: true, render: (p) => lkr(-p.deductions) },
              { key: 'net', header: 'Net paid', align: 'right', mono: true, render: (p) => <strong>{lkr(p.net)}</strong> },
              { key: 'doc', header: 'ERP document', mono: true, render: (p) => p.erpDoc },
              { key: 'paid', header: 'Paid on', render: (p) => p.paid },
            ]}
          />
        </Card>
      )}

      {tab === 'deductions' && (
        <Card>
          <CardHeader
            title="Deductions & advances"
            subtitle={`Outstanding ${lkr(outstanding)} · recovered from each payment run`}
            actions={
              <button className="btn btn-primary btn-sm" onClick={() => setDedOpen(true)}>
                <Plus className="h-3.5 w-3.5" /> Add deduction
              </button>
            }
          />
          <DataTable
            rows={deductions}
            rowKey={(d) => d.ref}
            columns={[
              { key: 'type', header: 'Type' },
              { key: 'ref', header: 'Reference', mono: true },
              { key: 'total', header: 'Total', align: 'right', mono: true, render: (d) => lkr(d.total) },
              { key: 'pp', header: 'Per period', align: 'right', mono: true, render: (d) => lkr(d.perPeriod) },
              { key: 'out', header: 'Outstanding', align: 'right', mono: true, render: (d) => lkr(d.outstanding) },
              { key: 'status', header: 'Status', render: (d) => <Badge>{d.status}</Badge> },
            ]}
          />
        </Card>
      )}

      {tab === 'compliance' && (
        <Card>
          <CardHeader title="Compliance & food safety" subtitle="Checked at onboarding and every field visit" />
          <ul className="divide-y divide-zinc-100">
            {farmerCompliance.map((c) => (
              <li key={c.item} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                <div>
                  <p className="text-sm font-medium">{c.item}</p>
                  <p className="text-xs text-zinc-500">{c.note}</p>
                </div>
                <StatusBadge status={c.status} />
              </li>
            ))}
          </ul>
        </Card>
      )}

      {tab === 'documents' && (
        <Card>
          <CardHeader
            title="Documents"
            actions={
              <label className="btn btn-secondary btn-sm cursor-pointer">
                <Plus className="h-3.5 w-3.5" /> Upload
                <input type="file" className="sr-only" onChange={(e) => e.target.files?.[0] && toast(`${e.target.files[0].name} uploaded`)} />
              </label>
            }
          />
          <ul className="divide-y divide-zinc-100">
            {farmerDocuments.map((d) => (
              <li key={d.name} className="flex flex-wrap items-center gap-3 px-5 py-3">
                <FileText className="h-5 w-5 text-zinc-400" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{d.name}</p>
                  <p className="text-xs text-zinc-500">
                    {d.type} · uploaded {d.uploaded}
                  </p>
                </div>
                <StatusBadge status={d.status} />
              </li>
            ))}
          </ul>
        </Card>
      )}

      {tab === 'audit' && (
        <Card>
          <CardHeader title="Audit trail" subtitle="Every change to this farmer, kept for regulatory audits" />
          <CardBody>
            <ol className="relative space-y-5 border-l border-zinc-200 pl-6">
              {farmerAudit.map((a) => (
                <li key={a.time} className="relative">
                  <span className="absolute -left-[29px] top-1 h-3 w-3 rounded-full border-2 border-white bg-brand-600" />
                  <p className="num text-xs text-zinc-500">{a.time}</p>
                  <p className="text-sm">{a.text}</p>
                </li>
              ))}
            </ol>
          </CardBody>
        </Card>
      )}

      <Modal
        open={dedOpen}
        onClose={() => setDedOpen(false)}
        title="Add deduction or advance"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setDedOpen(false)}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                setDeductions((d) => [
                  ...d,
                  { type: 'Cattle feed (on credit)', ref: `FD-26-${1200 + d.length}`, total: 12000, perPeriod: 3000, outstanding: 12000, status: 'Pending' },
                ]);
                setDedOpen(false);
                toast('Deduction added and sent for approval');
              }}
            >
              Save
            </button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Type" className="sm:col-span-2">
            <select className="input">
              <option>Cattle feed (on credit)</option>
              <option>Vet drugs</option>
              <option>Milk can</option>
              <option>Loan</option>
              <option>Cash advance</option>
            </select>
          </Field>
          <Field label="Total amount (Rs)">
            <input className="input num" defaultValue="12000" inputMode="decimal" />
          </Field>
          <Field label="Recover over (periods)">
            <input className="input num" defaultValue="4" inputMode="numeric" />
          </Field>
          <Field label="Note" className="sm:col-span-2">
            <textarea className="input" rows={3} placeholder="Item, quantity or reason" />
          </Field>
        </div>
      </Modal>
    </>
  );
}
