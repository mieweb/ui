import * as React from 'react';
import { AgGridReact, AgGridReactProps } from 'ag-grid-react';
import {
  ModuleRegistry,
  AllCommunityModule,
  type GridApi,
  type GridReadyEvent,
  type ColDef as AGColDef,
  type RowClickedEvent,
  type RowSelectionOptions,
} from 'ag-grid-community';
import { cn } from '../../utils/cn';
import { cva, type VariantProps } from 'class-variance-authority';
import type { BrandConfig } from '../../brands/types';

// Register AG Grid Community modules
ModuleRegistry.registerModules([AllCommunityModule]);

// ============================================================================
// AG Grid Wrapper Styles
// ============================================================================

const agGridVariants = cva('ag-theme-custom w-full', {
  variants: {
    /**
     * Visual variant of the grid
     */
    variant: {
      default: '',
      bordered:
        '[&_.ag-root-wrapper]:border [&_.ag-root-wrapper]:border-border [&_.ag-root-wrapper]:rounded-lg',
      striped: '[&_.ag-row-odd]:bg-muted/50',
      card: '[&_.ag-root-wrapper]:shadow-card [&_.ag-root-wrapper]:rounded-lg [&_.ag-root-wrapper]:border-0',
    },
    /**
     * Size/density of the grid rows
     */
    size: {
      xs: '[&_.ag-row]:h-7 [&_.ag-header-row]:h-7 text-xs [&_.ag-cell]:px-2',
      sm: '[&_.ag-row]:h-8 [&_.ag-header-row]:h-8 text-xs [&_.ag-cell]:px-3',
      md: '[&_.ag-row]:h-10 [&_.ag-header-row]:h-10 text-sm [&_.ag-cell]:px-4',
      lg: '[&_.ag-row]:h-12 [&_.ag-header-row]:h-12 text-base [&_.ag-cell]:px-4',
      xl: '[&_.ag-row]:h-14 [&_.ag-header-row]:h-14 text-base [&_.ag-cell]:px-6',
    },
    /**
     * Brand theme variant
     */
    brand: {
      default: '',
      mieweb: 'ag-brand-mieweb',
      bluehive: 'ag-brand-bluehive',
      waggleline: 'ag-brand-waggleline',
      webchart: 'ag-brand-webchart',
      'enterprise-health': 'ag-brand-enterprise-health',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
    brand: 'default',
  },
});

// ============================================================================
// AG Grid Component Types
// ============================================================================

export interface AGGridProps<TData = unknown>
  extends
    Omit<AgGridReactProps<TData>, 'className' | 'rowSelection'>,
    VariantProps<typeof agGridVariants> {
  /** Additional CSS classes for the grid container */
  className?: string;
  /** Height of the grid container */
  height?: string | number;
  /** Loading state */
  loading?: boolean;
  /** Callback when a row is clicked */
  onRowClick?: (event: RowClickedEvent<TData>) => void;
  /** Reference to access the grid API */
  gridRef?: React.RefObject<AgGridReact<TData> | null>;
  /** Row selection configuration (v35+ object format or legacy string) */
  rowSelection?: RowSelectionOptions | 'single' | 'multiple';
  /** Brand configuration for theming */
  brandConfig?: BrandConfig;
  /** Show pagination controls */
  pagination?: boolean;
  /** Enable column resizing */
  resizable?: boolean;
  /** Enable sorting */
  sortable?: boolean;
  /** Enable filtering */
  filterable?: boolean;
  /** Custom empty state message */
  noDataMessage?: string;
  /** Custom loading message */
  loadingMessage?: string;
}

// ============================================================================
// Default Column Definitions
// ============================================================================

// Size to pixel height mapping for AG Grid (row heights + default container heights)
const sizeToRowHeight: Record<
  string,
  { rowHeight: number; headerHeight: number; containerHeight: number }
> = {
  xs: { rowHeight: 28, headerHeight: 28, containerHeight: 280 },
  sm: { rowHeight: 32, headerHeight: 32, containerHeight: 320 },
  md: { rowHeight: 40, headerHeight: 40, containerHeight: 400 },
  lg: { rowHeight: 48, headerHeight: 48, containerHeight: 480 },
  xl: { rowHeight: 56, headerHeight: 56, containerHeight: 560 },
};

// Enhanced default column definitions with brand awareness
const getDefaultColDef = (
  sortable: boolean,
  filterable: boolean,
  resizable: boolean
): AGColDef => ({
  sortable,
  filter: filterable,
  resizable,
  minWidth: 100,
  flex: 1,
  suppressMovable: false,
  headerClass: 'ag-header-cell-custom',
  cellClass: 'ag-cell-custom',
});

// ============================================================================
// AG Grid Component
// ============================================================================

/**
 * A themed AG Grid wrapper component that integrates with the MIE Web UI design system.
 *
 * This component wraps AG Grid Community Edition and provides:
 * - Consistent theming with CSS variables
 * - Size variants (sm, md, lg)
 * - Visual variants (default, bordered, striped)
 * - Loading states
 * - Simplified API while maintaining full AG Grid capabilities
 *
 * @example
 * ```tsx
 * const columnDefs = [
 *   { field: 'name', headerName: 'Name' },
 *   { field: 'email', headerName: 'Email' },
 *   { field: 'status', headerName: 'Status' },
 * ];
 *
 * const rowData = [
 *   { name: 'John Doe', email: 'john@example.com', status: 'Active' },
 *   { name: 'Jane Smith', email: 'jane@example.com', status: 'Pending' },
 * ];
 *
 * <AGGrid
 *   columnDefs={columnDefs}
 *   rowData={rowData}
 *   variant="bordered"
 *   size="md"
 * />
 * ```
 */
function AGGridInner<TData = unknown>(
  {
    className,
    variant,
    size,
    brand,
    height,
    loading = false,
    columnDefs,
    rowData,
    defaultColDef: userDefaultColDef,
    onGridReady,
    onRowClick,
    gridRef,
    rowSelection,
    brandConfig,
    pagination = false,
    resizable = true,
    sortable = true,
    filterable = true,
    noDataMessage = 'No data to display',
    loadingMessage = 'Loading...',
    ...props
  }: AGGridProps<TData>,
  ref: React.ForwardedRef<AgGridReact<TData>>
) {
  const internalRef = React.useRef<AgGridReact<TData>>(null);
  const gridApiRef = React.useRef<GridApi<TData> | null>(null);

  // Use provided ref or internal ref
  const resolvedRef = gridRef || ref || internalRef;

  // Handle grid ready
  const handleGridReady = React.useCallback(
    (event: GridReadyEvent<TData>) => {
      gridApiRef.current = event.api;
      onGridReady?.(event);
    },
    [onGridReady]
  );

  // Handle row click
  const handleRowClicked = React.useCallback(
    (event: RowClickedEvent<TData>) => {
      onRowClick?.(event);
    },
    [onRowClick]
  );

  // Merge default column definitions with feature toggles
  const mergedDefaultColDef = React.useMemo(
    () =>
      ({
        ...getDefaultColDef(sortable, filterable, resizable),
        ...userDefaultColDef,
      }) as AGColDef<TData>,
    [userDefaultColDef, sortable, filterable, resizable]
  );

  // Convert legacy rowSelection string to v35+ object format
  const resolvedRowSelection = React.useMemo(():
    | RowSelectionOptions
    | undefined => {
    if (!rowSelection) return undefined;

    // If already in object format, use as-is
    if (typeof rowSelection === 'object') {
      return rowSelection;
    }

    // Convert legacy string format to v35+ object format
    if (rowSelection === 'multiple') {
      return {
        mode: 'multiRow',
        enableClickSelection: true,
      };
    }

    if (rowSelection === 'single') {
      return {
        mode: 'singleRow',
        enableClickSelection: true,
      };
    }

    return undefined;
  }, [rowSelection]);

  // Show loading overlay when loading prop changes
  React.useEffect(() => {
    if (gridApiRef.current) {
      if (loading) {
        gridApiRef.current.showLoadingOverlay();
      } else {
        gridApiRef.current.hideOverlay();
      }
    }
  }, [loading]);

  // Get row/header heights based on size prop
  const sizeConfig = sizeToRowHeight[size || 'md'];

  // Use provided height or default based on size
  const resolvedHeight = height ?? sizeConfig.containerHeight;

  return (
    <div
      className={cn(agGridVariants({ variant, size, brand }), className)}
      style={{
        height:
          typeof resolvedHeight === 'number'
            ? `${resolvedHeight}px`
            : resolvedHeight,
        ...(brandConfig &&
          ({
            '--ag-primary-color': brandConfig.colors.primary[600],
            '--ag-font-family':
              brandConfig.typography.fontFamily.sans.join(', '),
          } as React.CSSProperties)),
      }}
      data-brand={brand}
    >
      <AgGridReact<TData>
        ref={resolvedRef as React.RefObject<AgGridReact<TData>>}
        columnDefs={columnDefs}
        rowData={rowData}
        defaultColDef={mergedDefaultColDef}
        onGridReady={handleGridReady}
        onRowClicked={handleRowClicked}
        animateRows={true}
        enableBrowserTooltips={true}
        rowSelection={resolvedRowSelection}
        pagination={pagination}
        paginationPageSize={pagination ? 50 : undefined}
        paginationPageSizeSelector={pagination ? [25, 50, 100, 200] : undefined}
        rowHeight={sizeConfig.rowHeight}
        headerHeight={sizeConfig.headerHeight}
        noRowsOverlayComponent={() => (
          <div className="text-muted-foreground py-8 text-center">
            {noDataMessage}
          </div>
        )}
        loadingOverlayComponent={() => (
          <div className="text-muted-foreground py-8 text-center">
            {loadingMessage}
          </div>
        )}
        theme="legacy"
        {...props}
      />
    </div>
  );
}

// Forward ref with generic support
export const AGGrid = React.forwardRef(AGGridInner) as <TData = unknown>(
  props: AGGridProps<TData> & { ref?: React.ForwardedRef<AgGridReact<TData>> }
) => React.ReactElement;

// Display name for debugging
(AGGrid as React.FC).displayName = 'AGGrid';

// ============================================================================
// Re-export AG Grid types for convenience
// ============================================================================

// Export ColDef with the original name for external use
export type { ColDef as AGColDef } from 'ag-grid-community';

// Also export as ColDef for convenience
export type ColDef<TData = unknown, TValue = unknown> = AGColDef<TData, TValue>;

export type {
  GridApi,
  GridReadyEvent,
  RowClickedEvent,
  CellClickedEvent,
  CellValueChangedEvent,
  SelectionChangedEvent,
  FilterChangedEvent,
  SortChangedEvent,
  RowSelectedEvent,
  FirstDataRenderedEvent,
} from 'ag-grid-community';

export { AgGridReact } from 'ag-grid-react';
