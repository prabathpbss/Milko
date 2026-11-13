import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Paperclip, RotateCcw, Send } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { Badge, SlaBadge, StatusBadge } from '@/components/ui/Badge';
import { FilterChips, Tabs } from '@/components/ui/Tabs';
import { Field } from '@/components/ui/Field';
import StatCard from '@/components/ui/StatCard';
import { disputes as seedDisputes, exceptions, farmers, type Dispute, type ExceptionItem } from '@/data/mock';
import { EmptyState } from '@/components/ui/misc';
import { lkr, num } from '@/lib/format';
import { useToast } from '@/context/ToastContext';

type TabId = 'exceptions' | 'disputes';
type ExF = 'all' | ExceptionItem['type'];

const typeTone = { Rejected: 'danger', Quality: 'warning', Quantity: 'info' } as const;

const Sla = ({ hours }: { hours: number }) => <SlaBadge hours={hours} />;

const MONTHS: Record<string, string> = { Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06', Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12' };
/** Sample data stores dates as "12 Nov" (current year). Convert to ISO yyyy-mm-dd for range checks. */
const toIso = (d: string) => {
  const [day, mon] = d.split(' ');
  return `2026-${MONTHS[mon] ?? '01'}-${day.padStart(2, '0')}`;
};
/** Farmer code from an exception subject such as "MF-004901 R. M. Piyasena" (tankers have none). */
const codeOf = (subject: string) => /^(MF|SOC)-\d+/.exec(subject)?.[0] ?? '';

const DEFAULT_FROM = '2026-10-01';
const DEFAULT_TO = '2026-11-12';

export default function Quality() {
  const toast = useToast();
  const [tab, setTab] = useState<TabId>('disputes');
  const [exFilter, setExFilter] = useState<ExF>('all');
  const [disputes, setDisputes] = useState(seedDisputes);
  const [selId, setSelId] = useState(seedDisputes[0].id);
  const [resolution, setResolution] = useState('');
  const [note, setNote] = useState('A lab retest of your retained sample is booked for 13 Nov. We will update you by 14 Nov.');

  // Search parameters: date range + farmer code
  const [from, setFrom] = useState(DEFAULT_FROM);
  const [to, setTo] = useState(DEFAULT_TO);
  const [code, setCode] = useState('');
  const rangeError = from && to && from > to ? '“From date” must be on or before “To date”.' : '';

  const inScope = (iso: string, farmerCode: string) => {
    if (rangeError) return false;
    if (from && iso < from) return false;
    if (to && iso > to) return false;
    const q = code.trim().toUpperCase();
    return !q || farmerCode.toUpperCase().includes(q);
  };

  const fDisputes = useMemo(
    () => disputes.filter((d) => inScope(toIso(d.raised), d.farmerId)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [disputes, from, to, code, rangeError],
  );
  const fExceptions = useMemo(
    () => exceptions.filter((e) => inScope(toIso(e.date), codeOf(e.subject))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [from, to, code, rangeError],
  );

  const sel = fDisputes.find((d) => d.id === selId) ?? fDisputes[0];
  const ex = exFilter === 'all' ? fExceptions : fExceptions.filter((e) => e.type === exFilter);
  const cnt = (t: ExF) => (t === 'all' ? fExceptions.length : fExceptions.filter((e) => e.type === t).length);
  const rejectedL = fExceptions.filter((e) => e.type === 'Rejected').reduce((s, e) => s + e.litres, 0);
  const isFiltered = from !== DEFAULT_FROM || to !== DEFAULT_TO || code.trim() !== '';
  const reset = () => {
    setFrom(DEFAULT_FROM);
    setTo(DEFAULT_TO);
    setCode('');
  };

  const resolve = () => {
    if (!sel) return;
    if (!resolution) return toast('Choose an outcome first.', 'error');
    setDisputes((ds) =>
      ds.map((d) =>
        d.id === sel.id
          ? {
              ...d,
              status: 'In approval',
              timeline: [...d.timeline, { time: '12 Nov 10:30', who: 'You', text: `Proposed outcome: ${resolution}. Sent for approval.` }],
            }
          : d,
      ),
    );
    toast(`${sel.id} sent for approval. Farmer notified by SMS.`);
  };

  return (
    <>
      <PageHeader
        breadcrumb={[{ label: 'Collection' }, { label: 'Quality & disputes' }]}
        title="Quality exceptions & disputes"
        description="Rejected milk, quality and quantity deviations, and farmer disputes."
      />

      <Card className="mb-6">
        <form
          className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.4fr_auto] lg:items-start"
          onSubmit={(e) => e.preventDefault()}
          aria-label="Search disputes and exceptions"
        >
          <Field label="From date">
            <input type="date" className="input" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} />
          </Field>
          <Field label="To date" error={rangeError || undefined}>
            <input type="date" className="input" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} />
          </Field>
          <Field label="Farmer code" hint="e.g. MF-004812 — leave empty for all farmers">
            <input
              className="input num uppercase"
              list="farmer-codes"
              placeholder="All farmers"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
            <datalist id="farmer-codes">
              {farmers.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </datalist>
          </Field>
          <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-1 lg:pt-[22px]">
            <button type="button" className="btn btn-secondary w-full lg:w-auto" onClick={reset} disabled={!isFiltered}>
              <RotateCcw className="h-4 w-4" /> Reset
            </button>
          </div>
        </form>
        <p className="border-t border-zinc-100 px-4 py-2.5 text-xs text-zinc-500" aria-live="polite">
          Showing <strong className="font-semibold text-zinc-700">{fDisputes.length}</strong> disputes and{' '}
          <strong className="font-semibold text-zinc-700">{fExceptions.length}</strong> collection exceptions
          {code.trim() ? <> for <span className="num">{code.trim().toUpperCase()}</span></> : ' for all farmers'}
          {from && to && !rangeError ? <>, {from} to {to}</> : null}.
        </p>
      </Card>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Rejected milk" value={`${num(rejectedL, 1)} L`} hint={`${fExceptions.filter((e) => e.type === 'Rejected').length} deliveries in range`} />
        <StatCard label="Quality deviations" value={String(fExceptions.filter((e) => e.type === 'Quality').length)} hint="Temperature, low SNF" />
        <StatCard
          label="Open disputes"
          value={String(fDisputes.filter((d) => d.status !== 'Resolved').length)}
          hint={`${fDisputes.filter((d) => d.status !== 'Resolved' && d.slaHours < 0).length} past response target`}
        />
        <StatCard label="Avg resolution time" value="38 h" trend={{ value: '6 h', up: false, good: true }} hint="vs last month" />
      </div>

      <Tabs<TabId>
        value={tab}
        onChange={setTab}
        className="mb-6"
        tabs={[
          { id: 'disputes', label: 'Disputes', count: fDisputes.length },
          { id: 'exceptions', label: 'Collection exceptions', count: fExceptions.length },
        ]}
      />

      {tab === 'exceptions' && (
        <Card>
          <div className="border-b border-zinc-100 p-4">
            <FilterChips<ExF>
              value={exFilter}
              onChange={setExFilter}
              options={[
                { id: 'all', label: 'All', count: cnt('all') },
                { id: 'Rejected', label: 'Rejected milk', count: cnt('Rejected') },
                { id: 'Quality', label: 'Quality deviation', count: cnt('Quality') },
                { id: 'Quantity', label: 'Quantity deviation', count: cnt('Quantity') },
              ]}
            />
          </div>
          <DataTable<ExceptionItem>
            rows={ex}
            rowKey={(e) => e.id}
            empty={
              <span>
                No collection exceptions match these dates or farmer code.{' '}
                {isFiltered && (
                  <button type="button" className="font-medium text-brand-700 hover:underline" onClick={reset}>
                    Reset search
                  </button>
                )}
              </span>
            }
            columns={[
              { key: 'id', header: 'Reference', mono: true },
              { key: 'date', header: 'Date' },
              { key: 'center', header: 'Center' },
              { key: 'subject', header: 'Farmer / tanker' },
              { key: 'type', header: 'Type', render: (e) => <Badge tone={typeTone[e.type]}>{e.type}</Badge> },
              { key: 'detail', header: 'Detail', className: 'whitespace-normal min-w-[220px]' },
              { key: 'litres', header: 'Litres', align: 'right', mono: true, render: (e) => num(e.litres, 1) },
              { key: 'action', header: 'Action taken', className: 'whitespace-normal min-w-[180px] text-zinc-600' },
              { key: 'status', header: 'Status', render: (e) => <StatusBadge status={e.status} /> },
            ]}
          />
        </Card>
      )}

      {tab === 'disputes' && !sel && (
        <Card>
          <EmptyState
            title="No disputes found"
            text="No disputes were raised in this date range for this farmer code."
            action={
              isFiltered ? (
                <button type="button" className="btn btn-secondary btn-sm mt-2" onClick={reset}>
                  <RotateCcw className="h-3.5 w-3.5" /> Reset search
                </button>
              ) : undefined
            }
          />
        </Card>
      )}

      {tab === 'disputes' && sel && (
        <div className="grid gap-6 xl:grid-cols-5">
          <Card className="xl:col-span-3">
            <DataTable<Dispute>
              rows={fDisputes}
              rowKey={(d) => d.id}
              selectedKey={sel.id}
              onRowClick={(d) => {
                setSelId(d.id);
                setResolution('');
              }}
              columns={[
                {
                  key: 'id',
                  header: 'Ticket',
                  render: (d) => (
                    <div>
                      <div className="num text-[13px] font-medium">{d.id}</div>
                      <div className="text-xs text-zinc-500">{d.farmer}</div>
                    </div>
                  ),
                },
                { key: 'cat', header: 'Category', render: (d) => <Badge>{d.category}</Badge> },
                { key: 'raised', header: 'Raised' },
                { key: 'owner', header: 'Owner' },
                { key: 'sla', header: 'Response target', render: (d) => <Sla hours={d.slaHours} /> },
                { key: 'status', header: 'Status', render: (d) => <StatusBadge status={d.status} /> },
              ]}
            />
          </Card>

          <Card className="xl:col-span-2">
            <CardHeader
              title={`${sel.farmer} · ${sel.category}`}
              subtitle={`${sel.id} · linked ${sel.linked}`}
              actions={<Sla hours={sel.slaHours} />}
            />
            <CardBody className="space-y-5">
              <p className="text-sm leading-relaxed text-zinc-700">{sel.summary}</p>
              <div className="flex flex-wrap gap-2">
                <Badge tone="neutral">Value {lkr(sel.value)}</Badge>
                <Link to={`/farmers/${sel.farmerId}`} className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline">
                  Farmer profile <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
              <ol className="relative space-y-4 border-l border-zinc-200 pl-5">
                {sel.timeline.map((t) => (
                  <li key={t.time + t.text} className="relative">
                    <span className="absolute -left-[25px] top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-zinc-400" />
                    <p className="text-xs text-zinc-500">
                      <span className="num">{t.time}</span> · {t.who}
                    </p>
                    <p className="text-sm">{t.text}</p>
                  </li>
                ))}
              </ol>
              <div className="flex items-center gap-2 rounded-lg border border-dashed border-zinc-300 px-3 py-2.5 text-sm text-zinc-500">
                <Paperclip className="h-4 w-4" /> Analyser printout, can photo, sample label
              </div>
              <Field label="Outcome">
                <select className="input" value={resolution} onChange={(e) => setResolution(e.target.value)}>
                  <option value="">Choose an outcome…</option>
                  <option>Uphold the rejection</option>
                  <option>Reverse and pay in the next run</option>
                  <option>Partial credit</option>
                </select>
              </Field>
              <Field label="Message to farmer (SMS)">
                <textarea className="input" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
              </Field>
              <div className="flex flex-wrap justify-end gap-2">
                <button className="btn btn-secondary" onClick={() => toast('Escalated to Regional Manager')}>
                  Escalate
                </button>
                <button className="btn btn-primary" onClick={resolve}>
                  <Send className="h-4 w-4" /> Send for approval
                </button>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </>
  );
}
