'use client';

/**
 * Pen + text annotation over a document image, flattened to a PNG on save
 * (mieweb/ui#735). Deliberately minimal: no shapes/arrows/redaction and no
 * re-editable annotation layer — saving burns the annotations into the
 * bitmap and hands the host a new `File`.
 *
 * The normalized-coordinate strokes and composite export canvas follow the
 * esheet DrawingPad's proven approach, reimplemented rather than imported:
 * `@esheet/fields` would drag the esheet peer set into the kerebron entry
 * (src/esheet.ts keeps them deliberately separate) and its `ms:`-prefixed
 * styling has no CSS in this bundle. Reuse decision recorded on the PR.
 */
import * as React from 'react';
import { Pencil, Type, Undo2 } from 'lucide-react';
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalClose,
  ModalBody,
  ModalFooter,
} from '../Modal';
import { Button } from '../Button';
import { cn } from '../../utils/cn';
import { useMessages } from '../../utils/messages';

type Tool = 'pen' | 'text';

interface Point {
  /** 0..1 fraction of the image's natural width/height, so annotations land
   * identically on the display canvas and the full-resolution export. */
  x: number;
  y: number;
}

type Op =
  | { kind: 'stroke'; color: string; points: Point[] }
  | { kind: 'text'; color: string; at: Point; value: string };

/** Annotation palette: high-contrast marker colors, not theme tokens — they
 * are burned into user content and must survive light/dark mode changes. */
const COLORS = ['#dc2626', '#2563eb', '#16a34a', '#111111'] as const;
const COLOR_NAMES: Record<(typeof COLORS)[number], string> = {
  '#dc2626': 'Red',
  '#2563eb': 'Blue',
  '#16a34a': 'Green',
  '#111111': 'Black',
};

/** Pen width / text size relative to the image so annotations keep the same
 * visual weight on a thumbnail-sized photo and a 4K screenshot. */
const strokeWidth = (img: HTMLImageElement) =>
  Math.max(3, img.naturalWidth / 220);
const fontSize = (img: HTMLImageElement) =>
  Math.min(64, Math.max(16, img.naturalHeight * 0.05));

function drawOps(
  // eslint-disable-next-line no-undef -- type-only use of a DOM lib global
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  ops: Op[]
) {
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const op of ops) {
    if (op.kind === 'stroke') {
      ctx.strokeStyle = op.color;
      ctx.lineWidth = strokeWidth(img);
      ctx.beginPath();
      op.points.forEach((p, i) =>
        i === 0 ? ctx.moveTo(p.x * w, p.y * h) : ctx.lineTo(p.x * w, p.y * h)
      );
      if (op.points.length === 1) {
        // A click without a drag still leaves a visible dot.
        ctx.lineTo(op.points[0].x * w + 0.01, op.points[0].y * h);
      }
      ctx.stroke();
    } else {
      ctx.fillStyle = op.color;
      ctx.font = `${fontSize(img)}px sans-serif`;
      ctx.textBaseline = 'top';
      ctx.fillText(op.value, op.at.x * w, op.at.y * h);
    }
  }
}

export interface AnnotateImageDialogProps {
  /** The image being annotated; the dialog is open while this is set. */
  src: string | null;
  /** Receives the flattened PNG. The host swaps the document image's src. */
  onSave: (file: File) => void | Promise<void>;
  /** Cancel/Escape/overlay click — discard the annotations, keep the image. */
  onClose: () => void;
}

export function AnnotateImageDialog({
  src,
  onSave,
  onClose,
}: AnnotateImageDialogProps) {
  const m = useMessages();
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [img, setImg] = React.useState<HTMLImageElement | null>(null);
  const [tool, setTool] = React.useState<Tool>('pen');
  const [color, setColor] = React.useState<string>(COLORS[0]);
  const [ops, setOps] = React.useState<Op[]>([]);
  const [pendingText, setPendingText] = React.useState<{
    at: Point;
    value: string;
  } | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  // The in-flight stroke mutates a ref (one state commit per frame would
  // churn); the canvas repaints imperatively on every pointer move.
  const liveStroke = React.useRef<Op | null>(null);

  // Reset per image.
  React.useEffect(() => {
    setImg(null);
    setOps([]);
    setPendingText(null);
    setError(null);
    setTool('pen');
    if (!src) return;
    let cancelled = false;
    const image = new globalThis.Image();
    // Try a CORS-clean load first so the canvas export isn't tainted; fall
    // back to a plain load (view-only would still beat a broken dialog, and
    // the export failure surfaces its own message on save).
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      if (!cancelled) setImg(image);
    };
    image.onerror = () => {
      if (cancelled) return;
      const plain = new globalThis.Image();
      plain.onload = () => {
        if (!cancelled) setImg(plain);
      };
      plain.onerror = () => {
        if (!cancelled) setError(m('The image could not be loaded'));
      };
      plain.src = src;
    };
    image.src = src;
    return () => {
      cancelled = true;
    };
  }, [src, m]);

  // Repaint whenever the committed ops or the image change.
  React.useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !img) return;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    drawOps(ctx, img, ops);
  }, [img, ops]);

  const toPoint = (e: React.PointerEvent | React.MouseEvent): Point => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height)),
    };
  };

  const commitPendingText = () => {
    setPendingText((pending) => {
      if (pending && pending.value.trim()) {
        setOps((prev) => [
          ...prev,
          { kind: 'text', color, at: pending.at, value: pending.value },
        ]);
      }
      return null;
    });
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!img || saving) return;
    // Suppress the compatibility mouse events: mousedown's default action
    // would move focus to the modal container, instantly blurring (and so
    // discarding) the note input spawned below.
    e.preventDefault();
    if (pendingText) {
      commitPendingText();
      return;
    }
    if (tool === 'text') {
      setPendingText({ at: toPoint(e), value: '' });
      return;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    liveStroke.current = { kind: 'stroke', color, points: [toPoint(e)] };
    repaintLive();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!liveStroke.current || liveStroke.current.kind !== 'stroke') return;
    liveStroke.current.points.push(toPoint(e));
    repaintLive();
  };

  const handlePointerUp = () => {
    const stroke = liveStroke.current;
    liveStroke.current = null;
    if (stroke) setOps((prev) => [...prev, stroke]);
  };

  const repaintLive = () => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || !img) return;
    drawOps(ctx, img, liveStroke.current ? [...ops, liveStroke.current] : ops);
  };

  const handleSave = async () => {
    if (!img || saving) return;
    commitPendingText();
    setSaving(true);
    try {
      // Export at natural resolution from a fresh canvas: the display canvas
      // may hold an uncommitted pending-text frame, and React state inside
      // `commitPendingText` hasn't flushed yet — compose from source data.
      const out = document.createElement('canvas');
      out.width = img.naturalWidth;
      out.height = img.naturalHeight;
      const ctx = out.getContext('2d')!;
      const all = [...ops];
      if (pendingText?.value.trim()) {
        all.push({
          kind: 'text',
          color,
          at: pendingText.at,
          value: pendingText.value,
        });
      }
      drawOps(ctx, img, all);
      const blob = await new Promise<Blob>((resolve, reject) =>
        out.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('export failed'))),
          'image/png'
        )
      );
      await onSave(new File([blob], 'annotated.png', { type: 'image/png' }));
      onClose();
    } catch {
      // Typically a tainted canvas: the image came from another origin
      // without CORS headers, so the browser forbids reading pixels back.
      setError(m('The annotated image could not be saved'));
    } finally {
      setSaving(false);
    }
  };

  const toolButton = (value: Tool, label: string, Icon: typeof Pencil) => (
    <button
      type="button"
      onClick={() => setTool(value)}
      aria-label={label}
      aria-pressed={tool === value}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-lg',
        'focus-visible:ring-primary-500 focus-visible:ring-2 focus-visible:outline-none',
        tool === value
          ? 'bg-primary-100 text-primary-800 dark:bg-primary-900/40 dark:text-primary-300'
          : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700'
      )}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
    </button>
  );

  return (
    <Modal
      open={!!src}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      size="3xl"
      aria-label={m('Annotate image')}
    >
      <ModalHeader>
        <ModalTitle>{m('Annotate image')}</ModalTitle>
        <ModalClose aria-label={m('Close')} />
      </ModalHeader>
      <ModalBody>
        <div
          role="toolbar"
          aria-label={m('Annotation tools')}
          className="mb-2 flex items-center gap-1"
        >
          {toolButton('pen', m('Draw'), Pencil)}
          {toolButton('text', m('Add text'), Type)}
          <span
            aria-hidden="true"
            className="mx-1 h-5 w-px bg-neutral-200 dark:bg-neutral-700"
          />
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              aria-label={m(COLOR_NAMES[c])}
              aria-pressed={color === c}
              className={cn(
                'h-6 w-6 rounded-full border-2',
                'focus-visible:ring-primary-500 focus-visible:ring-2 focus-visible:outline-none',
                color === c
                  ? 'border-primary-500 ring-primary-500/30 ring-2'
                  : 'border-transparent'
              )}
              style={{ backgroundColor: c }}
            />
          ))}
          <span
            aria-hidden="true"
            className="mx-1 h-5 w-px bg-neutral-200 dark:bg-neutral-700"
          />
          <button
            type="button"
            onClick={() => setOps((prev) => prev.slice(0, -1))}
            disabled={!ops.length}
            aria-label={m('Undo')}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-lg',
              'text-neutral-600 hover:bg-neutral-100 disabled:opacity-40 dark:text-neutral-300 dark:hover:bg-neutral-700',
              'focus-visible:ring-primary-500 focus-visible:ring-2 focus-visible:outline-none'
            )}
          >
            <Undo2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <div className="relative flex justify-center">
          <canvas
            ref={canvasRef}
            data-slot="annotate-canvas"
            // The canvas is pointer-driven; the toolbar is the keyboard
            // surface and Save/Cancel live in the footer.
            aria-label={m('Annotation canvas')}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className={cn(
              'h-auto max-h-[60vh] w-auto max-w-full rounded-md border',
              'border-neutral-200 dark:border-neutral-700',
              'touch-none', // let the pen draw instead of scrolling the page
              tool === 'text' ? 'cursor-text' : 'cursor-crosshair'
            )}
          />
          {pendingText && canvasRef.current && (
            <input
              // Focus on mount: the input exists because the user just
              // placed a note on the canvas — this is a continuation of that
              // action, not a focus steal (hence no autoFocus prop).
              ref={(el) => el?.focus()}
              value={pendingText.value}
              onChange={(e) =>
                setPendingText((p) => p && { ...p, value: e.target.value })
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitPendingText();
                if (e.key === 'Escape') {
                  e.stopPropagation(); // keep the dialog open
                  setPendingText(null);
                }
              }}
              onBlur={commitPendingText}
              aria-label={m('Note text')}
              placeholder={m('Type a note')}
              className={cn(
                'absolute min-w-24 rounded border border-dashed bg-white/80 px-1 text-sm',
                'border-neutral-400 dark:bg-neutral-900/80'
              )}
              style={{
                left: `${pendingText.at.x * 100}%`,
                top: `${pendingText.at.y * 100}%`,
                color,
              }}
            />
          )}
          {!img && !error && (
            <p className="absolute inset-0 flex items-center justify-center text-sm text-neutral-500">
              {m('Loading image…')}
            </p>
          )}
        </div>
        {error && (
          <p
            role="alert"
            className="text-destructive-700 dark:text-destructive-300 mt-2 text-sm"
          >
            {error}
          </p>
        )}
      </ModalBody>
      <ModalFooter>
        <Button variant="outline" onClick={onClose} disabled={saving}>
          {m('Cancel')}
        </Button>
        <Button
          onClick={() => void handleSave()}
          disabled={!img || saving}
          isLoading={saving}
        >
          {m('Save annotation')}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
