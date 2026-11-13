import { useState } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { ArrowUpRight, Check, Clock, CornerUpLeft, X } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { FilterChips } from '@/components/ui/Tabs';
import { Field } from '@/components/ui/Field';
import { EmptyState, KeyValue } from '@/components/ui/misc';
import { approvals as seed, type Approval } from '@/data/mock';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { useLang } from '@/i18n/LanguageContext';
import { si } from '@/i18n/si';

type View = 'Pending' | 'Done';
const types: ('All' | Approval['type'])[] = ['All', 'Payment run', 'Contract change', 'Onboarding', 'Advance', 'Dispute', 'Collection edit', 'Write-off'];

type T = (text: string, vars?: Record<string, string | number>) => string;
/** '2 h' / '1 d' → translated age. */
const trAge = (age: string, t: T) => {
  const m = /^(\d+) (h|d)$/.exec(age);
  return m ? t(m[2] === 'h' ? '{n} h' : '{n} d', { n: m[1] }) : t(age);
};
/** Chain time: 'Yesterday 15:10' keeps the time; plain times and dates stay as they are. */
const trAt = (at: string, t: T) => (at.startsWith('Yesterday ') ? `${t('Yesterday')} ${at.slice(10)}` : at);
/** Approver text: 'Finance manager · Nadeesha Perera' translates only the role part before the name. */
const trWho = (who: string, t: T) => {
  const [first, ...rest] = who.split(' · ');
  return [t(first), ...rest].join(' · ');
};
/** Detail values: only word values that have a Sinhala entry are translated; numbers, money, codes and names stay as they are. */
const trValue = (v: string, t: T) => (v in si ? t(v) : v);

export default function Approvals() {
  const { t } = useLang();
  const toast = useToast();
  const { user } = useAuth();
  const [items, setItems] = useState(seed);
  const [view, setView] = useState<View>('Pending');
  const [type, setType] = useState<(typeof types)[number]>('All');
  const [selId, setSelId] = useState(seed[0].id);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  const list = items.filter(
    (a) => (view === 'Pending' ? a.status === 'Pending' : a.status !== 'Pending') && (type === 'All' || a.type === type),
  );
  const sel = items.find((a) => a.id === selId);

  const decide = (status: Approval['status']) => {
    if (!sel) return;
    if (status !== 'Approved' && !comment.trim()) {
      setError(t('Add a comment so the requester knows what to change.'));
      return;
    }
    setError('');
    const now = new Date().toTimeString().slice(0, 5);
    setItems((all) =>
      all.map((a) =>
        a.id === sel.id
          ? {
              ...a,
              status,
              chain: a.chain.map((c) =>
                c.status === 'Waiting'
                  ? { ...c, status: status === 'Approved' ? 'Approved' : status === 'Rejected' ? 'Rejected' : 'Returned', at: now, who: `${c.who} · ${user?.name ?? ''}` }
                  : c,
              ),
            }
          : a,
      ),
    );
    setComment('');
    toast(
      status === 'Approved'
        ? t('{title} approved', { title: t(sel.title) })
        : status === 'Rejected'
          ? t('{title} rejected', { title: t(sel.title) })
          : t('{title} sent back to {who}', { title: t(sel.title), who: t(sel.requestedBy) }),
      status === 'Approved' ? 'success' : 'info',
    );
    const next = list.find((a) => a.id !== sel.id);
    if (next) setSelId(next.id);
  };

  return (
    <>
      <PageHeader
        breadcrumb={[{ label: t('Finance') }, { label: t('Approvals') }]}
        title={t('Approvals')}
        description={t('Requests waiting for your decision. Approval rules are set in Settings.')}
        actions={
          <Link to="/settings" className="btn btn-secondary">
            {t('Approval rules')}
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <FilterChips<View>
          value={view}
          onChange={setView}
          options={[
            { id: 'Pending', label: t('Waiting for me'), count: items.filter((a) => a.status === 'Pending').length },
            { id: 'Done', label: t('Decided'), count: items.filter((a) => a.status !== 'Pending').length },
          ]}
        />
        <select className="input w-full sm:w-56" aria-label={t('Request type')} value={type} onChange={(e) => setType(e.target.value as typeof type)}>
          {types.map((ty) => (
            <option key={ty} value={ty}>{ty === 'All' ? t('All request types') : t(ty)}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-2">
          {list.length === 0 ? (
            <EmptyState title={t('Nothing here')} text={view === 'Pending' ? t('You have no requests waiting. Nice work.') : t('No decided requests yet.')} />
          ) : (
            <ul className="divide-y divide-zinc-100">
              {list.map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelId(a.id);
                      setError('');
                    }}
                    className={clsx(
                      'flex w-full flex-col gap-1.5 px-5 py-4 text-left transition-colors',
                      a.id === selId ? 'bg-brand-50/70 shadow-[inset_3px_0_0_#D71920]' : 'hover:bg-zinc-50',
                    )}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <Badge>{t(a.type)}</Badge>
                      <span className="flex items-center gap-1 text-xs text-zinc-500">
                        <Clock className="h-3 w-3" /> {trAge(a.age, t)}
                      </span>
                    </span>
                    <span className="text-sm font-semibold text-zinc-900">{t(a.title)}</span>
                    <span className="line-clamp-2 text-xs text-zinc-500">{t(a.summary)}</span>
                    {a.status !== 'Pending' && <StatusBadge status={a.status} className="self-start" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {sel && (
          <Card className="xl:col-span-3">
            <CardHeader
              title={t(sel.title)}
              subtitle={t('{type} · requested by {who}', { type: t(sel.type), who: t(sel.requestedBy) })}
              actions={
                <>
                  <StatusBadge status={sel.status} />
                  <Link to={sel.link} className="btn btn-ghost btn-sm">
                    {t('Open record')} <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </>
              }
            />
            <CardBody className="space-y-6">
              <p className="text-sm leading-relaxed text-zinc-700">{t(sel.summary)}</p>
              <div className="rounded-lg border border-zinc-200 p-4">
                <KeyValue items={sel.details.map(([k, v]) => [t(k), trValue(v, t)] as [string, string])} className="grid-cols-[minmax(0,200px)_minmax(0,1fr)]" />
              </div>

              <div>
                <h3 className="mb-3 text-sm font-semibold">{t('Approval chain')}</h3>
                <ol className="space-y-2">
                  {sel.chain.map((c, i) => (
                    <li key={i} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-200 px-4 py-3">
                      <span className="flex items-center gap-3">
                        <span className="num flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-600">{i}</span>
                        <span>
                          <span className="block text-sm font-medium">{t(c.role)}</span>
                          <span className="block text-xs text-zinc-500">{trWho(c.who, t)}</span>
                        </span>
                      </span>
                      <span className="flex items-center gap-2">
                        {c.at && <span className="num text-xs text-zinc-500">{trAt(c.at, t)}</span>}
                        <StatusBadge status={c.status} />
                      </span>
                    </li>
                  ))}
                </ol>
              </div>

              {sel.status === 'Pending' && (
                <div className="space-y-4 border-t border-zinc-100 pt-5">
                  <Field label={t('Comment')} error={error} hint={t('Required when rejecting or sending back')}>
                    <textarea className="input" rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder={t('Add a note for the requester')} />
                  </Field>
                  <div className="flex flex-wrap justify-end gap-2">
                    <button className="btn btn-secondary" onClick={() => decide('Returned')}>
                      <CornerUpLeft className="h-4 w-4" /> {t('Send back')}
                    </button>
                    <button className="btn btn-secondary text-red-700" onClick={() => decide('Rejected')}>
                      <X className="h-4 w-4" /> {t('Reject')}
                    </button>
                    <button className="btn btn-primary" onClick={() => decide('Approved')}>
                      <Check className="h-4 w-4" /> {t('Approve')}
                    </button>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        )}
      </div>
    </>
  );
}
