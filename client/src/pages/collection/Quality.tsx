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
import { exceptions, farmers, type Dispute, type ExceptionItem } from '@/data/mock';
import { EmptyState } from '@/components/ui/misc';
import { lkr, num } from '@/lib/format';
import { useToast } from '@/context/ToastContext';
import { disputeStore, useDisputes } from '@/data/disputes';
import { useLang } from '@/i18n/LanguageContext';

type TabId = 'exceptions' | 'disputes';
type ExF = 'all' | ExceptionItem['type'];
type TFn = (s: string, v?: Record<string, string | number>) => string;

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
const DEFAULT_NOTE = 'A lab retest of your retained sample is booked for 13 Nov. We will update you by 14 Nov.';

/** Owner such as "QA · L. Silva" or "Finance · not assigned": translate the team and "not assigned", keep names. */
const trOwner = (owner: string, t: TFn) =>
  owner
    .split(' · ')
    .map((p, i) => (i === 0 || p === 'not assigned' ? t(p) : p))
    .join(' · ');

/** Timeline "who": a team/channel word, or "Counter 2". "System" gets its own key (the plain one is the theme option). */
const trWho = (who: string, t: TFn) => {
  if (who === 'System') {
    const s = t('System (automatic)');
    return s === 'System (automatic)' ? who : s;
  }
  const m = /^Counter (\d+)$/.exec(who);
  return m ? t('Counter {n}', { n: m[1] }) : t(who);
};

/** Timeline text: fixed sentences from the sample data, plus the sentences built by raiseDispute() and resolve(). */
const trText = (text: string, t: TFn) => {
  let m = /^(Dispute|Complaint) raised\.$/.exec(text);
  if (m) return t('{kind} raised.', { kind: t(m[1]) });
  m = /^(Dispute|Complaint) raised with (\d+) attachments?\.$/.exec(text);
  if (m) return t('{kind} raised with {n} attachment(s).', { kind: t(m[1]), n: m[2] });
  m = /^Sent to (.+)\. Response target (-?\d+) h\. Farmer notified by SMS\.$/.exec(text);
  if (m) return t('Sent to {owner}. Response target {n} h. Farmer notified by SMS.', { owner: trOwner(m[1], t), n: m[2] });
  m = /^Proposed outcome: (.+)\. Sent for approval\.$/.exec(text);
  if (m) return t('Proposed outcome: {outcome}. Sent for approval.', { outcome: t(m[1]) });
  return t(text);
};

/** Exception subject: "MF-… Name" stays; "Tanker NP-LH 2290" gets the word translated. */
const trSubject = (subject: string, t: TFn) => {
  const m = /^Tanker (.+)$/.exec(subject);
  return m ? t('Tanker {plate}', { plate: m[1] }) : subject;
};

export default function Quality() {
  const toast = useToast();
  const { t } = useLang();
  const [tab, setTab] = useState<TabId>('disputes');
  const [exFilter, setExFilter] = useState<ExF>('all');
  const disputes = useDisputes();
  const [selId, setSelId] = useState(disputes[0]?.id ?? '');
  const [resolution, setResolution] = useState('');
  // null = untouched default message (shown in the current language)
  const [note, setNote] = useState<string | null>(null);

  // Search parameters: date range + farmer code
  const [from, setFrom] = useState(DEFAULT_FROM);
  const [to, setTo] = useState(DEFAULT_TO);
  const [code, setCode] = useState('');
  const rangeError = from && to && from > to ? t('“From date” must be on or before “To date”.') : '';

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
  const cnt = (ty: ExF) => (ty === 'all' ? fExceptions.length : fExceptions.filter((e) => e.type === ty).length);
  const rejectedL = fExceptions.filter((e) => e.type === 'Rejected').reduce((s, e) => s + e.litres, 0);
  const isFiltered = from !== DEFAULT_FROM || to !== DEFAULT_TO || code.trim() !== '';
  const reset = () => {
    setFrom(DEFAULT_FROM);
    setTo(DEFAULT_TO);
    setCode('');
  };

  const resolve = () => {
    if (!sel) return;
    if (!resolution) return toast(t('Choose an outcome first.'), 'error');
    disputeStore.set((ds) =>
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
    toast(t('{id} sent for approval. Farmer notified by SMS.', { id: sel.id }));
  };

  const scope = code.trim() ? code.trim().toUpperCase() : t('all farmers');
  const showing =
    from && to && !rangeError
      ? t('Showing {d} disputes and {e} collection exceptions for {scope}, {from} to {to}.', {
          d: fDisputes.length,
          e: fExceptions.length,
          scope,
          from,
          to,
        })
      : t('Showing {d} disputes and {e} collection exceptions for {scope}.', { d: fDisputes.length, e: fExceptions.length, scope });

  return (
    <>
      <PageHeader
        breadcrumb={[{ label: t('Collection') }, { label: t('Quality & disputes') }]}
        title={t('Quality exceptions & disputes')}
        description={t('Rejected milk, quality and quantity deviations, and farmer disputes.')}
      />

      <Card className="mb-6">
        <form
          className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.4fr_auto] lg:items-start"
          onSubmit={(e) => e.preventDefault()}
          aria-label={t('Search disputes and exceptions')}
        >
          <Field label={t('From date')}>
            <input type="date" className="input" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} />
          </Field>
          <Field label={t('To date')} error={rangeError || undefined}>
            <input type="date" className="input" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} />
          </Field>
          <Field label={t('Farmer code')} hint={t('e.g. {code} — leave empty for all farmers', { code: 'MF-004812' })}>
            <input
              className="input num uppercase"
              list="farmer-codes"
              placeholder={t('All farmers')}
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
              <RotateCcw className="h-4 w-4" /> {t('Reset')}
            </button>
          </div>
        </form>
        <p className="border-t border-zinc-100 px-4 py-2.5 text-xs text-zinc-500" aria-live="polite">
          {showing}
        </p>
      </Card>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t('Rejected milk')}
          value={`${num(rejectedL, 1)} L`}
          hint={t('{n} deliveries in range', { n: fExceptions.filter((e) => e.type === 'Rejected').length })}
        />
        <StatCard label={t('Quality deviations')} value={String(fExceptions.filter((e) => e.type === 'Quality').length)} hint={t('Temperature, low SNF')} />
        <StatCard
          label={t('Open disputes')}
          value={String(fDisputes.filter((d) => d.status !== 'Resolved').length)}
          hint={t('{n} past response target', { n: fDisputes.filter((d) => d.status !== 'Resolved' && d.slaHours < 0).length })}
        />
        <StatCard
          label={t('Avg resolution time')}
          value={t('{n} h', { n: 38 })}
          trend={{ value: t('{n} h', { n: 6 }), up: false, good: true }}
          hint={t('vs last month')}
        />
      </div>

      <Tabs<TabId>
        value={tab}
        onChange={setTab}
        className="mb-6"
        tabs={[
          { id: 'disputes', label: t('Disputes & complaints'), count: fDisputes.length },
          { id: 'exceptions', label: t('Collection exceptions'), count: fExceptions.length },
        ]}
      />

      {tab === 'exceptions' && (
        <Card>
          <div className="border-b border-zinc-100 p-4">
            <FilterChips<ExF>
              value={exFilter}
              onChange={setExFilter}
              options={[
                { id: 'all', label: t('All'), count: cnt('all') },
                { id: 'Rejected', label: t('Rejected milk'), count: cnt('Rejected') },
                { id: 'Quality', label: t('Quality deviation'), count: cnt('Quality') },
                { id: 'Quantity', label: t('Quantity deviation'), count: cnt('Quantity') },
              ]}
            />
          </div>
          <DataTable<ExceptionItem>
            rows={ex}
            rowKey={(e) => e.id}
            empty={
              <span>
                {t('No collection exceptions match these dates or farmer code.')}{' '}
                {isFiltered && (
                  <button type="button" className="font-medium text-brand-700 hover:underline" onClick={reset}>
                    {t('Reset search')}
                  </button>
                )}
              </span>
            }
            columns={[
              { key: 'id', header: t('Reference'), mono: true },
              { key: 'date', header: t('Date') },
              { key: 'center', header: t('Center'), render: (e) => (e.center === 'Plant intake' ? t('Plant intake') : e.center) },
              { key: 'subject', header: t('Farmer / tanker'), render: (e) => trSubject(e.subject, t) },
              { key: 'type', header: t('Type'), render: (e) => <Badge tone={typeTone[e.type]}>{t(e.type)}</Badge> },
              { key: 'detail', header: t('Detail'), className: 'whitespace-normal min-w-[220px]', render: (e) => t(e.detail) },
              { key: 'litres', header: t('Litres'), align: 'right', mono: true, render: (e) => num(e.litres, 1) },
              { key: 'action', header: t('Action taken'), className: 'whitespace-normal min-w-[180px] text-zinc-600', render: (e) => t(e.action) },
              { key: 'status', header: t('Status'), render: (e) => <StatusBadge status={e.status} /> },
            ]}
          />
        </Card>
      )}

      {tab === 'disputes' && !sel && (
        <Card>
          <EmptyState
            title={t('No disputes found')}
            text={t('No disputes were raised in this date range for this farmer code.')}
            action={
              isFiltered ? (
                <button type="button" className="btn btn-secondary btn-sm mt-2" onClick={reset}>
                  <RotateCcw className="h-3.5 w-3.5" /> {t('Reset search')}
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
                  header: t('Ticket'),
                  render: (d) => (
                    <div>
                      <div className="num text-[13px] font-medium">{d.id}</div>
                      <div className="text-xs text-zinc-500">{d.farmer}</div>
                    </div>
                  ),
                },
                {
                  key: 'cat',
                  header: t('Type'),
                  render: (d) => (
                    <div className="flex flex-wrap gap-1">
                      {d.kind === 'Complaint' && <Badge tone="info">{t('Complaint')}</Badge>}
                      <Badge>{t(d.category)}</Badge>
                    </div>
                  ),
                },
                { key: 'raised', header: t('Raised') },
                { key: 'owner', header: t('Owner'), render: (d) => trOwner(d.owner, t) },
                { key: 'sla', header: t('Response target'), render: (d) => <Sla hours={d.slaHours} /> },
                { key: 'status', header: t('Status'), render: (d) => <StatusBadge status={d.status} /> },
              ]}
            />
          </Card>

          <Card className="xl:col-span-2">
            <CardHeader
              title={`${sel.farmer} · ${t(sel.category)}`}
              subtitle={t('{id} · linked {ref}', { id: sel.id, ref: sel.linked })}
              actions={<Sla hours={sel.slaHours} />}
            />
            <CardBody className="space-y-5">
              <p className="text-sm leading-relaxed text-zinc-700">{t(sel.summary)}</p>
              <div className="flex flex-wrap gap-2">
                <Badge tone="neutral">{t('Value {amount}', { amount: lkr(sel.value) })}</Badge>
                {!!sel.attachments && (
                  <Badge tone="neutral">
                    {sel.attachments > 1 ? t('{n} attachments', { n: sel.attachments }) : t('{n} attachment', { n: sel.attachments })}
                  </Badge>
                )}
                <Link to={`/farmers/${sel.farmerId}`} className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline">
                  {t('Farmer profile')} <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
              <ol className="relative space-y-4 border-l border-zinc-200 pl-5">
                {sel.timeline.map((step) => (
                  <li key={step.time + step.text} className="relative">
                    <span className="absolute -left-[25px] top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-zinc-400" />
                    <p className="text-xs text-zinc-500">
                      <span className="num">{step.time}</span> · {trWho(step.who, t)}
                    </p>
                    <p className="text-sm">{trText(step.text, t)}</p>
                  </li>
                ))}
              </ol>
              <div className="flex items-center gap-2 rounded-lg border border-dashed border-zinc-300 px-3 py-2.5 text-sm text-zinc-500">
                <Paperclip className="h-4 w-4" /> {t('Analyser printout, can photo, sample label')}
              </div>
              <Field label={t('Outcome')}>
                <select className="input" value={resolution} onChange={(e) => setResolution(e.target.value)}>
                  <option value="">{t('Choose an outcome…')}</option>
                  <option value="Uphold the rejection">{t('Uphold the rejection')}</option>
                  <option value="Reverse and pay in the next run">{t('Reverse and pay in the next run')}</option>
                  <option value="Partial credit">{t('Partial credit')}</option>
                </select>
              </Field>
              <Field label={t('Message to farmer (SMS)')}>
                <textarea className="input" rows={3} value={note ?? t(DEFAULT_NOTE)} onChange={(e) => setNote(e.target.value)} />
              </Field>
              <div className="flex flex-wrap justify-end gap-2">
                <button className="btn btn-secondary" onClick={() => toast(t('Escalated to Regional Manager'))}>
                  {t('Escalate')}
                </button>
                <button className="btn btn-primary" onClick={resolve}>
                  <Send className="h-4 w-4" /> {t('Send for approval')}
                </button>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </>
  );
}
