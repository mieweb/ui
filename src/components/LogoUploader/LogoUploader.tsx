'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface LogoUploaderLabels {
  /** Accessible name of the file input. */
  upload: string;
  replace: string;
  remove: string;
  /** Text inside the empty drop target. */
  dropHint: string;
  uploading: string;
  removing: string;
  invalidType: string;
  tooLarge: (maxBytes: number) => string;
  uploadFailed: string;
  removeFailed: string;
  /** Alt text of the preview image. */
  previewAlt: string;
}

export const defaultLogoUploaderLabels: LogoUploaderLabels = {
  upload: 'Upload logo',
  replace: 'Replace logo',
  remove: 'Remove logo',
  dropHint: 'Drop an image or click to browse',
  uploading: 'Uploading…',
  removing: 'Removing…',
  invalidType: 'That file type is not supported.',
  tooLarge: (maxBytes) => `Files must be ${formatBytes(maxBytes)} or smaller.`,
  uploadFailed: 'Upload failed. Try again.',
  removeFailed: 'Could not remove the logo. Try again.',
  previewAlt: 'Current logo',
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${Math.round((kb / 1024) * 10) / 10} MB`;
}

/** Relative URLs, http(s), blob: and data:image/ only — nothing else reaches `<img src>`. */
function safeImageSrc(url: string | null | undefined): string | null {
  const trimmed = url?.trim();
  if (!trimmed) return null;
  const scheme = /^([a-z][a-z\d+.-]*):/i.exec(trimmed)?.[1].toLowerCase();
  if (!scheme || ['http', 'https', 'blob'].includes(scheme)) return trimmed;
  return /^data:image\//i.test(trimmed) ? trimmed : null;
}

/** True when `file` matches an `accept` attribute value. */
function matchesAccept(file: File, accept: string): boolean {
  return accept
    .split(',')
    .map((token) => token.trim().toLowerCase())
    .some((token) => {
      if (!token) return false;
      if (token.startsWith('.')) return file.name.toLowerCase().endsWith(token);
      if (token.endsWith('/*')) return file.type.startsWith(token.slice(0, -1));
      return file.type === token;
    });
}

/**
 * Local preview of a picked file. Drawn to a canvas so the file never becomes
 * an `<img src>` string (no object URL to sanitize or revoke).
 */
function FilePreview({ file, alt }: { file: File; alt: string }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  React.useEffect(() => {
    let cancelled = false;
    globalThis
      .createImageBitmap?.(file)
      .then((bitmap) => {
        const canvas = canvasRef.current;
        if (!cancelled && canvas) {
          canvas.width = bitmap.width;
          canvas.height = bitmap.height;
          canvas.getContext('2d')?.drawImage(bitmap, 0, 0);
        }
        bitmap.close();
      })
      .catch(() => {
        // Undecodable image: the target keeps its border and spinner.
      });
    return () => {
      cancelled = true;
    };
  }, [file]);
  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={alt}
      className="h-full w-full object-contain"
    />
  );
}

const targetVariants = cva(
  [
    'relative flex cursor-pointer items-center justify-center overflow-hidden border-2 border-dashed bg-muted/40 text-muted-foreground',
    'transition-colors motion-reduce:transition-none hover:border-primary-500 hover:text-foreground',
    'peer-focus-visible:ring-ring peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2',
    'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
  ],
  {
    variants: {
      shape: { square: 'rounded-lg', circle: 'rounded-full' },
      size: { sm: 'h-16 w-16', md: 'h-24 w-24', lg: 'h-32 w-32' },
      dragging: {
        true: 'border-primary-500 bg-primary-500/10',
        false: 'border-border',
      },
      filled: { true: 'border-solid bg-card', false: '' },
    },
    defaultVariants: {
      shape: 'square',
      size: 'md',
      dragging: false,
      filled: false,
    },
  }
);

export interface LogoUploaderProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'>,
    Pick<VariantProps<typeof targetVariants>, 'shape' | 'size'> {
  /** URL of the current logo. */
  value?: string | null;
  /** Upload the file. Resolve with the new URL to preview it until `value` updates. */
  onUpload: (file: File) => Promise<string | void>;
  /** Remove the logo. Omit to hide the remove button. */
  onRemove?: () => void | Promise<void>;
  /** `accept` attribute for the file input. */
  accept?: string;
  /** Reject files larger than this. */
  maxSizeBytes?: number;
  disabled?: boolean;
  /** Translatable strings. */
  labels?: Partial<LogoUploaderLabels>;
}

/**
 * Square or circular logo drop target with click-to-browse, preview and
 * remove.
 */
export const LogoUploader = React.forwardRef<HTMLDivElement, LogoUploaderProps>(
  function LogoUploader(
    {
      value,
      onUpload,
      onRemove,
      accept = 'image/*',
      maxSizeBytes,
      disabled,
      shape,
      size,
      labels: labelOverrides,
      className,
      ...props
    },
    ref
  ) {
    const labels = { ...defaultLogoUploaderLabels, ...labelOverrides };
    const [busy, setBusy] = React.useState<'uploading' | 'removing' | null>(
      null
    );
    const [preview, setPreview] = React.useState<string | null>(null);
    const [localFile, setLocalFile] = React.useState<File | null>(null);
    const [error, setError] = React.useState<string | null>(null);
    const [dragging, setDragging] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);
    // Bumped by each upload and each new `value`; stale uploads check it.
    const generation = React.useRef(0);
    const id = React.useId();
    const inputId = `${id}-input`;
    const errorId = `${id}-error`;

    // A fresh `value` from the caller supersedes any local preview.
    React.useEffect(() => {
      generation.current += 1;
      setPreview(null);
      setLocalFile(null);
    }, [value]);

    const shown = localFile ? null : safeImageSrc(preview ?? value);
    const filled = !!localFile || !!shown;
    const inactive = disabled || busy !== null;

    // The input is disabled while busy, so focus it once it re-enables.
    const refocusInput = React.useRef(false);
    React.useEffect(() => {
      if (busy === null && refocusInput.current) {
        refocusInput.current = false;
        inputRef.current?.focus();
      }
    }, [busy]);

    const handleFile = async (file: File | undefined) => {
      if (!file || inactive) return;
      if (!matchesAccept(file, accept)) return setError(labels.invalidType);
      if (maxSizeBytes !== undefined && file.size > maxSizeBytes) {
        return setError(labels.tooLarge(maxSizeBytes));
      }
      setError(null);
      const request = ++generation.current;
      setPreview(null);
      setLocalFile(file);
      setBusy('uploading');
      try {
        const url = await onUpload(file);
        if (url && request === generation.current) {
          setLocalFile(null);
          setPreview(url);
        }
      } catch {
        if (request === generation.current) {
          setLocalFile(null);
          setError(labels.uploadFailed);
        }
      } finally {
        setBusy(null);
      }
    };

    const handleRemove = async () => {
      if (!onRemove || inactive) return;
      setError(null);
      setBusy('removing');
      try {
        await onRemove();
        setPreview(null);
        setLocalFile(null);
      } catch {
        setError(labels.removeFailed);
      } finally {
        refocusInput.current = true;
        setBusy(null);
      }
    };

    return (
      <div
        ref={ref}
        data-slot="logo-uploader"
        aria-busy={busy !== null || undefined}
        className={cn('inline-flex flex-col items-start gap-2', className)}
        {...props}
      >
        <div className="relative">
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept={accept}
            disabled={inactive}
            aria-label={filled ? labels.replace : labels.upload}
            aria-describedby={error ? errorId : undefined}
            aria-invalid={error ? true : undefined}
            onChange={(e) => {
              void handleFile(e.target.files?.[0]);
              e.target.value = '';
            }}
            className="peer sr-only"
          />
          <label
            htmlFor={inputId}
            data-slot="logo-uploader-target"
            onDragOver={(e) => {
              e.preventDefault();
              if (!inactive) setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              void handleFile(e.dataTransfer.files?.[0]);
            }}
            className={targetVariants({
              shape,
              size,
              dragging,
              filled,
            })}
          >
            {localFile ? (
              <FilePreview file={localFile} alt={labels.previewAlt} />
            ) : shown ? (
              <img
                src={shown}
                alt={labels.previewAlt}
                className="h-full w-full object-contain"
              />
            ) : (
              <span className="flex flex-col items-center gap-1 px-2 text-center text-xs">
                <ImagePlus aria-hidden="true" className="h-5 w-5" />
                <span>{labels.dropHint}</span>
              </span>
            )}
            {busy && (
              <span
                role="status"
                className="bg-background/70 absolute inset-0 flex items-center justify-center"
              >
                <Loader2
                  aria-hidden="true"
                  className="text-foreground h-5 w-5 animate-spin motion-reduce:animate-none"
                />
                <span className="sr-only">
                  {busy === 'uploading' ? labels.uploading : labels.removing}
                </span>
              </span>
            )}
          </label>
          {filled && onRemove && (
            <button
              type="button"
              aria-label={labels.remove}
              title={labels.remove}
              disabled={inactive}
              onClick={() => void handleRemove()}
              className={cn(
                'border-border bg-card text-muted-foreground absolute -end-2 -top-2 rounded-full border p-1 shadow-sm',
                'hover:text-destructive focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
                'disabled:cursor-not-allowed disabled:opacity-50'
              )}
            >
              <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        {error && (
          <p
            id={errorId}
            role="alert"
            data-slot="logo-uploader-error"
            className="text-destructive text-sm"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

LogoUploader.displayName = 'LogoUploader';
