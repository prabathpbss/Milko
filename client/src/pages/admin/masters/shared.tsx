import type { ReactNode } from 'react';
import clsx from 'clsx';
import { Plus, Power, Save, Search, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import type { MasterStatus } from '@/data/masters';
import { useLang } from '@/i18n/LanguageContext';

/** List on one side, editor on the other. `wide` gives the editor more room (e.g. a permission matrix). */
export function MasterLayout({ list, form, wide }: { list: ReactNode; form: ReactNode; wide?: boolean }) {
  return (
    <div className="grid gap-6 xl:grid-cols-5">
      <Card className={clsx('h-fit', wide ? 'xl:col-span-2' : 'xl:col-span-3')}>{list}</Card>
      <div className={wide ? 'xl:col-span-3' : 'xl:col-span-2'}>{form}</div>
    </div>
  );
}

export function SearchBar({
  value,
  onChange,
  onNew,
  placeholder,
  label,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  onNew: () => void;
  placeholder: string;
  label: string;
  children?: ReactNode;
}) {
  const { t } = useLang();
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-zinc-100 p-4">
      <label className="relative min-w-[200px] flex-1">
        <span className="sr-only">{t('Search')}</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input className="input pl-9" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
      </label>
      {children}
      <button type="button" className="btn btn-primary" onClick={onNew}>
        <Plus className="h-4 w-4" /> {label}
      </button>
    </div>
  );
}

export const focusFirstError = () =>
  requestAnimationFrame(() =>
    document.querySelector('[data-field-error]')?.closest('label, fieldset')?.querySelector<HTMLElement>('input, select, textarea')?.focus(),
  );

/** Codes like NC, GLD, FIN-MGR, CC-HNG, RT-07 */
export const CODE_RE = /^[A-Z][A-Z0-9-]{1,9}$/;

export function FormActions({
  isNew,
  status,
  inUse,
  locked,
  onSave,
  onToggle,
  onDelete,
}: {
  isNew: boolean;
  status: MasterStatus;
  inUse: boolean;
  /** Built-in records: save only */
  locked?: boolean;
  onSave: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const { t } = useLang();
  return (
    <div className="flex flex-wrap justify-end gap-2 border-t border-zinc-100 pt-4">
      {!isNew &&
        !locked &&
        (inUse ? (
          <button type="button" className="btn btn-secondary" onClick={onToggle}>
            <Power className="h-4 w-4" /> {status === 'Active' ? t('Deactivate') : t('Activate')}
          </button>
        ) : (
          <button type="button" className="btn btn-ghost text-red-700 hover:bg-red-50" onClick={onDelete}>
            <Trash2 className="h-4 w-4" /> {t('Delete')}
          </button>
        ))}
      <button type="submit" className="btn btn-primary" onClick={onSave}>
        <Save className="h-4 w-4" /> {isNew ? t('Create') : t('Save changes')}
      </button>
    </div>
  );
}
