import { useMemo, useState } from 'react';
import clsx from 'clsx';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';
import { CalendarClock, Download, FileSpreadsheet, FileText } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { centers, farmers, type Farmer } from '@/data/mock';
import { useCategoryNames, useRegionNames } from '@/data/masters';
import { num } from '@/lib/format';
import { useToast } from '@/context/ToastContext';
import { useChartColors } from '@/lib/chartTheme';

const catalog = [
  { group: 'Farmers', items: ['Farmer performance scorecard', 'Supplier reliability', 'Contract expiry', 'Compliance status'] },
  { group: 'Collection', items: ['Milk volume by center', 'Quality summary (FAT / SNF)', 'Rejections & exceptions', 'Route & tanker efficiency'] },
  { group: 'Finance', items: ['Payment summary by period', 'Deductions & advances ledger', 'Incentive payouts'] },
  { group: 'Audit', items: ['Audit trail export', 'ERP posting reconciliation'] },
];

export default function Reports() {
  const toast = useToast();
  const cc = useChartColors();
  const regions = useRegionNames();
  const categories = useCategoryNames();
  const [report, setReport] = useState(catalog[0].items[0]);
  const [region, setRegion] = useState('');
  const [period, setPeriod] = useState('Last 3 months');

  const rows = useMemo(
    () =>
      farmers
        .filter((f) => f.qualityScore > 0 && (!region || f.region === region))
        .sort((a, b) => b.qualityScore - a.qualityScore),
    [region],
  );

  const histogram = useMemo(() => {
    const bins = ['50–59', '60–69', '70–79', '80–89', '90–100'];
    const base = [420, 1310, 4870, 7120, 4520];
    return bins.map((b, i) => ({ band: b, farmers: base[i] }));
  }, []);

  const scatter = rows.map((f) => ({ x: f.reliability, y: f.fat, z: f.avgLitres, name: f.name }));

  return (
    <>
      <PageHeader
        breadcrumb={[{ label: 'Finance' }, { label: 'Reports' }]}
        title="Reports & analytics"
        description="Farmer performance, milk volumes, quality and payment summaries."
        actions={
          <>
            <button className="btn btn-secondary" onClick={() => toast('Report scheduled: every Monday 07:00 by email')}>
              <CalendarClock className="h-4 w-4" /> Schedule
            </button>
            <button className="btn btn-secondary" onClick={() => toast(`${report} exported as PDF`)}>
              <FileText className="h-4 w-4" /> PDF
            </button>
            <button className="btn btn-primary" onClick={() => toast(`${report} exported to Excel`)}>
              <FileSpreadsheet className="h-4 w-4" /> Excel
            </button>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-4">
        <Card className="h-fit">
          <nav aria-label="Reports" className="p-2">
            {catalog.map((g) => (
              <div key={g.group} className="mb-2">
                <p className="px-3 pb-1 pt-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">{g.group}</p>
                {g.items.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setReport(r)}
                    className={clsx(
                      'flex min-h-[40px] w-full items-center rounded-lg px-3 text-left text-sm transition-colors',
                      r === report ? 'bg-brand-50 font-medium text-brand-700' : 'text-zinc-700 hover:bg-zinc-100',
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            ))}
          </nav>
        </Card>

        <div className="flex flex-col gap-6 xl:col-span-3">
          <Card>
            <CardHeader title={report} subtitle="Data as of 12 Nov 2026, 09:45" />
            <CardBody className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <select className="input" aria-label="Period" value={period} onChange={(e) => setPeriod(e.target.value)}>
                <option>This payment period</option>
                <option>Last 3 months</option>
                <option>Last 12 months</option>
                <option>Custom range…</option>
              </select>
              <select className="input" aria-label="Region" value={region} onChange={(e) => setRegion(e.target.value)}>
                <option value="">All regions</option>
                {regions.map((r) => <option key={r}>{r}</option>)}
              </select>
              <select className="input" aria-label="Center">
                <option>All centers</option>
                {centers.map((c) => <option key={c.id}>{c.name}</option>)}
              </select>
              <select className="input" aria-label="Category">
                <option>All categories</option>
                {categories.map((c) => <option key={c}>{c}</option>)}
              </select>
            </CardBody>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader title="Score distribution" subtitle="Farmers by performance score" />
              <CardBody className="h-[260px] pl-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={histogram} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke={cc.grid} strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="band" tick={{ fontSize: 11, fill: cc.tick }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: cc.tick }} tickLine={false} axisLine={false} width={44} />
                    <Tooltip formatter={(v: number) => num(v)} contentStyle={cc.tooltip} />
                    <Bar dataKey="farmers" name="Farmers" fill="#D71920" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="Reliability vs quality" subtitle="Bubble size = average litres per day" />
              <CardBody className="h-[260px] pl-1">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                    <CartesianGrid stroke={cc.grid} strokeDasharray="3 3" />
                    <XAxis type="number" dataKey="x" name="Reliability" unit="%" domain={[70, 100]} tick={{ fontSize: 11, fill: cc.tick }} tickLine={false} />
                    <YAxis type="number" dataKey="y" name="FAT" unit="%" domain={[3.2, 4.5]} tick={{ fontSize: 11, fill: cc.tick }} tickLine={false} width={44} />
                    <ZAxis type="number" dataKey="z" range={[60, 600]} name="L / day" />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={cc.tooltip} />
                    <Scatter data={scatter} fill={cc.ink} fillOpacity={0.7} />
                  </ScatterChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>
          </div>

          <Card>
            <CardHeader
              title="Farmer scorecard"
              subtitle="Score = 40% quality + 35% reliability + 25% volume against contract"
              actions={
                <button className="btn btn-ghost btn-sm" onClick={() => toast('Scorecard downloaded')}>
                  <Download className="h-3.5 w-3.5" /> Download
                </button>
              }
            />
            <DataTable<Farmer>
              rows={rows}
              rowKey={(f) => f.id}
              columns={[
                { key: 'rank', header: '#', mono: true, render: (_, i) => i + 1 },
                { key: 'name', header: 'Farmer', render: (f) => <span className="font-medium">{f.name}</span> },
                { key: 'center', header: 'Center' },
                { key: 'l', header: 'Litres (90 d)', align: 'right', mono: true, render: (f) => num(f.avgLitres * 90) },
                { key: 'fat', header: 'FAT', align: 'right', mono: true, render: (f) => f.fat.toFixed(2) },
                { key: 'snf', header: 'SNF', align: 'right', mono: true, render: (f) => f.snf.toFixed(2) },
                { key: 'rel', header: 'On time', align: 'right', mono: true, render: (f) => `${f.reliability}%` },
                {
                  key: 'score',
                  header: 'Score',
                  align: 'right',
                  render: (f) => (
                    <Badge tone={f.qualityScore >= 85 ? 'success' : f.qualityScore >= 70 ? 'neutral' : 'danger'}>
                      {f.qualityScore}
                    </Badge>
                  ),
                },
              ]}
            />
          </Card>
        </div>
      </div>
    </>
  );
}
