import clsx from 'clsx';
import { Building2, Truck } from 'lucide-react';

export interface MapMarker {
  id: string;
  x: number; // 0–100 % from left
  y: number; // 0–100 % from top
  label: string;
  kind?: 'tanker' | 'center';
  tone?: 'brand' | 'warning' | 'success' | 'neutral' | 'info';
  active?: boolean;
  onClick?: () => void;
}

const toneBg = {
  brand: 'bg-brand-600',
  warning: 'bg-amber-500',
  success: 'bg-emerald-600',
  neutral: 'bg-zinc-500',
  info: 'bg-sky-600',
};

/**
 * Placeholder map used until a map provider (Leaflet + OpenStreetMap — not Google Maps)
 * is wired in. Marker positions are percentages of the box.
 */
export default function FakeMap({
  markers,
  height = 320,
  caption = 'Live GPS · updates every 30 s',
}: {
  markers: MapMarker[];
  height?: number;
  caption?: string;
}) {
  return (
    <div
      className="relative w-full overflow-hidden rounded-lg border border-zinc-200 bg-[#EDF1E8]"
      style={{ height }}
    >
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
        <ellipse cx="74" cy="72" rx="11" ry="7" fill="#CBE0EC" />
        <ellipse cx="22" cy="18" rx="6" ry="4" fill="#CBE0EC" />
        <path d="M0 32 C 20 26, 35 46, 55 41 S 85 20, 100 28" stroke="#fff" strokeWidth="1.8" fill="none" vectorEffect="non-scaling-stroke" />
        <path d="M12 100 C 22 72, 40 60, 46 40 S 52 10, 62 0" stroke="#fff" strokeWidth="1.8" fill="none" vectorEffect="non-scaling-stroke" />
        <path d="M0 76 C 30 70, 60 86, 100 64" stroke="#fff" strokeWidth="1.2" fill="none" vectorEffect="non-scaling-stroke" />
        <path d="M72 100 C 74 80, 82 60, 100 50" stroke="#fff" strokeWidth="1" fill="none" vectorEffect="non-scaling-stroke" />
        <path d="M0 52 C 15 55, 25 50, 46 40" stroke="#fff" strokeWidth="1" fill="none" vectorEffect="non-scaling-stroke" />
      </svg>
      {markers.map((m) => {
        const Icon = m.kind === 'center' ? Building2 : Truck;
        return (
          <button
            key={m.id}
            type="button"
            onClick={m.onClick}
            className="group absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${m.x}%`, top: `${m.y}%` }}
            aria-label={m.label}
          >
            <span
              className={clsx(
                'flex items-center justify-center rounded-full border-2 border-white shadow-md transition-transform',
                m.kind === 'center' ? 'h-6 w-6 rounded-md bg-zinc-800' : toneBg[m.tone ?? 'brand'],
                m.kind !== 'center' && (m.active ? 'h-9 w-9 scale-110 ring-4 ring-brand-600/25' : 'h-7 w-7'),
              )}
            >
              <Icon className="h-3.5 w-3.5 text-white" />
            </span>
            <span className="absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded bg-white/95 px-1.5 py-0.5 text-[10px] font-medium text-zinc-700 shadow-sm">
              {m.label}
            </span>
          </button>
        );
      })}
      <span className="absolute bottom-2 left-2 rounded-md bg-white/95 px-2 py-1 text-xs text-zinc-600 shadow-sm">
        {caption}
      </span>
    </div>
  );
}
