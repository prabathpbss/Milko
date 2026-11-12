import { useState } from 'react';
import clsx from 'clsx';
import { Pause, Play, Plus, RotateCcw, Save } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { FilterChips } from '@/components/ui/Tabs';
import StatCard from '@/components/ui/StatCard';
import { fieldMappings, syncLog as seedLog, type FieldMap, type SyncLogEntry } from '@/data/mock';
import { useToast } from '@/context/ToastContext';

type F = 'all' | SyncLogEntry['result'];
const entities = Object.keys(fieldMappings);
const transforms = ['None', 'Prefix "F-"', 'Lookup table', 'E.164 format', 'yyyy-MM-dd', '+1 day', 'Active → tNO', 'Constant "cSupplier"', 'Constant "RM-MILK-RAW"'];

export default function ErpSync() {
  const toast = useToast();
  const [entity, setEntity] = useState(entities[0]);
  const [maps, setMaps] = useState(fieldMappings);
  const [log, setLog] = useState(seedLog);
  const [filter, setFilter] = useState<F>('all');
  const [paused, setPaused] = useState(false);

  const rows = maps[entity];
  const shown = filter === 'all' ? log : log.filter((l) => l.result === filter);
  const cnt = (f: F) => (f === 'all' ? log.length : log.filter((l) => l.result === f).length);

  const update = (i: number, patch: Partial<FieldMap>) =>
    setMaps((m) => ({ ...m, [entity]: m[entity].map((r, j) => (j === i ? { ...r, ...patch } : r)) }));

  const retry = (id: string) => {
    setLog((l) => l.map((e) => (e.id === id ? { ...e, result: 'Retrying', message: 'Queued for retry…', attempts: '1 / 5' } : e)));
    window.setTimeout(() => {
      setLog((l) =>
        l.map((e) => (e.id === id ? { ...e, result: 'Posted', doc: String(4500022000 + Math.floor(Math.random() * 900)), message: 'Created on retry' } : e)),
      );
      toast('Document posted to SAP Business One');
    }, 1200);
  };

  return (
    <>
      <PageHeader
        breadcrumb={[{ label: 'Administration' }, { label: 'ERP connectors', to: '/erp' }, { label: 'Mapping & sync log' }]}
        title="Field mapping & sync log"
        description="Active connector: SAP Business One (Service Layer)."
        actions={
          <>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setPaused((p) => !p);
                toast(paused ? 'Sync resumed' : 'Sync paused. Documents will queue until you resume.', 'info');
              }}
            >
              {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />} {paused ? 'Resume sync' : 'Pause sync'}
            </button>
            <button className="btn btn-primary" onClick={() => toast('Sync started for 128 queued documents')}>
              <RotateCcw className="h-4 w-4" /> Run sync now
            </button>
          </>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Queued" value={paused ? '128 · paused' : '128'} hint="Evening shift milk receipts" />
        <StatCard label="Posted today" value="2,904" hint="Avg 380 ms per document" />
        <StatCard label="Failed" value={String(log.filter((l) => l.result === 'Failed').length)} tone="danger" hint="Need action" />
        <StatCard label="Last full sync" value="01:00" hint="Items and centers, passed" />
      </div>

      <Card className="mb-6">
        <CardHeader
          title="Field mapping"
          subtitle="Saved per connector. Switching ERP keeps the MILCO side and asks you to map the new ERP's fields."
          actions={
            <>
              <select className="input w-full sm:w-72" aria-label="Mapping" value={entity} onChange={(e) => setEntity(e.target.value)}>
                {entities.map((e) => <option key={e}>{e}</option>)}
              </select>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() =>
                  setMaps((m) => ({ ...m, [entity]: [...m[entity], { milco: 'new.field', type: 'Text', erp: 'U_NEW (UDF)', transform: 'None', required: false, sample: '—' }] }))
                }
              >
                <Plus className="h-3.5 w-3.5" /> Field
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => toast('Mapping saved as version 5')}>
                <Save className="h-3.5 w-3.5" /> Save
              </button>
            </>
          }
        />
        <DataTable<FieldMap>
          rows={rows}
          rowKey={(r) => r.milco + r.erp}
          dense
          columns={[
            { key: 'milco', header: 'MILCO field', mono: true },
            { key: 'type', header: 'Type', render: (r) => <Badge>{r.type}</Badge> },
            {
              key: 'erp',
              header: 'ERP field',
              render: (r, i) => (
                <input className="input num h-9 min-w-[220px] text-xs" value={r.erp} onChange={(e) => update(i, { erp: e.target.value })} aria-label="ERP field" />
              ),
            },
            {
              key: 'transform',
              header: 'Transform',
              render: (r, i) => (
                <select className="input h-9 min-w-[170px] text-xs" value={r.transform} onChange={(e) => update(i, { transform: e.target.value })} aria-label="Transform">
                  {[r.transform, ...transforms.filter((t) => t !== r.transform)].map((t) => <option key={t}>{t}</option>)}
                </select>
              ),
            },
            { key: 'req', header: 'Required', render: (r) => (r.required ? <Badge tone="brand">Required</Badge> : <span className="text-xs text-zinc-500">Optional</span>) },
            { key: 'sample', header: 'Sample', mono: true, className: 'text-zinc-600' },
          ]}
        />
      </Card>

      <Card>
        <CardHeader title="Sync log" subtitle="Today" />
        <div className="border-b border-zinc-100 p-4">
          <FilterChips<F>
            value={filter}
            onChange={setFilter}
            options={[
              { id: 'all', label: 'All', count: cnt('all') },
              { id: 'Failed', label: 'Failed', count: cnt('Failed') },
              { id: 'Retrying', label: 'Retrying', count: cnt('Retrying') },
              { id: 'Posted', label: 'Posted', count: cnt('Posted') },
            ]}
          />
        </div>
        <DataTable<SyncLogEntry>
          rows={shown}
          rowKey={(l) => l.id}
          columns={[
            { key: 'time', header: 'Time', mono: true },
            { key: 'direction', header: 'Direction', render: (l) => <span className="text-xs text-zinc-600">{l.direction}</span> },
            { key: 'record', header: 'Record', mono: true },
            { key: 'object', header: 'ERP object' },
            { key: 'doc', header: 'ERP document', mono: true },
            { key: 'attempts', header: 'Attempts', mono: true },
            { key: 'result', header: 'Result', render: (l) => <StatusBadge status={l.result} /> },
            {
              key: 'message',
              header: 'Message',
              className: 'whitespace-normal min-w-[260px]',
              render: (l) => <span className={clsx(l.result === 'Failed' && 'text-red-700')}>{l.message}</span>,
            },
            {
              key: 'act',
              header: '',
              render: (l) =>
                l.result === 'Failed' ? (
                  <button className="btn btn-secondary btn-sm" onClick={() => retry(l.id)}>
                    <RotateCcw className="h-3.5 w-3.5" /> Retry
                  </button>
                ) : null,
            },
          ]}
        />
      </Card>
    </>
  );
}
