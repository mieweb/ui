/**
 * Enhanced AG Grid Cell Renderers with Design System Integration
 *
 * These renderers use the mieweb-ui design system components and are brand-aware.
 * They provide better integration, performance, and consistency with the overall design system.
 */

import * as React from 'react';
import { memo } from 'react';
import type { ICellRendererParams } from 'ag-grid-community';
import { cn } from '../../utils/cn';
import { Badge } from '../Badge';
import { Avatar } from '../Avatar';
import { Button } from '../Button';

// =============================================================================
// Enhanced Cell Renderers with Design System Integration
// =============================================================================

/**
 * Enhanced Avatar and Name renderer using the design system Avatar component
 */
export const EnhancedAvatarNameRenderer = memo<ICellRendererParams>(
  (params) => {
    const { value, data } = params;

    if (!value || !data) return null;

    const name =
      typeof value === 'string' ? value : data.name || data.fullName || '';
    const email = data.email;
    const avatar = data.avatar || data.profileImage;

    return (
      <div className="flex items-center gap-3">
        <Avatar src={avatar} alt={name} size="sm" className="flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="text-foreground truncate font-medium">{name}</div>
          {email && (
            <div className="text-muted-foreground truncate text-xs">
              {email}
            </div>
          )}
        </div>
      </div>
    );
  }
);

EnhancedAvatarNameRenderer.displayName = 'EnhancedAvatarNameRenderer';

/**
 * Enhanced Status Badge renderer using the design system Badge component
 */
export const EnhancedStatusBadgeRenderer = memo<ICellRendererParams>(
  (params) => {
    const { value } = params;

    if (!value) return null;

    const status = String(value).toLowerCase();

    // Map status values to badge variants
    const getVariant = (status: string) => {
      switch (status) {
        case 'active':
        case 'verified':
        case 'approved':
        case 'completed':
        case 'success':
          return 'success';
        case 'inactive':
        case 'disabled':
        case 'rejected':
        case 'failed':
        case 'error':
          return 'danger';
        case 'pending':
        case 'review':
        case 'processing':
        case 'warning':
          return 'warning';
        case 'new':
        case 'draft':
        case 'info':
          return 'secondary';
        default:
          return 'outline';
      }
    };

    return (
      <Badge variant={getVariant(status)} className="capitalize">
        {value}
      </Badge>
    );
  }
);

EnhancedStatusBadgeRenderer.displayName = 'EnhancedStatusBadgeRenderer';

/**
 * Enhanced Actions renderer using design system Button components
 */
export interface ActionsRendererProps extends ICellRendererParams {
  onEdit?: (data: unknown) => void;
  onDelete?: (data: unknown) => void;
  onView?: (data: unknown) => void;
  showEdit?: boolean;
  showDelete?: boolean;
  showView?: boolean;
  customActions?: Array<{
    label: string;
    icon?: React.ReactNode;
    onClick: (data: unknown) => void;
    variant?:
      | 'default'
      | 'destructive'
      | 'outline'
      | 'secondary'
      | 'ghost'
      | 'link';
  }>;
}

export const EnhancedActionsRenderer = memo<ActionsRendererProps>((params) => {
  const {
    data,
    onEdit,
    onDelete,
    onView,
    showEdit = true,
    showDelete = false,
    showView = false,
    customActions = [],
  } = params;

  if (!data) return null;

  return (
    <div className="flex items-center gap-1">
      {showView && onView && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onView(data)}
          className="h-8 w-8 p-0"
        >
          <span className="sr-only">View</span>
          👁
        </Button>
      )}

      {showEdit && onEdit && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(data)}
          className="h-8 w-8 p-0"
        >
          <span className="sr-only">Edit</span>
          ✏️
        </Button>
      )}

      {showDelete && onDelete && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(data)}
          className="hover:bg-destructive/10 hover:text-destructive h-8 w-8 p-0"
        >
          <span className="sr-only">Delete</span>
          🗑️
        </Button>
      )}

      {customActions.map((action, index) => (
        <Button
          key={index}
          variant={
            (action.variant as
              | 'primary'
              | 'secondary'
              | 'ghost'
              | 'outline'
              | 'danger'
              | 'link') || 'ghost'
          }
          size="sm"
          onClick={() => action.onClick(data)}
          className="h-8 px-2"
        >
          {action.icon}
          <span className="ml-1">{action.label}</span>
        </Button>
      ))}
    </div>
  );
});

EnhancedActionsRenderer.displayName = 'EnhancedActionsRenderer';

/**
 * Enhanced Boolean renderer with better visual representation
 */
export const EnhancedBooleanRenderer = memo<ICellRendererParams>((params) => {
  const { value } = params;

  if (value === null || value === undefined) {
    return <span className="text-muted-foreground">—</span>;
  }

  const isTrue = Boolean(value);

  return (
    <div className="flex items-center justify-center">
      <div
        className={cn(
          'flex h-5 w-5 items-center justify-center rounded-full text-xs font-medium',
          isTrue
            ? 'bg-success text-success-foreground'
            : 'bg-muted text-muted-foreground'
        )}
      >
        {isTrue ? '✓' : '✕'}
      </div>
    </div>
  );
});

EnhancedBooleanRenderer.displayName = 'EnhancedBooleanRenderer';

/**
 * Enhanced Currency renderer with proper formatting and styling
 */
export const EnhancedCurrencyRenderer = memo<ICellRendererParams>((params) => {
  const { value, colDef } = params;

  if (value === null || value === undefined || value === '') {
    return <span className="text-muted-foreground">—</span>;
  }

  const numericValue = Number(value);
  if (isNaN(numericValue)) {
    return <span className="text-muted-foreground">Invalid</span>;
  }

  // Get currency from column definition or default to USD
  const currency =
    (colDef as { cellRendererParams?: { currency?: string } })
      ?.cellRendererParams?.currency || 'USD';

  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue);

  return (
    <span
      className={cn(
        'text-right font-mono',
        numericValue >= 0 ? 'text-foreground' : 'text-destructive'
      )}
    >
      {formatted}
    </span>
  );
});

EnhancedCurrencyRenderer.displayName = 'EnhancedCurrencyRenderer';

/**
 * Enhanced Date renderer with consistent formatting
 */
export const EnhancedDateRenderer = memo<ICellRendererParams>((params) => {
  const { value, colDef } = params;

  if (!value) {
    return <span className="text-muted-foreground">—</span>;
  }

  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return <span className="text-muted-foreground">Invalid Date</span>;
    }

    // Get format from column definition or use default
    const format =
      (colDef as { cellRendererParams?: { format?: string } })
        ?.cellRendererParams?.format || 'short';

    let formatted: string;

    switch (format) {
      case 'long':
        formatted = date.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
        break;
      case 'medium':
        formatted = date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
        break;
      case 'time':
        formatted = date.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
        break;
      default:
        formatted = date.toLocaleDateString('en-US');
    }

    return <span className="text-muted-foreground font-mono">{formatted}</span>;
  } catch {
    return <span className="text-muted-foreground">Invalid Date</span>;
  }
});

EnhancedDateRenderer.displayName = 'EnhancedDateRenderer';

/**
 * Enhanced Progress renderer with visual progress bar
 */
export const EnhancedProgressRenderer = memo<ICellRendererParams>((params) => {
  const { value } = params;

  if (value === null || value === undefined) {
    return <span className="text-muted-foreground">—</span>;
  }

  const progress = Math.min(Math.max(Number(value), 0), 100);

  return (
    <div className="flex w-full items-center gap-2">
      <div className="bg-muted h-2 flex-1 overflow-hidden rounded-full">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-300',
            progress >= 80
              ? 'bg-success'
              : progress >= 60
                ? 'bg-warning'
                : progress >= 40
                  ? 'bg-primary'
                  : 'bg-muted-foreground'
          )}
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="text-muted-foreground min-w-[3ch] font-mono text-xs">
        {Math.round(progress)}%
      </span>
    </div>
  );
});

EnhancedProgressRenderer.displayName = 'EnhancedProgressRenderer';

/**
 * Enhanced Tag/Chip renderer for arrays of tags
 */
export const EnhancedTagsRenderer = memo<ICellRendererParams>((params) => {
  const { value } = params;

  if (!value || !Array.isArray(value) || value.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      {value.slice(0, 3).map((tag, index) => (
        <Badge key={index} variant="outline" className="h-6 px-2 py-0 text-xs">
          {String(tag)}
        </Badge>
      ))}
      {value.length > 3 && (
        <Badge variant="secondary" className="h-6 px-2 py-0 text-xs">
          +{value.length - 3} more
        </Badge>
      )}
    </div>
  );
});

EnhancedTagsRenderer.displayName = 'EnhancedTagsRenderer';

// =============================================================================
// Enhanced Cell Renderer Export Map
// =============================================================================

export const enhancedCellRenderers = {
  avatarName: EnhancedAvatarNameRenderer,
  statusBadge: EnhancedStatusBadgeRenderer,
  actions: EnhancedActionsRenderer,
  boolean: EnhancedBooleanRenderer,
  currency: EnhancedCurrencyRenderer,
  date: EnhancedDateRenderer,
  progress: EnhancedProgressRenderer,
  tags: EnhancedTagsRenderer,
} as const;

export type EnhancedCellRendererType = keyof typeof enhancedCellRenderers;
