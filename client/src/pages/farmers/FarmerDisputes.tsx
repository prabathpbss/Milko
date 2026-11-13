import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ShieldCheck } from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { Badge, SlaBadge, StatusBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/misc';
import type { Dispute } from '@/data/mock';
import { useDisputes } from '@/data/disputes';
import { lkr } from '@/lib/format';
import { useLang } from '@/i18n/LanguageContext';

type T = (s: string, v?: Record<string, string | number>) => string;

/** Owner is "Team · Person" or "Team · not assigned": translate the team and "not assigned", keep names. */
const trOwner = (owner: string, t: T) =>
  owner
    .split(' · ')
    .map((part) => t(part))
    .join(' · ');

/** "Counter 2" style channel names keep their number. */
function trWho(who: string, t: T) {
  const m = /^Counter (\d+)$/.exec(who);
  return m ? t('Counter {n}', { n: m[1] }) : t(who);
}

/** Timeline lines made by raiseDispute() carry numbers and team names, so they are matched by pattern. */
function trTimeline(text: string, t: T) {
  let m = /^(Dispute|Complaint) raised with (\d+) attachments?\.$/.exec(text);
  if (m) return t(`${m[1]} raised with {n} attachment(s).`, { n: m[2] });
  m = /^Sent to (.+)\. Response target (-?\d+) h\. Farmer notified by SMS\.$/.exec(text);
  if (m) return t('Sent to {owner}. Response target {n} h. Farmer notified by SMS.', { owner: trOwner(m[1], t), n: m[2] });
  return t(text);
}

/** Read-only, farmer-wise view of disputes shown as a tab on the farmer profile. */
export default function FarmerDisputes({ farmerId }: { farmerId: string }) {
  const { t } = useLang();
  const rows = useDisputes().filter((d) => d.farmerId === farmerId);
  const [selId, setSelId] = useState<string | null>(rows[0]?.id ?? null);
  const sel = rows.find((d) => d.id === selId) ?? rows[0];

  if (!rows.length) {
    return (
      <Card>
        <EmptyState
          title={t('No disputes for this farmer')}
          text={t('Quality, quantity and payment disputes raised by or for this farmer will appear here with their timeline.')}
        />
      </Card>
    );
  }

  const open = rows.filter((d) => d.status !== 'Resolved');
  const resolved = rows.length - open.length;
  const openValue = open.reduce((s, d) => s + d.value, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          [t('Open disputes'), String(open.length)],
          [t('Resolved'), String(resolved)],
          [t('Value under dispute'), lkr(openValue)],
        ].map(([label, value]) => (
          <div key={label} className="card p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</p>
            <p className="num mt-2 text-xl font-semibold">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader title={t('Disputes')} subtitle={t('{n} raised by or for this farmer', { n: rows.length })} />
          <DataTable<Dispute>
            rows={rows}
            rowKey={(d) => d.id}
            selectedKey={sel?.id}
            onRowClick={(d) => setSelId(d.id)}
            columns={[
              { key: 'id', header: t('Ticket'), mono: true, render: (d) => <span className="font-medium">{d.id}</span> },
              { key: 'cat', header: t('Category'), render: (d) => <Badge>{t(d.category)}</Badge> },
              { key: 'raised', header: t('Raised') },
              { key: 'value', header: t('Value'), align: 'right', mono: true, render: (d) => lkr(d.value) },
              { key: 'sla', header: t('Response target'), render: (d) => <SlaBadge hours={d.slaHours} resolved={d.status === 'Resolved'} /> },
              { key: 'status', header: t('Status'), render: (d) => <StatusBadge status={d.status} /> },
            ]}
          />
        </Card>

        {sel && (
          <Card className="xl:col-span-2">
            <CardHeader
              title={t(`${sel.category} ${(sel.kind ?? 'Dispute').toLowerCase()}`)}
              subtitle={t('{id} · linked {ref}', { id: sel.id, ref: sel.linked })}
              actions={<StatusBadge status={sel.status} />}
            />
            <CardBody className="space-y-5">
              <p className="text-sm leading-relaxed text-zinc-700">{t(sel.summary)}</p>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs text-zinc-500">{t('Owner')}</dt>
                  <dd>{trOwner(sel.owner, t)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-zinc-500">{t('Value')}</dt>
                  <dd className="num">{lkr(sel.value)}</dd>
                </div>
              </dl>
              <div>
                <p className="label mb-3">{t('Timeline')}</p>
                <ol className="relative space-y-4 border-l border-zinc-200 pl-5">
                  {sel.timeline.map((ev) => (
                    <li key={ev.time + ev.text} className="relative">
                      <span className="absolute -left-[25px] top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-zinc-400" />
                      <p className="text-xs text-zinc-500">
                        <span className="num">{ev.time}</span> · {trWho(ev.who, t)}
                      </p>
                      <p className="text-sm">{trTimeline(ev.text, t)}</p>
                    </li>
                  ))}
                </ol>
              </div>
              {sel.status === 'Resolved' ? (
                <p className="flex items-center gap-2 text-sm text-emerald-700">
                  <ShieldCheck className="h-4 w-4" /> {t('Closed — no action needed')}
                </p>
              ) : (
                <Link to="/quality" className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline">
                  {t('Work on it in Quality & disputes')} <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
