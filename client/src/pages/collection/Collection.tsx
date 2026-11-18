import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { ChevronLeft, ChevronRight, Download, Droplets, MapPin, Search, Smartphone, Users, Wallet, XCircle } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { FilterChips } from '@/components/ui/Tabs';
import StatCard from '@/components/ui/StatCard';
import { farmers } from '@/data/mock';
import { centerName, useCenterMaster } from '@/data/masters';
import { FIRST_DAY, TODAY_ISO, addDays, fmtDate, useDayDeliveries, type CollectionRecord } from '@/data/collection';
import { lkr, num } from '@/lib/format';
import { useToast } from '@/context/ToastContext';
import { useLang } from '@/i18n/LanguageContext';

type TFn = (s: string, v?: Record<string, string | number>) => string;
type Shift = 'all' | 'AM' | 'PM';
type Show = 'all' | 'supplied' | 'none' | 'rejected' | 'farm';
type Result = CollectionRecord['result'];

/** "Recorded by" values such as "Counter 2" or "Farm visit · K. Dissanayake". */
function trBy(by: string, t: TFn) {
  const m = /^Counter (\d+)$/.exec(by);
  if (m) return t('Counter {n}', { n: m[1] });
  const [head, ...rest] = by.split(' · ');
  return rest.length ? [t(head), ...rest].join(' · ') : t(by);
}

/** "Other: details" keeps the details as typed; the reason itself is translated. */
function trVisitReason(r: string, t: TFn) {
  const i = r.indexOf(': ');
  return i < 0 ? t(r) : `${t(r.slice(0, i))}: ${r.slice(i + 2)}`;
}

/** One farmer's milk for the chosen day. */
interface FarmerDay {
  farmerId: string;
  name: string;
  centerId: string;
  am: number;
  pm: number;
  /** Accepted + flagged litres (paid) */
  accepted: number;
  rejected: number;
  fat: number;
  snf: number;
  value: number;
  count: number;
  farmVisits: number;
  /** Worst result of the day; null = no delivery */
  status: Result | null;
  items: CollectionRecord[];
}

const RANK: Record<Result, number> = { Accepted: 0, Flagged: 1, Rejected: 2 };

function summarise(items: CollectionRecord[], farmerId: string, name: string, centerId: string): FarmerDay {
  const paid = items.filter((d) => d.result !== 'Rejected');
  const accepted = paid.reduce((s, d) => s + d.litres, 0);
  return {
    farmerId,
    name,
    centerId,
    am: paid.filter((d) => d.shift === 'AM').reduce((s, d) => s + d.litres, 0),
    pm: paid.filter((d) => d.shift === 'PM').reduce((s, d) => s + d.litres, 0),
    accepted,
    rejected: items.filter((d) => d.result === 'Rejected').reduce((s, d) => s + d.litres, 0),
    fat: paid.reduce((s, d) => s + d.fat * d.litres, 0) / Math.max(accepted, 1e-9),
    snf: paid.reduce((s, d) => s + d.snf * d.litres, 0) / Math.max(accepted, 1e-9),
    value: items.reduce((s, d) => s + d.value, 0),
    count: items.length,
    farmVisits: items.filter((d) => d.source === 'Farm').length,
    status: items.length ? items.reduce<Result>((w, d) => (RANK[d.result] > RANK[w] ? d.result : w), 'Accepted') : null,
    items: [...items].sort((a, b) => a.time.localeCompare(b.time)),
  };
}

/** Daily collection — read-only view of a chosen day's milk, farmer by farmer. Milk is recorded in Field collection. */
export default function Collection() {
  const toast = useToast();
  const { t } = useLang();
  const centers = useCenterMaster();
  const [date, setDate] = useState(TODAY_ISO);
  const [centerId, setCenterId] = useState<string>('CC-HNG');
  const [shift, setShift] = useState<Shift>('all');
  const [show, setShow] = useState<Show>('all');
  const [q, setQ] = useState('');
  const [selId, setSelId] = useState<string | null>(null);

  const records = useDayDeliveries(date, centerId, shift);

  // One row per farmer: everyone who delivered, plus active farmers of the center who did not.
  const rows = useMemo(() => {
    const byFarmer = new Map<string, CollectionRecord[]>();
    for (const d of records) byFarmer.set(d.farmerId, [...(byFarmer.get(d.farmerId) ?? []), d]);
    const list: FarmerDay[] = [];
    for (const [id, items] of byFarmer) list.push(summarise(items, id, items[0].farmerName, items[0].centerId));
    for (const f of farmers) {
      if (f.status === 'Active' && !byFarmer.has(f.id) && (centerId === 'all' || f.centerId === centerId)) list.push(summarise([], f.id, f.name, f.centerId));
    }
    return list.sort((a, b) => b.accepted - a.accepted || a.name.localeCompare(b.name));
  }, [records, centerId]);

  const is = (r: FarmerDay, s: Show) =>
    s === 'all' ||
    (s === 'supplied' && r.count > 0) ||
    (s === 'none' && r.count === 0) ||
    (s === 'rejected' && r.rejected > 0) ||
    (s === 'farm' && r.farmVisits > 0);
  const term = q.trim().toLowerCase();
  const shown = rows.filter((r) => is(r, show) && (!term || r.name.toLowerCase().includes(term) || r.farmerId.toLowerCase().includes(term)));
  const count = (s: Show) => rows.filter((r) => is(r, s)).length;

  // Day totals
  const supplied = rows.filter((r) => r.count > 0);
  const acceptedL = supplied.reduce((s, r) => s + r.accepted, 0);
  const rejectedL = supplied.reduce((s, r) => s + r.rejected, 0);
  const value = supplied.reduce((s, r) => s + r.value, 0);
  const avgFat = supplied.reduce((s, r) => s + r.fat * r.accepted, 0) / Math.max(acceptedL, 1e-9);
  const avgSnf = supplied.reduce((s, r) => s + r.snf * r.accepted, 0) / Math.max(acceptedL, 1e-9);
  const farmL = records.filter((d) => d.source === 'Farm' && d.result !== 'Rejected').reduce((s, d) => s + d.litres, 0);
  const sumOf = (k: 'am' | 'pm' | 'accepted' | 'rejected' | 'value' | 'count') => shown.reduce((s, r) => s + r[k], 0);

  const sel = rows.find((r) => r.farmerId === selId) ?? null;
  const go = (n: number) => {
    const next = addDays(date, n);
    if (next >= FIRST_DAY && next <= TODAY_ISO) setDate(next);
  };
  const where = centerId === 'all' ? t('All centers') : centerName(centerId);
  const shiftLabel = shift === 'AM' ? t('Morning') : shift === 'PM' ? t('Evening') : t('Both shifts');

  return (
    <>
      <PageHeader
        breadcrumb={[{ label: t('Collection') }, { label: t('Daily collection') }]}
        title={t('Daily collection')}
        description={t('{center} · {date} · {shift}', { center: where, date: fmtDate(date), shift: shiftLabel })}
        actions={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => toast(t('Daily collection exported'))}>
              <Download className="h-4 w-4" /> {t('Export')}
            </button>
            <Link to="/field/collect" className="btn btn-primary">
              <Smartphone className="h-4 w-4" /> {t('Record milk')}
            </Link>
          </>
        }
      />

      {/* Filters */}
      <Card className="mb-6">
        <CardBody className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="label">{t('Date')}</span>
            <div className="flex items-center gap-1">
              <button type="button" className="btn btn-secondary btn-icon" onClick={() => go(-1)} disabled={date <= FIRST_DAY} aria-label={t('Previous day')}>
                <ChevronLeft className="h-4 w-4" />
              </button>
              <input
                type="date"
                className="input num w-44"
                aria-label={t('Date')}
                value={date}
                min={FIRST_DAY}
                max={TODAY_ISO}
                onChange={(e) => e.target.value && setDate(e.target.value)}
              />
              <button type="button" className="btn btn-secondary btn-icon" onClick={() => go(1)} disabled={date >= TODAY_ISO} aria-label={t('Next day')}>
                <ChevronRight className="h-4 w-4" />
              </button>
              {date !== TODAY_ISO && (
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDate(TODAY_ISO)}>
                  {t('Today')}
                </button>
              )}
            </div>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="label">{t('Collection center')}</span>
            <select
              className="input w-56"
              value={centerId}
              onChange={(e) => {
                setCenterId(e.target.value);
                setSelId(null);
              }}
            >
              <option value="all">{t('All centers')}</option>
              {centers.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                  {c.status !== 'Active' ? ` (${t('Inactive')})` : ''}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-col gap-1.5">
            <span className="label">{t('Shift')}</span>
            <FilterChips<Shift>
              value={shift}
              onChange={setShift}
              options={[
                { id: 'all', label: t('Both') },
                { id: 'AM', label: t('Morning') },
                { id: 'PM', label: t('Evening') },
              ]}
            />
          </div>
        </CardBody>
      </Card>

      {/* Day totals */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label={t('Farmers supplied')} value={`${num(supplied.length)} / ${num(rows.length)}`} icon={Users} />
        <StatCard label={t('Accepted')} value={`${num(acceptedL, 1)} L`} icon={Droplets} hint={t('Avg FAT {fat} · SNF {snf}', { fat: avgFat.toFixed(2), snf: avgSnf.toFixed(2) })} />
        <StatCard label={t('Rejected')} value={`${num(rejectedL, 1)} L`} icon={XCircle} tone={rejectedL ? 'danger' : 'default'} />
        <StatCard label={t('From farm visits')} value={`${num(farmL, 1)} L`} icon={MapPin} />
        <StatCard label={t('Value to farmers')} value={lkr(value)} icon={Wallet} />
      </div>

      {/* Farmer by farmer */}
      <Card>
        <CardHeader title={t('Farmer by farmer')} subtitle={t('Click a farmer to see each delivery.')} />
        <div className="flex flex-wrap items-center gap-3 border-b border-zinc-100 px-4 py-3">
          <FilterChips<Show>
            value={show}
            onChange={setShow}
            options={[
              { id: 'all', label: t('All farmers'), count: count('all') },
              { id: 'supplied', label: t('Supplied'), count: count('supplied') },
              { id: 'none', label: t('No delivery'), count: count('none') },
              { id: 'rejected', label: t('With rejections'), count: count('rejected') },
              { id: 'farm', label: t('Farm visits'), count: count('farm') },
            ]}
          />
          <label className="relative ml-auto min-w-[200px]">
            <span className="sr-only">{t('Search')}</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input className="input pl-9" placeholder={t('Farmer name or ID…')} value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
        </div>
        <DataTable<FarmerDay>
          rows={shown}
          rowKey={(r) => r.farmerId}
          selectedKey={selId}
          onRowClick={(r) => setSelId(r.farmerId === selId ? null : r.farmerId)}
          empty={t('No collection for this day.')}
          columns={[
            {
              key: 'farmer',
              header: t('Farmer'),
              render: (r) => (
                <div>
                  <div className="font-medium">{r.name}</div>
                  <div className="text-xs text-zinc-500">
                    <span className="num">{r.farmerId}</span>
                    {centerId === 'all' && ` · ${centerName(r.centerId)}`}
                  </div>
                </div>
              ),
            },
            { key: 'am', header: t('Morning L'), align: 'right', mono: true, render: (r) => (r.am ? num(r.am, 1) : '—') },
            { key: 'pm', header: t('Evening L'), align: 'right', mono: true, render: (r) => (r.pm ? num(r.pm, 1) : '—') },
            { key: 'total', header: t('Accepted L'), align: 'right', mono: true, render: (r) => <span className="font-semibold">{r.accepted ? num(r.accepted, 1) : '—'}</span> },
            { key: 'fat', header: 'FAT', align: 'right', mono: true, render: (r) => (r.accepted ? r.fat.toFixed(2) : '—') },
            { key: 'snf', header: 'SNF', align: 'right', mono: true, render: (r) => (r.accepted ? r.snf.toFixed(2) : '—') },
            {
              key: 'rej',
              header: t('Rejected L'),
              align: 'right',
              render: (r) => <span className={clsx('num', r.rejected > 0 && 'font-semibold text-red-700')}>{r.rejected ? num(r.rejected, 1) : '—'}</span>,
            },
            { key: 'count', header: t('Deliveries'), align: 'right', mono: true, render: (r) => r.count },
            { key: 'value', header: t('Value'), align: 'right', mono: true, render: (r) => (r.value ? lkr(r.value) : '—') },
            {
              key: 'status',
              header: t('Result'),
              render: (r) =>
                r.status ? (
                  <span className="flex flex-wrap items-center gap-1">
                    {r.status === 'Rejected' && r.accepted > 0 ? <Badge tone="warning">{t('Part rejected')}</Badge> : <StatusBadge status={r.status} />}
                    {r.farmVisits > 0 && <Badge tone="warning">{t('Farm visit')}</Badge>}
                  </span>
                ) : (
                  <Badge tone="neutral">{t('No delivery')}</Badge>
                ),
            },
          ]}
          footer={
            shown.length > 0 && (
              <tr className="text-sm">
                <td className="px-4 py-3">{t('Total · {n} farmers', { n: shown.length })}</td>
                <td className="num px-4 py-3 text-right">{num(sumOf('am'), 1)}</td>
                <td className="num px-4 py-3 text-right">{num(sumOf('pm'), 1)}</td>
                <td className="num px-4 py-3 text-right">{num(sumOf('accepted'), 1)}</td>
                <td className="px-4 py-3" />
                <td className="px-4 py-3" />
                <td className="num px-4 py-3 text-right">{num(sumOf('rejected'), 1)}</td>
                <td className="num px-4 py-3 text-right">{sumOf('count')}</td>
                <td className="num whitespace-nowrap px-4 py-3 text-right">{lkr(sumOf('value'))}</td>
                <td className="px-4 py-3" />
              </tr>
            )
          }
        />
        <p className="border-t border-zinc-100 px-5 py-3 text-xs text-zinc-500">
          {t('View only. Milk is recorded in Field collection; corrections after a shift is closed need supervisor approval.')}{' '}
          <Link to="/quality" className="font-medium text-brand-700 hover:underline">
            {t('View exceptions')}
          </Link>
        </p>
      </Card>

      {/* Selected farmer's deliveries */}
      {sel && (
        <Card className="mt-6">
          <CardHeader
            title={sel.name}
            subtitle={t('{id} · {center} · {date}', { id: sel.farmerId, center: centerName(sel.centerId), date: fmtDate(date) })}
            actions={
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSelId(null)}>
                {t('Close')}
              </button>
            }
          />
          {sel.items.length ? (
            <DataTable<CollectionRecord>
              rows={sel.items}
              rowKey={(d) => d.id}
              columns={[
                { key: 'time', header: t('Time'), mono: true, render: (d) => `${d.time} · ${d.shift === 'AM' ? t('Morning') : t('Evening')}` },
                { key: 'litres', header: t('Litres'), align: 'right', mono: true, render: (d) => num(d.litres, 1) },
                { key: 'fat', header: 'FAT', align: 'right', mono: true, render: (d) => d.fat.toFixed(2) },
                { key: 'snf', header: 'SNF', align: 'right', mono: true, render: (d) => d.snf.toFixed(2) },
                { key: 'temp', header: '°C', align: 'right', render: (d) => <span className={clsx('num', d.temp > 10 && 'font-semibold text-amber-700')}>{d.temp.toFixed(1)}</span> },
                {
                  key: 'tests',
                  header: t('Tests'),
                  render: (d) => (
                    <span className="text-xs text-zinc-600">
                      {t('Alcohol')} {d.alcohol === 'Pass' ? '✓' : '✗'} · {d.adulteration === 'None found' ? t('Clean') : t(d.adulteration)}
                    </span>
                  ),
                },
                {
                  key: 'source',
                  header: t('Collected at'),
                  className: 'whitespace-normal min-w-[170px] max-w-[260px]',
                  render: (d) =>
                    d.source === 'Farm' ? (
                      <div>
                        <Badge tone="warning">{t('Farm visit')}</Badge>
                        {d.visitReason && <div className="mt-0.5 text-xs text-zinc-600">{trVisitReason(d.visitReason, t)}</div>}
                        {d.location && <div className="mt-0.5 line-clamp-2 text-xs text-zinc-500">{d.location}</div>}
                      </div>
                    ) : (
                      <span className="text-zinc-600">{t('At center')}</span>
                    ),
                },
                { key: 'result', header: t('Result'), render: (d) => <StatusBadge status={d.result} /> },
                { key: 'value', header: t('Value'), align: 'right', mono: true, render: (d) => (d.value ? lkr(d.value) : '—') },
                { key: 'by', header: t('Recorded by'), className: 'text-zinc-500', render: (d) => trBy(d.by, t) },
              ]}
            />
          ) : (
            <CardBody className="text-sm text-zinc-500">{t('No milk from this farmer on this day.')}</CardBody>
          )}
        </Card>
      )}
    </>
  );
}
