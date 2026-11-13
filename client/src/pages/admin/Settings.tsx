import { useState } from 'react';
import clsx from 'clsx';
import { ArrowRight, Plus, Save, Trash2 } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Field, FormGrid } from '@/components/ui/Field';
import { Toggle } from '@/components/ui/misc';
import { incentiveSchemes } from '@/data/mock';
import { qualityLimits } from '@/lib/pricing';
import { compact, num } from '@/lib/format';
import { useToast } from '@/context/ToastContext';
import { useLang } from '@/i18n/LanguageContext';

const sections = [
  'Incentive schemes',
  'Deduction types',
  'Approval workflows',
  'Notifications',
  'Quality limits',
  'Payment periods & bank',
  'Company',
] as const;
type Section = (typeof sections)[number];

const deductionTypes = [
  { name: 'Cattle feed (on credit)', erpItem: 'FD-*', maxPct: 40, periods: 4 },
  { name: 'Vet drugs', erpItem: 'VD-*', maxPct: 20, periods: 1 },
  { name: 'Milk cans', erpItem: 'CN-40L', maxPct: 20, periods: 5 },
  { name: 'Loan instalment', erpItem: 'GL 2310', maxPct: 30, periods: 12 },
  { name: 'Cash advance', erpItem: 'GL 2320', maxPct: 30, periods: 5 },
  { name: 'Transport charge', erpItem: 'GL 5120', maxPct: 5, periods: 1 },
];

const workflows: Record<string, { level: string; who: string; when: string }[]> = {
  'Payment run': [
    { level: 'Level 1', who: 'Regional manager', when: "Each region's lines" },
    { level: 'Level 2', who: 'Finance manager', when: 'Always' },
    { level: 'Level 3', who: 'General manager', when: 'If net over Rs 250 M' },
  ],
  'Farmer onboarding': [{ level: 'Level 1', who: 'Regional manager', when: 'Always' }],
  'Contract or price change': [
    { level: 'Level 1', who: 'Finance manager', when: 'Always' },
    { level: 'Level 2', who: 'General manager', when: 'Template changes' },
  ],
  'Advance or loan': [
    { level: 'Level 1', who: 'Regional manager', when: 'Up to category limit' },
    { level: 'Level 2', who: 'Finance manager', when: 'Above category limit' },
  ],
  'Dispute resolution': [{ level: 'Level 1', who: 'Finance manager', when: 'If a credit is paid' }],
  'Collection edit after close': [{ level: 'Level 1', who: 'Regional manager', when: 'Always' }],
};

const notificationRows = [
  { event: 'Payment posted', to: 'Farmer', sms: true, push: true, email: false, lang: 'SI · TA · EN' },
  { event: 'Delivery rejected', to: 'Farmer, center supervisor', sms: true, push: true, email: false, lang: 'SI · TA · EN' },
  { event: 'Contract expires in 30 days', to: 'Farmer, field officer', sms: true, push: true, email: true, lang: 'SI · TA · EN' },
  { event: 'Tanker delayed over 30 minutes', to: 'Transport, center supervisor', sms: true, push: true, email: false, lang: 'EN' },
  { event: 'Approval waiting over 24 hours', to: 'Approver and their manager', sms: false, push: true, email: true, lang: 'EN' },
  { event: 'ERP posting failed', to: 'ERP support team', sms: false, push: false, email: true, lang: 'EN' },
];

export default function Settings() {
  const toast = useToast();
  const { t } = useLang();
  const opt = (v: string) => <option key={v} value={v}>{t(v)}</option>;
  const [section, setSection] = useState<Section>('Incentive schemes');
  const [workflow, setWorkflow] = useState('Payment run');
  const [notifs, setNotifs] = useState(notificationRows);

  return (
    <>
      <PageHeader
        breadcrumb={[{ label: t('Administration') }, { label: t('Settings') }]}
        title={t('System settings')}
        description={t('Business rules used across collection, pricing, payments and approvals. Every change is logged.')}
        actions={
          <button className="btn btn-primary" onClick={() => toast(t('{section} saved', { section: t(section) }))}>
            <Save className="h-4 w-4" /> {t('Save changes')}
          </button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-4">
        <Card className="h-fit">
          <nav aria-label={t('Settings sections')} className="scrollbar-none flex gap-1 overflow-x-auto p-2 xl:flex-col">
            {sections.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSection(s)}
                className={clsx(
                  'flex min-h-[40px] shrink-0 items-center whitespace-nowrap rounded-lg px-3 text-left text-sm transition-colors',
                  s === section ? 'bg-brand-50 font-medium text-brand-700' : 'text-zinc-700 hover:bg-zinc-100',
                )}
              >
                {t(s)}
              </button>
            ))}
          </nav>
        </Card>

        <div className="flex flex-col gap-6 xl:col-span-3">
          {section === 'Incentive schemes' && (
            <Card>
              <CardHeader title={t('Incentive & bonus schemes')} subtitle={t('Loyalty, performance and seasonal bonuses')} actions={<button className="btn btn-secondary btn-sm"><Plus className="h-3.5 w-3.5" /> {t('Scheme')}</button>} />
              <DataTable
                rows={incentiveSchemes}
                rowKey={(s) => s.name}
                columns={[
                  { key: 'name', header: t('Scheme'), render: (s) => <span className="font-medium">{t(s.name)}</span> },
                  { key: 'basis', header: t('Basis'), render: (s) => t(s.basis) },
                  { key: 'total', header: t('Last period'), align: 'right', mono: true, render: (s) => t('Rs {amount}', { amount: compact(s.total) }) },
                  { key: 'on', header: t('Active'), render: () => <Toggle label={t('Active')} checked onChange={() => toast(t('Scheme updated'), 'info')} /> },
                ]}
              />
            </Card>
          )}

          {section === 'Deduction types' && (
            <Card>
              <CardHeader title={t('Deduction types')} subtitle={t('What can be recovered from farmer payments, and how much per period')} />
              <DataTable
                rows={deductionTypes}
                rowKey={(d) => d.name}
                columns={[
                  { key: 'name', header: t('Type'), render: (d) => <span className="font-medium">{t(d.name)}</span> },
                  { key: 'erpItem', header: t('ERP item / account'), mono: true },
                  { key: 'maxPct', header: t('Max % of milk value'), align: 'right', mono: true, render: (d) => `${d.maxPct}%` },
                  { key: 'periods', header: t('Default periods'), align: 'right', mono: true },
                ]}
              />
            </Card>
          )}

          {section === 'Approval workflows' && (
            <Card>
              <CardHeader
                title={t('Approval workflows')}
                actions={
                  <select className="input w-full sm:w-64" aria-label={t('Workflow')} value={workflow} onChange={(e) => setWorkflow(e.target.value)}>
                    {Object.keys(workflows).map(opt)}
                  </select>
                }
              />
              <CardBody className="space-y-6">
                <div className="flex flex-wrap items-stretch gap-3">
                  {workflows[workflow].map((s, i) => (
                    <div key={s.level} className="flex items-center gap-3">
                      {i > 0 && <ArrowRight className="h-4 w-4 text-zinc-400" />}
                      <div className="min-w-[180px] rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{t(s.level)}</p>
                        <p className="text-sm font-semibold">{t(s.who)}</p>
                        <p className="text-xs text-zinc-500">{t(s.when)}</p>
                        <button className="mt-2 inline-flex items-center gap-1 text-xs text-red-700 hover:underline" onClick={() => toast(t('Level removed'), 'info')}>
                          <Trash2 className="h-3 w-3" /> {t('Remove')}
                        </button>
                      </div>
                    </div>
                  ))}
                  <button className="btn btn-secondary self-center" onClick={() => toast(t('Level added'), 'info')}>
                    <Plus className="h-4 w-4" /> {t('Level')}
                  </button>
                </div>
                <FormGrid>
                  <Field label={t('Escalate if no action in')}>
                    <select className="input">{opt('24 hours')}{opt('48 hours')}{opt('72 hours')}</select>
                  </Field>
                  <Field label={t('Delegation')}>
                    <select className="input">{opt('Any approver, up to 14 days')}{opt('Not allowed')}</select>
                  </Field>
                  <Field label={t('Requester can approve own request')}>
                    <select className="input">{opt('No')}</select>
                  </Field>
                </FormGrid>
              </CardBody>
            </Card>
          )}

          {section === 'Notifications' && (
            <Card>
              <CardHeader title={t('Notifications')} subtitle={t('Which events send SMS, app or email messages')} />
              <DataTable
                rows={notifs}
                rowKey={(n) => n.event}
                columns={[
                  { key: 'event', header: t('Event'), render: (n) => <span className="font-medium">{t(n.event)}</span> },
                  { key: 'to', header: t('Sent to'), className: 'text-zinc-600', render: (n) => t(n.to) },
                  ...(['sms', 'push', 'email'] as const).map((ch) => ({
                    key: ch,
                    header: ch === 'sms' ? t('SMS') : ch === 'push' ? t('App') : t('Email'),
                    render: (n: (typeof notificationRows)[number]) => (
                      <Toggle
                        label={`${t(n.event)} ${ch === 'sms' ? t('SMS') : ch === 'push' ? t('App') : t('Email')}`}
                        checked={n[ch]}
                        onChange={(v) => setNotifs((all) => all.map((x) => (x.event === n.event ? { ...x, [ch]: v } : x)))}
                      />
                    ),
                  })),
                  { key: 'lang', header: t('Languages'), mono: true },
                ]}
              />
              <CardBody className="border-t border-zinc-100">
                <Field label={t('SMS template · Payment posted')} hint={`${t('Variables:')} {amount} {period} {bank} {last4} {litres}`}>
                  <textarea
                    className="input"
                    rows={3}
                    defaultValue="MILCO: Rs {amount} for {period} has been sent to your {bank} account ending {last4}. Litres {litres}. Call 1919 for help."
                  />
                </Field>
              </CardBody>
            </Card>
          )}

          {section === 'Quality limits' && (
            <Card>
              <CardHeader title={t('Quality limits & collection rules')} subtitle={t('Applied at every collection counter, on desktop and phone')} />
              <CardBody>
                <FormGrid>
                  <Field label={t('Minimum FAT %')}><input className="input num" defaultValue={qualityLimits.minFat.toFixed(2)} /></Field>
                  <Field label={t('Minimum SNF %')}><input className="input num" defaultValue={qualityLimits.minSnf.toFixed(2)} /></Field>
                  <Field label={t('Chill bonus at or below (°C)')}><input className="input num" defaultValue={qualityLimits.chillTemp} /></Field>
                  <Field label={t('Chill bonus (Rs / L)')}><input className="input num" defaultValue={qualityLimits.chillBonus.toFixed(2)} /></Field>
                  <Field label={t('Flag deliveries above (°C)')}><input className="input num" defaultValue={qualityLimits.flagTemp} /></Field>
                  <Field label={t('Morning cut-off')}><input className="input num" type="time" defaultValue="09:00" /></Field>
                  <Field label={t('Evening cut-off')}><input className="input num" type="time" defaultValue="19:00" /></Field>
                  <Field label={t('Edit window after shift close')}>
                    <select className="input">{opt('24 hours, needs approval')}{opt('Not allowed')}</select>
                  </Field>
                  <Field label={t('Retain samples for (days)')}><input className="input num" defaultValue="3" /></Field>
                </FormGrid>
              </CardBody>
            </Card>
          )}

          {section === 'Payment periods & bank' && (
            <Card>
              <CardHeader title={t('Payment periods & bank file')} />
              <CardBody>
                <FormGrid>
                  <Field label={t('Payment cycle')}><select className="input">{opt('Twice a month (1–15, 16–end)')}{opt('Weekly')}{opt('Monthly')}</select></Field>
                  <Field label={t('Pay on')}><select className="input">{opt('1st working day after period')}</select></Field>
                  <Field label={t('Bank file format')}><select className="input">{opt('LankaClear SLIPS')}{opt('CEFTS bulk')}{opt('Bank of Ceylon corporate CSV')}</select></Field>
                  <Field label={t('Debit account')}><input className="input num" defaultValue="0000-1234-5678" /></Field>
                  <Field label={t('Negative balance')}><select className="input">{opt('Carry forward to next period')}{opt('Hold payment')}</select></Field>
                  <Field label={t('Rounding')}><select className="input">{opt('Nearest rupee')}{opt('Nearest 10 cents')}</select></Field>
                </FormGrid>
              </CardBody>
            </Card>
          )}

          {section === 'Company' && (
            <Card>
              <CardHeader title={t('Company')} />
              <CardBody>
                <FormGrid>
                  <Field label={t('Legal name')} className="sm:col-span-2"><input className="input" defaultValue="Milk Industries of Lanka Company Ltd." /></Field>
                  <Field label={t('Short name')}><input className="input" defaultValue="MILCO" /></Field>
                  <Field label={t('Currency')}><input className="input" readOnly defaultValue="LKR (Rs)" /></Field>
                  <Field label={t('Time zone')}><input className="input" readOnly defaultValue="Asia/Colombo (UTC+05:30)" /></Field>
                  <Field label={t('Help line')}><input className="input" defaultValue="1919" /></Field>
                </FormGrid>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
