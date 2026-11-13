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
import { FileText, MapPin, MessageSquare, Pencil, Phone, Plus } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { DataTable } from '@/components/ui/DataTable';
import { Avatar, KeyValue, Modal } from '@/components/ui/misc';
import { Field } from '@/components/ui/Field';
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
import { useChartColors } from '@/lib/chartTheme';
import { useLang } from '@/i18n/LanguageContext';
import FarmerDisputes from './FarmerDisputes';
import { useDisputes } from '@/data/disputes';

type TabId = 'overview' | 'supply' | 'payments' | 'deductions' | 'compliance' | 'documents' | 'disputes' | 'audit';

const DEDUCTION_TYPES = ['Cattle feed (on credit)', 'Vet drugs', 'Milk can', 'Loan', 'Cash advance'];

export default function FarmerProfile() {
  const { id } = useParams();
  const toast = useToast();
  const { t } = useLang();
  const cc = useChartColors();
  const farmer =farmerById(id) ?? farmers[0];
  const [tab, setTab] = useState<TabId>('overview');
  const [dedOpen, setDedOpen] = useState(false);
  const [deductions, setDeductions] = useState(farmerDeductions);
  const disputeCount = useDisputes().filter((d) => d.farmerId === farmer.id && d.status !== 'Resolved').length;

  const series = useMemo(() => farmerSupplySeries(farmer.avgLitres / 2, farmer.fat, farmer.snf), [farmer]);
  const myDeliveries = deliveries.filter((d) => d.farmerId === farmer.id);
  const recent = myDeliveries.length ? myDeliveries : deliveries.slice(0, 4);
  const outstanding = deductions.reduce((s, d) => s + d.outstanding, 0);

  const chart = (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={cc.grid} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: cc.tick }} tickLine={false} axisLine={false} interval={6} />
        <YAxis yAxisId="l" tick={{ fontSize: 11, fill: cc.tick }} tickLine={false} axisLine={false} width={36} />
        <YAxis yAxisId="q" orientation="right" domain={[3, 9]} tick={{ fontSize: 11, fill: cc.tick }} tickLine={false} axisLine={false} width={30} />
        <Tooltip contentStyle={cc.tooltip} />
        <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" iconSize={8} />
        <Bar yAxisId="l" dataKey="litres" name={t('Litres per shift')} fill={cc.muted} radius={[3, 3, 0, 0]} />
        <Line yAxisId="q" type="monotone" dataKey="fat" name="FAT %" stroke="#D71920" strokeWidth={2} dot={false} />
        <Line yAxisId="q" type="monotone" dataKey="snf" name="SNF %" stroke={cc.ink} strokeWidth={2} dot={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );

  return (
    <>
      <PageHeader
        breadcrumb={[{ label: t('Farmers'), to: '/farmers' }, { label: farmer.id }]}
        title={farmer.name}
        actions={
          <>
            <button className="btn btn-secondary" onClick={() => toast(t('SMS sent to {mobile}', { mobile: farmer.mobile }))}>
              <MessageSquare className="h-4 w-4" /> {t('Send SMS')}
            </button>
            <button className="btn btn-secondary" onClick={() => toast(t('Edit mode opened'), 'info')}>
              <Pencil className="h-4 w-4" /> {t('Edit')}
            </button>
          </>
        }
      />

      <Card className="mb-6">
        <div className="flex flex-col gap-6 p-5 lg:flex-row lg:items-center">
          <div className="flex min-w-0 items-center gap-4 lg:w-[40%]">
            <Avatar name={farmer.name} size="lg" />
            <div className="min-w-0">
              <div className="mb-1.5 flex flex-wrap gap-1.5">
                <Badge tone="brand">{t(farmer.category)}</Badge>
                <StatusBadge status={farmer.status} />
                {farmer.erpVendor ? (
                  <Badge tone="info">{t('ERP vendor {id}', { id: farmer.erpVendor })}</Badge>
                ) : (
                  <Badge tone="warning">{t('Not in ERP yet')}</Badge>
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
                {t('NIC {nic} · supplier since {year}', { nic: farmer.nic, year: farmer.since })}
              </p>
            </div>
          </div>
          <div className="grid flex-1 grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              [t('Avg L / day'), num(farmer.avgLitres, 1)],
              ['FAT / SNF', `${farmer.fat.toFixed(2)} / ${farmer.snf.toFixed(2)}`],
              [t('Reliability'), farmer.reliability ? `${farmer.reliability}%` : '—'],
              [t('Balance due'), lkr(farmer.balance)],
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
              { id: 'overview', label: t('Overview') },
              { id: 'supply', label: t('Supply & quality') },
              { id: 'payments', label: t('Payments') },
              { id: 'deductions', label: t('Deductions & advances'), count: deductions.length },
              { id: 'compliance', label: t('Compliance') },
              { id: 'documents', label: t('Documents') },
              { id: 'disputes', label: t('Disputes & complaints'), count: disputeCount || undefined },
              { id: 'audit', label: t('Audit trail') },
            ]}
          />
        </div>
      </Card>

      {tab === 'overview' && (
        <div className="grid gap-6 xl:grid-cols-3">
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader title={t('Personal details')} />
              <CardBody>
                <KeyValue
                  items={[
                    [t('Full name'), farmer.fullName],
                    [t('Address'), farmer.address],
                    [t('Language'), t(farmer.language)],
                    [t('Bank account'), farmer.bank],
                    [t('Mobile'), farmer.mobile],
                  ]}
                />
              </CardBody>
            </Card>
            <Card>
              <CardHeader title={t('Farm profile & capacity')} />
              <CardBody className="space-y-4">
                <KeyValue
                  items={[
                    [t('Land'), t('{n} acres', { n: farmer.landAcres })],
                    [t('Herd'), t('{cattle} cattle · {milking} milking', { cattle: farmer.totalCattle, milking: farmer.milkingCows })],
                    [t('Breed'), t(farmer.breed)],
                    [t('Capacity'), t('{n} L / day', { n: farmer.capacity })],
                  ]}
                />
                <div>
                  <span className="label mb-1.5 block">{t('Farm location')}</span>
                  <p className="min-h-[64px] whitespace-pre-line rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-800">
                    {farmer.address}
                  </p>
                </div>
              </CardBody>
            </Card>
          </div>
          <div className="flex flex-col gap-6 xl:col-span-2">
            <Card>
              <CardHeader title={t('Supply & quality, last 45 days')} subtitle={t('Litres per shift with FAT and SNF %')} />
              <CardBody className="h-[280px] pl-1">{chart}</CardBody>
            </Card>
            <Card>
              <CardHeader
                title={t('Recent deliveries')}
                actions={
                  <button className="btn btn-ghost btn-sm" onClick={() => setTab('supply')}>
                    {t('Full history')}
                  </button>
                }
              />
              <DataTable
                rows={recent}
                rowKey={(d) => d.id}
                columns={[
                  { key: 'time', header: t('Time'), mono: true, render: (d) => `12 Nov ${d.time}` },
                  { key: 'litres', header: t('Litres'), align: 'right', mono: true, render: (d) => num(d.litres, 1) },
                  { key: 'fat', header: 'FAT', align: 'right', mono: true, render: (d) => d.fat.toFixed(2) },
                  { key: 'snf', header: 'SNF', align: 'right', mono: true, render: (d) => d.snf.toFixed(2) },
                  { key: 'temp', header: '°C', align: 'right', mono: true, render: (d) => d.temp.toFixed(1) },
                  { key: 'result', header: t('Result'), render: (d) => <StatusBadge status={d.result} /> },
                  { key: 'value', header: t('Value'), align: 'right', mono: true, render: (d) => lkr(d.value) },
                ]}
              />
            </Card>
          </div>
        </div>
      )}

      {tab === 'supply' && (
        <Card>
          <CardHeader title={t('Supply & quality history')} subtitle={t('Each bar is one delivery shift')} />
          <CardBody className="h-[380px] pl-1">{chart}</CardBody>
        </Card>
      )}

      {tab === 'payments' && (
        <Card>
          <CardHeader title={t('Payment history')} subtitle={t('Posted to SAP Business One')} />
          <DataTable
            rows={farmerPayments}
            rowKey={(p) => p.period}
            columns={[
              { key: 'period', header: t('Period') },
              { key: 'litres', header: t('Litres'), align: 'right', mono: true, render: (p) => num(p.litres) },
              { key: 'gross', header: t('Gross'), align: 'right', mono: true, render: (p) => lkr(p.gross) },
              { key: 'ded', header: t('Deductions'), align: 'right', mono: true, render: (p) => lkr(-p.deductions) },
              { key: 'net', header: t('Net paid'), align: 'right', mono: true, render: (p) => <strong>{lkr(p.net)}</strong> },
              { key: 'doc', header: t('ERP document'), mono: true, render: (p) => p.erpDoc },
              { key: 'paid', header: t('Paid on'), render: (p) => p.paid },
            ]}
          />
        </Card>
      )}

      {tab === 'deductions' && (
        <Card>
          <CardHeader
            title={t('Deductions & advances')}
            subtitle={t('Outstanding {amount} · recovered from each payment run', { amount: lkr(outstanding) })}
            actions={
              <button className="btn btn-primary btn-sm" onClick={() => setDedOpen(true)}>
                <Plus className="h-3.5 w-3.5" /> {t('Add deduction')}
              </button>
            }
          />
          <DataTable
            rows={deductions}
            rowKey={(d) => d.ref}
            columns={[
              { key: 'type', header: t('Type'), render: (d) => t(d.type) },
              { key: 'ref', header: t('Reference'), mono: true },
              { key: 'total', header: t('Total'), align: 'right', mono: true, render: (d) => lkr(d.total) },
              { key: 'pp', header: t('Per period'), align: 'right', mono: true, render: (d) => lkr(d.perPeriod) },
              { key: 'out', header: t('Outstanding'), align: 'right', mono: true, render: (d) => lkr(d.outstanding) },
              { key: 'status', header: t('Status'), render: (d) => <Badge>{t(d.status)}</Badge> },
            ]}
          />
        </Card>
      )}

      {tab === 'compliance' && (
        <Card>
          <CardHeader title={t('Compliance & food safety')} subtitle={t('Checked at onboarding and every field visit')} />
          <ul className="divide-y divide-zinc-100">
            {farmerCompliance.map((c) => (
              <li key={c.item} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                <div>
                  <p className="text-sm font-medium">{t(c.item)}</p>
                  <p className="text-xs text-zinc-500">{t(c.note)}</p>
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
            title={t('Documents')}
            actions={
              <label className="btn btn-secondary btn-sm cursor-pointer">
                <Plus className="h-3.5 w-3.5" /> {t('Upload')}
                <input
                  type="file"
                  className="sr-only"
                  onChange={(e) => e.target.files?.[0] && toast(t('{name} uploaded', { name: e.target.files[0].name }))}
                />
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
                    {t('{type} · uploaded {date}', { type: t(d.type), date: d.uploaded })}
                  </p>
                </div>
                <StatusBadge status={d.status} />
              </li>
            ))}
          </ul>
        </Card>
      )}

      {tab === 'disputes' && <FarmerDisputes farmerId={farmer.id} />}

      {tab === 'audit' && (
        <Card>
          <CardHeader title={t('Audit trail')} subtitle={t('Every change to this farmer, kept for regulatory audits')} />
          <CardBody>
            <ol className="relative space-y-5 border-l border-zinc-200 pl-6">
              {farmerAudit.map((a) => (
                <li key={a.time} className="relative">
                  <span className="absolute -left-[29px] top-1 h-3 w-3 rounded-full border-2 border-white bg-brand-600" />
                  <p className="num text-xs text-zinc-500">{a.time}</p>
                  <p className="text-sm">{t(a.text)}</p>
                </li>
              ))}
            </ol>
          </CardBody>
        </Card>
      )}

      <Modal
        open={dedOpen}
        onClose={() => setDedOpen(false)}
        title={t('Add deduction or advance')}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setDedOpen(false)}>
              {t('Cancel')}
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                setDeductions((d) => [
                  ...d,
                  { type: 'Cattle feed (on credit)', ref: `FD-26-${1200 + d.length}`, total: 12000, perPeriod: 3000, outstanding: 12000, status: 'Pending' },
                ]);
                setDedOpen(false);
                toast(t('Deduction added and sent for approval'));
              }}
            >
              {t('Save')}
            </button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('Type')} className="sm:col-span-2">
            <select className="input">
              {DEDUCTION_TYPES.map((d) => (
                <option key={d} value={d}>
                  {t(d)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t('Total amount (Rs)')}>
            <input className="input num" defaultValue="12000" inputMode="decimal" />
          </Field>
          <Field label={t('Recover over (periods)')}>
            <input className="input num" defaultValue="4" inputMode="numeric" />
          </Field>
          <Field label={t('Note')} className="sm:col-span-2">
            <textarea className="input" rows={3} placeholder={t('Item, quantity or reason')} />
          </Field>
        </div>
      </Modal>
    </>
  );
}
