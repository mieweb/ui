import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import { Card, CardContent, CardHeader } from '../Card';
import { Button } from '../Button';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../Table';

// =============================================================================
// DashboardWidget — shared wrapper
// =============================================================================

const widgetVariants = cva('', {
  variants: {
    size: {
      sm: '',
      md: '',
      lg: '',
      full: '',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

export interface DashboardWidgetProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof widgetVariants> {
  /** Widget title displayed in the header */
  title: string;
  /** Optional icon rendered before the title */
  icon?: React.ReactNode;
  /** Count badge next to the title (e.g. number of items) */
  count?: number;
  /** Callback when the "+" add button is clicked — omit to hide the button */
  onAdd?: () => void;
  /** Label for the add button (accessible) */
  addLabel?: string;
  /** Optional header-right element (replaces the default "+" button) */
  headerAction?: React.ReactNode;
  /** Show a loading skeleton state */
  loading?: boolean;
  /** Card accent color bar */
  accent?: 'primary' | 'success' | 'warning' | 'destructive' | 'info';
  /** Optional footer content beneath the widget body */
  footer?: React.ReactNode;
}

/**
 * A composable dashboard widget container.
 *
 * Provides a consistent card wrapper with a title bar, optional count badge,
 * and an add/action button. Pair with the variant sub-components
 * (`DashboardWidgetInfo`, `DashboardWidgetTable`, `DashboardWidgetActions`,
 * `DashboardWidgetDataCards`) to build dashboard layouts.
 *
 * @example
 * ```tsx
 * <DashboardWidget title="Demographics" icon={<UserIcon className="h-4 w-4" />}>
 *   <DashboardWidgetInfo items={[{ label: 'Name', value: 'Hart, William' }]} />
 * </DashboardWidget>
 * ```
 */
const DashboardWidget = React.forwardRef<HTMLDivElement, DashboardWidgetProps>(
  (
    {
      className,
      size,
      title,
      icon,
      count,
      onAdd,
      addLabel = 'Add',
      headerAction,
      loading,
      accent,
      footer,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <Card
        ref={ref}
        padding="none"
        loading={loading}
        accent={accent}
        className={cn(widgetVariants({ size }), className)}
        {...props}
      >
        {/* Header */}
        <CardHeader
          className={cn(
            'border-border flex flex-row items-center justify-between gap-2 border-b px-4 py-3 pb-3',
            accent && 'pl-6'
          )}
        >
          <div className="flex items-center gap-2">
            {icon && (
              <span className="text-muted-foreground shrink-0">{icon}</span>
            )}
            <h3 className="text-foreground text-sm font-semibold tracking-wide uppercase">
              {title}
            </h3>
            {count !== undefined && (
              <span className="bg-primary-100 text-primary-900 dark:bg-primary-900/50 dark:text-primary-300 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold">
                {count}
              </span>
            )}
          </div>
          {headerAction
            ? headerAction
            : onAdd && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={onAdd}
                  aria-label={addLabel}
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </Button>
              )}
        </CardHeader>

        {/* Body */}
        <CardContent className={cn('px-4 py-3', accent && 'pl-6')}>
          {children}
        </CardContent>

        {/* Footer */}
        {footer && (
          <div
            className={cn('border-border border-t px-4 py-2', accent && 'pl-6')}
          >
            {footer}
          </div>
        )}
      </Card>
    );
  }
);

DashboardWidget.displayName = 'DashboardWidget';

// =============================================================================
// DashboardWidgetInfo — static label/value pairs (e.g. Demographics)
// =============================================================================

export interface InfoItem {
  /** Field label (e.g. "NAME", "DOB") */
  label: string;
  /** Field value — string or ReactNode for rich content */
  value: React.ReactNode;
  /** Span full width of the grid row */
  fullWidth?: boolean;
  /** Custom className for this item */
  className?: string;
}

export interface DashboardWidgetInfoProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Array of label/value items to display */
  items: InfoItem[];
  /** Number of columns in the grid */
  columns?: 1 | 2 | 3 | 4;
  /** Whether labels should be rendered above values (stacked) or inline */
  layout?: 'stacked' | 'inline';
}

/**
 * A label/value grid for displaying static information fields.
 *
 * @example
 * ```tsx
 * <DashboardWidgetInfo
 *   columns={2}
 *   items={[
 *     { label: 'Name', value: 'Hart, William' },
 *     { label: 'DOB', value: '1948-04-03 (77 y/o)' },
 *     { label: 'Address', value: '123 Main St\nFort Wayne, IN 46802', fullWidth: true },
 *   ]}
 * />
 * ```
 */
const DashboardWidgetInfo = React.forwardRef<
  HTMLDivElement,
  DashboardWidgetInfoProps
>(({ className, items, columns = 2, layout = 'stacked', ...props }, ref) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
  };

  return (
    <div
      ref={ref}
      className={cn('grid gap-x-6 gap-y-3', gridCols[columns], className)}
      {...props}
    >
      {items.map((item, i) => (
        <div
          key={`${item.label}-${i}`}
          className={cn(
            item.fullWidth && 'col-span-full',
            layout === 'inline' && 'flex items-baseline gap-2',
            item.className
          )}
        >
          <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            {item.label}
          </dt>
          <dd
            className={cn(
              'text-foreground text-sm',
              layout === 'stacked' && 'mt-0.5'
            )}
          >
            {item.value}
          </dd>
        </div>
      ))}
    </div>
  );
});

DashboardWidgetInfo.displayName = 'DashboardWidgetInfo';

// =============================================================================
// DashboardWidgetTable — rows with columns, badges, actions
// (Encounters, Allergies, Medications, Medical History)
// =============================================================================

export interface WidgetTableColumn<T = Record<string, unknown>> {
  /** Unique column key */
  key: string;
  /** Header label — omit for a headerless table */
  header?: string;
  /** Custom cell renderer */
  render?: (row: T, index: number) => React.ReactNode;
  /** Alignment */
  align?: 'left' | 'center' | 'right';
  /** Header & cell className */
  className?: string;
}

export interface WidgetTableAction<T = Record<string, unknown>> {
  /** Accessible label */
  label: string;
  /** Icon to render */
  icon: React.ReactNode;
  /** Click handler */
  onClick: (row: T, index: number) => void;
  /** Conditionally hide per row */
  hidden?: (row: T, index: number) => boolean;
}

export interface DashboardWidgetTableProps<
  T = Record<string, unknown>,
> extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Column definitions */
  columns: WidgetTableColumn<T>[];
  /** Row data */
  data: T[];
  /** Row-level actions (edit, delete, etc.) rendered at the end of each row */
  actions?: WidgetTableAction<T>[];
  /** Show column headers */
  showHeader?: boolean;
  /** Callback when a row is clicked */
  onRowClick?: (row: T, index: number) => void;
  /** Message when data is empty */
  emptyMessage?: string;
  /** Key extractor for stable row keys */
  rowKey?: (row: T, index: number) => string;
}

/**
 * A lightweight table view for list-style widget content.
 *
 * Uses the existing `Table` primitives under the hood.
 *
 * @example
 * ```tsx
 * <DashboardWidgetTable
 *   columns={[
 *     { key: 'date', header: 'Date' },
 *     { key: 'type', header: 'Type' },
 *     { key: 'status', render: (row) => <Badge>{row.status}</Badge> },
 *   ]}
 *   data={encounters}
 *   actions={[
 *     { label: 'Edit', icon: <EditIcon />, onClick: handleEdit },
 *     { label: 'Delete', icon: <TrashIcon />, onClick: handleDelete },
 *   ]}
 * />
 * ```
 */
function DashboardWidgetTableInner<T extends Record<string, unknown>>(
  {
    className,
    columns,
    data,
    actions,
    showHeader = false,
    onRowClick,
    emptyMessage = 'No items',
    rowKey,
    ...props
  }: DashboardWidgetTableProps<T>,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  if (data.length === 0) {
    return (
      <div
        ref={ref}
        className={cn(
          'text-muted-foreground flex items-center justify-center py-6 text-sm',
          className
        )}
        {...props}
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <div ref={ref} className={cn('-mx-4', className)} {...props}>
      <Table responsive>
        {showHeader && (
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={cn(
                    'px-4 text-xs',
                    col.align === 'right' && 'text-right',
                    col.align === 'center' && 'text-center',
                    col.className
                  )}
                >
                  {col.header}
                </TableHead>
              ))}
              {actions && actions.length > 0 && (
                <TableHead className="w-0 px-4" />
              )}
            </TableRow>
          </TableHeader>
        )}
        <TableBody>
          {data.map((row, rowIndex) => (
            <TableRow
              key={rowKey ? rowKey(row, rowIndex) : rowIndex}
              className={cn(
                onRowClick &&
                  'hover:bg-muted/50 cursor-pointer transition-colors'
              )}
              onClick={onRowClick ? () => onRowClick(row, rowIndex) : undefined}
            >
              {columns.map((col) => (
                <TableCell
                  key={col.key}
                  className={cn(
                    'px-4 py-2 text-sm',
                    col.align === 'right' && 'text-right',
                    col.align === 'center' && 'text-center',
                    col.className
                  )}
                >
                  {col.render
                    ? col.render(row, rowIndex)
                    : (row[col.key] as React.ReactNode)}
                </TableCell>
              ))}
              {actions && actions.length > 0 && (
                <TableCell className="px-2 py-2 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {actions.map(
                      (action, actionIndex) =>
                        !action.hidden?.(row, rowIndex) && (
                          <button
                            key={actionIndex}
                            type="button"
                            className="text-muted-foreground hover:bg-muted hover:text-foreground rounded p-1 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              action.onClick(row, rowIndex);
                            }}
                            aria-label={action.label}
                          >
                            {action.icon}
                          </button>
                        )
                    )}
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

const DashboardWidgetTable = React.forwardRef(DashboardWidgetTableInner) as <
  T extends Record<string, unknown>,
>(
  props: DashboardWidgetTableProps<T> & {
    ref?: React.ForwardedRef<HTMLDivElement>;
  }
) => React.ReactElement | null;

// =============================================================================
// DashboardWidgetActions — grid of action buttons (Quick Links)
// =============================================================================

export interface WidgetAction {
  /** Action label */
  label: string;
  /** Icon rendered before the label */
  icon?: React.ReactNode;
  /** Click handler */
  onClick?: () => void;
  /** Render as a link instead of a button */
  href?: string;
  /** Color accent for the icon */
  color?:
    | 'primary'
    | 'green'
    | 'red'
    | 'orange'
    | 'blue'
    | 'purple'
    | 'amber'
    | 'neutral';
  /** Disabled state */
  disabled?: boolean;
}

const actionColorMap: Record<string, string> = {
  primary:
    'bg-primary-100 text-primary-900 dark:bg-primary-900/40 dark:text-primary-300',
  green:
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  red: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  orange:
    'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  blue: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  purple:
    'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  neutral:
    'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
};

export interface DashboardWidgetActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Array of actions to render */
  actions: WidgetAction[];
  /** Grid columns */
  columns?: 1 | 2 | 3;
}

/**
 * A grid of action buttons for quick navigation / shortcuts.
 *
 * @example
 * ```tsx
 * <DashboardWidgetActions
 *   columns={2}
 *   actions={[
 *     { label: 'Add Encounter', icon: <CalendarIcon />, color: 'primary', onClick: handleAdd },
 *     { label: 'Record Vitals', icon: <HeartIcon />, color: 'red', onClick: handleVitals },
 *   ]}
 * />
 * ```
 */
const DashboardWidgetActions = React.forwardRef<
  HTMLDivElement,
  DashboardWidgetActionsProps
>(({ className, actions, columns = 2, ...props }, ref) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
  };

  return (
    <div
      ref={ref}
      className={cn('grid gap-2', gridCols[columns], className)}
      {...props}
    >
      {actions.map((action, i) => {
        const colorClasses = actionColorMap[action.color ?? 'primary'];

        const content = (
          <>
            {action.icon && (
              <span
                className={cn(
                  'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md',
                  colorClasses
                )}
              >
                {action.icon}
              </span>
            )}
            <span className="text-sm font-medium">{action.label}</span>
          </>
        );

        const sharedClasses = cn(
          'flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-left transition-colors',
          'hover:bg-muted/60 hover:border-primary-200 dark:hover:border-primary-800',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
          action.disabled && 'opacity-50 cursor-not-allowed pointer-events-none'
        );

        if (action.href) {
          return (
            <a key={i} href={action.href} className={sharedClasses}>
              {content}
            </a>
          );
        }

        return (
          <button
            key={i}
            type="button"
            className={sharedClasses}
            onClick={action.onClick}
            disabled={action.disabled}
          >
            {content}
          </button>
        );
      })}
    </div>
  );
});

DashboardWidgetActions.displayName = 'DashboardWidgetActions';

// =============================================================================
// DashboardWidgetDataCards — key/value stat blocks (Vitals)
// =============================================================================

export interface DataCardItem {
  /** Short label (e.g. "BP", "PULSE") */
  label: string;
  /** Display value */
  value: React.ReactNode;
  /** Optional unit suffix (e.g. "lbs", "°F") */
  unit?: string;
  /** Custom className for this card */
  className?: string;
}

export interface DashboardWidgetDataCardsProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Array of data card items */
  items: DataCardItem[];
  /** Grid columns */
  columns?: 2 | 3 | 4;
  /** Optional footer content below the grid (e.g. a date + delete button) */
  footer?: React.ReactNode;
}

/**
 * A grid of key/value stat blocks for displaying metrics at a glance.
 *
 * @example
 * ```tsx
 * <DashboardWidgetDataCards
 *   columns={2}
 *   items={[
 *     { label: 'BP', value: '128/82' },
 *     { label: 'Pulse', value: '72' },
 *     { label: 'Temp', value: '98.6', unit: '°F' },
 *   ]}
 * />
 * ```
 */
const DashboardWidgetDataCards = React.forwardRef<
  HTMLDivElement,
  DashboardWidgetDataCardsProps
>(({ className, items, columns = 2, footer, ...props }, ref) => {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
  };

  return (
    <div ref={ref} className={cn('space-y-3', className)} {...props}>
      <div className={cn('grid gap-x-6 gap-y-3', gridCols[columns])}>
        {items.map((item, i) => (
          <div key={`${item.label}-${i}`} className={cn('', item.className)}>
            <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              {item.label}
            </dt>
            <dd className="text-foreground mt-0.5 text-sm font-semibold">
              {item.value}
              {item.unit && (
                <span className="text-muted-foreground ml-0.5 text-xs font-normal">
                  {item.unit}
                </span>
              )}
            </dd>
          </div>
        ))}
      </div>
      {footer && (
        <div className="border-border text-muted-foreground flex items-center gap-2 border-t pt-2 text-xs">
          {footer}
        </div>
      )}
    </div>
  );
});

DashboardWidgetDataCards.displayName = 'DashboardWidgetDataCards';

// =============================================================================
// Exports
// =============================================================================

export {
  DashboardWidget,
  DashboardWidgetInfo,
  DashboardWidgetTable,
  DashboardWidgetActions,
  DashboardWidgetDataCards,
  widgetVariants,
};
