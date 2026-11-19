import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { Camera, RotateCcw, Trash2, UploadCloud, UserRound } from 'lucide-react';
import { Avatar, Modal } from '@/components/ui/misc';
import { PHOTO_MAX_MB, PHOTO_TYPES, photoFromFile, squarePhoto, useFarmerPhoto } from '@/data/farmerPhotos';
import { useLang } from '@/i18n/LanguageContext';

/** Farmer avatar: the registered photo, or initials when there is none. */
export function FarmerAvatar({ id, name, size = 'md', className }: { id: string; name: string; size?: 'sm' | 'md' | 'lg' | 'xl'; className?: string }) {
  return <Avatar name={name} size={size} src={useFarmerPhoto(id)} className={className} />;
}

/** Live camera (webcam or phone camera) with capture, retake and use. */
function CameraModal({ open, onClose, onUse, onFail }: { open: boolean; onClose: () => void; onUse: (photo: string) => void; onFail: () => void }) {
  const { t } = useLang();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [shot, setShot] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const failRef = useRef(onFail);
  failRef.current = onFail;

  useEffect(() => {
    if (!open || shot) return;
    let stream: MediaStream | null = null;
    let cancelled = false;
    setReady(false);
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false })
      .then((s) => {
        if (cancelled) return s.getTracks().forEach((tr) => tr.stop());
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.play().catch(() => {});
        }
      })
      .catch(() => !cancelled && failRef.current());
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((tr) => tr.stop());
    };
  }, [open, shot]);

  const close = () => {
    setShot(null);
    onClose();
  };

  const capture = () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    setShot(squarePhoto(v, v.videoWidth, v.videoHeight));
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title={t('Take farmer photo')}
      footer={
        shot ? (
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setShot(null)}>
              <RotateCcw className="h-4 w-4" /> {t('Retake')}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                onUse(shot);
                close();
              }}
            >
              {t('Use photo')}
            </button>
          </>
        ) : (
          <>
            <button type="button" className="btn btn-secondary" onClick={close}>
              {t('Cancel')}
            </button>
            <button type="button" className="btn btn-primary" disabled={!ready} onClick={capture}>
              <Camera className="h-4 w-4" /> {t('Capture')}
            </button>
          </>
        )
      }
    >
      <div className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-xl bg-[#18181B]">
        {shot ? (
          <img src={shot} alt={t('Captured photo')} className="h-full w-full object-cover" />
        ) : (
          <>
            {/* Mirrored like a selfie camera; the saved photo is not mirrored */}
            <video ref={videoRef} playsInline muted onLoadedData={() => setReady(true)} className="h-full w-full -scale-x-100 object-cover" />
            {!ready && <p className="absolute inset-0 flex items-center justify-center text-sm text-[#d4d4d8]">{t('Starting camera…')}</p>}
            <div aria-hidden className="pointer-events-none absolute inset-[12%] rounded-full border-2 border-dashed border-[#fff]/60" />
          </>
        )}
      </div>
      <p className="mt-3 text-center text-xs text-zinc-500">{t('Face in the circle, good light, no cap or sunglasses.')}</p>
    </Modal>
  );
}

/**
 * Farmer photo field: take a photo with the camera or upload one; shows the preview with Retake / Remove.
 * The photo is cropped to a square and made small before it is kept.
 */
export function PhotoPicker({
  value,
  onChange,
  name,
  error,
  onReject,
  compact,
}: {
  value: string | null;
  onChange: (photo: string | null) => void;
  name: string;
  error?: string;
  onReject: (message: string) => void;
  compact?: boolean;
}) {
  const { t } = useLang();
  const uploadRef = useRef<HTMLInputElement>(null);
  const captureRef = useRef<HTMLInputElement>(null);
  const [camera, setCamera] = useState(false);

  const fromFile = async (file?: File) => {
    if (!file) return;
    if (!PHOTO_TYPES.includes(file.type)) return onReject(t('Use a JPEG, PNG or WebP photo.'));
    if (file.size > PHOTO_MAX_MB * 1024 * 1024) return onReject(t('That photo is over {n} MB.', { n: PHOTO_MAX_MB }));
    try {
      onChange(await photoFromFile(file));
    } catch {
      onReject(t('That photo could not be read. Try another one.'));
    }
  };

  const takePhoto = () => {
    // Live camera where the browser allows it; otherwise the phone's own camera app
    if (typeof navigator.mediaDevices?.getUserMedia === 'function') setCamera(true);
    else captureRef.current?.click();
  };

  return (
    <div className={clsx('flex items-center gap-4', compact && 'gap-3')}>
      <div
        className={clsx(
          'relative shrink-0 overflow-hidden rounded-full border-2',
          compact ? 'h-20 w-20' : 'h-28 w-28',
          error ? 'border-red-500' : value ? 'border-transparent' : 'border-dashed border-zinc-300',
        )}
      >
        {value ? (
          <img src={value} alt={t('Photo of {name}', { name })} className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-zinc-50 text-zinc-400">
            <UserRound className={compact ? 'h-8 w-8' : 'h-12 w-12'} />
          </span>
        )}
      </div>
      <div className="min-w-0 space-y-2">
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-secondary btn-sm" onClick={takePhoto}>
            <Camera className="h-3.5 w-3.5" /> {value ? t('Retake') : t('Take photo')}
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => uploadRef.current?.click()}>
            <UploadCloud className="h-3.5 w-3.5" /> {t('Upload')}
          </button>
          {value && (
            <button type="button" className="btn btn-ghost btn-sm text-red-700" onClick={() => onChange(null)}>
              <Trash2 className="h-3.5 w-3.5" /> {t('Remove')}
            </button>
          )}
        </div>
        <p className="text-xs text-zinc-500">{t('Clear face photo. JPEG, PNG or WebP up to {n} MB.', { n: PHOTO_MAX_MB })}</p>
        {error && (
          <p className="text-xs font-medium text-red-600" role="alert" data-field-error>
            {error}
          </p>
        )}
      </div>

      <input
        ref={uploadRef}
        type="file"
        accept={PHOTO_TYPES.join(',')}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          fromFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      <input
        ref={captureRef}
        type="file"
        accept="image/*"
        capture="user"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          fromFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      <CameraModal
        open={camera}
        onClose={() => setCamera(false)}
        onUse={onChange}
        onFail={() => {
          setCamera(false);
          onReject(t('Camera not available. Upload a photo instead.'));
          captureRef.current?.click();
        }}
      />
    </div>
  );
}
