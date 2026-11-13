import { useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { CheckCircle2, Download, Lock, Printer, ScanLine, Thermometer, XCircle } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/Badge';
import { FilterChips } from '@/components/ui/Tabs';
import { Field } from '@/components/ui/Field';
import { Progress } from '@/components/ui/misc';
import { centers, deliveries as seed, farmers, type Delivery } from '@/data/mock';
import { evaluateDelivery } from '@/lib/pricing';
import { lkr, num } from '@/lib/format';
import { useToast } from '@/context/ToastContext';
import { useLang } from '@/i18n/LanguageContext';

type TFn = (s: string, v?: Record<string, string | number>) => string;

/** Quality reasons from evaluateDelivery come as English sentences; translate the known shapes. */
function trReason(r: string, t: TFn) {
  let m = /^Adulteration: (.+)$/.exec(r);
  if (m) return t('Adulteration: {what}', { what: t(m[1]) });
  m = /^Below minimum \(FAT (.+) \/ SNF (.+)\)$/.exec(r);
  if (m) return t('Below minimum (FAT {fat} / SNF {snf})', { fat: m[1], snf: m[2] });
  m = /^Temperature (.+) °C above (.+) °C$/.exec(r);
  if (m) return t('Temperature {temp} °C above {max} °C', { temp: m[1], max: m[2] });
  return t(r);
}

/** "Recorded by" values such as "Counter 2" or "Mobile · K.D.". */
function trBy(by: string, t: TFn) {
  const m = /^Counter (\d+)$/.exec(by);
  if (m) return t('Counter {n}', { n: m[1] });
  const [head, ...rest] = by.split(' · ');
  return rest.length ? [t(head), ...rest].join(' · ') : t(by);
}

type F = 'all' | Delivery['result'];

const blank = { farmerId: 'MF-004812', litres: '44.0', fat: '4.10', snf: '8.60', temp: '6.8', clr: '28.5', alcohol: 'Pass', adulteration: 'None found', cans: '2' };

export default function Collection() {
  const toast = useToast();
  const { t } = useLang();
  const [centerId, setCenterId] = useState('CC-HNG');
  const [shift, setShift] = useState<'AM' | 'PM'>('AM');
  const [rows, setRows] = useState<Delivery[]>(seed);
  const [filter, setFilter] = useState<F>('all');
  const [form, setForm] = useState(blank);
  const [closed, setClosed] = useState(false);

  const center = centers.find((c) => c.id === centerId)!;
  const farmer = farmers.find((f) => f.id === form.farmerId);

  const evaluation = useMemo(() => {
    const litres = parseFloat(form.litres);
    const fat = parseFloat(form.fat);
    const snf = parseFloat(form.snf);
    const temp = parseFloat(form.temp);
    if (![litres, fat, snf, temp].every(Number.isFinite) || litres <= 0) return null;
    return evaluateDelivery({
      litres, fat, snf, temp,
      alcohol: form.alcohol as 'Pass' | 'Fail',
      adulteration: form.adulteration,
      category: farmer?.category ?? 'Standard',
    });
  }, [form, farmer]);

  const set = (k: keyof typeof blank) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = (e: FormEvent, override?: 'Rejected') => {
    e.preventDefault();
    if (!farmer) return toast(t('Choose a registered farmer first.'), 'error');
    if (!evaluation) return toast(t('Enter litres, FAT, SNF and temperature.'), 'error');
    const result = override ?? evaluation.result;
    const now = new Date();
    const d: Delivery = {
      id: `D-${1013 + rows.length}`,
      time: now.toTimeString().slice(0, 5),
      shift,
      farmerId: farmer.id,
      farmerName: farmer.name,
      litres: parseFloat(form.litres),
      fat: parseFloat(form.fat),
      snf: parseFloat(form.snf),
      temp: parseFloat(form.temp),
      alcohol: form.alcohol as 'Pass' | 'Fail',
      adulteration: form.adulteration,
      result,
      by: 'Counter 1',
      value: result === 'Rejected' ? 0 : evaluation.value,
    };
    setRows((r) => [d, ...r]);
    toast(
      result === 'Rejected'
        ? t('Rejected {litres} L from {name}. SMS sent.', { litres: d.litres, name: farmer.name })
        : t('Saved {litres} L · {value}. Receipt printing.', { litres: d.litres, value: lkr(d.value) }),
    );
    setForm({ ...blank, farmerId: '', litres: '', fat: '', snf: '', temp: '' });
  };

  const accepted = rows.filter((r) => r.result !== 'Rejected');
  const acceptedL = accepted.reduce((s, r) => s + r.litres, 0);
  const rejectedL = rows.filter((r) => r.result === 'Rejected').reduce((s, r) => s + r.litres, 0);
  const avgFat = accepted.reduce((s, r) => s + r.fat * r.litres, 0) / Math.max(1, acceptedL);
  const avgSnf = accepted.reduce((s, r) => s + r.snf * r.litres, 0) / Math.max(1, acceptedL);
  const shown = filter === 'all' ? rows : rows.filter((r) => r.result === filter);
  const cnt = (s: F) => (s === 'all' ? rows.length : rows.filter((r) => r.result === s).length);
  const loaded = center.todayLitres - 1180 + acceptedL;

  return (
    <>
      <PageHeader
        breadcrumb={[{ label: t('Collection') }, { label: t('Daily collection') }]}
        title={t(shift === 'AM' ? '{center} · Morning shift' : '{center} · Evening shift', { center: center.name })}
        description={t('12 Nov 2026 · weighing scale and milk analyser connected')}
        actions={
          <>
            <select className="input w-48" aria-label={t('Collection center')} value={centerId} onChange={(e) => setCenterId(e.target.value)}>
              {centers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select className="input w-32" aria-label={t('Shift')} value={shift} onChange={(e) => setShift(e.target.value as 'AM' | 'PM')}>
              <option value="AM">{t('Morning')}</option>
              <option value="PM">{t('Evening')}</option>
            </select>
            <button
              className="btn btn-dark"
              disabled={closed}
              onClick={() => {
                setClosed(true);
                toast(t('Shift closed. Goods receipt queued for SAP B1.'));
              }}
            >
              <Lock className="h-4 w-4" /> {closed ? t('Shift closed') : t('Close shift')}
            </button>
          </>
        }
      />

      <Card className="mb-6">
        <CardHeader
          title={t('New delivery')}
          subtitle={
            farmer
              ? t('{name} · {category} · usually {litres} L per shift', { name: farmer.name, category: t(farmer.category), litres: num(farmer.avgLitres / 2, 0) })
              : t('Scan the farmer card or type the farmer ID')
          }
        />
        <form onSubmit={(e) => save(e)}>
          <CardBody className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-8">
              <Field label={t('Farmer')} className="sm:col-span-2">
                <div className="flex gap-2">
                  <select className="input" value={form.farmerId} onChange={set('farmerId')} disabled={closed}>
                    <option value="">{t('Select farmer…')}</option>
                    {farmers.filter((f) => f.status !== 'Suspended').map((f) => (
                      <option key={f.id} value={f.id}>{f.id} · {f.name}</option>
                    ))}
                  </select>
                  <button type="button" className="btn btn-secondary btn-icon shrink-0" aria-label={t('Scan farmer card')} onClick={() => setForm((f) => ({ ...f, farmerId: 'MF-004812' }))}>
                    <ScanLine className="h-4 w-4" />
                  </button>
                </div>
              </Field>
              <Field label={t('Litres')}><input className="input num text-base font-semibold" inputMode="decimal" value={form.litres} onChange={set('litres')} disabled={closed} /></Field>
              <Field label={t('FAT %')}><input className="input num" inputMode="decimal" value={form.fat} onChange={set('fat')} disabled={closed} /></Field>
              <Field label={t('SNF %')}><input className="input num" inputMode="decimal" value={form.snf} onChange={set('snf')} disabled={closed} /></Field>
              <Field label={t('Temp °C')}><input className="input num" inputMode="decimal" value={form.temp} onChange={set('temp')} disabled={closed} /></Field>
              <Field label={t('Density (CLR)')}><input className="input num" inputMode="decimal" value={form.clr} onChange={set('clr')} disabled={closed} /></Field>
              <Field label={t('Cans')}><input className="input num" inputMode="numeric" value={form.cans} onChange={set('cans')} disabled={closed} /></Field>
              <Field label={t('Alcohol test')}>
                <select className="input" value={form.alcohol} onChange={set('alcohol')} disabled={closed}>
                  <option value="Pass">{t('Pass')}</option>
                  <option value="Fail">{t('Fail')}</option>
                </select>
              </Field>
              <Field label={t('Adulteration')}>
                <select className="input" value={form.adulteration} onChange={set('adulteration')} disabled={closed}>
                  <option value="None found">{t('None found')}</option>
                  <option value="Water">{t('Water')}</option>
                  <option value="Starch">{t('Starch')}</option>
                  <option value="Sugar">{t('Sugar')}</option>
                  <option value="Neutraliser">{t('Neutraliser')}</option>
                </select>
              </Field>
            </div>

            <div className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4 lg:flex-row lg:items-center lg:justify-between">
              {evaluation ? (
                <div className="flex items-start gap-3">
                  {evaluation.result === 'Rejected' ? (
                    <XCircle className="mt-0.5 h-6 w-6 shrink-0 text-red-600" />
                  ) : evaluation.result === 'Flagged' ? (
                    <Thermometer className="mt-0.5 h-6 w-6 shrink-0 text-amber-600" />
                  ) : (
                    <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" />
                  )}
                  <div>
                    <p className="text-sm font-semibold">
                      {evaluation.result === 'Rejected'
                        ? t('Reject this delivery')
                        : t('{result} · Rs {rate} per litre', { result: t(evaluation.result), rate: evaluation.rate.toFixed(2) })}
                    </p>
                    <p className="text-sm text-zinc-600">
                      {evaluation.reasons.length
                        ? evaluation.reasons.map((r) => trReason(r, t)).join(' · ')
                        : t('Passed all quality checks, chill bonus applied.')}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-zinc-500">{t('Enter readings to see the result and value.')}</p>
              )}
              <div className="flex flex-wrap items-center gap-3">
                {evaluation && evaluation.result !== 'Rejected' && (
                  <span className="num text-xl font-semibold">{lkr(evaluation.value)}</span>
                )}
                <button type="button" className="btn btn-secondary" disabled={closed} onClick={(e) => save(e, 'Rejected')}>
                  {t('Reject')}
                </button>
                <button type="submit" className="btn btn-primary" disabled={closed || !evaluation}>
                  <Printer className="h-4 w-4" /> {evaluation?.result === 'Rejected' ? t('Save rejection') : t('Accept & print receipt')}
                </button>
              </div>
            </div>
          </CardBody>
        </form>
      </Card>

      <div className="grid gap-6 xl:grid-cols-4">
        <Card className="xl:col-span-3">
          <CardHeader
            title={t("This shift's deliveries")}
            actions={
              <button className="btn btn-secondary btn-sm" onClick={() => toast(t('Shift report exported'))}>
                <Download className="h-3.5 w-3.5" /> {t('Export')}
              </button>
            }
          />
          <div className="border-b border-zinc-100 px-4 py-3">
            <FilterChips<F>
              value={filter}
              onChange={setFilter}
              options={[
                { id: 'all', label: t('All'), count: cnt('all') },
                { id: 'Accepted', label: t('Accepted'), count: cnt('Accepted') },
                { id: 'Flagged', label: t('Flagged'), count: cnt('Flagged') },
                { id: 'Rejected', label: t('Rejected'), count: cnt('Rejected') },
              ]}
            />
          </div>
          <DataTable<Delivery>
            rows={shown}
            rowKey={(r) => r.id}
            columns={[
              { key: 'time', header: t('Time'), mono: true },
              {
                key: 'farmer',
                header: t('Farmer'),
                render: (r) => (
                  <div>
                    <div className="font-medium">{r.farmerName}</div>
                    <div className="num text-xs text-zinc-500">{r.farmerId}</div>
                  </div>
                ),
              },
              { key: 'litres', header: t('Litres'), align: 'right', mono: true, render: (r) => num(r.litres, 1) },
              { key: 'fat', header: 'FAT', align: 'right', mono: true, render: (r) => r.fat.toFixed(2) },
              { key: 'snf', header: 'SNF', align: 'right', mono: true, render: (r) => r.snf.toFixed(2) },
              {
                key: 'temp',
                header: '°C',
                align: 'right',
                render: (r) => <span className={clsx('num', r.temp > 10 && 'font-semibold text-amber-700')}>{r.temp.toFixed(1)}</span>,
              },
              {
                key: 'tests',
                header: t('Tests'),
                render: (r) => (
                  <span className="text-xs text-zinc-600">
                    {t('Alcohol')} {r.alcohol === 'Pass' ? '✓' : '✗'} · {r.adulteration === 'None found' ? t('Clean') : t(r.adulteration)}
                  </span>
                ),
              },
              { key: 'result', header: t('Result'), render: (r) => <StatusBadge status={r.result} /> },
              { key: 'value', header: t('Value'), align: 'right', mono: true, render: (r) => (r.value ? lkr(r.value) : '—') },
              { key: 'by', header: t('Recorded by'), className: 'text-zinc-500', render: (r) => trBy(r.by, t) },
            ]}
          />
          <p className="border-t border-zinc-100 px-5 py-3 text-xs text-zinc-500">
            {t('Edits after the shift is closed need supervisor approval and are kept in the audit trail.')}{' '}
            <Link to="/quality" className="font-medium text-brand-700 hover:underline">
              {t('View exceptions')}
            </Link>
          </p>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader title={t('Shift summary')} />
            <CardBody className="space-y-4">
              {[
                [t('Accepted'), `${num(acceptedL, 1)} L`],
                [t('Rejected'), `${num(rejectedL, 1)} L`],
                [t('Avg FAT / SNF'), `${avgFat.toFixed(2)} / ${avgSnf.toFixed(2)}`],
                [t('Deliveries'), num(rows.length)],
              ].map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between gap-2">
                  <span className="text-sm text-zinc-500">{k}</span>
                  <span className="num text-lg font-semibold">{v}</span>
                </div>
              ))}
              <div className="space-y-1.5 border-t border-zinc-100 pt-4">
                <div className="flex justify-between text-xs text-zinc-500">
                  <span>{t('Center capacity')}</span>
                  <span className="num">{num(loaded)} / {num(center.capacity)} L</span>
                </div>
                <Progress value={loaded} max={center.capacity} tone={loaded / center.capacity > 0.95 ? 'warning' : 'dark'} label={t('Center capacity')} />
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title={t('Chillers & tanker')} />
            <CardBody className="space-y-3 text-sm">
              <div className="flex justify-between"><span>{t('Chiller tank {n}', { n: 1 })}</span><span className="num">9,800 L · 4.1 °C</span></div>
              <div className="flex justify-between"><span>{t('Chiller tank {n}', { n: 2 })}</span><span className="num">8,210 L · 4.4 °C</span></div>
              <div className="flex items-center justify-between">
                <span>NP-LK 4521 · R-07</span>
                <StatusBadge status="Delayed" />
              </div>
              <Link to="/logistics" className="btn btn-secondary w-full">
                {t('Track tanker')}
              </Link>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
