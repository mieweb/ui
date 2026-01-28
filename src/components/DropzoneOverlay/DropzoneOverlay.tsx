import * as React from 'react';
import { cn } from '../../utils/cn';
import { Upload, FileUp, FolderUp } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export interface DropzoneOverlayProps {
  /** Whether the overlay is visible */
  isVisible: boolean;
  /** Message to display */
  message?: string;
  /** Icon to display */
  icon?: 'upload' | 'file' | 'folder' | React.ReactNode;
  /** Custom className */
  className?: string;
  /** Color variant */
  variant?: 'default' | 'primary' | 'success';
  /** Size variant */
  size?: 'default' | 'compact';
}

// ============================================================================
// DropzoneOverlay Component
// ============================================================================

const iconMap: Record<'upload' | 'file' | 'folder', typeof Upload> = {
  upload: Upload,
  file: FileUp,
  folder: FolderUp,
};

/**
 * Full-screen overlay shown when dragging files over the upload area.
 *
 * @example
 * ```tsx
 * const [isDragging, setIsDragging] = useState(false);
 *
 * <div
 *   onDragEnter={() => setIsDragging(true)}
 *   onDragLeave={() => setIsDragging(false)}
 *   onDrop={() => setIsDragging(false)}
 * >
 *   <DropzoneOverlay
 *     isVisible={isDragging}
 *     message="Drop files to upload"
 *   />
 *   {// ... rest of content}
 * </div>
 * ```
 */
export function DropzoneOverlay({
  isVisible,
  message = 'Drop to upload file',
  icon = 'upload',
  className,
  variant = 'default',
  size = 'default',
}: DropzoneOverlayProps) {
  const IconComponent =
    typeof icon === 'string' && icon in iconMap
      ? iconMap[icon as keyof typeof iconMap]
      : null;

  const variantStyles = {
    default: 'bg-background/90 border-border text-muted-foreground',
    primary: 'bg-primary/10 border-primary text-primary',
    success: 'bg-success/10 border-success text-success',
  };

  const sizeStyles = {
    default: {
      container: 'fixed inset-0',
      icon: 'h-16 w-16 mb-4',
      text: 'text-xl',
    },
    compact: {
      container: 'absolute inset-0',
      icon: 'h-8 w-8 mb-2',
      text: 'text-sm',
    },
  };

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        sizeStyles[size].container,
        'z-50 flex flex-col items-center justify-center',
        'border-4 border-dashed transition-all duration-200',
        variantStyles[variant],
        className
      )}
      role="status"
      aria-live="polite"
    >
      {IconComponent ? (
        <IconComponent className={cn(sizeStyles[size].icon, 'opacity-70')} />
      ) : (
        icon
      )}
      <p className={cn(sizeStyles[size].text, 'font-medium')}>{message}</p>
    </div>
  );
}

// ============================================================================
// Dropzone Hook
// ============================================================================

export interface UseDropzoneOptions {
  /** Callback when files are dropped */
  onDrop: (files: File[]) => void;
  /** Accepted file types (e.g., 'image/*', '.pdf') */
  accept?: string[];
  /** Whether to allow multiple files */
  multiple?: boolean;
  /** Whether dropzone is disabled */
  disabled?: boolean;
}

export interface UseDropzoneReturn {
  /** Whether user is currently dragging over the zone */
  isDragging: boolean;
  /** Props to spread on the drop target element */
  getRootProps: () => {
    onDragEnter: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
  };
  /** Open file picker programmatically */
  open: () => void;
  /** Props for hidden file input */
  getInputProps: () => {
    type: 'file';
    ref: React.RefObject<HTMLInputElement | null>;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    accept?: string;
    multiple?: boolean;
    style: React.CSSProperties;
  };
}

/**
 * Hook for handling drag-and-drop file uploads.
 *
 * @example
 * ```tsx
 * const { isDragging, getRootProps, getInputProps, open } = useDropzone({
 *   onDrop: (files) => console.log('Dropped:', files),
 *   accept: ['image/*', '.pdf'],
 *   multiple: true,
 * });
 *
 * return (
 *   <div {...getRootProps()}>
 *     <input {...getInputProps()} />
 *     <DropzoneOverlay isVisible={isDragging} />
 *     <button onClick={open}>Upload Files</button>
 *   </div>
 * );
 * ```
 */
export function useDropzone({
  onDrop,
  accept,
  multiple = false,
  disabled = false,
}: UseDropzoneOptions): UseDropzoneReturn {
  const [isDragging, setIsDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const dragCounter = React.useRef(0);

  const handleDragEnter = React.useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (disabled) return;
      dragCounter.current++;
      if (dragCounter.current === 1) {
        setIsDragging(true);
      }
    },
    [disabled]
  );

  const handleDragOver = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragLeave = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = React.useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current = 0;
      setIsDragging(false);

      if (disabled) return;

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        onDrop(multiple ? files : [files[0]]);
      }
    },
    [disabled, multiple, onDrop]
  );

  const handleInputChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files ? Array.from(e.target.files) : [];
      if (files.length > 0) {
        onDrop(files);
      }
      // Reset input so same file can be selected again
      e.target.value = '';
    },
    [onDrop]
  );

  const open = React.useCallback(() => {
    if (!disabled) {
      inputRef.current?.click();
    }
  }, [disabled]);

  return {
    isDragging,
    getRootProps: () => ({
      onDragEnter: handleDragEnter,
      onDragOver: handleDragOver,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop,
    }),
    open,
    getInputProps: () => ({
      type: 'file' as const,
      ref: inputRef,
      onChange: handleInputChange,
      accept: accept?.join(','),
      multiple,
      style: { display: 'none' },
    }),
  };
}

export default DropzoneOverlay;
