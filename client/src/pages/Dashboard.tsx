import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AlertTriangle, ArrowRight, CalendarClock, Droplets, Milk, Truck, Users, XCircle } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import StatCard from '@/components/ui/StatCard';
import { DataTable } from '@/components/ui/DataTable';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import FakeMap from '@/components/ui/FakeMap';
import { Progress } from '@/components/ui/misc';
import { alerts, approvals, centers, collectionTrend, regions, tankers, TODAY, type Center } from '@/data/mock';
import { compact, num } from '@/lib/format';
import { useAuth } from '@/context/AuthContext';

const series: { key: string; color: string }[] = [
  { key: 'North Central', color: '#D71920' },
  { key: 'North Western', color: '#3F3F46' },
  { key: 'Central', color: '#F59E0B' },
  { key: 'Eastern', color: '#0EA5E9' },
  { key: 'Uva', color: '#10B981' },
];

const alertStyle = {
  danger: 'bg-red-50 text-red-700',
  warning: 'bg-amber-50 text-amber-800',
  info: 'bg-sky-50 text-sky-700',
};

export default function Dashboard() {
  const { user } = useAuth();
  const [region, setRegion] = useState('All regions');
  const [shift, setShift] = useState('Both shifts');

  const shown = useMemo(
    () => (region === 'All regions' ? centers : centers.filter((c) => c.region === region)),
    [region],
  );
  const litres = shown.reduce((s, c) => s + c.todayLitres, 0);
  const rejected = shown.reduce((s, c) => s + c.rejected, 0);
  const suppliers = shown.reduce((s, c) => s + c.farmers, 0);
  const fat = shown.reduce((s, c) => s + c.fat * c.todayLitres, 0) / Math.max(1, litres);
  const snf = shown.reduce((s, c) => s + c.snf * c.todayLitres, 0) / Math.max(1, litres);
  const onRoute = tankers.filter((t) => t.status === 'On time' || t.status === 'Delayed').length;
  const delayed = tankers.filter((t) => t.status === 'Delayed').length;
  const pending = approvals.filter((a) => a.status === 'Pending');

  const shownSeries = region === 'All regions' ? series : series.filter((s) => s.key === region);

  return (
    <>
      <PageHeader
        title={`Good morning, ${user?.name.split(' ')[0] ?? ''}`}
        description={`Collection overview for ${TODAY}.`}
        actions={
          <>
            <Link to="/reports" className="btn btn-secondary">
              Open reports
            </Link>
            <Link to="/collection" className="btn btn-primary">
              <Milk className="h-4 w-4" /> Record collection
            </Link>
          </>
        }
      />

      <div className="mb-6 flex flex-wrap gap-3">
        <label className="w-full sm:w-52">
          <span className="sr-only">Region</span>
          <select className="input" value={region} onChange={(e) => setRegion(e.target.value)}>
            <option>All regions</option>
            {regions.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </label>
        <label className="w-full sm:w-44">
          <span className="sr-only">Shift</span>
          <select className="input" value={shift} onChange={(e) => setShift(e.target.value)}>
            <option>Both shifts</option>
            <option>Morning</option>
            <option>Evening</option>
          </select>
        </label>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard label="Milk received today" value={`${num(litres)} L`} icon={Milk} trend={{ value: '4.2%', up: true }} hint="vs last week" />
        <StatCard label="Farmers supplied" value={num(Math.round(suppliers * 0.65))} icon={Users} hint={`of ${num(suppliers)} active`} />
        <StatCard label="FAT / SNF" value={`${fat.toFixed(2)} / ${snf.toFixed(2)}`} icon={Droplets} hint="Weighted average %" />
        <StatCard label="Rejected today" value={`${num(rejected)} L`} icon={XCircle} tone="danger" trend={{ value: `${((rejected / litres) * 100).toFixed(2)}%`, up: true, good: false }} hint="of received" />
        <StatCard label="Next payment run" value="16 Nov" icon={CalendarClock} hint="1–15 Nov · in approval" />
        <StatCard label="Tankers on route" value={`${onRoute} / ${tankers.length}`} icon={Truck} hint={`${delayed} delayed over 30 min`} />
      </div>

      <div className="mb-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Milk received, last 30 days" subtitle="Litres per day by region" />
          <CardBody className="h-[320px] pl-1 sm:pl-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={collectionTrend} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  {shownSeries.map((s) => (
                    <linearGradient key={s.key} id={`g-${s.key.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={s.color} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={s.color} stopOpacity={0.05} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid stroke="#E4E4E7" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#71717A' }} tickLine={false} axisLine={false} interval={4} />
                <YAxis tick={{ fontSize: 11, fill: '#71717A' }} tickLine={false} axisLine={false} tickFormatter={compact} width={48} />
                <Tooltip
                  formatter={(v: number) => `${num(v)} L`}
                  contentStyle={{ borderRadius: 8, border: '1px solid #E4E4E7', fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" iconSize={8} />
                {shownSeries.map((s) => (
                  <Area
                    key={s.key}
                    type="monotone"
                    dataKey={s.key}
                    stackId="1"
                    stroke={s.color}
                    strokeWidth={1.5}
                    fill={`url(#g-${s.key.replace(/\s/g, '')})`}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Needs attention"
            actions={
              <Badge tone="danger" dot>
                {alerts.length} alerts
              </Badge>
            }
          />
          <ul className="divide-y divide-zinc-100">
            {alerts.map((a) => (
              <li key={a.text}>
                <Link to={a.to} className="flex items-start gap-3 px-5 py-3.5 hover:bg-zinc-50">
                  <span className={clsx('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg', alertStyle[a.tone])}>
                    <AlertTriangle className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-semibold uppercase tracking-wide text-zinc-500">{a.title}</span>
                    <span className="block text-sm text-zinc-800">{a.text}</span>
                  </span>
                  <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-zinc-300" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Today by collection center"
            actions={
              <Link to="/logistics" className="btn btn-ghost btn-sm">
                All centers <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            }
          />
          <DataTable<Center>
            rows={shown}
            rowKey={(c) => c.id}
            columns={[
              {
                key: 'name',
                header: 'Center',
                render: (c) => (
                  <div>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-zinc-500">{c.region}</div>
                  </div>
                ),
              },
              { key: 'litres', header: 'Litres', align: 'right', mono: true, render: (c) => num(c.todayLitres) },
              {
                key: 'cap',
                header: 'Capacity used',
                render: (c) => {
                  const p = (c.todayLitres / c.capacity) * 100;
                  return (
                    <div className="flex w-36 items-center gap-2">
                      <Progress value={p} tone={p > 95 ? 'warning' : 'dark'} label={`${c.name} capacity`} />
                      <span className="num w-10 text-right text-xs text-zinc-500">{p.toFixed(0)}%</span>
                    </div>
                  );
                },
              },
              { key: 'fat', header: 'FAT', align: 'right', mono: true, render: (c) => c.fat.toFixed(2) },
              { key: 'snf', header: 'SNF', align: 'right', mono: true, render: (c) => c.snf.toFixed(2) },
              { key: 'rej', header: 'Rejected L', align: 'right', mono: true, render: (c) => num(c.rejected) },
              { key: 'status', header: 'Status', render: (c) => <StatusBadge status={c.status} /> },
            ]}
          />
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader
              title="Live tankers"
              subtitle={`${onRoute} on route · ${delayed} delayed`}
              actions={
                <Link to="/logistics" className="btn btn-ghost btn-sm">
                  Track
                </Link>
              }
            />
            <CardBody>
              <FakeMap
                height={200}
                markers={tankers
                  .filter((t) => t.status !== 'Unassigned')
                  .map((t) => ({
                    id: t.id,
                    x: t.x,
                    y: t.y,
                    label: t.route,
                    tone: t.status === 'Delayed' ? 'warning' : t.status === 'At plant' ? 'info' : 'success',
                  }))}
              />
            </CardBody>
          </Card>
          <Card>
            <CardHeader
              title="Waiting for approval"
              actions={
                <Link to="/approvals" className="btn btn-ghost btn-sm">
                  Open inbox
                </Link>
              }
            />
            <ul className="divide-y divide-zinc-100">
              {pending.slice(0, 4).map((a) => (
                <li key={a.id}>
                  <Link to="/approvals" className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-zinc-50">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{a.title}</span>
                      <span className="block text-xs text-zinc-500">
                        {a.type} · {a.age} ago
                      </span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-zinc-300" />
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
