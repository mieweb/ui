import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import {
  MoreHorizontalIcon,
  ShareIcon,
  StethoscopeIcon,
  UserIcon,
  DownloadIcon,
  ExternalLinkIcon,
  ClockIcon,
  FileTextIcon,
  MailIcon,
  ChevronDownIcon,
} from '../Icons';
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalClose,
  ModalBody,
  ModalFooter,
} from '../Modal';
import { Button } from '../Button';
import { Input } from '../Input';

// =============================================================================
// Variants
// =============================================================================

const countBadgeVariants = cva(
  [
    'inline-flex items-center gap-2',
    'rounded-full',
    'border',
    'font-normal text-sm',
    'px-3 py-1',
    'transition-colors duration-150',
    'cursor-pointer select-none',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    'disabled:cursor-default disabled:opacity-50 disabled:pointer-events-none',
  ],
  {
    variants: {
      variant: {
        default: [
          'border-border/50 text-muted-foreground',
          'hover:border-border hover:bg-muted/50',
          'dark:border-border/40 dark:hover:border-border dark:hover:bg-muted/30',
        ],
        info: [
          'border-primary-200 text-primary-700',
          'hover:border-primary-300 hover:bg-primary-50',
          'dark:border-primary-800 dark:text-primary-300',
          'dark:hover:border-primary-700 dark:hover:bg-primary-950/50',
        ],
        informative: [
          'border-blue-200 text-blue-700',
          'hover:border-blue-300 hover:bg-blue-50',
          'dark:border-blue-800 dark:text-blue-300',
          'dark:hover:border-blue-700 dark:hover:bg-blue-950/50',
        ],
        success: [
          'border-green-200 text-green-700',
          'hover:border-green-300 hover:bg-green-50',
          'dark:border-green-800 dark:text-green-300',
          'dark:hover:border-green-700 dark:hover:bg-green-950/50',
        ],
        warning: [
          'border-yellow-200 text-yellow-700',
          'hover:border-yellow-300 hover:bg-yellow-50',
          'dark:border-yellow-800 dark:text-yellow-300',
          'dark:hover:border-yellow-700 dark:hover:bg-yellow-950/50',
        ],
        alert: [
          'border-red-200 text-red-700',
          'hover:border-red-300 hover:bg-red-50',
          'dark:border-red-800 dark:text-red-300',
          'dark:hover:border-red-700 dark:hover:bg-red-950/50',
        ],
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const countChipVariants = cva(
  [
    'inline-flex items-center justify-center',
    'rounded px-1.5 py-0.5',
    'text-xs font-semibold',
    'min-w-[1.25rem]',
  ],
  {
    variants: {
      variant: {
        default:
          'bg-muted text-foreground/70 dark:bg-muted dark:text-foreground/70',
        info: 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200',
        informative:
          'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        success:
          'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        warning:
          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        alert: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

// Status dot color mapping
const statusDotColor: Record<CountBadgeItemStatus, string> = {
  active: 'bg-green-500',
  pending: 'bg-yellow-500',
  overdue: 'bg-red-500',
  completed: 'bg-blue-500',
  cancelled: 'bg-neutral-400',
};

const statusLabel: Record<CountBadgeItemStatus, string> = {
  active: 'Active',
  pending: 'Pending',
  overdue: 'Overdue',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

// =============================================================================
// Types
// =============================================================================

/** Status options for items in the hover menu */
export type CountBadgeItemStatus =
  | 'active'
  | 'pending'
  | 'overdue'
  | 'completed'
  | 'cancelled';

/** A single item displayed as a row in the hover menu table */
export interface CountBadgeItem {
  /** Unique identifier for the item */
  id: string;
  /** Display label for the item */
  label: string;
  /** Current status */
  status: CountBadgeItemStatus;
}

/** Action menu item for the 3-dot overflow */
export interface CountBadgeAction {
  /** Unique key for the action */
  key: string;
  /** Display label */
  label: string;
  /** Optional icon */
  icon?: React.ReactNode;
  /** Visual variant */
  variant?: 'default' | 'danger';
  /** Callback when the action is clicked, receives the item */
  onClick: (item: CountBadgeItem) => void;
}

export interface CountBadgeProps
  extends
    Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'>,
    VariantProps<typeof countBadgeVariants> {
  /** The label text displayed in the badge */
  label: string;
  /** The count number displayed in the chip */
  count: number;
  /** Optional icon before the label */
  icon?: React.ReactNode;
  /** Items to display in the click menu table. When provided, clicking the badge shows a popover table. */
  items?: CountBadgeItem[];
  /** Actions available in each row's 3-dot overflow menu. Defaults to View / Edit / Delete. */
  actions?: CountBadgeAction[];
  /** Callback for the default "View" action (used when `actions` is not provided) */
  onView?: (item: CountBadgeItem) => void;
  /** Callback for the default "Edit" action (used when `actions` is not provided). Called with form data when the user saves. */
  onEdit?: (item: CountBadgeItem, formData?: Record<string, string>) => void;
  /** Callback for the default "Delete" action (used when `actions` is not provided). Called after the user confirms deletion in the modal. */
  onDelete?: (item: CountBadgeItem) => void;
  /** Label used in the delete confirmation dialog (e.g. "task", "encounter"). Defaults to "item". */
  deleteLabel?: string;
}

// =============================================================================
// Internal: Row action overflow menu
// =============================================================================

function RowActionMenu({
  item,
  actions,
}: {
  item: CountBadgeItem;
  actions: CountBadgeAction[];
}) {
  const [open, setOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  // Close on outside click
  React.useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Close on Escape
  React.useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  // Calculate position for the portal-rendered menu
  const [menuPos, setMenuPos] = React.useState<{
    top: number;
    left: number;
  } | null>(null);

  React.useLayoutEffect(() => {
    if (!open || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setMenuPos({
      top: rect.bottom + 4,
      left: rect.right,
    });
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className={cn(
          'inline-flex h-6 w-6 items-center justify-center rounded',
          'text-neutral-400 transition-colors',
          'hover:bg-neutral-100 hover:text-neutral-600',
          'dark:hover:bg-neutral-700 dark:hover:text-neutral-300',
          'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none'
        )}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Actions for ${item.label}`}
      >
        <MoreHorizontalIcon size={14} />
      </button>

      {open &&
        menuPos &&
        ReactDOM.createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{
              position: 'fixed',
              top: menuPos.top,
              left: menuPos.left,
              transform: 'translateX(-100%)',
            }}
            className={cn(
              'z-[9999] min-w-[10rem]',
              'rounded-lg border border-neutral-200 bg-white py-1 shadow-lg',
              'dark:border-neutral-700 dark:bg-neutral-800',
              'animate-in fade-in zoom-in-95 duration-100'
            )}
          >
            {actions.map((action) => (
              <button
                key={action.key}
                role="menuitem"
                type="button"
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs',
                  'transition-colors duration-100',
                  action.variant === 'danger'
                    ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20'
                    : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700'
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                  action.onClick(item);
                }}
              >
                {action.icon && (
                  <span className="h-3.5 w-3.5 shrink-0">{action.icon}</span>
                )}
                <span>{action.label}</span>
              </button>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}

// =============================================================================
// Internal: Hover menu popover
// =============================================================================

function HoverMenu({
  items,
  actions,
  variant,
}: {
  items: CountBadgeItem[];
  actions: CountBadgeAction[];
  variant: CountBadgeProps['variant'];
}) {
  // Variant-aware header accent
  const headerBg: Record<string, string> = {
    default: 'bg-neutral-50 dark:bg-neutral-800',
    info: 'bg-primary-50 dark:bg-primary-950/40',
    informative: 'bg-blue-50 dark:bg-blue-950/40',
    success: 'bg-green-50 dark:bg-green-950/40',
    warning: 'bg-yellow-50 dark:bg-yellow-950/40',
    alert: 'bg-red-50 dark:bg-red-950/40',
  };

  return (
    /* eslint-disable-next-line jsx-a11y/no-static-element-interactions */
    <div
      className={cn(
        'absolute top-full right-0 z-50 mt-2',
        'w-[320px] rounded-lg border border-neutral-200 bg-white shadow-xl',
        'dark:border-neutral-700 dark:bg-neutral-800',
        'animate-in fade-in slide-in-from-top-1 duration-150'
      )}
      // Prevent click-outside handler from immediately closing when interacting
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div
        className={cn(
          'rounded-t-lg border-b border-neutral-200 px-3 py-2 dark:border-neutral-700',
          headerBg[variant ?? 'default']
        )}
      >
        <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      {/* Table */}
      <div className="max-h-[240px] overflow-y-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-neutral-100 dark:border-neutral-700">
              <th className="px-3 py-1.5 font-medium text-neutral-500 dark:text-neutral-400">
                #
              </th>
              <th className="px-3 py-1.5 font-medium text-neutral-500 dark:text-neutral-400">
                Label
              </th>
              <th className="px-3 py-1.5 font-medium text-neutral-500 dark:text-neutral-400">
                Status
              </th>
              <th className="w-8 px-1 py-1.5">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr
                key={item.id}
                className="group dark:border-neutral-750 border-b border-neutral-50 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-700/50"
              >
                <td className="px-3 py-1.5 text-neutral-500 tabular-nums dark:text-neutral-400">
                  {index + 1}
                </td>
                <td className="max-w-[140px] truncate px-3 py-1.5 font-medium text-neutral-800 dark:text-neutral-200">
                  {item.label}
                </td>
                <td className="px-3 py-1.5">
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className={cn(
                        'inline-block h-1.5 w-1.5 rounded-full',
                        statusDotColor[item.status]
                      )}
                    />
                    <span className="text-neutral-600 dark:text-neutral-400">
                      {statusLabel[item.status]}
                    </span>
                  </span>
                </td>
                <td className="px-1 py-1.5">
                  {actions.length > 0 && (
                    <RowActionMenu item={item} actions={actions} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// =============================================================================
// Default actions factory
// =============================================================================

function buildDefaultActions(
  onView?: (item: CountBadgeItem) => void,
  onEdit?: (item: CountBadgeItem) => void,
  onDelete?: (item: CountBadgeItem) => void
): CountBadgeAction[] {
  const actions: CountBadgeAction[] = [];
  if (onView) {
    actions.push({ key: 'view', label: 'View', onClick: onView });
  }
  if (onEdit) {
    actions.push({ key: 'edit', label: 'Edit', onClick: onEdit });
  }
  if (onDelete) {
    actions.push({
      key: 'delete',
      label: 'Delete',
      variant: 'danger',
      onClick: onDelete,
    });
  }
  return actions;
}

// =============================================================================
// Internal: View modal action bar with Share dropdown
// =============================================================================

function ViewModalActions({
  viewTarget,
}: {
  viewTarget: CountBadgeItem | null;
}) {
  const [shareOpen, setShareOpen] = React.useState(false);
  const shareRef = React.useRef<HTMLDivElement>(null);

  // Close share dropdown on outside click
  React.useEffect(() => {
    if (!shareOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) {
        setShareOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [shareOpen]);

  return (
    <div className="mb-4 flex items-center gap-1 border-b border-neutral-200 pb-3 dark:border-neutral-700">
      {/* Share with dropdown */}
      <div ref={shareRef} className="relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShareOpen((v) => !v)}
          aria-expanded={shareOpen}
          aria-haspopup="menu"
        >
          <ShareIcon size={14} className="mr-1.5" />
          Share
          <ChevronDownIcon
            size={12}
            className={cn(
              'ml-1 transition-transform duration-150',
              shareOpen && 'rotate-180'
            )}
          />
        </Button>

        {shareOpen && (
          <div
            role="menu"
            className={cn(
              'absolute top-full left-0 z-50 mt-1',
              'min-w-[10rem] rounded-lg border border-neutral-200 bg-white py-1 shadow-lg',
              'dark:border-neutral-700 dark:bg-neutral-800',
              'animate-in fade-in zoom-in-95 duration-100'
            )}
          >
            <button
              role="menuitem"
              type="button"
              className={cn(
                'flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm',
                'text-neutral-700 hover:bg-neutral-100',
                'dark:text-neutral-300 dark:hover:bg-neutral-700'
              )}
              onClick={() => {
                console.warn('Share with physician', viewTarget);
                setShareOpen(false);
              }}
            >
              <StethoscopeIcon size={14} />
              Physician
            </button>
            <button
              role="menuitem"
              type="button"
              className={cn(
                'flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm',
                'text-neutral-700 hover:bg-neutral-100',
                'dark:text-neutral-300 dark:hover:bg-neutral-700'
              )}
              onClick={() => {
                console.warn('Share with patient', viewTarget);
                setShareOpen(false);
              }}
            >
              <UserIcon size={14} />
              Patient
            </button>
            <button
              role="menuitem"
              type="button"
              className={cn(
                'flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm',
                'text-neutral-700 hover:bg-neutral-100',
                'dark:text-neutral-300 dark:hover:bg-neutral-700'
              )}
              onClick={() => {
                console.warn('Share via email', viewTarget);
                setShareOpen(false);
              }}
            >
              <MailIcon size={14} />
              Email
            </button>
          </div>
        )}
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => console.warn('Export', viewTarget)}
      >
        <DownloadIcon size={14} className="mr-1.5" />
        Export
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => console.warn('Open in chart', viewTarget)}
      >
        <ExternalLinkIcon size={14} className="mr-1.5" />
        Open in Chart
      </Button>
    </div>
  );
}

// =============================================================================
// Component
// =============================================================================

/**
 * A pill-shaped badge with a label and count chip, ideal for navigation
 * shortcuts like "Tasks 3" or "Open Enc 5".
 *
 * Supports six semantic variants: `default`, `info`, `informative`,
 * `success`, `warning`, and `alert`.
 *
 * When `items` are provided, clicking the badge reveals a small popover
 * table with one row per item, each with a 3-dot overflow menu.
 *
 * @example
 * ```tsx
 * <CountBadge label="Tasks" count={3} />
 * <CountBadge label="Open Enc" count={5} variant="info" />
 * <CountBadge label="Due List" count={4} variant="warning" />
 * <CountBadge label="eSign" count={7} variant="alert" />
 *
 * // With hover menu
 * <CountBadge
 *   label="Tasks"
 *   count={3}
 *   items={[
 *     { id: '1', label: 'Review labs', status: 'active' },
 *     { id: '2', label: 'Sign order', status: 'pending' },
 *     { id: '3', label: 'Update meds', status: 'overdue' },
 *   ]}
 *   onView={(item) => console.log('View', item)}
 *   onEdit={(item) => console.log('Edit', item)}
 *   onDelete={(item) => console.log('Delete', item)}
 * />
 * ```
 */
const CountBadge = React.forwardRef<HTMLButtonElement, CountBadgeProps>(
  (
    {
      className,
      variant,
      label,
      count,
      icon,
      items,
      actions: actionsProp,
      onView,
      onEdit,
      onDelete,
      deleteLabel,
      ...props
    },
    ref
  ) => {
    const [open, setOpen] = React.useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [deleteTarget, setDeleteTarget] =
      React.useState<CountBadgeItem | null>(null);
    const [editTarget, setEditTarget] = React.useState<CountBadgeItem | null>(
      null
    );
    const [editForm, setEditForm] = React.useState<Record<string, string>>({});
    const [viewTarget, setViewTarget] = React.useState<CountBadgeItem | null>(
      null
    );

    const showMenu = items && items.length > 0;

    // Close on click outside
    React.useEffect(() => {
      if (!open) return;
      const handleClickOutside = (e: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(e.target as Node)
        ) {
          setOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }, [open]);

    // Close on Escape
    React.useEffect(() => {
      if (!open) return;
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setOpen(false);
      };
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }, [open]);

    // Wrap onDelete to show confirmation modal instead of firing immediately
    const handleDeleteRequest = React.useCallback((item: CountBadgeItem) => {
      setDeleteTarget(item);
    }, []);

    // Wrap onView to show detail modal instead of firing immediately
    const handleViewRequest = React.useCallback((item: CountBadgeItem) => {
      setViewTarget(item);
    }, []);

    // Wrap onEdit to show form modal instead of firing immediately
    const handleEditRequest = React.useCallback((item: CountBadgeItem) => {
      setEditTarget(item);
      setEditForm({
        label: item.label,
        status: item.status,
        priority: 'Normal',
        assignedTo: 'Dr. Smith',
        dueDate: new Date().toISOString().split('T')[0],
        notes: '',
      });
    }, []);

    const resolvedActions =
      actionsProp ??
      buildDefaultActions(
        onView ? handleViewRequest : undefined,
        onEdit ? handleEditRequest : undefined,
        onDelete ? handleDeleteRequest : undefined
      );

    const entityLabel = deleteLabel ?? 'item';

    return (
      <>
        <div ref={containerRef} className="relative inline-flex">
          <button
            ref={ref}
            type="button"
            className={cn(countBadgeVariants({ variant }), className)}
            onClick={(e) => {
              if (showMenu) {
                setOpen((prev) => !prev);
              }
              props.onClick?.(e);
            }}
            aria-expanded={showMenu ? open : undefined}
            {...props}
          >
            {icon && <span className="shrink-0">{icon}</span>}
            <span>{label}</span>
            <span className={cn(countChipVariants({ variant }))}>{count}</span>
          </button>

          {showMenu && open && (
            <HoverMenu
              items={items}
              actions={resolvedActions}
              variant={variant}
            />
          )}
        </div>

        {/* Delete confirmation modal */}
        <Modal
          open={!!deleteTarget}
          onOpenChange={(isOpen) => {
            if (!isOpen) setDeleteTarget(null);
          }}
          size="sm"
        >
          <ModalHeader>
            <ModalTitle>Delete {entityLabel}</ModalTitle>
            <ModalClose />
          </ModalHeader>
          <ModalBody>
            <p className="text-muted-foreground">
              Are you sure you want to delete{' '}
              <span className="text-foreground font-medium">
                {deleteTarget?.label}
              </span>
              ? This action cannot be undone.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (deleteTarget && onDelete) {
                  onDelete(deleteTarget);
                }
                setDeleteTarget(null);
              }}
            >
              Delete
            </Button>
          </ModalFooter>
        </Modal>

        {/* Edit form modal */}
        <Modal
          open={!!editTarget}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setEditTarget(null);
              setEditForm({});
            }
          }}
          size="md"
        >
          <ModalHeader>
            <ModalTitle>
              {label}: {editTarget?.label}
            </ModalTitle>
            <ModalClose />
          </ModalHeader>
          <ModalBody>
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <Input
                label="Label"
                value={editForm.label ?? ''}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, label: e.target.value }))
                }
              />

              <div>
                <label
                  htmlFor="cb-edit-status"
                  className="text-foreground mb-1.5 block text-sm font-medium"
                >
                  Status
                </label>
                <select
                  id="cb-edit-status"
                  value={editForm.status ?? ''}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, status: e.target.value }))
                  }
                  className={cn(
                    'border-input bg-background text-foreground w-full rounded-lg border px-3 py-2 text-base',
                    'transition-colors duration-200',
                    'focus:ring-ring focus:border-transparent focus:ring-2 focus:outline-none'
                  )}
                >
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="overdue">Overdue</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="cb-edit-priority"
                  className="text-foreground mb-1.5 block text-sm font-medium"
                >
                  Priority
                </label>
                <select
                  id="cb-edit-priority"
                  value={editForm.priority ?? 'Normal'}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, priority: e.target.value }))
                  }
                  className={cn(
                    'border-input bg-background text-foreground w-full rounded-lg border px-3 py-2 text-base',
                    'transition-colors duration-200',
                    'focus:ring-ring focus:border-transparent focus:ring-2 focus:outline-none'
                  )}
                >
                  <option value="Low">Low</option>
                  <option value="Normal">Normal</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>

              <Input
                label="Assigned To"
                value={editForm.assignedTo ?? ''}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, assignedTo: e.target.value }))
                }
              />

              <Input
                label="Due Date"
                type="date"
                value={editForm.dueDate ?? ''}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, dueDate: e.target.value }))
                }
              />

              <div>
                <label
                  htmlFor="cb-edit-notes"
                  className="text-foreground mb-1.5 block text-sm font-medium"
                >
                  Notes
                </label>
                <textarea
                  id="cb-edit-notes"
                  rows={3}
                  value={editForm.notes ?? ''}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  className={cn(
                    'border-input bg-background text-foreground w-full rounded-lg border px-3 py-2 text-base',
                    'placeholder:text-muted-foreground',
                    'transition-colors duration-200',
                    'focus:ring-ring focus:border-transparent focus:ring-2 focus:outline-none'
                  )}
                  placeholder="Add notes…"
                />
              </div>
            </form>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="secondary"
              onClick={() => {
                setEditTarget(null);
                setEditForm({});
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (editTarget && onEdit) {
                  onEdit(editTarget, editForm);
                }
                setEditTarget(null);
                setEditForm({});
              }}
            >
              Save
            </Button>
          </ModalFooter>
        </Modal>

        {/* View detail modal */}
        <Modal
          open={!!viewTarget}
          onOpenChange={(isOpen) => {
            if (!isOpen) setViewTarget(null);
          }}
          size="md"
        >
          <ModalHeader>
            <ModalTitle>
              {label}: {viewTarget?.label}
            </ModalTitle>
            <ModalClose />
          </ModalHeader>
          <ModalBody>
            {/* Quick-action buttons */}
            <ViewModalActions viewTarget={viewTarget} />

            {/* Detail fields */}
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-foreground font-medium">Label</dt>
                <dd className="text-muted-foreground">{viewTarget?.label}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-foreground font-medium">Status</dt>
                <dd>
                  {viewTarget && (
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className={cn(
                          'inline-block h-2 w-2 rounded-full',
                          statusDotColor[viewTarget.status]
                        )}
                      />
                      <span className="text-muted-foreground">
                        {statusLabel[viewTarget.status]}
                      </span>
                    </span>
                  )}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-foreground font-medium">Priority</dt>
                <dd className="text-muted-foreground">Normal</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-foreground font-medium">Assigned To</dt>
                <dd className="text-muted-foreground">Dr. Smith</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-foreground font-medium">Due Date</dt>
                <dd className="text-muted-foreground">
                  {new Date().toLocaleDateString()}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-foreground font-medium">Created</dt>
                <dd className="text-muted-foreground inline-flex items-center gap-1">
                  <ClockIcon size={13} />
                  Feb 10, 2026 at 9:15 AM
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-foreground font-medium">Last Modified</dt>
                <dd className="text-muted-foreground inline-flex items-center gap-1">
                  <ClockIcon size={13} />
                  Feb 22, 2026 at 3:42 PM
                </dd>
              </div>
            </dl>

            {/* Activity / audit trail */}
            <div className="mt-4 border-t border-neutral-200 pt-3 dark:border-neutral-700">
              <h4 className="text-muted-foreground mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
                <FileTextIcon size={13} />
                Recent Activity
              </h4>
              <ul className="text-muted-foreground space-y-2 text-xs">
                <li className="flex items-start gap-2">
                  <span className="bg-primary-400 mt-0.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full" />
                  <span>
                    <span className="text-foreground font-medium">
                      Dr. Smith
                    </span>{' '}
                    updated status to{' '}
                    <span className="font-medium">
                      {viewTarget && statusLabel[viewTarget.status]}
                    </span>{' '}
                    &mdash; 1 day ago
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-300 dark:bg-neutral-600" />
                  <span>
                    <span className="text-foreground font-medium">System</span>{' '}
                    created this {entityLabel} &mdash; 13 days ago
                  </span>
                </li>
              </ul>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setViewTarget(null)}>
              Close
            </Button>
            {onEdit && (
              <Button
                onClick={() => {
                  if (viewTarget) {
                    // Transition to edit modal
                    setViewTarget(null);
                    handleEditRequest(viewTarget);
                  }
                }}
              >
                Edit
              </Button>
            )}
          </ModalFooter>
        </Modal>
      </>
    );
  }
);

CountBadge.displayName = 'CountBadge';

export { CountBadge, countBadgeVariants, countChipVariants };
