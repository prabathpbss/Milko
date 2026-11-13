import { useState } from 'react';
import clsx from 'clsx';
import { CheckCircle2, MessageSquareWarning, Scale, ShoppingBag } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Field } from '@/components/ui/Field';
import { EmptyState, Modal } from '@/components/ui/misc';
import AttachmentGrid, { type Attachment } from '@/components/ui/AttachmentGrid';
import LanguageSwitch from '@/components/ui/LanguageSwitch';
import { farmerPayments, farmers, type Dispute } from '@/data/mock';
import { DISPUTE_ROUTING, raiseDispute, useDisputes } from '@/data/disputes';
import { lkr, num } from '@/lib/format';
import { useToast } from '@/context/ToastContext';
import { useLang } from '@/i18n/LanguageContext';

const recent = [
  { ref: 'D-1012', when: '12 Nov AM', litres: 44.0, status: 'Accepted' },
  { ref: 'D-0988', when: '11 Nov PM', litres: 41.5, status: 'Accepted' },
  { ref: 'D-0961', when: '11 Nov AM', litres: 45.2, status: 'Accepted' },
  { ref: 'D-0937', when: '10 Nov PM', litres: 6.0, status: 'Rejected' },
];

type Kind = NonNullable<Dispute['kind']>;
type DisputeCat = 'Quality' | 'Delivery' | 'Payment';

const DISPUTE_TYPES: { id: DisputeCat; title: string; text: string }[] = [
  { id: 'Quality', title: 'Milk rejected or quality wrong', text: 'FAT, SNF, temperature or a rejection you disagree with' },
  { id: 'Delivery', title: 'Litres recorded wrong', text: 'The litres on your slip are less than you gave' },
  { id: 'Payment', title: 'Payment amount wrong', text: 'Rate, bonus or deduction on a payment is not right' },
];

/** Stored in English for the staff screens; shown to the farmer in their language. */
const COMPLAINT_TOPICS = [
  'Milk not picked up or picked up late',
  'Collection center staff',
  'Cans, chiller or equipment',
  'Feed or advance request delayed',
  'Other',
];

/** Team names as stored on the ticket owner. */
const TEAM: Record<string, string> = { QA: 'Quality team', Finance: 'Finance team', Logistics: 'Transport team', 'Center supervisor': 'Center supervisor' };

interface Draft {
  cat: DisputeCat;
  linked: string;
  topic: string;
  amount: string;
  details: string;
  contact: 'SMS' | 'Phone call';
}

const emptyDraft = (): Draft => ({ cat: 'Quality', linked: recent[0].ref, topic: COMPLAINT_TOPICS[0], amount: '', details: '', contact: 'SMS' });

/** Farmer self-service page — what a farmer sees after signing in with their mobile number. */
export default function MobileFarmer() {
  const toast = useToast();
  const { t } = useLang();
  const f = farmers[0];
  const mine = useDisputes().filter((d) => d.farmerId === f.id);

  const [kind, setKind] = useState<Kind | null>(null);
  const [d, setD] = useState<Draft>(emptyDraft);
  const [files, setFiles] = useState<Attachment[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState<Dispute | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const messages = [
    { tag: t('Paid'), tone: 'bg-emerald-50 text-emerald-800', text: t('{amount} for 16–31 Oct was sent to your bank.', { amount: lkr(farmerPayments[0].net) }) },
    { tag: t('Contract'), tone: 'bg-amber-50 text-amber-900', text: t('Your contract renews on 31 Mar 2027. Tap to review.') },
    { tag: t('Training'), tone: 'bg-zinc-100 text-zinc-700', text: t('Food safety training at Hingurakgoda CC on 30 Nov, 10:00.') },
  ];

  const start = (k: Kind) => {
    setKind(k);
    setD(emptyDraft());
    setFiles([]);
    setErrors({});
    setDone(null);
  };
  const close = () => setKind(null);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));
  const pickCat = (cat: DisputeCat) => setD((x) => ({ ...x, cat, linked: cat === 'Payment' ? farmerPayments[0].period : recent[0].ref }));

  const submit = () => {
    const e: Record<string, string> = {};
    if (d.details.trim().length < 10) e.details = t('Tell us a little more (at least 10 letters).');
    if (d.amount.trim() && (Number.isNaN(Number(d.amount)) || Number(d.amount) < 0)) e.amount = t('Enter an amount in rupees, or leave it empty.');
    setErrors(e);
    if (Object.keys(e).length) return;

    const isComplaint = kind === 'Complaint';
    const contact = d.contact === 'Phone call' ? ' Please call me.' : '';
    const ticket = raiseDispute({
      farmer: f.name,
      farmerId: f.id,
      kind: kind!,
      category: isComplaint ? 'Service' : d.cat,
      summary: `${isComplaint ? `${d.topic}: ` : ''}${d.details.trim()}${contact}`,
      value: isComplaint ? 0 : Number(d.amount) || 0,
      linked: isComplaint ? '—' : d.linked,
      attachments: files.length,
      channel: 'Farmer portal',
    });
    setDone(ticket);
    toast(t('{id} sent. We will reply by SMS.', { id: ticket.id }));
  };

  const route = DISPUTE_ROUTING[kind === 'Complaint' ? 'Service' : d.cat];
  const team = (owner: string) => t(TEAM[owner.split(' · ')[0]] ?? owner);
  const days = (hours: number) => Math.round(hours / 24);
  const kindLabel = (k?: Kind) => t(k ?? 'Dispute');

  return (
    <>
      <PageHeader
        breadcrumb={[{ label: t('Field forms') }, { label: t('Farmer portal') }]}
        title={t('Ayubowan, {name}', { name: f.name })}
        description={t('{id} · {category} farmer', { id: f.id, category: t(f.category) })}
        actions={<LanguageSwitch full />}
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          <div className="rounded-2xl bg-brand-700 p-5 text-white sm:p-6">
            <p className="text-xs text-brand-100">{t('This period so far · 1–12 Nov')}</p>
            <p className="mt-1 font-mono text-3xl font-semibold tabular-nums">Rs 143,580</p>
            <p className="mt-1 text-sm text-brand-100">
              {t('{litres} L · avg FAT {fat} / SNF {snf}', { litres: '1,038', fat: f.fat.toFixed(2), snf: f.snf.toFixed(2) })}
            </p>
            <p className="mt-3 rounded-lg bg-white/10 px-3 py-2 text-xs text-brand-50">{t('Payment on 16 Nov to {bank}', { bank: f.bank })}</p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4">
            <button type="button" className="btn btn-secondary h-14" onClick={() => start('Dispute')}>
              <Scale className="h-4 w-4" /> {t('Raise dispute')}
            </button>
            <button type="button" className="btn btn-secondary h-14" onClick={() => start('Complaint')}>
              <MessageSquareWarning className="h-4 w-4" /> {t('Complaint')}
            </button>
            <button type="button" className="btn btn-secondary col-span-2 h-14 sm:col-span-1" onClick={() => toast(t('Request sent to your field officer'))}>
              <ShoppingBag className="h-4 w-4" /> {t('Feed / advance')}
            </button>
          </div>

          <Card>
            <CardHeader
              title={t('My disputes & complaints')}
              subtitle={t('{n} open', { n: mine.filter((x) => x.status !== 'Resolved').length })}
            />
            {mine.length ? (
              <ul className="divide-y divide-zinc-100">
                {mine.map((x) => {
                  const last = x.timeline[x.timeline.length - 1];
                  const expanded = openId === x.id;
                  return (
                    <li key={x.id}>
                      <button
                        type="button"
                        aria-expanded={expanded}
                        onClick={() => setOpenId(expanded ? null : x.id)}
                        className="flex min-h-[44px] w-full items-start gap-3 px-4 py-3 text-left hover:bg-zinc-50 sm:px-5"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="num text-sm font-medium">{x.id}</span>
                            <Badge tone={x.kind === 'Complaint' ? 'info' : 'neutral'}>{kindLabel(x.kind)}</Badge>
                          </div>
                          <p className="mt-1 line-clamp-2 text-sm text-zinc-700">{x.summary}</p>
                          <p className="mt-1 text-xs text-zinc-500">{t('Raised {date} · last update: {text}', { date: x.raised, text: last.text })}</p>
                        </div>
                        <StatusBadge status={x.status} />
                      </button>
                      {expanded && (
                        <ol className="mx-4 mb-4 space-y-3 border-l border-zinc-200 pl-4 sm:mx-5">
                          {x.timeline.map((step, i) => (
                            <li key={i} className="text-sm">
                              <p className="text-xs text-zinc-500">
                                {step.time} · {step.who}
                              </p>
                              <p>{step.text}</p>
                            </li>
                          ))}
                        </ol>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState title={t('Nothing raised yet')} text={t('Use Raise dispute or Complaint above. You can follow the answer here.')} />
            )}
          </Card>

          <Card>
            <CardHeader title={t('Messages')} />
            <ul className="divide-y divide-zinc-100">
              {messages.map((m) => (
                <li key={m.tag} className="flex items-start gap-3 px-4 py-3 sm:px-5">
                  <span className={clsx('shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold', m.tone)}>{m.tag}</span>
                  <span className="text-sm leading-snug">{m.text}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <Card className="h-fit lg:col-span-2">
          <CardHeader title={t('Last deliveries')} />
          <ul className="divide-y divide-zinc-100">
            {recent.map((r) => (
              <li key={r.ref} className="flex items-center justify-between gap-2 px-4 py-3 text-sm sm:px-5">
                <span>{r.when}</span>
                <span className="num">{num(r.litres, 1)} L</span>
                <StatusBadge status={r.status} />
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Modal
        open={kind !== null}
        onClose={close}
        title={done ? t('Sent') : kind === 'Complaint' ? t('Make a complaint') : t('Raise a dispute')}
        footer={
          done ? (
            <button className="btn btn-primary" onClick={close}>{t('Done')}</button>
          ) : (
            <>
              <button className="btn btn-secondary" onClick={close}>{t('Cancel')}</button>
              <button className="btn btn-primary" onClick={submit}>{t('Send')}</button>
            </>
          )
        }
      >
        {done ? (
          <div className="space-y-3 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
            <p className="text-sm">
              {t('Your {kind} number is', { kind: kindLabel(done.kind).toLowerCase() })} <span className="num font-semibold">{done.id}</span>
            </p>
            <p className="text-sm text-zinc-600">
              {t(d.contact === 'Phone call' ? 'We will call you within {days} days.' : 'We will reply by SMS within {days} days.', { days: days(done.slaHours) })}{' '}
              {t('You can follow it under “My disputes & complaints”.')}
            </p>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); submit(); }}>
            {kind === 'Dispute' ? (
              <>
                <fieldset className="space-y-2">
                  <legend className="label mb-1.5">{t('What is wrong?')}</legend>
                  {DISPUTE_TYPES.map((dt) => (
                    <label
                      key={dt.id}
                      className={clsx(
                        'flex min-h-[44px] cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition-colors',
                        d.cat === dt.id ? 'border-brand-600 bg-brand-50' : 'border-zinc-200 hover:bg-zinc-50',
                      )}
                    >
                      <input type="radio" name="dispute-type" className="mt-0.5 h-4 w-4 accent-brand-600" checked={d.cat === dt.id} onChange={() => pickCat(dt.id)} />
                      <span>
                        <span className="font-medium">{t(dt.title)}</span>
                        <span className="block text-xs text-zinc-500">{t(dt.text)}</span>
                      </span>
                    </label>
                  ))}
                </fieldset>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={d.cat === 'Payment' ? t('Which payment?') : t('Which delivery?')}>
                    <select className="input" value={d.linked} onChange={(e) => set('linked', e.target.value)}>
                      {d.cat === 'Payment'
                        ? farmerPayments.map((p) => (
                            <option key={p.period} value={p.period}>
                              {p.period} · {lkr(p.net)}
                            </option>
                          ))
                        : recent.map((r) => (
                            <option key={r.ref} value={r.ref}>
                              {r.when} · {num(r.litres, 1)} L · {t(r.status)}
                            </option>
                          ))}
                    </select>
                  </Field>
                  <Field label={t('Amount you expect (Rs)')} hint={!errors.amount ? t('Optional') : undefined} error={errors.amount}>
                    <input className="input num" inputMode="decimal" value={d.amount} onChange={(e) => set('amount', e.target.value)} />
                  </Field>
                </div>
              </>
            ) : (
              <Field label={t('What is it about?')}>
                <select className="input" value={d.topic} onChange={(e) => set('topic', e.target.value)}>
                  {COMPLAINT_TOPICS.map((topic) => (
                    <option key={topic} value={topic}>
                      {t(topic)}
                    </option>
                  ))}
                </select>
              </Field>
            )}

            <Field label={t('Tell us what happened')} error={errors.details}>
              <textarea className="input min-h-[96px]" value={d.details} onChange={(e) => set('details', e.target.value)} />
            </Field>

            <div>
              <span className="label mb-1.5 block">{t('Photos or documents')}</span>
              <AttachmentGrid
                value={files}
                onChange={setFiles}
                maxFiles={5}
                hint={t('Optional · e.g. the can, the slip or the payment SMS')}
                onReject={(msg) => toast(msg, 'error')}
              />
            </div>

            <fieldset>
              <legend className="label mb-1.5">{t('How should we reply?')}</legend>
              <div className="grid grid-cols-2 gap-2">
                {(['SMS', 'Phone call'] as const).map((c) => (
                  <label
                    key={c}
                    className={clsx(
                      'flex min-h-[44px] cursor-pointer items-center justify-center rounded-lg border text-sm font-medium has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-600',
                      d.contact === c ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-zinc-200 text-zinc-700',
                    )}
                  >
                    <input type="radio" name="reply" className="sr-only" checked={d.contact === c} onChange={() => set('contact', c)} />
                    {t(c)}
                  </label>
                ))}
              </div>
            </fieldset>

            <p className="text-xs text-zinc-500">{t('Goes to the {team}. You get an answer within {days} days.', { team: team(route.owner), days: days(route.sla) })}</p>
          </form>
        )}
      </Modal>
    </>
  );
}
