import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { CheckCircle2, ScanLine, WifiOff, XCircle } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/misc';
import { farmers } from '@/data/mock';
import { evaluateDelivery } from '@/lib/pricing';
import { lkr, num } from '@/lib/format';
import { useToast } from '@/context/ToastContext';
import StickyActions from './StickyActions';
import { useLang } from '@/i18n/LanguageContext';

/** Quality reasons come from lib/pricing in English; translate them with their numbers kept. */
function trReason(r: string, t: (s: string, v?: Record<string, string | number>) => string) {
  let m = /^Adulteration: (.+)$/.exec(r);
  if (m) return t("Adulteration: {what}", { what: t(m[1]) });
  m = /^Below minimum \(FAT (.+) \/ SNF (.+)\)$/.exec(r);
  if (m) return t("Below minimum (FAT {fat} / SNF {snf})", { fat: m[1], snf: m[2] });
  m = /^Temperature (.+) °C above (.+) °C$/.exec(r);
  if (m) return t("Temperature {temp} °C above {max} °C", { temp: m[1], max: m[2] });
  return t(r);
}

interface Saved {
  id: number;
  time: string;
  farmer: string;
  litres: number;
  value: number;
  result: string;
}

/** Field collection form — used on a phone at the collection point, also works on desktop. */
export default function MobileCollect() {
  const toast = useToast();
  const { t } = useLang();
  const [farmerId, setFarmerId] = useState('MF-004812');
  const [litres, setLitres] = useState('44.0');
  const [fat, setFat] = useState('4.10');
  const [snf, setSnf] = useState('8.60');
  const [temp, setTemp] = useState('6.8');
  const [alcohol, setAlcohol] = useState<'Pass' | 'Fail'>('Pass');
  const [adult, setAdult] = useState('None found');
  const [pending, setPending] = useState(3);
  const [count, setCount] = useState(41);
  const [saved, setSaved] = useState<Saved[]>([]);

  const farmer = farmers.find((f) => f.id === farmerId.trim().toUpperCase());
  const ev = useMemo(() => {
    const v = [litres, fat, snf, temp].map(parseFloat);
    if (!farmer || !v.every(Number.isFinite)) return null;
    return evaluateDelivery({ litres: v[0], fat: v[1], snf: v[2], temp: v[3], alcohol, adulteration: adult, category: farmer.category });
  }, [farmer, litres, fat, snf, temp, alcohol, adult]);

  const save = (reject = false) => {
    if (!farmer || !ev) return toast(t("Check the farmer ID and readings."), "error");
    const rejected = reject || ev.result === 'Rejected';
    setPending((p) => p + 1);
    setCount((c) => c + 1);
    setSaved((s) => [
      {
        id: Date.now(),
        time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        farmer: farmer.name,
        litres: parseFloat(litres),
        value: rejected ? 0 : ev.value,
        result: rejected ? 'Rejected' : ev.result,
      },
      ...s,
    ]);
    toast(rejected ? t("Rejection saved for {name}", { name: farmer.name }) : t("Saved {litres} L · {value}. Receipt printing.", { litres, value: lkr(ev.value) }));
    setLitres('');
    setFat('');
    setSnf('');
    setTemp('');
    setFarmerId('');
  };

  const big = 'input h-12 font-mono text-lg font-semibold tabular-nums';

  return (
    <>
      <PageHeader
        breadcrumb={[{ label: t("Field forms") }, { label: t("Field collection") }]}
        title={t("New delivery")}
        description={t("Hingurakgoda CC · Morning shift · {n} deliveries today", { n: count })}
        actions={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800 ring-1 ring-amber-600/25">
            <WifiOff className="h-3.5 w-3.5" /> {t("Offline · {n} to upload", { n: pending })}
          </span>
        }
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardBody>
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); save(); }}>
              <div className="flex items-end gap-2">
                <label className="flex-1">
                  <span className="label mb-1.5 block">{t("Farmer ID")}</span>
                  <input
                    className={big}
                    value={farmerId}
                    onChange={(e) => setFarmerId(e.target.value)}
                    placeholder="MF-…"
                    list="field-farmers"
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <datalist id="field-farmers">
                    {farmers.map((f) => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </datalist>
                </label>
                <button
                  type="button"
                  className="btn btn-secondary h-12 w-12 shrink-0 p-0"
                  aria-label={t("Scan farmer card QR code")}
                  onClick={() => setFarmerId('MF-004812')}
                >
                  <ScanLine className="h-5 w-5" />
                </button>
              </div>

              {farmer ? (
                <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                  <Avatar name={farmer.name} />
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{farmer.name}</p>
                    <p className="text-xs text-zinc-500">
                      {t("{category} · usually {litres} L · last FAT {fat}", { category: t(farmer.category), litres: Math.round(farmer.avgLitres / 2), fat: farmer.fat.toFixed(2) })}
                    </p>
                  </div>
                </div>
              ) : (
                farmerId && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{t("No farmer with ID {id}.", { id: farmerId })}</p>
              )}

              <label className="block">
                <span className="label mb-1.5 block">{t("Litres")}</span>
                <input className={clsx(big, 'h-16 text-3xl')} inputMode="decimal" value={litres} onChange={(e) => setLitres(e.target.value)} />
              </label>

              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                {(
                  [
                    ['FAT %', fat, setFat],
                    ['SNF %', snf, setSnf],
                    ['Temp °C', temp, setTemp],
                  ] as const
                ).map(([label, value, setter]) => (
                  <label key={label}>
                    <span className="label mb-1.5 block">{t(label)}</span>
                    <input className={big} inputMode="decimal" value={value} onChange={(e) => setter(e.target.value)} />
                  </label>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                <button
                  type="button"
                  aria-pressed={alcohol === 'Fail'}
                  onClick={() => setAlcohol((a) => (a === 'Pass' ? 'Fail' : 'Pass'))}
                  className={clsx(
                    'flex h-12 items-center justify-between rounded-lg border px-3 text-sm font-medium',
                    alcohol === 'Pass' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-700',
                  )}
                >
                  {t("Alcohol test")} <span>{t(alcohol)}</span>
                </button>
                <select aria-label={t("Adulteration")} className="input h-12" value={adult} onChange={(e) => setAdult(e.target.value)}>
                  {["None found", "Water", "Starch", "Sugar"].map((o) => (
                    <option key={o} value={o}>{t(o)}</option>
                  ))}
                </select>
              </div>

              {ev && (
                <div
                  role="status"
                  className={clsx(
                    'flex items-center gap-3 rounded-xl p-3',
                    ev.result === 'Rejected' ? 'bg-red-50 text-red-800' : ev.result === 'Flagged' ? 'bg-amber-50 text-amber-900' : 'bg-emerald-50 text-emerald-900',
                  )}
                >
                  {ev.result === 'Rejected' ? <XCircle className="h-6 w-6 shrink-0" /> : <CheckCircle2 className="h-6 w-6 shrink-0" />}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{ev.result === "Rejected" ? t("Reject") : `${t(ev.result)} · Rs ${ev.rate.toFixed(2)} / L`}</p>
                    {ev.reasons.length > 0 && <p className="text-xs">{ev.reasons.map((r) => trReason(r, t)).join(" · ")}</p>}
                  </div>
                  {ev.result !== 'Rejected' && <span className="font-mono text-lg font-semibold tabular-nums">{lkr(ev.value)}</span>}
                </div>
              )}

              <StickyActions>
                <button type="button" className="btn btn-secondary h-14 sm:h-11" onClick={() => save(true)}>
                  {t("Reject")}
                </button>
                <button type="submit" className="btn btn-primary h-14 sm:h-11">
                  {t("Save & print")}
                </button>
              </StickyActions>
            </form>
          </CardBody>
        </Card>

        <Card className="h-fit lg:col-span-2">
          <CardHeader title={t("This shift")} subtitle={t("{n} saved on this device", { n: saved.length })} />
          {saved.length ? (
            <ul className="divide-y divide-zinc-100">
              {saved.map((s) => (
                <li key={s.id} className="flex items-center gap-3 px-4 py-3 text-sm sm:px-5">
                  <span className="num w-12 shrink-0 text-zinc-500">{s.time}</span>
                  <span className="min-w-0 flex-1 truncate font-medium">{s.farmer}</span>
                  <span className="num">{num(s.litres, 1)} L</span>
                  <StatusBadge status={s.result} />
                </li>
              ))}
            </ul>
          ) : (
            <CardBody className="text-sm text-zinc-500">{t("Deliveries you save appear here and upload when the phone is back online.")}</CardBody>
          )}
        </Card>
      </div>
    </>
  );
}
