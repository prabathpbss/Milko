import { useEffect, useRef, useState, type DragEvent } from 'react';
import clsx from 'clsx';
import { Camera, FileText, Plus, UploadCloud, X } from 'lucide-react';

export interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  /** Object URL for image previews (revoked on remove/unmount). */
  url?: string;
  file?: File;
}

const MB = 1024 * 1024;

function fmtSize(bytes: number) {
  if (bytes >= MB) return `${(bytes / MB).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

let seq = 0;
const toAttachment = (file: File): Attachment => ({
  id: `att-${Date.now()}-${seq++}`,
  name: file.name,
  size: file.size,
  type: file.type,
  url: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
  file,
});

/**
 * Multi-file attachment grid: drag & drop, browse, or phone camera.
 * Shows image thumbnails / file tiles with a remove button.
 */
export default function AttachmentGrid({
  value,
  onChange,
  accept = 'image/*,.pdf',
  maxFiles = 20,
  maxSizeMb = 10,
  hint = 'Images or PDF, up to 10 MB each',
  onReject,
}: {
  value: Attachment[];
  onChange: (next: Attachment[]) => void;
  accept?: string;
  maxFiles?: number;
  maxSizeMb?: number;
  hint?: string;
  onReject?: (message: string) => void;
}) {
  const browseRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  // Revoke preview URLs when the component unmounts.
  const latest = useRef(value);
  latest.current = value;
  useEffect(() => () => latest.current.forEach((a) => a.url && URL.revokeObjectURL(a.url)), []);

  const add = (list: FileList | null) => {
    if (!list?.length) return;
    const room = maxFiles - value.length;
    const files = Array.from(list);
    const tooBig = files.filter((f) => f.size > maxSizeMb * MB);
    const ok = files.filter((f) => f.size <= maxSizeMb * MB).slice(0, Math.max(0, room));
    if (tooBig.length) onReject?.(`${tooBig.length} file(s) over ${maxSizeMb} MB were skipped`);
    else if (files.length > room) onReject?.(`Only ${maxFiles} attachments allowed`);
    if (ok.length) onChange([...value, ...ok.map(toAttachment)]);
  };

  const remove = (id: string) => {
    const a = value.find((x) => x.id === id);
    if (a?.url) URL.revokeObjectURL(a.url);
    onChange(value.filter((x) => x.id !== id));
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    add(e.dataTransfer.files);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={clsx(
        'rounded-lg border-2 border-dashed p-3 transition-colors',
        dragging ? 'border-brand-600 bg-brand-50' : 'border-zinc-200',
      )}
    >
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {value.map((a) => (
          <li key={a.id} className="group relative overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
            <div className="flex aspect-[4/3] items-center justify-center">
              {a.url ? (
                <img src={a.url} alt={a.name} className="h-full w-full object-cover" />
              ) : (
                <FileText className="h-8 w-8 text-zinc-400" />
              )}
            </div>
            <div className="border-t border-zinc-200 bg-white px-2 py-1.5">
              <p className="truncate text-xs font-medium" title={a.name}>
                {a.name}
              </p>
              <p className="text-[11px] text-zinc-500">{fmtSize(a.size)}</p>
            </div>
            <button
              type="button"
              onClick={() => remove(a.id)}
              aria-label={`Remove ${a.name}`}
              className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-[#18181B]/70 text-[#fff] hover:bg-[#18181B]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}

        {value.length < maxFiles && (
          <li>
            <button
              type="button"
              onClick={() => browseRef.current?.click()}
              className="flex aspect-[4/3] h-full min-h-[120px] w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-500 hover:border-brand-600 hover:text-brand-700"
            >
              <Plus className="h-5 w-5" />
              <span className="text-xs font-medium">Add files</span>
            </button>
          </li>
        )}
      </ul>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => browseRef.current?.click()}>
          <UploadCloud className="h-3.5 w-3.5" /> Browse
        </button>
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => cameraRef.current?.click()}>
          <Camera className="h-3.5 w-3.5" /> Take photo
        </button>
        <span className="text-xs text-zinc-500">
          {hint} · drag & drop supported · {value.length}/{maxFiles}
        </span>
      </div>

      <input
        ref={browseRef}
        type="file"
        multiple
        accept={accept}
        className="sr-only"
        onChange={(e) => {
          add(e.target.files);
          e.target.value = '';
        }}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(e) => {
          add(e.target.files);
          e.target.value = '';
        }}
      />
    </div>
  );
}
