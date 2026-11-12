import { useState } from 'react';
import clsx from 'clsx';
import { AlertTriangle, CheckCircle2, Circle, CircleDot, ClipboardCheck, Navigation, Route, Thermometer } from 'lucide-react';
import { tankers } from '@/data/mock';
import { num } from '@/lib/format';
import FakeMap from '@/components/ui/FakeMap';
import { Progress } from '@/components/ui/misc';
import { useToast } from '@/context/ToastContext';

export default function MobileDriver() {
  const toast = useToast();
  const base = tankers[0];
  const [stops, setStops] = useState(base.stops);
  const [loaded, setLoaded] = useState(base.loaded);

  const nextIndex = stops.findIndex((s) => s.status === 'Next');
  const next = stops[nextIndex];

  const arrive = () => {
    if (!next) return;
    const picked = 3500;
    setLoaded((l) => l + picked);
    setStops((s) =>
      s.map((x, i) =>
        i === nextIndex ? { ...x, status: 'Done', litres: picked } : i === nextIndex + 1 ? { ...x, status: 'Next' } : x,
      ),
    );
    toast(`${next.name}: ${num(picked)} L loaded, sample sealed`);
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <header className="bg-zinc-900 px-4 pb-4 pt-5 text-white">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">Route {base.route}</h1>
          <span className="rounded-full bg-amber-400/20 px-2.5 py-1 text-xs font-medium text-amber-200">{base.delayMin} min late</span>
        </div>
        <p className="mt-1 text-sm text-[#A1A1AA]">
          {base.plate} · {base.driver} · started {base.departed}
        </p>
      </header>

      <FakeMap
        height={190}
        caption="Navigation to next stop"
        markers={[{ id: 't', x: 45, y: 50, label: next ? `Next: ${next.name}` : 'Route complete', active: true, tone: 'brand' }]}
      />

      <main className="flex-1 space-y-4 overflow-y-auto p-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <div className="mb-2 flex justify-between text-sm">
            <span className="font-semibold">Tanker load</span>
            <span className="font-mono tabular-nums">
              {num(loaded)} / {num(base.capacity)} L
            </span>
          </div>
          <Progress value={loaded} max={base.capacity} label="Tanker load" />
          <p className="mt-2 flex items-center gap-1 text-xs text-zinc-500">
            <Thermometer className="h-3.5 w-3.5" /> Compartment {base.temp.toFixed(1)} °C
          </p>
        </div>

        <ol className="space-y-2">
          {stops.map((s, i) => (
            <li
              key={s.name}
              className={clsx(
                'flex items-center gap-3 rounded-xl border bg-white p-3',
                s.status === 'Next' ? 'border-brand-600 ring-2 ring-brand-600/15' : 'border-zinc-200',
              )}
            >
              {s.status === 'Done' ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
              ) : s.status === 'Next' ? (
                <CircleDot className="h-5 w-5 shrink-0 text-brand-600" />
              ) : (
                <Circle className="h-5 w-5 shrink-0 text-zinc-300" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">
                  {i + 1}. {s.name}
                </p>
                <p className="text-xs text-zinc-500">
                  {s.status === 'Done' ? `${num(s.litres ?? 0)} L · sample sealed` : s.eta ? `ETA ${s.eta}` : 'Waiting'}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </main>

      <div className="grid grid-cols-[1fr_2fr] gap-2 border-t border-zinc-200 bg-white p-3">
        <button type="button" className="flex h-14 items-center justify-center gap-1.5 rounded-xl border border-zinc-300 text-sm font-semibold" onClick={() => toast('Issue reported to transport control', 'info')}>
          <AlertTriangle className="h-4 w-4" /> Issue
        </button>
        <button
          type="button"
          disabled={!next}
          className="h-14 rounded-xl bg-brand-600 font-semibold text-white disabled:bg-zinc-300"
          onClick={arrive}
        >
          {next ? `Arrived at stop ${nextIndex + 1}` : 'Route complete'}
        </button>
      </div>

      <nav aria-label="App" className="grid grid-cols-3 border-t border-zinc-200 bg-white pb-[env(safe-area-inset-bottom)]">
        {[
          { label: 'Route', icon: Route, active: true },
          { label: 'Navigate', icon: Navigation },
          { label: 'Vehicle check', icon: ClipboardCheck },
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
