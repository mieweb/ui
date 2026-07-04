'use client';

import * as React from 'react';
import { cn } from '../../utils/cn';
import { Badge } from '../Badge/Badge';
import { Button } from '../Button';
import { Tooltip } from '../Tooltip';
import { Card, CardHeader, CardContent } from '../Card/Card';
import {
  PencilIcon,
  RefreshIcon,
  LinkIcon,
  PlusIcon,
  PillIcon,
  TestTubeIcon,
  ScanIcon,
  StethoscopeIcon,
  SendIcon,
  AlertCircleIcon,
  GripVerticalIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  MoreVerticalIcon,
} from '../Icons';
import { Dropdown, DropdownItem, DropdownSeparator } from '../Dropdown';
import {
  CodingChips,
  toolbarKeyNav,
  type ConditionAssertion,
  type ConditionConcern,
} from '../ProblemList';
import {
  useDragReorder,
  dragIndicatorClasses,
  reorderIds,
} from '../../hooks/useDragReorder';

// =============================================================================
// Types
// =============================================================================

/** Order categories that can nest under an assessed problem. */
export type OrderType = 'medication' | 'lab' | 'imaging' | 'procedure' | 'referral';

/**
 * An order placed this visit. Links to a problem via concernId (durable
 * IndicationLink) — orders without a concernId collect in the unlinked bucket.
 */
export interface AssessmentOrder {
  orderId: string;
  type: OrderType;
  /** Display text, e.g. "insulin glargine 10 units qhs" */
  display: string;
  /** Durable link to the problem this order is for */
  concernId?: string;
  /** Secondary display text, e.g. status or sig */
  detail?: string;
  /** Coding from the code lookup, when the order was picked from it */
  code?: { fullid: string; codetype: string; fullcode: string };
}

/** A code picked from a lookup (structurally matches CodifyResult). */
export interface OrderCodePick {
  fullid: string;
  label: string;
  codetype: string;
  fullcode: string;
}

/** Infer the order type from the picked code's coding system. */
export function orderTypeForCodetype(codetype: string): OrderType {
  const ct = codetype.toUpperCase();
  if (['RXNORM', 'FDB', 'FDB MEDNAME', 'NDC', 'CVX'].includes(ct)) {
    return 'medication';
  }
  if (ct.startsWith('LOINC') || ct.endsWith('ORDER')) return 'lab';
  return 'procedure'; // HCPCS, ICD10PCS, … (imaging is a manual choice)
}

/** Code-lookup domains to search for an order-type filter. */
export const ORDER_TYPE_SEARCH_DOMAINS: Record<OrderType, string[]> = {
  medication: ['med', 'vaccine'],
  lab: ['lab'],
  imaging: ['procedure'],
  procedure: ['procedure'],
  referral: ['procedure'],
};

/** One assessed problem this visit. */
export interface AssessmentItem {
  concernId: string;
  /** Today's assertion for the concern (even a no-change "addressed today" one) */
  assertionId: string;
  note?: string;
}

/** Row actions on an assessed problem. */
export type AssessmentAction = 'refine' | 'revise' | 'add-order';

export interface AssessmentProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'className' | 'title'> {
  /** Concerns addressed this visit (with their assertion history) */
  concerns: ConditionConcern[];
  /** Assessment entries — one per assessed concern (controlled) */
  items: AssessmentItem[];
  /** Orders placed this visit */
  orders?: AssessmentOrder[];
  /** Header title (pass null to hide) */
  title?: string | null;
  /** Show the plan (orders nested under each problem). Default true. */
  showPlan?: boolean;
  /** Called when the plan toggle changes (omit to hide the toggle) */
  onShowPlanChange?: (show: boolean) => void;
  /** Called when a row action is clicked */
  onAction?: (item: AssessmentItem, action: AssessmentAction) => void;
  /**
   * Called when a new order is created from the inline order form.
   * Enables the "Add order" affordances — `item` is null when the order is
   * added from the unlinked bucket. The new order should come back in via
   * `orders` (with `concernId` set to the item's concern when linked).
   */
  onAddOrder?: (
    item: AssessmentItem | null,
    order: { type: OrderType; display: string; code?: AssessmentOrder['code'] }
  ) => void;
  /**
   * Called when a diagnosis is picked to add a new problem to the assessment.
   * Enables the "Add problem" search row (requires renderOrderSearch).
   */
  onAddAssessment?: (pick: OrderCodePick) => void;
  /**
   * Render a code-lookup search for the add-order form (dependency-injected
   * so the library build doesn't bundle the lookup's worker — pass e.g.
   * a CodeLookup wired to your index). `domains` reflects the user's
   * order-type filter ('auto' = undefined = search everything); call `onPick`
   * with the chosen code. Omit to fall back to free-text order entry.
   */
  renderOrderSearch?: (args: {
    domains?: string[];
    onPick: (pick: OrderCodePick) => void;
  }) => React.ReactNode;
  /** Called when an unlinked order is linked to a problem — also used when an
   * order is dragged onto another problem (re-link = move) */
  onLinkOrder?: (order: AssessmentOrder, concernId: string) => void;
  /**
   * Called with the full new order-id sequence after an order is dragged to a
   * new position — enables drag & drop reordering of orders within a plan.
   * Orders render in `orders` array order per problem; persist and feed back.
   */
  onReorderOrders?: (orderIds: string[]) => void;
  /**
   * Called with the new concernId order after a problem block is dragged —
   * enables drag & drop reordering of the assessment. The list renders in
   * `items` order; persist and feed the order back in.
   */
  onReorderItems?: (concernIds: string[]) => void;
  /** Hide all controls (display only) */
  readOnly?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Test ID for testing */
  'data-testid'?: string;
}

// =============================================================================
// Constants
// =============================================================================

export const ORDER_TYPE_META: Record<
  OrderType,
  { label: string; icon: React.ComponentType<{ size?: number | string }> }
> = {
  medication: { label: 'Medication', icon: PillIcon },
  lab: { label: 'Lab', icon: TestTubeIcon },
  imaging: { label: 'Imaging', icon: ScanIcon },
  procedure: { label: 'Procedure', icon: StethoscopeIcon },
  referral: { label: 'Referral', icon: SendIcon },
};

const ACTION_META: Record<
  AssessmentAction,
  { label: string; icon: React.ComponentType<{ size?: number | string }> }
> = {
  refine: { label: 'Refine (more specific)', icon: PencilIcon },
  revise: { label: 'Revise (prior was wrong)', icon: RefreshIcon },
  'add-order': { label: 'Add order', icon: PlusIcon },
};

// =============================================================================
// Sub-components
// =============================================================================

function OrderContent({ order }: { order: AssessmentOrder }) {
  const meta = ORDER_TYPE_META[order.type];
  const Icon = meta.icon;
  return (
    <span className="text-muted-foreground flex items-center gap-2 text-sm">
      <Tooltip content={meta.label}>
        <Icon size={14} />
      </Tooltip>
      <span className="text-foreground">{order.display}</span>
      {order.detail && <span className="text-xs">{order.detail}</span>}
    </span>
  );
}

/** Drag state shared by the order rows and the problem-block drop targets. */
interface OrderDrag {
  draggingId: string | null;
  over:
    | { type: 'order'; id: string; after: boolean }
    | { type: 'concern'; concernId: string }
    | null;
  rowProps: (order: AssessmentOrder) => React.HTMLAttributes<HTMLElement>;
  enabled: boolean;
}

/** Keyboard + menu controls for an order row (the non-pointer path for DnD). */
interface OrderControls {
  /** Reorder within the current plan (Alt+↑/↓, menu) */
  moveWithin?: (order: AssessmentOrder, dir: -1 | 1) => void;
  /** Re-link to another problem (Alt+←/→, menu) */
  moveToProblem?: (order: AssessmentOrder, concernId: string) => void;
  /** The problem before/after the order's current one, if any */
  adjacentProblem: (order: AssessmentOrder, dir: -1 | 1) => { concernId: string; label: string } | null;
  /** All problems (for the Move to… menu) */
  targets: { concernId: string; label: string }[];
}

function OrderRow({
  order,
  drag,
  controls,
}: {
  order: AssessmentOrder;
  drag: OrderDrag;
  controls?: OrderControls;
}) {
  const interactive = Boolean(controls?.moveWithin || controls?.moveToProblem);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.target !== e.currentTarget || !controls) return;
    if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault();
      controls.moveWithin?.(order, e.key === 'ArrowUp' ? -1 : 1);
    } else if (e.altKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
      e.preventDefault();
      const adj = controls.adjacentProblem(order, e.key === 'ArrowLeft' ? -1 : 1);
      if (adj) controls.moveToProblem?.(order, adj.concernId);
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      // Roving focus between order rows in the same plan
      e.preventDefault();
      const list = e.currentTarget.closest('ul');
      if (!list) return;
      const rows = Array.from(list.querySelectorAll<HTMLElement>('li[data-order-id]'));
      const i = rows.indexOf(e.currentTarget as HTMLElement);
      rows[e.key === 'ArrowUp' ? Math.max(0, i - 1) : Math.min(rows.length - 1, i + 1)]?.focus();
    }
  };

  return (
    // Order rows are focus stops so the drag interactions have a full keyboard
    // equivalent: Alt+↑/↓ reorders, Alt+←/→ moves between problems (508).
    /* eslint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex */
    <li
      data-order-id={order.orderId}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={interactive ? handleKeyDown : undefined}
      aria-label={
        interactive
          ? `${order.display}. Alt plus up or down to reorder; Alt plus left or right to move to another problem.`
          : undefined
      }
      {...drag.rowProps(order)}
      className={cn(
        'group/order flex items-center gap-1.5 py-1',
        'focus-visible:ring-ring rounded focus-visible:ring-2 focus-visible:outline-none',
        drag.enabled && 'cursor-grab active:cursor-grabbing',
        drag.draggingId === order.orderId && 'opacity-40',
        drag.over?.type === 'order' &&
          drag.over.id === order.orderId &&
          (drag.over.after
            ? 'shadow-[inset_0_-2px_0_0_var(--color-primary-500,#3b82f6)]'
            : 'shadow-[inset_0_2px_0_0_var(--color-primary-500,#3b82f6)]')
      )}
    >
      {/* eslint-enable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex */}
      {drag.enabled && (
        <GripVerticalIcon
          size={12}
          aria-hidden
          className="text-muted-foreground/40 shrink-0"
        />
      )}
      <OrderContent order={order} />
      {interactive && (
        <span className="ml-auto opacity-40 transition-opacity group-hover/order:opacity-100 focus-within:opacity-100">
          <Dropdown
            trigger={
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Move ${order.display}`}
                className="h-6 w-6"
              >
                <MoreVerticalIcon size={13} />
              </Button>
            }
            placement="bottom-end"
          >
            {controls?.moveWithin && (
              <>
                <DropdownItem
                  icon={<ChevronUpIcon size={14} />}
                  onClick={() => controls.moveWithin?.(order, -1)}
                >
                  Move up
                </DropdownItem>
                <DropdownItem
                  icon={<ChevronDownIcon size={14} />}
                  onClick={() => controls.moveWithin?.(order, 1)}
                >
                  Move down
                </DropdownItem>
              </>
            )}
            {controls?.moveToProblem &&
              controls.targets.some((t) => t.concernId !== order.concernId) && (
                <>
                  {controls.moveWithin && <DropdownSeparator />}
                  {controls.targets
                    .filter((t) => t.concernId !== order.concernId)
                    .map((t) => (
                      <DropdownItem
                        key={t.concernId}
                        icon={<LinkIcon size={14} />}
                        onClick={() => controls.moveToProblem?.(order, t.concernId)}
                      >
                        Move to: {t.label}
                      </DropdownItem>
                    ))}
                </>
              )}
          </Dropdown>
        </span>
      )}
    </li>
  );
}

/** Inline per-problem order entry: type filter + code lookup (or free text). */
function AddOrderForm({
  problemText,
  onSubmit,
  onCancel,
  renderSearch,
}: {
  problemText: string;
  onSubmit: (order: {
    type: OrderType;
    display: string;
    code?: AssessmentOrder['code'];
  }) => void;
  onCancel: () => void;
  renderSearch?: AssessmentProps['renderOrderSearch'];
}) {
  const [type, setType] = React.useState<'auto' | OrderType>(
    renderSearch ? 'auto' : 'medication'
  );
  const [display, setDisplay] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const submit = () => {
    const text = display.trim();
    if (!text) return;
    onSubmit({ type: type === 'auto' ? 'procedure' : type, display: text });
    setDisplay('');
    inputRef.current?.focus();
  };

  const handlePick = (pick: OrderCodePick) => {
    onSubmit({
      type: type === 'auto' ? orderTypeForCodetype(pick.codetype) : type,
      display: pick.label,
      code: {
        fullid: pick.fullid,
        codetype: pick.codetype,
        fullcode: pick.fullcode,
      },
    });
  };

  return (
    <div
      role="form"
      aria-label={`Add order for ${problemText}`}
      className="border-border bg-muted/40 mt-1.5 ml-2.5 flex flex-wrap items-center gap-1.5 rounded-md border border-dashed p-2"
    >
      <select
        aria-label="Order type filter"
        value={type}
        onChange={(e) => setType(e.target.value as 'auto' | OrderType)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onCancel();
        }}
        className={cn(
          'border-border bg-background text-foreground rounded-md border px-1.5 text-sm',
          renderSearch ? 'h-10' : 'h-8',
          'focus:ring-ring focus:ring-2 focus:outline-none'
        )}
      >
        {renderSearch && <option value="auto">Auto</option>}
        {(Object.keys(ORDER_TYPE_META) as OrderType[]).map((t) => (
          <option key={t} value={t}>
            {ORDER_TYPE_META[t].label}
          </option>
        ))}
      </select>

      {renderSearch ? (
        <div className="min-w-64 flex-1">
          {renderSearch({
            domains:
              type === 'auto' ? undefined : ORDER_TYPE_SEARCH_DOMAINS[type],
            onPick: handlePick,
          })}
        </div>
      ) : (
        <>
          <input
            ref={inputRef}
            type="text"
            value={display}
            onChange={(e) => setDisplay(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit();
              else if (e.key === 'Escape') onCancel();
            }}
            placeholder="e.g. lisinopril 10 mg tablet — 1 po daily"
            aria-label="Order description"
            className={cn(
              'border-border bg-background text-foreground placeholder:text-muted-foreground',
              'h-8 min-w-48 flex-1 rounded-md border px-2.5 text-sm',
              'focus:ring-ring focus:ring-2 focus:outline-none'
            )}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={submit}
            disabled={!display.trim()}
            leftIcon={<PlusIcon size={12} />}
            className="h-8"
          >
            Add
          </Button>
        </>
      )}
      <Button
        variant="ghost"
        size="sm"
        onClick={onCancel}
        className={renderSearch ? 'h-10' : 'h-8'}
      >
        Done
      </Button>
    </div>
  );
}

// =============================================================================
// Assessment
// =============================================================================

/**
 * Visit-specific Assessment (& Plan). One block per assessed problem showing
 * today's assertion; with the plan enabled, orders linked to the problem (via
 * concernId — the durable IndicationLink) render indented under it. Orders
 * without a problem link collect in an unlinked bucket with a one-click link
 * affordance.
 *
 * Controlled component: concerns, items and orders come in via props; every
 * user interaction is reported through callbacks.
 *
 * @example
 * ```tsx
 * <Assessment
 *   concerns={touchedConcerns}
 *   items={assessment}
 *   orders={orders}
 *   onAction={(item, action) => handleAction(item, action)}
 *   onLinkOrder={(order, concernId) => linkOrder(order.orderId, concernId)}
 * />
 * ```
 */
export const Assessment = React.forwardRef<HTMLDivElement, AssessmentProps>(
  (
    {
      concerns,
      items,
      orders = [],
      title = 'Assessment & plan',
      showPlan = true,
      onShowPlanChange,
      onAction,
      onAddOrder,
      onAddAssessment,
      onLinkOrder,
      onReorderItems,
      onReorderOrders,
      renderOrderSearch,
      readOnly = false,
      className,
      'data-testid': dataTestId,
      ...props
    },
    ref
  ) => {
    const [addingFor, setAddingFor] = React.useState<string | null>(null);
    const [addingUnlinked, setAddingUnlinked] = React.useState(false);
    const [announcement, setAnnouncement] = React.useState('');

    const concernById = React.useMemo(
      () => new Map(concerns.map((c) => [c.concernId, c])),
      [concerns]
    );

    const assertionOf = (item: AssessmentItem): ConditionAssertion | undefined =>
      concernById
        .get(item.concernId)
        ?.assertions.find((a) => a.id === item.assertionId);

    const unlinkedOrders = orders.filter(
      (o) => !o.concernId || !items.some((i) => i.concernId === o.concernId)
    );

    const drag = useDragReorder({
      ids: items.map((i) => i.concernId),
      onReorder: readOnly ? undefined : onReorderItems,
    });

    // ---- Keyboard + menu equivalents for order drag & drop (508) ----
    const problemLabel = React.useCallback(
      (concernId: string) =>
        concernById
          .get(concernId)
          ?.assertions.find((a) =>
            items.some((i) => i.concernId === concernId && i.assertionId === a.id)
          )?.text ?? concernId,
      [concernById, items]
    );

    const orderControls: OrderControls | undefined = readOnly
      ? undefined
      : {
          moveWithin: onReorderOrders
            ? (order, dir) => {
                const planIds = orders
                  .filter((o) => o.concernId === order.concernId)
                  .map((o) => o.orderId);
                const i = planIds.indexOf(order.orderId);
                const target = planIds[i + dir];
                if (!target) return;
                onReorderOrders(
                  reorderIds(
                    orders.map((o) => o.orderId),
                    order.orderId,
                    target,
                    dir === 1
                  )
                );
                setAnnouncement(
                  `${order.display} moved ${dir === -1 ? 'up' : 'down'}`
                );
              }
            : undefined,
          moveToProblem: onLinkOrder
            ? (order, concernId) => {
                onLinkOrder(order, concernId);
                setAnnouncement(
                  `${order.display} moved to ${problemLabel(concernId)}`
                );
              }
            : undefined,
          adjacentProblem: (order, dir) => {
            const i = items.findIndex((it) => it.concernId === order.concernId);
            const adj = items[i + dir];
            return adj
              ? { concernId: adj.concernId, label: problemLabel(adj.concernId) }
              : null;
          },
          targets: items.map((it) => ({
            concernId: it.concernId,
            label: problemLabel(it.concernId),
          })),
        };

    // ---- Order-level drag & drop: reorder within a plan, or move to another
    // problem by dropping on its block (re-link) or between its orders. ----
    const orderDragEnabled =
      !readOnly && Boolean(onReorderOrders || onLinkOrder);
    const [draggingOrderId, setDraggingOrderId] = React.useState<string | null>(null);
    const [orderOver, setOrderOver] = React.useState<OrderDrag['over']>(null);

    const resetOrderDrag = () => {
      setDraggingOrderId(null);
      setOrderOver(null);
    };

    /** Drop `dragged` relative to `target` (another order row). */
    const dropOnOrder = (dragged: AssessmentOrder, target: AssessmentOrder, after: boolean) => {
      if (dragged.concernId !== target.concernId && target.concernId) {
        onLinkOrder?.(dragged, target.concernId); // move to the other problem
      }
      onReorderOrders?.(
        reorderIds(orders.map((o) => o.orderId), dragged.orderId, target.orderId, after)
      );
    };

    const orderDrag: OrderDrag = {
      enabled: orderDragEnabled,
      draggingId: draggingOrderId,
      over: orderOver,
      rowProps: (order) =>
        orderDragEnabled
          ? {
              draggable: true,
              onDragStart: (e) => {
                e.stopPropagation(); // don't start a problem-block drag
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', order.orderId);
                setDraggingOrderId(order.orderId);
              },
              onDragEnd: (e) => {
                e.stopPropagation();
                resetOrderDrag();
              },
              onDragOver: (e) => {
                if (!draggingOrderId || draggingOrderId === order.orderId) return;
                e.preventDefault();
                e.stopPropagation();
                e.dataTransfer.dropEffect = 'move';
                const r = e.currentTarget.getBoundingClientRect();
                const after = e.clientY > r.top + r.height / 2;
                setOrderOver({ type: 'order', id: order.orderId, after });
              },
              onDrop: (e) => {
                const draggedId =
                  draggingOrderId ?? e.dataTransfer.getData('text/plain');
                const dragged = orders.find((o) => o.orderId === draggedId);
                if (!dragged || dragged.orderId === order.orderId) return;
                e.preventDefault();
                e.stopPropagation();
                const r = e.currentTarget.getBoundingClientRect();
                const after = e.clientY > r.top + r.height / 2;
                dropOnOrder(dragged, order, after);
                resetOrderDrag();
              },
            }
          : {},
    };

    /** Problem blocks double as drop targets for orders (move-to-problem). */
    const blockProps = (concernId: string): React.HTMLAttributes<HTMLElement> => {
      const itemProps = drag.rowProps(concernId);
      if (!orderDragEnabled) return itemProps;
      return {
        ...itemProps,
        onDragOver: (e) => {
          if (draggingOrderId) {
            const dragged = orders.find((o) => o.orderId === draggingOrderId);
            if (dragged?.concernId === concernId) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            setOrderOver({ type: 'concern', concernId });
            return;
          }
          itemProps.onDragOver?.(e);
        },
        onDragLeave: (e) => {
          if (draggingOrderId) {
            setOrderOver((prev) =>
              prev?.type === 'concern' && prev.concernId === concernId ? null : prev
            );
            return;
          }
          itemProps.onDragLeave?.(e);
        },
        onDrop: (e) => {
          // An order drop on the block moves the order to this problem; any
          // other payload (a problem-block drag) falls through to item reorder.
          const payload = draggingOrderId ?? e.dataTransfer.getData('text/plain');
          const dragged = orders.find((o) => o.orderId === payload);
          if (dragged) {
            e.preventDefault();
            if (dragged.concernId !== concernId) {
              onLinkOrder?.(dragged, concernId);
            }
            resetOrderDrag();
            return;
          }
          itemProps.onDrop?.(e);
        },
      };
    };

    return (
      <Card
        ref={ref}
        padding="none"
        className={cn('w-full', className)}
        data-testid={dataTestId}
        {...props}
      >
        {title !== null && (
          <CardHeader className="border-border bg-muted/50 flex flex-row items-center justify-between border-b px-4 py-3">
            <h3 className="text-foreground text-sm font-semibold tracking-wide uppercase">
              {title}
            </h3>
            {onShowPlanChange && (
              <label className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
                <input
                  type="checkbox"
                  checked={showPlan}
                  onChange={(e) => onShowPlanChange(e.target.checked)}
                  className="accent-primary-600 h-3.5 w-3.5"
                />
                Show plan
              </label>
            )}
          </CardHeader>
        )}

        <CardContent className="space-y-4 px-4 py-4">
          {items.length === 0 && (
            <p className="text-muted-foreground text-sm">
              No problems assessed this visit.
            </p>
          )}

          <ol className="space-y-3">
            {items.map((item, index) => {
              const assertion = assertionOf(item);
              if (!assertion) return null;
              const linkedOrders = orders.filter(
                (o) => o.concernId === item.concernId
              );
              const bp = blockProps(item.concernId);
              const formOpen = addingFor === item.concernId;
              return (
                <li
                  key={item.concernId}
                  data-concern-id={item.concernId}
                  {...bp}
                  // While the add-order form is open the block body must yield
                  // to text selection/editing — the header row (below) stays a
                  // drag handle so the block can still be moved.
                  draggable={drag.enabled && !formOpen}
                  className={cn(
                    'group border-border/60 relative rounded-md border px-3 py-2',
                    drag.enabled &&
                      !formOpen &&
                      'cursor-grab active:cursor-grabbing',
                    dragIndicatorClasses(drag, item.concernId),
                    orderOver?.type === 'concern' &&
                      orderOver.concernId === item.concernId &&
                      'ring-primary-400 bg-primary-50/50 dark:bg-primary-950/50 ring-2'
                  )}
                >
                  <div
                    className={cn(
                      'flex flex-wrap items-center gap-x-2 gap-y-1',
                      drag.enabled && formOpen && 'cursor-grab active:cursor-grabbing'
                    )}
                    // Header row remains a drag source while the form is open
                    draggable={drag.enabled && formOpen}
                    onDragStart={formOpen ? bp.onDragStart : undefined}
                    onDragEnd={formOpen ? bp.onDragEnd : undefined}
                  >
                    {drag.enabled && (
                      <GripVerticalIcon
                        size={14}
                        aria-hidden
                        className="text-muted-foreground/50 shrink-0"
                      />
                    )}
                    <span className="text-muted-foreground text-sm font-semibold tabular-nums">
                      {index + 1}.
                    </span>
                    <span className="text-foreground font-medium">
                      {assertion.text}
                    </span>
                    {assertion.verificationStatus !== 'confirmed' && (
                      <Badge variant="warning" size="sm">
                        {assertion.verificationStatus}
                      </Badge>
                    )}
                    <CodingChips coding={assertion.coding} />

                    {!readOnly && (
                      <div
                        role="toolbar"
                        aria-label={`Actions for ${assertion.text}`}
                        onKeyDown={toolbarKeyNav}
                        className={cn(
                          'bg-card border-border absolute top-1.5 right-1.5 z-10 flex items-center gap-0.5 rounded-md border p-0.5 shadow-sm',
                          'pointer-events-none opacity-0 transition-opacity',
                          'group-hover:pointer-events-auto group-hover:opacity-100',
                          'focus-within:pointer-events-auto focus-within:opacity-100'
                        )}
                      >
                        {(Object.keys(ACTION_META) as AssessmentAction[]).map(
                          (action) => {
                            const meta = ACTION_META[action];
                            const Icon = meta.icon;
                            if (action === 'add-order' && !onAddOrder && !onAction)
                              return null;
                            return (
                              <Tooltip key={action} content={meta.label}>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  aria-label={meta.label}
                                  onClick={() => {
                                    if (action === 'add-order' && onAddOrder) {
                                      setAddingFor((prev) =>
                                        prev === item.concernId
                                          ? null
                                          : item.concernId
                                      );
                                    } else {
                                      onAction?.(item, action);
                                    }
                                  }}
                                  className="h-7 w-7 shrink-0"
                                >
                                  <Icon size={14} />
                                </Button>
                              </Tooltip>
                            );
                          }
                        )}
                      </div>
                    )}
                  </div>

                  {item.note && (
                    <p className="text-muted-foreground mt-1 pl-6 text-sm">
                      {item.note}
                    </p>
                  )}

                  {showPlan && linkedOrders.length > 0 && (
                    <ul
                      aria-label={`Plan for ${assertion.text}`}
                      className="border-border mt-1.5 ml-2.5 border-l pl-4"
                    >
                      {linkedOrders.map((order) => (
                        <OrderRow
                          key={order.orderId}
                          order={order}
                          drag={orderDrag}
                          controls={orderControls}
                        />
                      ))}
                    </ul>
                  )}

                  {!readOnly && onAddOrder && addingFor === item.concernId && (
                    <AddOrderForm
                      problemText={assertion.text}
                      onSubmit={(order) => onAddOrder(item, order)}
                      onCancel={() => setAddingFor(null)}
                      renderSearch={renderOrderSearch}
                    />
                  )}
                </li>
              );
            })}
          </ol>

          {/* Add a problem (dx code) to the assessment */}
          {!readOnly && onAddAssessment && renderOrderSearch && (
            <div
              role="form"
              aria-label="Add problem to assessment"
              className="border-border bg-muted/40 flex flex-wrap items-center gap-2 rounded-md border border-dashed p-2"
            >
              <span className="text-muted-foreground shrink-0 text-xs font-semibold tracking-wide uppercase">
                Add problem
              </span>
              <div className="min-w-64 flex-1">
                {renderOrderSearch({
                  domains: ['condition'],
                  onPick: onAddAssessment,
                })}
              </div>
            </div>
          )}

          {/* Unlinked orders bucket */}
          {showPlan &&
            (unlinkedOrders.length > 0 || (!readOnly && onAddOrder)) && (
            <section
              aria-label="Orders not linked to a problem"
              className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 dark:border-amber-700 dark:bg-amber-950"
            >
              <h4 className="flex items-center gap-1.5 text-sm font-semibold text-amber-900 dark:text-amber-200">
                <AlertCircleIcon size={14} />
                Orders not linked to a problem
                {!readOnly && onAddOrder && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setAddingUnlinked((v) => !v)}
                    leftIcon={<PlusIcon size={12} />}
                    className="ml-auto h-6 px-1.5 text-xs font-medium text-amber-900 dark:text-amber-200"
                  >
                    Add order
                  </Button>
                )}
              </h4>
              <ul className="mt-1">
                {unlinkedOrders.map((order) => (
                  <li
                    key={order.orderId}
                    data-order-id={order.orderId}
                    {...orderDrag.rowProps(order)}
                    className={cn(
                      'flex flex-wrap items-center gap-2 py-1',
                      orderDrag.enabled && 'cursor-grab active:cursor-grabbing',
                      draggingOrderId === order.orderId && 'opacity-40'
                    )}
                  >
                    {orderDrag.enabled && (
                      <GripVerticalIcon
                        size={12}
                        aria-hidden
                        className="text-muted-foreground/40 shrink-0"
                      />
                    )}
                    <OrderContent order={order} />
                    {!readOnly && onLinkOrder && items.length > 0 && (
                      <span className="ml-auto flex flex-wrap items-center gap-1">
                        {items.map((item) => {
                          const assertion = assertionOf(item);
                          if (!assertion) return null;
                          return (
                            <Button
                              key={item.concernId}
                              variant="ghost"
                              size="sm"
                              onClick={() => onLinkOrder(order, item.concernId)}
                              leftIcon={<LinkIcon size={11} />}
                              className="border-border h-auto rounded-full border px-2 py-0.5 text-xs"
                            >
                              {assertion.text}
                            </Button>
                          );
                        })}
                      </span>
                    )}
                  </li>
                ))}
              </ul>

              {!readOnly && onAddOrder && addingUnlinked && (
                <AddOrderForm
                  problemText="no problem (unlinked)"
                  onSubmit={(order) => onAddOrder(null, order)}
                  onCancel={() => setAddingUnlinked(false)}
                  renderSearch={renderOrderSearch}
                />
              )}
            </section>
          )}
        </CardContent>

        {/* Move/reorder announcements for screen readers */}
        <div aria-live="polite" className="sr-only">
          {announcement}
        </div>
      </Card>
    );
  }
);

Assessment.displayName = 'Assessment';

export default Assessment;
