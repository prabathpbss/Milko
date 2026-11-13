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
import { useLang } from '@/i18n/LanguageContext';

type F = 'all' | SyncLogEntry['result'];
type T = ReturnType<typeof useLang>['t'];
const entities = Object.keys(fieldMappings);
const transforms = ['None', 'Prefix "F-"', 'Lookup table', 'E.164 format', 'yyyy-MM-dd', '+1 day', 'Active → tNO', 'Constant "cSupplier"', 'Constant "RM-MILK-RAW"'];

/** Transform and record values from data that have a Sinhala label. Codes such as yyyy-MM-dd stay as they are. */
const TRANSLATED_VALUES = new Set([
  'None', 'Prefix "F-"', 'Lookup table', 'E.164 format', '+1 day', 'Constant "cSupplier"', 'Constant "RM-MILK-RAW"',
  'Items (feed, vet, cans)', 'Collection centers',
]);
const tv = (v: string, t: T) => (TRANSLATED_VALUES.has(v) ? t(v) : v);

/** Sync log messages from the ERP connector, with the varying parts kept as they are. */
const MESSAGE_PATTERNS: [RegExp, string, string[]][] = [
  [/^Business partner (\S+) does not exist\. Sync the farmer first\.$/, 'Business partner {bp} does not exist. Sync the farmer first.', ['bp']],
  [/^Service Layer timeout after (\d+) s\. Next try at (\S+)\.$/, 'Service Layer timeout after {s} s. Next try at {time}.', ['s', 'time']],
  [/^Posting period (\S+) is locked in SAP B1\.$/, 'Posting period {period} is locked in SAP B1.', ['period']],
  [/^Item (\S+) is inactive in SAP B1\.$/, 'Item {item} is inactive in SAP B1.', ['item']],
  [/^Created, ([\d,]+) lines$/, 'Created, {n} lines', ['n']],
  [/^(\d+) new, (\d+) price updates$/, '{n} new, {m} price updates', ['n', 'm']],
  [/^(\d+) records$/, '{n} records', ['n']],
];
const FIXED_MESSAGES = new Set(['Created', 'No changes', 'Queued for retry…', 'Created on retry']);

function trMessage(msg: string, t: T) {
  if (FIXED_MESSAGES.has(msg)) return t(msg);
  for (const [re, key, names] of MESSAGE_PATTERNS) {
    const m = re.exec(msg);
    if (m) return t(key, Object.fromEntries(names.map((n, i) => [n, m[i + 1]])));
  }
  return msg;
}

/** "Farmer → Business Partner": translate the MILCO side, keep the ERP object name. */
const entityLabel = (e: string, t: T) => {
  const [milco, erp] = e.split(' → ');
  return erp ? `${t(milco)} → ${erp}` : e;
};

export default function ErpSync() {
  const toast = useToast();
  const { t } = useLang();
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
      toast(t('Document posted to {erp}', { erp: 'SAP Business One' }));
    }, 1200);
  };

  return (
    <>
      <PageHeader
        breadcrumb={[{ label: t('Administration') }, { label: t('ERP connectors'), to: '/erp' }, { label: t('Mapping & sync log') }]}
        title={t('Field mapping & sync log')}
        description={t('Active connector: {name}.', { name: 'SAP Business One (Service Layer)' })}
        actions={
          <>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setPaused((p) => !p);
                toast(paused ? t('Sync resumed') : t('Sync paused. Documents will queue until you resume.'), 'info');
              }}
            >
              {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />} {paused ? t('Resume sync') : t('Pause sync')}
            </button>
            <button className="btn btn-primary" onClick={() => toast(t('Sync started for {n} queued documents', { n: 128 }))}>
              <RotateCcw className="h-4 w-4" /> {t('Run sync now')}
            </button>
          </>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('Queued')} value={paused ? t('{n} · paused', { n: 128 }) : '128'} hint={t('Evening shift milk receipts')} />
        <StatCard label={t('Posted today')} value="2,904" hint={t('Avg {ms} ms per document', { ms: 380 })} />
        <StatCard label={t('Failed')} value={String(log.filter((l) => l.result === 'Failed').length)} tone="danger" hint={t('Need action')} />
        <StatCard label={t('Last full sync')} value="01:00" hint={t('Items and centers, passed')} />
      </div>

      <Card className="mb-6">
        <CardHeader
          title={t('Field mapping')}
          subtitle={t("Saved per connector. Switching ERP keeps the MILCO side and asks you to map the new ERP's fields.")}
          actions={
            <>
              <select className="input w-full sm:w-72" aria-label={t('Mapping')} value={entity} onChange={(e) => setEntity(e.target.value)}>
                {entities.map((e) => (
                  <option key={e} value={e}>
                    {entityLabel(e, t)}
                  </option>
                ))}
              </select>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() =>
                  setMaps((m) => ({ ...m, [entity]: [...m[entity], { milco: 'new.field', type: 'Text', erp: 'U_NEW (UDF)', transform: 'None', required: false, sample: '—' }] }))
                }
              >
                <Plus className="h-3.5 w-3.5" /> {t('Field')}
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => toast(t('Mapping saved as version {n}', { n: 5 }))}>
                <Save className="h-3.5 w-3.5" /> {t('Save')}
              </button>
            </>
          }
        />
        <DataTable<FieldMap>
          rows={rows}
          rowKey={(r) => r.milco + r.erp}
          dense
          columns={[
            { key: 'milco', header: t('MILCO field'), mono: true },
            { key: 'type', header: t('Type'), render: (r) => <Badge>{t(r.type)}</Badge> },
            {
              key: 'erp',
              header: t('ERP field'),
              render: (r, i) => (
                <input className="input num h-9 min-w-[220px] text-xs" value={r.erp} onChange={(e) => update(i, { erp: e.target.value })} aria-label={t('ERP field')} />
              ),
            },
            {
              key: 'transform',
              header: t('Transform'),
              render: (r, i) => (
                <select className="input h-9 min-w-[170px] text-xs" value={r.transform} onChange={(e) => update(i, { transform: e.target.value })} aria-label={t('Transform')}>
                  {[r.transform, ...transforms.filter((x) => x !== r.transform)].map((x) => (
                    <option key={x} value={x}>
                      {tv(x, t)}
                    </option>
                  ))}
                </select>
              ),
            },
            { key: 'req', header: t('Required'), render: (r) => (r.required ? <Badge tone="brand">{t('Required')}</Badge> : <span className="text-xs text-zinc-500">{t('Optional')}</span>) },
            { key: 'sample', header: t('Sample'), mono: true, className: 'text-zinc-600' },
          ]}
        />
      </Card>

      <Card>
        <CardHeader title={t('Sync log')} subtitle={t('Today')} />
        <div className="border-b border-zinc-100 p-4">
          <FilterChips<F>
            value={filter}
            onChange={setFilter}
            options={[
              { id: 'all', label: t('All'), count: cnt('all') },
              { id: 'Failed', label: t('Failed'), count: cnt('Failed') },
              { id: 'Retrying', label: t('Retrying'), count: cnt('Retrying') },
              { id: 'Posted', label: t('Posted'), count: cnt('Posted') },
            ]}
          />
        </div>
        <DataTable<SyncLogEntry>
          rows={shown}
          rowKey={(l) => l.id}
          columns={[
            { key: 'time', header: t('Time'), mono: true },
            { key: 'direction', header: t('Direction'), render: (l) => <span className="text-xs text-zinc-600">{l.direction}</span> },
            { key: 'record', header: t('Record'), mono: true, render: (l) => tv(l.record, t) },
            { key: 'object', header: t('ERP object') },
            { key: 'doc', header: t('ERP document'), mono: true, render: (l) => trMessage(l.doc, t) },
            { key: 'attempts', header: t('Attempts'), mono: true },
            { key: 'result', header: t('Result'), render: (l) => <StatusBadge status={l.result} /> },
            {
              key: 'message',
              header: t('Message'),
              className: 'whitespace-normal min-w-[260px]',
              render: (l) => <span className={clsx(l.result === 'Failed' && 'text-red-700')}>{trMessage(l.message, t)}</span>,
            },
            {
              key: 'act',
              header: '',
              render: (l) =>
                l.result === 'Failed' ? (
                  <button className="btn btn-secondary btn-sm" onClick={() => retry(l.id)}>
                    <RotateCcw className="h-3.5 w-3.5" /> {t('Retry')}
                  </button>
                ) : null,
            },
          ]}
        />
      </Card>
    </>
  );
}
