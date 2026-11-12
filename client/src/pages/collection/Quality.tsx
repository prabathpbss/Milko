import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Paperclip, Plus, Send } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { FilterChips, Tabs } from '@/components/ui/Tabs';
import { Field } from '@/components/ui/Field';
import StatCard from '@/components/ui/StatCard';
import { disputes as seedDisputes, exceptions, type Dispute, type ExceptionItem } from '@/data/mock';
import { lkr, num } from '@/lib/format';
import { useToast } from '@/context/ToastContext';

type TabId = 'exceptions' | 'disputes';
type ExF = 'all' | ExceptionItem['type'];

const typeTone = { Rejected: 'danger', Quality: 'warning', Quantity: 'info' } as const;

function Sla({ hours }: { hours: number }) {
  if (hours < 0) return <Badge tone="danger" dot>{Math.abs(hours)} h over</Badge>;
  if (hours < 24) return <Badge tone="warning" dot>{hours} h left</Badge>;
  return <Badge tone="success" dot>{hours} h left</Badge>;
}

export default function Quality() {
  const toast = useToast();
  const [tab, setTab] = useState<TabId>('disputes');
  const [exFilter, setExFilter] = useState<ExF>('all');
  const [disputes, setDisputes] = useState(seedDisputes);
  const [selId, setSelId] = useState(seedDisputes[0].id);
  const [resolution, setResolution] = useState('');
  const [note, setNote] = useState('A lab retest of your retained sample is booked for 13 Nov. We will update you by 14 Nov.');

  const sel = disputes.find((d) => d.id === selId)!;
  const ex = exFilter === 'all' ? exceptions : exceptions.filter((e) => e.type === exFilter);
  const cnt = (t: ExF) => (t === 'all' ? exceptions.length : exceptions.filter((e) => e.type === t).length);

  const resolve = () => {
    if (!resolution) return toast('Choose an outcome first.', 'error');
    setDisputes((ds) =>
      ds.map((d) =>
        d.id === selId
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
        actions={
          <>
            <button className="btn btn-secondary" onClick={() => toast('Exception form opened', 'info')}>
              <Plus className="h-4 w-4" /> Log exception
            </button>
            <button className="btn btn-primary" onClick={() => toast('New dispute form opened', 'info')}>
              <Plus className="h-4 w-4" /> Open dispute
            </button>
          </>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Rejected this week" value="1,230 L" hint="64 deliveries" />
        <StatCard label="Quality deviations" value="41" hint="Temperature, low SNF" />
        <StatCard label="Open disputes" value={String(disputes.filter((d) => d.status !== 'Resolved').length)} hint="1 past 72-hour target" />
        <StatCard label="Avg resolution time" value="38 h" trend={{ value: '6 h', up: false, good: true }} hint="vs last month" />
      </div>

      <Tabs<TabId>
        value={tab}
        onChange={setTab}
        className="mb-6"
        tabs={[
          { id: 'disputes', label: 'Disputes', count: disputes.length },
          { id: 'exceptions', label: 'Collection exceptions', count: exceptions.length },
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

      {tab === 'disputes' && (
        <div className="grid gap-6 xl:grid-cols-5">
          <Card className="xl:col-span-3">
            <DataTable<Dispute>
              rows={disputes}
              rowKey={(d) => d.id}
              selectedKey={selId}
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
