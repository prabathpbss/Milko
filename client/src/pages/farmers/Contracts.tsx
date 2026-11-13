import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { Calculator, Plus, RefreshCcw, Send } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { FilterChips } from '@/components/ui/Tabs';
import { Field } from '@/components/ui/Field';
import { contractRules, contracts, farmerById, type Contract } from '@/data/mock';
import { bandIndex, categoryPremium, fatBands, priceMatrix, ratePerLitre, snfBands } from '@/lib/pricing';
import { useToast } from '@/context/ToastContext';
import { activeTemplateNames } from '@/data/priceTemplates';
import { useLang } from '@/i18n/LanguageContext';

type Tr = (text: string, vars?: Record<string, string | number>) => string;

/** Template names follow "Category · Region Year"; only the category word is translated (the value stays English). */
function trName(name: string, t: Tr) {
  const m = /^(Platinum|Gold|Silver|Standard|Society bulk) · (.+)$/.exec(name);
  return m ? `${t(m[1])} · ${m[2]}` : name;
}

function trCondition(text: string, t: Tr) {
  const m = /^Route (.+)$/.exec(text);
  return m ? t('Route {route}', { route: m[1] }) : t(text);
}

type F = 'all' | Contract['status'];

export default function Contracts() {
  const { t } = useLang();
  const toast = useToast();
  const [filter, setFilter] = useState<F>('all');
  const [selectedId, setSelectedId] = useState(contracts[0].id);
  const [calcFat, setCalcFat] = useState('4.10');
  const [calcSnf, setCalcSnf] = useState('8.60');

  const rows = useMemo(() => (filter === 'all' ? contracts : contracts.filter((c) => c.status === filter)), [filter]);
  const c = contracts.find((x) => x.id === selectedId) ?? contracts[0];
  const farmer = farmerById(c.farmerId);
  const fatI = farmer ? bandIndex(farmer.fat, fatBands) : -1;
  const snfI = farmer ? bandIndex(farmer.snf, snfBands) : -1;

  const fat = parseFloat(calcFat);
  const snf = parseFloat(calcSnf);
  const base = Number.isFinite(fat) && Number.isFinite(snf) ? ratePerLitre(fat, snf) : null;
  const count = (s: F) => (s === 'all' ? contracts.length : contracts.filter((x) => x.status === s).length);

  return (
    <>
      <PageHeader
        breadcrumb={[{ label: t('Farmers') }, { label: t('Contracts & pricing') }]}
        title={t('Supply contracts & price rules')}
        description={t('Milk supply agreements, price templates and validity periods.')}
        actions={
          <>
            <button className="btn btn-secondary" onClick={() => toast(t('Renewal batch for 132 contracts sent for approval'))}>
              <RefreshCcw className="h-4 w-4" /> {t('Renew expiring')}
            </button>
            <button className="btn btn-primary" onClick={() => toast(t('New contract draft created'), 'info')}>
              <Plus className="h-4 w-4" /> {t('New contract')}
            </button>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-2">
          <CardHeader title={t('Contracts')} subtitle={t('4,812 active in total')} />
          <div className="border-b border-zinc-100 p-4">
            <FilterChips<F>
              value={filter}
              onChange={setFilter}
              options={[
                { id: 'all', label: t('All'), count: count('all') },
                { id: 'Active', label: t('Active'), count: count('Active') },
                { id: 'Expiring', label: t('Expiring'), count: count('Expiring') },
                { id: 'Expired', label: t('Expired'), count: count('Expired') },
                { id: 'Draft', label: t('Draft'), count: count('Draft') },
              ]}
            />
          </div>
          <DataTable<Contract>
            rows={rows}
            rowKey={(r) => r.id}
            selectedKey={selectedId}
            onRowClick={(r) => setSelectedId(r.id)}
            columns={[
              {
                key: 'id',
                header: t('Contract'),
                render: (r) => (
                  <div>
                    <div className="num text-[13px] font-medium">{r.id}</div>
                    <div className="max-w-[200px] truncate text-xs text-zinc-500">{r.party}</div>
                  </div>
                ),
              },
              { key: 'to', header: t('Valid to'), render: (r) => r.validTo },
              { key: 'st', header: t('Status'), render: (r) => <StatusBadge status={r.status} /> },
            ]}
          />
        </Card>

        <div className="flex flex-col gap-6 xl:col-span-3">
          <Card>
            <CardHeader
              title={c.party}
              subtitle={`${c.id} · ${c.type === 'Society' ? t('Society supply agreement') : t('Individual supply agreement')}`}
              actions={
                <>
                  <StatusBadge status={c.status} />
                  <button className="btn btn-secondary btn-sm" onClick={() => toast(t('Renewal draft created'), 'info')}>
                    {t('Renew')}
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => toast(t('Amendment opened'), 'info')}>
                    {t('Amend')}
                  </button>
                </>
              }
            />
            <CardBody>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <Field label={t('Price template')} hint={<Link to="/price-templates" className="font-medium text-brand-700 hover:underline">{t('Manage price templates')}</Link>}>
                  <select className="input" defaultValue={c.template} key={c.id + 't'}>
                    {Array.from(new Set([c.template, ...activeTemplateNames()])).map((name) => (
                      <option key={name} value={name}>
                        {trName(name, t)}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={t('Category')} hint={t('Premium Rs {amt} / L', { amt: categoryPremium[c.category].toFixed(2) })}>
                  <input className="input" readOnly value={t(c.category)} />
                </Field>
                <Field label={t('Minimum supply (L / day)')}>
                  <input className="input num" defaultValue={c.minLitres} key={c.id + 'm'} />
                </Field>
                <Field label={t('Valid from')}>
                  <input className="input" defaultValue={c.validFrom} key={c.id + 'f'} />
                </Field>
                <Field label={t('Valid to')}>
                  <input className="input" defaultValue={c.validTo} key={c.id + 'v'} />
                </Field>
                <Field label={t('Renewal reminder')}>
                  <select className="input">
                    <option value="30 days before, SMS + app">{t('30 days before, SMS + app')}</option>
                    <option value="60 days before">{t('60 days before')}</option>
                  </select>
                </Field>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title={t('Price matrix · Rs per litre')}
              subtitle={farmer ? t("Highlighted: this farmer's average (FAT {fat}, SNF {snf})", { fat: farmer.fat, snf: farmer.snf }) : t('Base rate by FAT and SNF band')}
            />
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50/80">
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">FAT % \ SNF %</th>
                    {snfBands.map((b) => (
                      <th key={b.label} className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        {b.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {priceMatrix.map((row, r) => (
                    <tr key={fatBands[r].label}>
                      <td className="px-4 py-2.5 font-medium">{fatBands[r].label}</td>
                      {row.map((v, col) => (
                        <td key={col} className="px-2 py-1.5 text-right">
                          <span
                            className={clsx(
                              'num inline-block min-w-[72px] rounded-md px-2 py-1',
                              r === fatI && col === snfI ? 'bg-brand-600 font-semibold text-white' : 'text-zinc-800',
                            )}
                          >
                            {v.toFixed(2)}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="border-t border-zinc-100 px-5 py-3 text-xs text-zinc-500">
              {t('Milk below FAT 3.0 or SNF 7.8, or failing the alcohol or adulteration test, is rejected and not paid.')}
            </p>
          </Card>

          <div className="grid gap-6 lg:grid-cols-5">
            <Card className="lg:col-span-3">
              <CardHeader title={t('Additions & penalties')} />
              <DataTable
                rows={contractRules}
                rowKey={(r) => r.rule}
                dense
                columns={[
                  { key: 'rule', header: t('Rule'), render: (r) => <span className="font-medium">{t(r.rule)}</span> },
                  { key: 'condition', header: t('Condition'), render: (r) => trCondition(r.condition, t), className: 'whitespace-normal min-w-[180px] text-zinc-600' },
                  {
                    key: 'amount',
                    header: t('Amount'),
                    align: 'right',
                    render: (r) => (
                      <span className={clsx('num', r.amount.startsWith('+') ? 'text-emerald-700' : 'text-red-700')}>{r.amount}</span>
                    ),
                  },
                  { key: 'source', header: t('Source'), render: (r) => <Badge>{t(r.source)}</Badge> },
                ]}
              />
            </Card>
            <Card className="lg:col-span-2">
              <CardHeader title={t('Rate calculator')} subtitle={t('{category} category', { category: t(c.category) })} />
              <CardBody className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Field label={t('FAT %')}>
                    <input className="input num" inputMode="decimal" value={calcFat} onChange={(e) => setCalcFat(e.target.value)} />
                  </Field>
                  <Field label={t('SNF %')}>
                    <input className="input num" inputMode="decimal" value={calcSnf} onChange={(e) => setCalcSnf(e.target.value)} />
                  </Field>
                </div>
                <div className="rounded-lg bg-zinc-50 p-4">
                  {base === null ? (
                    <p className="text-sm font-medium text-red-700">{t('Rejected: below minimum quality')}</p>
                  ) : (
                    <dl className="space-y-1.5 text-sm">
                      <div className="flex justify-between"><dt className="text-zinc-500">{t('Base rate')}</dt><dd className="num">{base.toFixed(2)}</dd></div>
                      <div className="flex justify-between"><dt className="text-zinc-500">{t('Category premium')}</dt><dd className="num">+{categoryPremium[c.category].toFixed(2)}</dd></div>
                      <div className="flex justify-between"><dt className="text-zinc-500">{t('Chill bonus (≤ 8 °C)')}</dt><dd className="num">+2.50</dd></div>
                      <div className="flex justify-between border-t border-zinc-200 pt-1.5 font-semibold">
                        <dt className="flex items-center gap-1.5"><Calculator className="h-4 w-4" /> {t('Rs per litre')}</dt>
                        <dd className="num">{(base + categoryPremium[c.category] + 2.5).toFixed(2)}</dd>
                      </div>
                    </dl>
                  )}
                </div>
                <button className="btn btn-primary w-full" onClick={() => toast(t('Contract change sent for approval'))}>
                  <Send className="h-4 w-4" /> {t('Submit change for approval')}
                </button>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
