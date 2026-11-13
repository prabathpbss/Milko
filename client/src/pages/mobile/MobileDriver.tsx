import { useState } from 'react';
import clsx from 'clsx';
import { AlertTriangle, CheckCircle2, Circle, CircleDot, Thermometer } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/misc';
import FakeMap from '@/components/ui/FakeMap';
import { tankers } from '@/data/mock';
import { num } from '@/lib/format';
import { useToast } from '@/context/ToastContext';
import StickyActions from './StickyActions';
import { useLang } from '@/i18n/LanguageContext';

/** Tanker driver form — route, stops and loading. Used on the driver's phone browser. */
export default function MobileDriver() {
  const toast = useToast();
  const { t } = useLang();
  const base = tankers[0];
  const [stops, setStops] = useState(base.stops);
  const [loaded, setLoaded] = useState(base.loaded);

  const nextIndex = stops.findIndex((s) => s.status === 'Next');
  const next = stops[nextIndex];

  const arrive = () => {
    if (!next) return;
    const picked = 3500;
    setLoaded((l) => l + picked);
    setStops((s) => s.map((x, i) => (i === nextIndex ? { ...x, status: 'Done', litres: picked } : i === nextIndex + 1 ? { ...x, status: 'Next' } : x)));
    toast(t("{stop}: {litres} L loaded, sample sealed", { stop: next.name, litres: num(picked) }));
  };

  return (
    <>
      <PageHeader
        breadcrumb={[{ label: t("Field forms") }, { label: t("Tanker driver") }]}
        title={t("Route {route}", { route: base.route })}
        description={t("{plate} · {driver} · started {time}", { plate: base.plate, driver: base.driver, time: base.departed })}
        actions={base.delayMin ? <Badge tone="warning" dot>{t("{n} min late", { n: base.delayMin })}</Badge> : undefined}
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          <Card>
            <CardBody>
              <div className="mb-2 flex justify-between text-sm">
                <span className="font-semibold">{t("Tanker load")}</span>
                <span className="num">
                  {num(loaded)} / {num(base.capacity)} L
                </span>
              </div>
              <Progress value={loaded} max={base.capacity} label={t("Tanker load")} />
              <p className="mt-2 flex items-center gap-1 text-xs text-zinc-500">
                <Thermometer className="h-3.5 w-3.5" /> {t("Compartment {temp} °C", { temp: base.temp.toFixed(1) })}
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={t("Stops")} subtitle={next ? t("Next: {stop}", { stop: next.name }) : t("All stops done")} />
            <CardBody className="space-y-4">
              <ol className="space-y-2">
                {stops.map((s, i) => (
                  <li
                    key={s.name}
                    aria-current={s.status === 'Next' ? 'step' : undefined}
                    className={clsx(
                      'flex items-center gap-3 rounded-xl border p-3',
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
                        {s.status === "Done" ? t("{litres} L · sample sealed", { litres: num(s.litres ?? 0) }) : s.eta ? t("ETA {time}", { time: s.eta }) : t("Waiting")}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
              <StickyActions>
                  <button type="button" className="btn btn-secondary h-14 sm:h-11" onClick={() => toast(t("Issue reported to transport control"), "info")}>
                    <AlertTriangle className="h-4 w-4" /> {t("Issue")}
                  </button>
                  <button type="button" disabled={!next} className="btn btn-primary h-14 sm:h-11" onClick={arrive}>
                    {next ? t("Arrived at stop {n}", { n: nextIndex + 1 }) : t("Route complete")}
                  </button>
                </StickyActions>
            </CardBody>
          </Card>
        </div>

        <Card className="h-fit overflow-hidden lg:col-span-2">
          <FakeMap
            height={260}
            caption={t("Next stop")}
            markers={[{ id: 't', x: 45, y: 50, label: next ? t("Next: {stop}", { stop: next.name }) : t("Route complete"), active: true, tone: 'brand' }]}
          />
        </Card>
      </div>
    </>
  );
}
