import { useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, Send, UploadCloud } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Field, FormGrid } from '@/components/ui/Field';
import Stepper from '@/components/ui/Stepper';
import { StatusBadge } from '@/components/ui/Badge';
import AttachmentGrid, { type Attachment } from '@/components/ui/AttachmentGrid';
import { KeyValue } from '@/components/ui/misc';
import { centers, routes } from '@/data/mock';
import { useToast } from '@/context/ToastContext';
import { activeTemplateNames } from '@/data/priceTemplates';
import { useCategoryNames } from '@/data/masters';
import { useLang } from '@/i18n/LanguageContext';

const steps = ['Personal details', 'Farm & herd', 'Bank & payment', 'Contract & category', 'Documents', 'Review & submit'];

const initial: Record<string, string> = {
  fullName: 'Pathirana Dilani',
  nic: '199245678901',
  dob: '1992-03-18',
  gender: 'Female',
  mobile: '+94 77 845 1209',
  language: 'Sinhala',
  address: 'No. 18, Yaya 4, Hingurakgoda',
  district: 'Polonnaruwa',
  farmAddress: 'No. 18, Yaya 4, Hingurakgoda, Polonnaruwa',
  center: 'CC-HNG',
  route: 'R-07',
  land: '2.0',
  pasture: '0.5',
  cattle: '5',
  milking: '3',
  breed: 'Jersey cross',
  expected: '18',
  delivery: 'Morning and evening',
  cooling: 'None',
  bank: 'Bank of Ceylon',
  branch: 'Hingurakgoda (7010)',
  account: '',
  accountName: 'P. Dilani',
  payMethod: 'Bank transfer',
  template: 'Standard · North Central 2026',
  category: 'Standard',
  validFrom: '2026-11-16',
  validTo: '2027-11-15',
  minLitres: '15',
};

const docList = [
  { key: 'nic', name: 'National ID (both sides)', required: true },
  { key: 'bank', name: 'Bank passbook page', required: true },
  { key: 'land', name: 'Land deed or lease', required: true },
  { key: 'vet', name: 'Veterinary certificate', required: false },
  { key: 'agreement', name: 'Signed supply agreement', required: true },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const toast = useToast();
  const { t } = useLang();
  const categories = useCategoryNames();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initial);
  const [docs, setDocs] = useState<Record<string, string>>({ nic: 'NIC_Dilani.pdf', land: 'Lease_Yaya4.pdf' });
  const [checks, setChecks] = useState({ duplicate: true, visit: true, bank: false, sample: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const stepLabels = steps.map((s) => t(s));
  /** Select options: the value stays English (stored data), the visible label is translated. */
  const opts = (list: string[]) =>
    list.map((o) => (
      <option key={o} value={o}>
        {t(o)}
      </option>
    ));

  const set = (k: string) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (step === 0) {
      if (!form.fullName.trim()) e.fullName = t('Enter the full name as on the NIC.');
      if (!/^(\d{9}[VvXx]|\d{12})$/.test(form.nic.trim())) e.nic = t('Use the old (9 digits + V) or new (12 digits) NIC format.');
      if (!form.mobile.trim()) e.mobile = t('Enter a mobile number for SMS alerts.');
    }
    if (step === 2 && !/^\d{6,16}$/.test(form.account.replace(/\s/g, ''))) e.account = t('Enter the account number (digits only).');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (!validate()) {
      // Move focus to the first field with an error so keyboard and screen-reader users land on it
      requestAnimationFrame(() =>
        document
          .querySelector('[data-field-error]')
          ?.closest('label')
          ?.querySelector<HTMLElement>('input, select, textarea')
          ?.focus(),
      );
      return;
    }
    setStep((s) => Math.min(steps.length - 1, s + 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submit = () => {
    toast(t('Farmer sent to the Regional Manager for approval'));
    navigate('/approvals');
  };

  const docsDone = docList.filter((d) => docs[d.key]).length;
  const centerRoutes = routes.filter((r) => r.centerId === form.center);

  return (
    <>
      <PageHeader
        breadcrumb={[{ label: t('Farmers'), to: '/farmers' }, { label: t('Onboarding') }]}
        title={t('Register a new farmer')}
        description={t('Complete each step. The farmer gets an ID and an ERP vendor record after approval.')}
        actions={<button className="btn btn-secondary" onClick={() => toast(t('Draft saved'))}>{t('Save draft')}</button>}
      />

      <div className="mb-6">
        <Stepper steps={stepLabels} current={step} onStep={setStep} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title={stepLabels[step]} subtitle={t('Step {n} of {total}', { n: step + 1, total: steps.length })} />
          <CardBody className="space-y-6">
            {step === 0 && (
              <FormGrid>
                <Field label={t('Full name (as on NIC)')} error={errors.fullName} className="sm:col-span-2">
                  <input className="input" value={form.fullName} onChange={set('fullName')} />
                </Field>
                <Field label={t('NIC number')} error={errors.nic}>
                  <input className="input num" value={form.nic} onChange={set('nic')} />
                </Field>
                <Field label={t('Date of birth')}>
                  <input type="date" className="input" value={form.dob} onChange={set('dob')} />
                </Field>
                <Field label={t('Gender')}>
                  <select className="input" value={form.gender} onChange={set('gender')}>
                    {opts(["Female","Male","Prefer not to say"])}
                  </select>
                </Field>
                <Field label={t('Mobile number')} error={errors.mobile} hint={t('Payment and quality alerts go here')}>
                  <input className="input" inputMode="tel" value={form.mobile} onChange={set('mobile')} />
                </Field>
                <Field label={t('Preferred language')}>
                  <select className="input" value={form.language} onChange={set('language')}>
                    {opts(["Sinhala","Tamil","English"])}
                  </select>
                </Field>
                <Field label={t('Address')} className="sm:col-span-2">
                  <input className="input" value={form.address} onChange={set('address')} />
                </Field>
                <Field label={t('District')}>
                  <input className="input" value={form.district} onChange={set('district')} />
                </Field>
              </FormGrid>
            )}

            {step === 1 && (
              <>
                <FormGrid>
                  <Field label={t('Collection center')}>
                    <select className="input" value={form.center} onChange={set('center')}>
                      {centers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label={t('Collection route')}>
                    <select className="input" value={form.route} onChange={set('route')}>
                      {(centerRoutes.length ? centerRoutes : routes).map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.id} · {r.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label={t('Land extent (acres)')}>
                    <input className="input num" inputMode="decimal" value={form.land} onChange={set('land')} />
                  </Field>
                  <Field label={t('Pasture (acres)')}>
                    <input className="input num" inputMode="decimal" value={form.pasture} onChange={set('pasture')} />
                  </Field>
                  <Field label={t('Total cattle')}>
                    <input className="input num" inputMode="numeric" value={form.cattle} onChange={set('cattle')} />
                  </Field>
                  <Field label={t('Milking cows')}>
                    <input className="input num" inputMode="numeric" value={form.milking} onChange={set('milking')} />
                  </Field>
                  <Field label={t('Main breed')}>
                    <select className="input" value={form.breed} onChange={set('breed')}>
                      {opts(["Jersey cross","Friesian cross","Sahiwal cross","Local"])}
                    </select>
                  </Field>
                  <Field label={t('Expected supply (L / day)')}>
                    <input className="input num" inputMode="decimal" value={form.expected} onChange={set('expected')} />
                  </Field>
                  <Field label={t('Delivery')}>
                    <select className="input" value={form.delivery} onChange={set('delivery')}>
                      {opts(["Morning and evening","Morning only","Evening only"])}
                    </select>
                  </Field>
                  <Field label={t('Cooling facility')}>
                    <select className="input" value={form.cooling} onChange={set('cooling')}>
                      {opts(["None","Chiller","Shared society chiller"])}
                    </select>
                  </Field>
                </FormGrid>
                <Field label={t('Farm location (address)')} hint={t('House no., road, village / GN division, nearest town')}>
                  <textarea
                    className="input min-h-[88px] py-2"
                    rows={3}
                    value={form.farmAddress}
                    onChange={set('farmAddress')}
                    placeholder={t('e.g. No. 18, Yaya 4, Hingurakgoda, Polonnaruwa')}
                  />
                </Field>
                <div>
                  <span className="label mb-2 block">Farm photos & attachments</span>
                  <AttachmentGrid
                    value={attachments}
                    onChange={setAttachments}
                    hint={t('Shed, herd, water source, land documents')}
                    onReject={(m) => toast(m, 'error')}
                  />
                </div>
              </>
            )}

            {step === 2 && (
              <FormGrid>
                <Field label={t('Payment method')}>
                  <select className="input" value={form.payMethod} onChange={set('payMethod')}>
                    {opts(["Bank transfer","Society account","Cash at center (approval needed)"])}
                  </select>
                </Field>
                <Field label={t('Bank')}>
                  <select className="input" value={form.bank} onChange={set('bank')}>
                    {["Bank of Ceylon", "People's Bank", "Hatton National Bank", "Sampath Bank", "Regional Development Bank"].map((b) => (
                      <option key={b}>{b}</option>
                    ))}
                  </select>
                </Field>
                <Field label={t('Branch')}>
                  <input className="input" value={form.branch} onChange={set('branch')} />
                </Field>
                <Field label={t('Account number')} error={errors.account}>
                  <input className="input num" inputMode="numeric" value={form.account} onChange={set('account')} placeholder={t('e.g. 0071234471')} />
                </Field>
                <Field label={t('Account holder name')}>
                  <input className="input" value={form.accountName} onChange={set('accountName')} />
                </Field>
              </FormGrid>
            )}

            {step === 3 && (
              <FormGrid>
                <Field label={t('Price template')} className="sm:col-span-2">
                  <select className="input" value={form.template} onChange={set('template')}>
                    {activeTemplateNames().map((name) => (
                      <option key={name}>{name}</option>
                    ))}
                  </select>
                </Field>
                <Field label={t('Starting category')} hint={t('Reviewed every quarter')}>
                  <select className="input" value={form.category} onChange={set('category')}>
                    {opts(categories)}
                  </select>
                </Field>
                <Field label={t('Valid from')}>
                  <input type="date" className="input" value={form.validFrom} onChange={set('validFrom')} />
                </Field>
                <Field label={t('Valid to')}>
                  <input type="date" className="input" value={form.validTo} onChange={set('validTo')} />
                </Field>
                <Field label={t('Minimum supply (L / day)')}>
                  <input className="input num" value={form.minLitres} onChange={set('minLitres')} />
                </Field>
              </FormGrid>
            )}

            {step === 4 && (
              <ul className="divide-y divide-zinc-100 rounded-lg border border-zinc-200">
                {docList.map((d) => (
                  <li key={d.key} className="flex flex-wrap items-center gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        {t(d.name)} {d.required && <span className="text-red-600">*</span>}
                      </p>
                      <p className="truncate text-xs text-zinc-500">{docs[d.key] ?? t('PDF, JPG or PNG up to 10 MB')}</p>
                    </div>
                    {docs[d.key] ? <StatusBadge status="Uploaded" /> : <StatusBadge status={d.required ? 'Missing' : 'Optional'} />}
                    <label className="btn btn-secondary btn-sm cursor-pointer">
                      <UploadCloud className="h-3.5 w-3.5" /> {docs[d.key] ? t('Replace') : t('Upload')}
                      <input
                        type="file"
                        className="sr-only"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setDocs((s) => ({ ...s, [d.key]: file.name }));
                        }}
                      />
                    </label>
                  </li>
                ))}
              </ul>
            )}

            {step === 5 && (
              <div className="grid gap-6 lg:grid-cols-2">
                {[
                  { title: t('Personal'), items: [[t('Name'), form.fullName], ['NIC', form.nic], [t('Mobile'), form.mobile], [t('Language'), t(form.language)], [t('Address'), form.address]] },
                  { title: t('Farm'), items: [[t('Center'), centers.find((c) => c.id === form.center)?.name ?? ''], [t('Route'), form.route], [t('Herd'), t('{cattle} cattle, {milking} milking', { cattle: form.cattle, milking: form.milking })], [t('Expected'), t('{n} L / day', { n: form.expected })], [t('Location'), form.farmAddress || '—'], [t('Attachments'), t('{n} file(s)', { n: attachments.length })]] },
                  { title: t('Bank'), items: [[t('Method'), t(form.payMethod)], [t('Bank'), `${form.bank}, ${form.branch}`], [t('Account'), form.account || '—'], [t('Holder'), form.accountName]] },
                  { title: t('Contract'), items: [[t('Template'), form.template], [t('Category'), t(form.category)], [t('Valid'), t('{from} to {to}', { from: form.validFrom, to: form.validTo })], [t('Documents'), t('{n} of {total}', { n: docsDone, total: docList.length })]] },
                ].map((s) => (
                  <div key={s.title} className="rounded-lg border border-zinc-200 p-4">
                    <h3 className="mb-3 text-sm font-semibold">{s.title}</h3>
                    <KeyValue items={s.items as [string, string][]} />
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-wrap justify-between gap-3 border-t border-zinc-100 pt-5">
              <button className="btn btn-secondary" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
                <ArrowLeft className="h-4 w-4" /> {t('Back')}
              </button>
              {step < steps.length - 1 ? (
                <button className="btn btn-primary" onClick={next}>
                  {t('Next: {step}', { step: stepLabels[step + 1] })} <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button className="btn btn-primary" onClick={submit}>
                  <Send className="h-4 w-4" /> {t('Submit for approval')}
                </button>
              )}
            </div>
          </CardBody>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader title={t('Verification')} subtitle={t('Completed by the field officer')} />
            <CardBody className="space-y-3">
              {(
                [
                  ['duplicate', 'NIC checked for duplicate farmers'],
                  ['visit', 'Farm visit completed'],
                  ['bank', 'Bank account verified'],
                  ['sample', 'First milk sample passed'],
                ] as const
              ).map(([k, label]) => (
                <label key={k} className="flex items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-brand-600"
                    checked={checks[k]}
                    onChange={() => setChecks((c) => ({ ...c, [k]: !c[k] }))}
                  />
                  {t(label)}
                </label>
              ))}
            </CardBody>
          </Card>
          <Card>
            <CardHeader title={t('Documents')} subtitle={t('{n} of {total} uploaded', { n: docsDone, total: docList.length })} />
            <ul className="divide-y divide-zinc-100">
              {docList.map((d) => (
                <li key={d.key} className="flex items-center justify-between gap-2 px-5 py-2.5 text-sm">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className={docs[d.key] ? 'h-4 w-4 text-emerald-600' : 'h-4 w-4 text-zinc-300'} />
                    {t(d.name)}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <CardHeader title={t('Waiting in onboarding')} />
            <ul className="divide-y divide-zinc-100 text-sm">
              {[
                ['S. Tharshini', 'Ampara CC', 'Investigating'],
                ['M. Ranjith', 'Kurunegala CC', 'Missing'],
                ['P. Dilani', 'Hingurakgoda CC', 'In approval'],
              ].map(([n, c, s]) => (
                <li key={n} className="flex items-center justify-between gap-2 px-5 py-3">
                  <span>
                    <span className="block font-medium">{n}</span>
                    <span className="block text-xs text-zinc-500">{c}</span>
                  </span>
                  <StatusBadge status={s} />
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
