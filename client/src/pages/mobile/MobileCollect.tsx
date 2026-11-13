import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { CheckCircle2, ClipboardList, Milk, ScanLine, Truck, Users, WifiOff, XCircle } from 'lucide-react';
import { farmers } from '@/data/mock';
import { evaluateDelivery } from '@/lib/pricing';
import { lkr } from '@/lib/format';
import { useToast } from '@/context/ToastContext';
import { Avatar } from '@/components/ui/misc';

export default function MobileCollect() {
  const toast = useToast();
  const [farmerId, setFarmerId] = useState('MF-004812');
  const [litres, setLitres] = useState('44.0');
  const [fat, setFat] = useState('4.10');
  const [snf, setSnf] = useState('8.60');
  const [temp, setTemp] = useState('6.8');
  const [alcohol, setAlcohol] = useState<'Pass' | 'Fail'>('Pass');
  const [adult, setAdult] = useState('None found');
  const [pending, setPending] = useState(3);
  const [count, setCount] = useState(41);

  const farmer = farmers.find((f) => f.id === farmerId.trim().toUpperCase());
  const ev = useMemo(() => {
    const v = [litres, fat, snf, temp].map(parseFloat);
    if (!farmer || !v.every(Number.isFinite)) return null;
    return evaluateDelivery({ litres: v[0], fat: v[1], snf: v[2], temp: v[3], alcohol, adulteration: adult, category: farmer.category });
  }, [farmer, litres, fat, snf, temp, alcohol, adult]);

  const save = (reject = false) => {
    if (!farmer || !ev) return toast('Check the farmer ID and readings.', 'error');
    setPending((p) => p + 1);
    setCount((c) => c + 1);
    toast(reject || ev.result === 'Rejected' ? `Rejection saved for ${farmer.name}` : `Saved ${litres} L · ${lkr(ev.value)}. Receipt printing.`);
    setLitres('');
    setFat('');
    setSnf('');
    setTemp('');
    setFarmerId('');
  };

  const input = 'h-12 w-full rounded-xl border border-zinc-300 bg-white px-3 font-mono text-lg font-semibold tabular-nums outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20';

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <header className="bg-zinc-900 px-4 pb-4 pt-5 text-white">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">New delivery</h1>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 px-2.5 py-1 text-xs font-medium text-amber-200">
            <WifiOff className="h-3.5 w-3.5" /> Offline · {pending} to upload
          </span>
        </div>
        <p className="mt-1 text-sm text-[#A1A1AA]">Hingurakgoda CC · Morning · {count} today</p>
      </header>

      <main className="flex-1 space-y-4 overflow-y-auto p-4">
        <div className="flex gap-2">
          <label className="flex-1">
            <span className="mb-1 block text-xs font-medium text-zinc-600">Farmer ID</span>
            <input className={input} value={farmerId} onChange={(e) => setFarmerId(e.target.value)} placeholder="MF-…" />
          </label>
          <button
            type="button"
            className="mt-5 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-zinc-300 bg-white"
            aria-label="Scan farmer card QR code"
            onClick={() => setFarmerId('MF-004812')}
          >
            <ScanLine className="h-5 w-5" />
          </button>
        </div>

        {farmer ? (
          <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3">
            <Avatar name={farmer.name} />
            <div className="min-w-0">
              <p className="truncate font-semibold">{farmer.name}</p>
              <p className="text-xs text-zinc-500">
                {farmer.category} · usually {Math.round(farmer.avgLitres / 2)} L · last FAT {farmer.fat.toFixed(2)}
              </p>
            </div>
          </div>
        ) : (
          farmerId && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">No farmer with ID {farmerId}.</p>
        )}

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-zinc-600">Litres</span>
          <input className={clsx(input, 'h-16 text-3xl')} inputMode="decimal" value={litres} onChange={(e) => setLitres(e.target.value)} />
        </label>

        <div className="grid grid-cols-3 gap-2">
          {[
            ['FAT %', fat, setFat],
            ['SNF %', snf, setSnf],
            ['Temp °C', temp, setTemp],
          ].map(([label, value, setter]) => (
            <label key={label as string}>
              <span className="mb-1 block text-xs font-medium text-zinc-600">{label as string}</span>
              <input
                className={input}
                inputMode="decimal"
                value={value as string}
                onChange={(e) => (setter as (v: string) => void)(e.target.value)}
              />
            </label>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setAlcohol((a) => (a === 'Pass' ? 'Fail' : 'Pass'))}
            className={clsx(
              'flex h-12 items-center justify-between rounded-xl border px-3 text-sm font-medium',
              alcohol === 'Pass' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-700',
            )}
          >
            Alcohol test <span>{alcohol}</span>
          </button>
          <select
            aria-label="Adulteration"
            className="h-12 rounded-xl border border-zinc-300 bg-white px-3 text-sm font-medium"
            value={adult}
            onChange={(e) => setAdult(e.target.value)}
          >
            <option>None found</option>
            <option>Water</option>
            <option>Starch</option>
            <option>Sugar</option>
          </select>
        </div>

        {ev && (
          <div
            className={clsx(
              'flex items-center gap-3 rounded-xl p-3',
              ev.result === 'Rejected' ? 'bg-red-50 text-red-800' : ev.result === 'Flagged' ? 'bg-amber-50 text-amber-900' : 'bg-emerald-50 text-emerald-900',
            )}
          >
            {ev.result === 'Rejected' ? <XCircle className="h-6 w-6 shrink-0" /> : <CheckCircle2 className="h-6 w-6 shrink-0" />}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{ev.result === 'Rejected' ? 'Reject' : `${ev.result} · Rs ${ev.rate.toFixed(2)} / L`}</p>
              {ev.reasons.length > 0 && <p className="text-xs">{ev.reasons.join(' · ')}</p>}
            </div>
            {ev.result !== 'Rejected' && <span className="font-mono text-lg font-semibold tabular-nums">{lkr(ev.value)}</span>}
          </div>
        )}
      </main>

      <div className="grid grid-cols-[1fr_2fr] gap-2 border-t border-zinc-200 bg-white p-3">
        <button type="button" className="h-14 rounded-xl border border-zinc-300 font-semibold" onClick={() => save(true)}>
          Reject
        </button>
        <button type="button" className="h-14 rounded-xl bg-brand-600 font-semibold text-white active:bg-brand-700" onClick={() => save()}>
          Save & print
        </button>
      </div>

      <nav aria-label="App" className="grid grid-cols-4 border-t border-zinc-200 bg-white pb-[env(safe-area-inset-bottom)]">
        {[
          { label: 'Collect', icon: Milk, active: true },
          { label: 'Today', icon: ClipboardList },
          { label: 'Farmers', icon: Users },
          { label: 'Tanker', icon: Truck },
        ].map((t) => (
          <button
            key={t.label}
            type="button"
            className={clsx('flex h-16 flex-col items-center justify-center gap-1 text-xs font-medium', t.active ? 'text-brand-700' : 'text-zinc-500')}
          >
            <t.icon className="h-5 w-5" />
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
