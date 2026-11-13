import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { Download, RefreshCcw, Search, Send } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import Stepper from '@/components/ui/Stepper';
import StatCard from '@/components/ui/StatCard';
import { deductionTotal, incentiveSchemes, incentiveTotal, netOf, paymentLines, type PaymentLine } from '@/data/mock';
import { compact, lkr, num } from '@/lib/format';
import { useToast } from '@/context/ToastContext';
import { useLang } from '@/i18n/LanguageContext';

const steps = ['Calculate', 'Review', 'Approve', 'Post to ERP', 'Bank transfer', 'Notify farmers'];

function Line({ label, value, strong, negative }: { label: string; value: number; strong?: boolean; negative?: boolean }) {
  if (!value && !strong) return null;
  return (
    <div className={clsx('flex justify-between gap-4 py-1.5 text-sm', strong && 'border-t border-zinc-200 pt-2.5 font-semibold')}>
      <span className={strong ? '' : 'text-zinc-600'}>{label}</span>
      <span className={clsx('num', negative && 'text-red-700')}>{lkr(negative ? -value : value, 2)}</span>
    </div>
  );
}

export default function Payments() {
  const { t } = useLang();
  const toast = useToast();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [show, setShow] = useState('all');
  const [selId, setSelId] = useState(paymentLines[0].farmerId);
  const [step, setStep] = useState(1);
  const [recalcAt, setRecalcAt] = useState('09:58');

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return paymentLines.filter(
      (l) =>
        (!term || l.name.toLowerCase().includes(term) || l.farmerId.toLowerCase().includes(term)) &&
        (show === 'all' || (show === 'issues' ? l.status !== 'Ready' : l.status === show)),
    );
  }, [q, show]);

  const sel = paymentLines.find((l) => l.farmerId === selId)!;
  const totals = paymentLines.reduce(
    (s, l) => ({
      litres: s.litres + l.litres,
      milk: s.milk + l.milkValue,
      inc: s.inc + incentiveTotal(l),
      ded: s.ded + deductionTotal(l),
      net: s.net + netOf(l),
    }),
    { litres: 0, milk: 0, inc: 0, ded: 0, net: 0 },
  );
  const issues = paymentLines.filter((l) => l.status !== 'Ready').length;

  return (
    <>
      <PageHeader
        breadcrumb={[{ label: t('Finance') }, { label: t('Payment runs') }]}
        title="PR-2026-11A · 1–15 Nov 2026"
        description={t('Calculated at {time} from accepted deliveries, contract prices, incentives and open deductions.', { time: recalcAt })}
        actions={
          <>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setRecalcAt(new Date().toTimeString().slice(0, 5));
                toast(t('Payment run recalculated'));
              }}
            >
              <RefreshCcw className="h-4 w-4" /> {t('Recalculate')}
            </button>
            <button className="btn btn-secondary" onClick={() => toast(t('Bank file (SLIPS format) downloaded'))}>
              <Download className="h-4 w-4" /> {t('Bank file')}
            </button>
            <button
              className="btn btn-primary"
              disabled={step > 1}
              onClick={() => {
                setStep(2);
                toast(t('Payment run submitted for approval'));
                navigate('/approvals');
              }}
            >
              <Send className="h-4 w-4" /> {t('Submit for approval')}
            </button>
          </>
        }
      />

      <div className="mb-6">
        <Stepper steps={steps.map((st) => t(st))} current={step} />
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label={t('Farmers in run')} value="11,906" hint={t('{n} need attention on this page', { n: issues })} />
        <StatCard label={t('Litres')} value="2.73 M" hint={t('Accepted only')} />
        <StatCard label={t('Milk value')} value="Rs 382.4 M" hint={t('Avg {rate} / L', { rate: 'Rs 139.98' })} />
        <StatCard label={t('Incentives − deductions')} value="−Rs 19.4 M" hint={t('{added} added, {recovered} recovered', { added: '14.2 M', recovered: '33.6 M' })} />
        <StatCard label={t('Net payable')} value="Rs 363.0 M" trend={{ value: '3.8%', up: true }} hint={t('vs last period')} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="grid gap-3 border-b border-zinc-100 p-4 sm:grid-cols-3">
            <label className="relative sm:col-span-2">
              <span className="sr-only">{t('Search farmer')}</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input className="input pl-9" placeholder={t('Search farmer name or ID')} value={q} onChange={(e) => setQ(e.target.value)} />
            </label>
            <select className="input" aria-label={t('Show')} value={show} onChange={(e) => setShow(e.target.value)}>
              <option value="all">{t('All farmers')}</option>
              <option value="issues">{t('Needs attention')}</option>
              <option value="Below zero">{t('Net below zero')}</option>
              <option value="Disputed">{t('Disputed')}</option>
              <option value="No ERP vendor">{t('No ERP vendor')}</option>
              <option value="On hold">{t('On hold')}</option>
            </select>
          </div>
          <DataTable<PaymentLine>
            rows={rows}
            rowKey={(l) => l.farmerId}
            selectedKey={selId}
            onRowClick={(l) => setSelId(l.farmerId)}
            columns={[
              {
                key: 'name',
                header: t('Farmer'),
                render: (l) => (
                  <div>
                    <div className="font-medium">{l.name}</div>
                    <div className="text-xs text-zinc-500">
                      <span className="num">{l.farmerId}</span> · {t(l.category)}
                    </div>
                  </div>
                ),
              },
              { key: 'litres', header: t('Litres'), align: 'right', mono: true, render: (l) => num(l.litres, 1) },
              { key: 'q', header: 'FAT / SNF', align: 'right', mono: true, render: (l) => `${l.fat.toFixed(2)} / ${l.snf.toFixed(2)}` },
              { key: 'milk', header: t('Milk value'), align: 'right', mono: true, render: (l) => num(l.milkValue) },
              { key: 'inc', header: t('Incentives'), align: 'right', mono: true, render: (l) => <span className="text-emerald-700">+{num(incentiveTotal(l))}</span> },
              { key: 'ded', header: t('Deductions'), align: 'right', mono: true, render: (l) => <span className="text-red-700">−{num(deductionTotal(l))}</span> },
              {
                key: 'net',
                header: t('Net payable'),
                align: 'right',
                render: (l) => <span className={clsx('num font-semibold', netOf(l) < 0 && 'text-red-700')}>{lkr(netOf(l))}</span>,
              },
              { key: 'status', header: t('Status'), render: (l) => <StatusBadge status={l.status} /> },
            ]}
            footer={
              <tr>
                <td className="px-4 py-3">{t('Page total')}</td>
                <td className="num px-4 py-3 text-right">{num(totals.litres, 1)}</td>
                <td />
                <td className="num px-4 py-3 text-right">{compact(totals.milk)}</td>
                <td className="num px-4 py-3 text-right">{compact(totals.inc)}</td>
                <td className="num px-4 py-3 text-right">{compact(totals.ded)}</td>
                <td className="num px-4 py-3 text-right">{lkr(totals.net)}</td>
                <td />
              </tr>
            }
          />
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader title={t('Calculation')} subtitle={`${sel.name} · ${sel.farmerId}`} actions={<StatusBadge status={sel.status} />} />
            <CardBody>
              <Line label={t('Milk value · {litres} L at contract rates', { litres: num(sel.litres, 1) })} value={sel.milkValue} />
              <Line label={t('{category} category premium', { category: t(sel.category) })} value={sel.premium} />
              <Line label={t('Chilled milk bonus')} value={sel.chillBonus} />
              <Line label={t('Loyalty bonus')} value={sel.loyalty} />
              <Line label={t('Seasonal bonus')} value={sel.seasonal} />
              <Line label={t('Transport')} value={sel.transport} negative />
              <Line label={t('Cattle feed')} value={sel.feed} negative />
              <Line label={t('Milk cans')} value={sel.cans} negative />
              <Line label={t('Vet drugs')} value={sel.vet} negative />
              <Line label={t('Loan instalment')} value={sel.loans} negative />
              <Line label={t('Cash advance')} value={sel.advances} negative />
              <Line label={t('Net payable')} value={netOf(sel)} strong />
              {netOf(sel) < 0 && (
                <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-800">
                  {t('Net is below zero. The shortfall is carried forward to the next period.')}
                </p>
              )}
              {sel.status === 'No ERP vendor' && (
                <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  {t('This farmer has no ERP vendor yet. Payment is held until the farmer syncs to SAP B1.')}
                </p>
              )}
            </CardBody>
          </Card>
          <Card>
            <CardHeader title={t('Incentive schemes in this run')} />
            <ul className="divide-y divide-zinc-100">
              {incentiveSchemes.map((s) => (
                <li key={s.name} className="flex items-center justify-between gap-3 px-5 py-3">
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{t(s.name)}</span>
                    <span className="block text-xs text-zinc-500">{t(s.basis)}</span>
                  </span>
                  <Badge tone="success">Rs {compact(s.total)}</Badge>
                </li>
              ))}
            </ul>
            <p className="border-t border-zinc-100 px-5 py-3 text-xs leading-relaxed text-zinc-500">
              {t('After approval: A/P invoices and outgoing payments post to SAP Business One, the bank file is released, and every farmer gets an SMS and an app statement.')}
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}
