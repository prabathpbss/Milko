import clsx from 'clsx';
import { FileText, Home, MessageSquareWarning, Milk, ShoppingBag, Wallet } from 'lucide-react';
import logo from '@/assets/milco-logo.jpg';
import { farmerPayments, farmers } from '@/data/mock';
import { StatusBadge } from '@/components/ui/Badge';
import { lkr, num } from '@/lib/format';
import { useToast } from '@/context/ToastContext';

const messages = [
  { tag: 'Paid', tone: 'bg-emerald-50 text-emerald-800', text: `${lkr(farmerPayments[0].net)} for 16–31 Oct was sent to your bank.` },
  { tag: 'Contract', tone: 'bg-amber-50 text-amber-900', text: 'Your contract renews on 31 Mar 2027. Tap to review.' },
  { tag: 'Training', tone: 'bg-zinc-100 text-zinc-700', text: 'Food safety training at Hingurakgoda CC on 30 Nov, 10:00.' },
];

const recent = [
  { when: '12 Nov AM', litres: 44.0, status: 'Accepted' },
  { when: '11 Nov PM', litres: 41.5, status: 'Accepted' },
  { when: '11 Nov AM', litres: 45.2, status: 'Accepted' },
  { when: '10 Nov PM', litres: 6.0, status: 'Rejected' },
];

export default function MobileFarmer() {
  const toast = useToast();
  const f = farmers[0];

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3">
        <img src={logo} alt="MILCO" className="h-8 w-auto" />
        <select aria-label="Language" className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs">
          <option>සිංහල</option>
          <option>தமிழ்</option>
          <option>English</option>
        </select>
      </header>

      <main className="flex-1 space-y-4 overflow-y-auto p-4">
        <div>
          <p className="text-sm text-zinc-500">Ayubowan,</p>
          <h1 className="text-xl font-semibold">{f.name}</h1>
          <p className="text-xs text-zinc-500">
            {f.id} · {f.category} farmer
          </p>
        </div>

        <div className="rounded-2xl bg-brand-700 p-5 text-white">
          <p className="text-xs text-brand-100">This period so far · 1–12 Nov</p>
          <p className="mt-1 font-mono text-3xl font-semibold tabular-nums">Rs 143,580</p>
          <p className="mt-1 text-sm text-brand-100">1,038 L · avg FAT {f.fat.toFixed(2)} / SNF {f.snf.toFixed(2)}</p>
          <p className="mt-3 rounded-lg bg-white/10 px-3 py-2 text-xs text-brand-50">Payment on 16 Nov to {f.bank}</p>
        </div>

        <section>
          <h2 className="mb-2 text-sm font-semibold">Messages</h2>
          <ul className="space-y-2">
            {messages.map((m) => (
              <li key={m.tag} className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-white p-3">
                <span className={clsx('rounded-full px-2 py-0.5 text-[11px] font-semibold', m.tone)}>{m.tag}</span>
                <span className="text-sm leading-snug">{m.text}</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-semibold">Last deliveries</h2>
          <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white">
            {recent.map((r) => (
              <li key={r.when} className="flex items-center justify-between gap-2 px-3 py-2.5 text-sm">
                <span>{r.when}</span>
                <span className="font-mono tabular-nums">{num(r.litres, 1)} L</span>
                <StatusBadge status={r.status} />
              </li>
            ))}
          </ul>
        </section>

        <div className="grid grid-cols-2 gap-2">
          <button type="button" className="flex h-14 items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white text-sm font-semibold" onClick={() => toast('Request sent to your field officer')}>
            <ShoppingBag className="h-4 w-4" /> Feed / advance
          </button>
          <button type="button" className="flex h-14 items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white text-sm font-semibold" onClick={() => toast('Complaint form opened', 'info')}>
            <MessageSquareWarning className="h-4 w-4" /> Complaint
          </button>
        </div>
      </main>

      <nav aria-label="App" className="grid grid-cols-4 border-t border-zinc-200 bg-white pb-[env(safe-area-inset-bottom)]">
        {[
          { label: 'Home', icon: Home, active: true },
          { label: 'Supply', icon: Milk },
          { label: 'Payments', icon: Wallet },
          { label: 'Contract', icon: FileText },
        ].map((t) => (
          <button key={t.label} type="button" className={clsx('flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium', t.active ? 'text-brand-700' : 'text-zinc-500')}>
            <t.icon className="h-5 w-5" />
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
