import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ShieldCheck } from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { Badge, SlaBadge, StatusBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/misc';
import { disputes, type Dispute } from '@/data/mock';
import { lkr } from '@/lib/format';

/** Read-only, farmer-wise view of disputes shown as a tab on the farmer profile. */
export default function FarmerDisputes({ farmerId }: { farmerId: string }) {
  const rows = disputes.filter((d) => d.farmerId === farmerId);
  const [selId, setSelId] = useState<string | null>(rows[0]?.id ?? null);
  const sel = rows.find((d) => d.id === selId) ?? rows[0];

  if (!rows.length) {
    return (
      <Card>
        <EmptyState
          title="No disputes for this farmer"
          text="Quality, quantity and payment disputes raised by or for this farmer will appear here with their timeline."
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
          ['Open disputes', String(open.length)],
          ['Resolved', String(resolved)],
          ['Value under dispute', lkr(openValue)],
        ].map(([label, value]) => (
          <div key={label} className="card p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</p>
            <p className="num mt-2 text-xl font-semibold">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader title="Disputes" subtitle={`${rows.length} raised by or for this farmer`} />
          <DataTable<Dispute>
            rows={rows}
            rowKey={(d) => d.id}
            selectedKey={sel?.id}
            onRowClick={(d) => setSelId(d.id)}
            columns={[
              { key: 'id', header: 'Ticket', mono: true, render: (d) => <span className="font-medium">{d.id}</span> },
              { key: 'cat', header: 'Category', render: (d) => <Badge>{d.category}</Badge> },
              { key: 'raised', header: 'Raised' },
              { key: 'value', header: 'Value', align: 'right', mono: true, render: (d) => lkr(d.value) },
              { key: 'sla', header: 'Response target', render: (d) => <SlaBadge hours={d.slaHours} resolved={d.status === 'Resolved'} /> },
              { key: 'status', header: 'Status', render: (d) => <StatusBadge status={d.status} /> },
            ]}
          />
        </Card>

        {sel && (
          <Card className="xl:col-span-2">
            <CardHeader
              title={`${sel.category} dispute`}
              subtitle={`${sel.id} · linked ${sel.linked}`}
              actions={<StatusBadge status={sel.status} />}
            />
            <CardBody className="space-y-5">
              <p className="text-sm leading-relaxed text-zinc-700">{sel.summary}</p>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs text-zinc-500">Owner</dt>
                  <dd>{sel.owner}</dd>
                </div>
                <div>
                  <dt className="text-xs text-zinc-500">Value</dt>
                  <dd className="num">{lkr(sel.value)}</dd>
                </div>
              </dl>
              <div>
                <p className="label mb-3">Timeline</p>
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
              </div>
              {sel.status === 'Resolved' ? (
                <p className="flex items-center gap-2 text-sm text-emerald-700">
                  <ShieldCheck className="h-4 w-4" /> Closed — no action needed
                </p>
              ) : (
                <Link to="/quality" className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline">
                  Work on it in Quality &amp; disputes <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
