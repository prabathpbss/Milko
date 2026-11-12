import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { CheckCircle2, Info, XCircle } from 'lucide-react';

type Tone = 'success' | 'error' | 'info';
interface Toast {
  id: number;
  message: string;
  tone: Tone;
}

const ToastContext = createContext<(message: string, tone?: Tone) => void>(() => {});

const icons = {
  success: <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />,
  error: <XCircle className="h-4 w-4 shrink-0 text-red-400" />,
  info: <Info className="h-4 w-4 shrink-0 text-sky-400" />,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);

  const push = useCallback((message: string, tone: Tone = 'success') => {
    const id = Date.now() + Math.random();
    setItems((s) => [...s, { id, message, tone }]);
    window.setTimeout(() => setItems((s) => s.filter((t) => t.id !== id)), 3500);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-4 right-4 z-[70] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2"
      >
        {items.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-start gap-3 rounded-xl bg-zinc-900 px-4 py-3 text-sm text-white shadow-lg"
          >
            <span className="mt-0.5">{icons[t.tone]}</span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
