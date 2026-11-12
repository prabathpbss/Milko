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

type F = 'all' | Delivery['result'];

const blank = { farmerId: 'MF-004812', litres: '44.0', fat: '4.10', snf: '8.60', temp: '6.8', clr: '28.5', alcohol: 'Pass', adulteration: 'None found', cans: '2' };

export default function Collection() {
  const toast = useToast();
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
    if (!farmer) return toast('Choose a registered farmer first.', 'error');
    if (!evaluation) return toast('Enter litres, FAT, SNF and temperature.', 'error');
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
    toast(result === 'Rejected' ? `Rejected ${d.litres} L from ${farmer.name}. SMS sent.` : `Saved ${d.litres} L · ${lkr(d.value)}. Receipt printing.`);
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
        breadcrumb={[{ label: 'Collection' }, { label: 'Daily collection' }]}
        title={`${center.name} · ${shift === 'AM' ? 'Morning' : 'Evening'} shift`}
        description="12 Nov 2026 · weighing scale and milk analyser connected"
        actions={
          <>
            <select className="input w-48" aria-label="Collection center" value={centerId} onChange={(e) => setCenterId(e.target.value)}>
              {centers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select className="input w-32" aria-label="Shift" value={shift} onChange={(e) => setShift(e.target.value as 'AM' | 'PM')}>
              <option value="AM">Morning</option>
              <option value="PM">Evening</option>
            </select>
            <button
              className="btn btn-dark"
              disabled={closed}
              onClick={() => {
                setClosed(true);
                toast('Shift closed. Goods receipt queued for SAP B1.');
              }}
            >
              <Lock className="h-4 w-4" /> {closed ? 'Shift closed' : 'Close shift'}
            </button>
          </>
        }
      />

      <Card className="mb-6">
        <CardHeader title="New delivery" subtitle={farmer ? `${farmer.name} · ${farmer.category} · usually ${num(farmer.avgLitres / 2, 0)} L per shift` : 'Scan the farmer card or type the farmer ID'} />
        <form onSubmit={(e) => save(e)}>
          <CardBody className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-8">
              <Field label="Farmer" className="sm:col-span-2">
                <div className="flex gap-2">
                  <select className="input" value={form.farmerId} onChange={set('farmerId')} disabled={closed}>
                    <option value="">Select farmer…</option>
                    {farmers.filter((f) => f.status !== 'Suspended').map((f) => (
                      <option key={f.id} value={f.id}>{f.id} · {f.name}</option>
                    ))}
                  </select>
                  <button type="button" className="btn btn-secondary btn-icon shrink-0" aria-label="Scan farmer card" onClick={() => setForm((f) => ({ ...f, farmerId: 'MF-004812' }))}>
                    <ScanLine className="h-4 w-4" />
                  </button>
                </div>
              </Field>
              <Field label="Litres"><input className="input num text-base font-semibold" inputMode="decimal" value={form.litres} onChange={set('litres')} disabled={closed} /></Field>
              <Field label="FAT %"><input className="input num" inputMode="decimal" value={form.fat} onChange={set('fat')} disabled={closed} /></Field>
              <Field label="SNF %"><input className="input num" inputMode="decimal" value={form.snf} onChange={set('snf')} disabled={closed} /></Field>
              <Field label="Temp °C"><input className="input num" inputMode="decimal" value={form.temp} onChange={set('temp')} disabled={closed} /></Field>
              <Field label="Density (CLR)"><input className="input num" inputMode="decimal" value={form.clr} onChange={set('clr')} disabled={closed} /></Field>
              <Field label="Cans"><input className="input num" inputMode="numeric" value={form.cans} onChange={set('cans')} disabled={closed} /></Field>
              <Field label="Alcohol test">
                <select className="input" value={form.alcohol} onChange={set('alcohol')} disabled={closed}>
                  <option>Pass</option>
                  <option>Fail</option>
                </select>
              </Field>
              <Field label="Adulteration">
                <select className="input" value={form.adulteration} onChange={set('adulteration')} disabled={closed}>
                  <option>None found</option>
                  <option>Water</option>
                  <option>Starch</option>
                  <option>Sugar</option>
                  <option>Neutraliser</option>
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
                        ? 'Reject this delivery'
                        : `${evaluation.result} · Rs ${evaluation.rate.toFixed(2)} per litre`}
                    </p>
                    <p className="text-sm text-zinc-600">
                      {evaluation.reasons.length ? evaluation.reasons.join(' · ') : 'Passed all quality checks, chill bonus applied.'}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-zinc-500">Enter readings to see the result and value.</p>
              )}
              <div className="flex flex-wrap items-center gap-3">
                {evaluation && evaluation.result !== 'Rejected' && (
                  <span className="num text-xl font-semibold">{lkr(evaluation.value)}</span>
                )}
                <button type="button" className="btn btn-secondary" disabled={closed} onClick={(e) => save(e, 'Rejected')}>
                  Reject
                </button>
                <button type="submit" className="btn btn-primary" disabled={closed || !evaluation}>
                  <Printer className="h-4 w-4" /> {evaluation?.result === 'Rejected' ? 'Save rejection' : 'Accept & print receipt'}
                </button>
              </div>
            </div>
          </CardBody>
        </form>
      </Card>

      <div className="grid gap-6 xl:grid-cols-4">
        <Card className="xl:col-span-3">
          <CardHeader
            title="This shift's deliveries"
            actions={
              <button className="btn btn-secondary btn-sm" onClick={() => toast('Shift report exported')}>
                <Download className="h-3.5 w-3.5" /> Export
              </button>
            }
          />
          <div className="border-b border-zinc-100 px-4 py-3">
            <FilterChips<F>
              value={filter}
              onChange={setFilter}
              options={[
                { id: 'all', label: 'All', count: cnt('all') },
                { id: 'Accepted', label: 'Accepted', count: cnt('Accepted') },
                { id: 'Flagged', label: 'Flagged', count: cnt('Flagged') },
                { id: 'Rejected', label: 'Rejected', count: cnt('Rejected') },
              ]}
            />
          </div>
          <DataTable<Delivery>
            rows={shown}
            rowKey={(r) => r.id}
            columns={[
              { key: 'time', header: 'Time', mono: true },
              {
                key: 'farmer',
                header: 'Farmer',
                render: (r) => (
                  <div>
                    <div className="font-medium">{r.farmerName}</div>
                    <div className="num text-xs text-zinc-500">{r.farmerId}</div>
                  </div>
                ),
              },
              { key: 'litres', header: 'Litres', align: 'right', mono: true, render: (r) => num(r.litres, 1) },
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
                header: 'Tests',
                render: (r) => (
                  <span className="text-xs text-zinc-600">
                    Alcohol {r.alcohol === 'Pass' ? '✓' : '✗'} · {r.adulteration === 'None found' ? 'Clean' : r.adulteration}
                  </span>
                ),
              },
              { key: 'result', header: 'Result', render: (r) => <StatusBadge status={r.result} /> },
              { key: 'value', header: 'Value', align: 'right', mono: true, render: (r) => (r.value ? lkr(r.value) : '—') },
              { key: 'by', header: 'Recorded by', className: 'text-zinc-500' },
            ]}
          />
          <p className="border-t border-zinc-100 px-5 py-3 text-xs text-zinc-500">
            Edits after the shift is closed need supervisor approval and are kept in the audit trail.{' '}
            <Link to="/quality" className="font-medium text-brand-700 hover:underline">
              View exceptions
            </Link>
          </p>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader title="Shift summary" />
            <CardBody className="space-y-4">
              {[
                ['Accepted', `${num(acceptedL, 1)} L`],
                ['Rejected', `${num(rejectedL, 1)} L`],
                ['Avg FAT / SNF', `${avgFat.toFixed(2)} / ${avgSnf.toFixed(2)}`],
                ['Deliveries', num(rows.length)],
              ].map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between gap-2">
                  <span className="text-sm text-zinc-500">{k}</span>
                  <span className="num text-lg font-semibold">{v}</span>
                </div>
              ))}
              <div className="space-y-1.5 border-t border-zinc-100 pt-4">
                <div className="flex justify-between text-xs text-zinc-500">
                  <span>Center capacity</span>
                  <span className="num">{num(loaded)} / {num(center.capacity)} L</span>
                </div>
                <Progress value={loaded} max={center.capacity} tone={loaded / center.capacity > 0.95 ? 'warning' : 'dark'} label="Center capacity" />
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Chillers & tanker" />
            <CardBody className="space-y-3 text-sm">
              <div className="flex justify-between"><span>Chiller tank 1</span><span className="num">9,800 L · 4.1 °C</span></div>
              <div className="flex justify-between"><span>Chiller tank 2</span><span className="num">8,210 L · 4.4 °C</span></div>
              <div className="flex items-center justify-between">
                <span>NP-LK 4521 · R-07</span>
                <StatusBadge status="Delayed" />
              </div>
              <Link to="/logistics" className="btn btn-secondary w-full">
                Track tanker
              </Link>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
