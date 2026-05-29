import * as React from 'react';
import { Minus, Square, ExternalLink, X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from '../Button';

type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

export interface FloatingWindowProps {
  /** Whether the window is rendered. */
  open: boolean;
  /** Whether the window is collapsed to a minimized bar (renders nothing). */
  minimized?: boolean;
  /** Window title shown in the header. */
  title: React.ReactNode;
  /** Window body content. */
  children: React.ReactNode;
  /** Footer content, typically action buttons. */
  footer?: React.ReactNode;
  /** Called when the close control is activated. */
  onClose: () => void;
  /** Called when the minimize control is activated. Hidden when omitted. */
  onMinimize?: () => void;
  /** Called when the pop-out control is activated. Hidden when omitted. */
  onPopOut?: () => void;
  /**
   * When `true` the window floats at a draggable position. When `false`
   * (default) it is centered over a dimmed overlay like a modal.
   */
  draggable?: boolean;
  /** Whether the window can be resized from its edges/corners. Default true. */
  resizable?: boolean;
  /** Initial width in pixels. Default 1024. */
  defaultWidth?: number;
  /** Initial height in pixels. Default 600. */
  defaultHeight?: number;
  /** Minimum width in pixels. Default 600. */
  minWidth?: number;
  /** Minimum height in pixels. Default 400. */
  minHeight?: number;
  /** Class applied to the window container. */
  className?: string;
  /** Accessible label for the dialog when the title is not text. */
  'aria-label'?: string;
}

const RESIZE_HANDLES: { dir: ResizeDirection; className: string }[] = [
  { dir: 'nw', className: 'top-0 left-0 h-2 w-2 cursor-nw-resize' },
  { dir: 'ne', className: 'top-0 right-0 h-2 w-2 cursor-ne-resize' },
  { dir: 'sw', className: 'bottom-0 left-0 h-2 w-2 cursor-sw-resize' },
  { dir: 'n', className: 'top-0 left-2 right-2 h-1 cursor-n-resize' },
  { dir: 's', className: 'bottom-0 left-2 right-2 h-1 cursor-s-resize' },
  { dir: 'w', className: 'left-0 top-2 bottom-2 w-1 cursor-w-resize' },
  { dir: 'e', className: 'right-0 top-2 bottom-2 w-1 cursor-e-resize' },
];

/**
 * A presentational floating window shell used for pop-out editors (notes,
 * letters, etc.). It can render as a centered modal-style window or as a
 * draggable, freely-positioned window, and supports edge/corner resizing.
 * Open/minimize/close state and footer actions are controlled via props so it
 * can be wired to any store.
 */
const FloatingWindow = React.forwardRef<HTMLDivElement, FloatingWindowProps>(
  (
    {
      open,
      minimized = false,
      title,
      children,
      footer,
      onClose,
      onMinimize,
      onPopOut,
      draggable = false,
      resizable = true,
      defaultWidth = 1024,
      defaultHeight = 600,
      minWidth = 600,
      minHeight = 400,
      className,
      'aria-label': ariaLabel,
    },
    ref
  ) => {
    const [size, setSize] = React.useState({
      width: defaultWidth,
      height: defaultHeight,
    });
    const [position, setPosition] = React.useState({ x: 50, y: 50 });

    const dragRef = React.useRef<{ x: number; y: number } | null>(null);
    const resizeRef = React.useRef<{
      dir: ResizeDirection;
      startX: number;
      startY: number;
      startW: number;
      startH: number;
      startPosX: number;
      startPosY: number;
    } | null>(null);

    const titleId = React.useId();

    const handleResizeStart = (
      e: React.MouseEvent,
      dir: ResizeDirection
    ) => {
      e.preventDefault();
      e.stopPropagation();
      resizeRef.current = {
        dir,
        startX: e.clientX,
        startY: e.clientY,
        startW: size.width,
        startH: size.height,
        startPosX: position.x,
        startPosY: position.y,
      };
    };

    const handleDragStart = (e: React.MouseEvent) => {
      if (!draggable) return;
      if ((e.target as HTMLElement).closest('[data-window-controls]')) return;
      const rect = (e.currentTarget as HTMLElement)
        .closest('[data-slot="floating-window"]')!
        .getBoundingClientRect();
      dragRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    React.useEffect(() => {
      if (!open || minimized) return;

      const handleMouseMove = (e: MouseEvent) => {
        if (dragRef.current) {
          setPosition({
            x: e.clientX - dragRef.current.x,
            y: e.clientY - dragRef.current.y,
          });
          return;
        }
        const r = resizeRef.current;
        if (!r) return;
        const deltaX = e.clientX - r.startX;
        const deltaY = e.clientY - r.startY;
        let newWidth = r.startW;
        let newHeight = r.startH;
        let newX = r.startPosX;
        let newY = r.startPosY;

        if (r.dir.includes('e')) {
          newWidth = Math.max(
            minWidth,
            Math.min(window.innerWidth - 40, r.startW + deltaX)
          );
        }
        if (r.dir.includes('w')) {
          newWidth = Math.max(minWidth, r.startW - deltaX);
          if (draggable) newX = r.startPosX + (r.startW - newWidth);
        }
        if (r.dir.includes('s')) {
          newHeight = Math.max(
            minHeight,
            Math.min(window.innerHeight - 40, r.startH + deltaY)
          );
        }
        if (r.dir.includes('n')) {
          newHeight = Math.max(minHeight, r.startH - deltaY);
          if (draggable) newY = r.startPosY + (r.startH - newHeight);
        }

        setSize({ width: newWidth, height: newHeight });
        if (draggable && (r.dir.includes('w') || r.dir.includes('n'))) {
          setPosition({ x: newX, y: newY });
        }
      };

      const handleMouseUp = () => {
        dragRef.current = null;
        resizeRef.current = null;
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }, [open, minimized, draggable, minWidth, minHeight]);

    if (!open || minimized) return null;

    const windowEl = (
      <div
        ref={ref}
        data-slot="floating-window"
        role="dialog"
        aria-modal={draggable ? undefined : true}
        aria-labelledby={typeof title === 'string' ? titleId : undefined}
        aria-label={typeof title === 'string' ? undefined : ariaLabel}
        className={cn(
          'relative flex flex-col overflow-hidden rounded-lg bg-card text-card-foreground shadow-2xl',
          draggable && 'fixed border-2 border-primary-800',
          className
        )}
        style={
          draggable
            ? {
                left: position.x,
                top: position.y,
                width: size.width,
                height: size.height,
                maxWidth: 'calc(100vw - 40px)',
                maxHeight: 'calc(100vh - 40px)',
                zIndex: 50,
              }
            : {
                width: size.width,
                height: size.height,
                maxWidth: 'calc(100vw - 40px)',
                maxHeight: 'calc(100vh - 40px)',
              }
        }
      >
        {resizable &&
          RESIZE_HANDLES.map((handle) => (
            <div
              key={handle.dir}
              aria-hidden="true"
              className={cn('absolute z-10', handle.className)}
              onMouseDown={(e) => handleResizeStart(e, handle.dir)}
            />
          ))}
        {resizable && (
          <div
            aria-hidden="true"
            className="absolute bottom-0 right-0 z-10 h-4 w-4 cursor-se-resize rounded-tl hover:bg-muted/50"
            onMouseDown={(e) => handleResizeStart(e, 'se')}
          >
            <svg
              className="h-4 w-4 text-muted-foreground/50"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M22 22H20V20H22V22ZM22 18H20V16H22V18ZM18 22H16V20H18V22ZM22 14H20V12H22V14ZM18 18H16V16H18V18ZM14 22H12V20H14V22Z" />
            </svg>
          </div>
        )}

        {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions -- header acts as an optional drag handle; the controls inside remain keyboard accessible */}
        <div
          data-slot="floating-window-header"
          className={cn(
            'flex items-center justify-between rounded-t-lg bg-primary-800 px-4 py-3 text-white',
            draggable && 'cursor-move'
          )}
          onMouseDown={handleDragStart}
        >
          <h2
            id={typeof title === 'string' ? titleId : undefined}
            className="text-lg font-semibold"
          >
            {title}
          </h2>
          <div data-window-controls className="flex items-center gap-1">
            {onMinimize && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-white hover:bg-white/20"
                onClick={onMinimize}
                aria-label="Minimize"
                title="Minimize"
              >
                <Minus className="h-4 w-4" />
              </Button>
            )}
            {onPopOut && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-white hover:bg-white/20"
                onClick={onPopOut}
                aria-label="Open in new window"
                title="Open in new window"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-white hover:bg-white/20"
              onClick={onClose}
              aria-label="Close"
              title="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div
          data-slot="floating-window-content"
          className="flex-1 overflow-y-auto"
        >
          {children}
        </div>

        {footer && (
          <div
            data-slot="floating-window-footer"
            className="flex items-center justify-end gap-3 rounded-b-lg border-t border-border bg-card px-6 py-4"
          >
            {footer}
          </div>
        )}
      </div>
    );

    if (draggable) return windowEl;

    return (
      <div
        data-slot="floating-window-overlay"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      >
        {windowEl}
      </div>
    );
  }
);

FloatingWindow.displayName = 'FloatingWindow';

export interface MinimizedWindowProps {
  /** Title shown on the minimized bar. */
  title: React.ReactNode;
  /** Called when the bar is activated to restore the window. */
  onRestore: () => void;
  /** Called when the close control is activated. */
  onClose: () => void;
  /** Additional class for the minimized bar. */
  className?: string;
}

/**
 * A compact bar representing a minimized {@link FloatingWindow}. Render this
 * (typically in a docked tray) while the corresponding window is minimized.
 */
const MinimizedWindow = React.forwardRef<HTMLDivElement, MinimizedWindowProps>(
  ({ title, onRestore, onClose, className }, ref) => (
    <div
      ref={ref}
      data-slot="minimized-window"
      className={cn(
        'flex min-w-[200px] items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 shadow-md',
        className
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-6 px-2"
        onClick={onRestore}
      >
        <Square className="mr-1 h-3 w-3" />
        <span className="truncate text-sm">{title}</span>
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="ml-auto h-6 w-6 p-0"
        onClick={onClose}
        aria-label="Close"
        title="Close"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  )
);

MinimizedWindow.displayName = 'MinimizedWindow';

export { FloatingWindow, MinimizedWindow };
