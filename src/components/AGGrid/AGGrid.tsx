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
    },
    /**
     * Size/density of the grid rows
     */
    size: {
      sm: '[&_.ag-row]:h-8 [&_.ag-header-row]:h-8 text-xs',
      md: '[&_.ag-row]:h-10 [&_.ag-header-row]:h-10 text-sm',
      lg: '[&_.ag-row]:h-12 [&_.ag-header-row]:h-12 text-base',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
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
}

// ============================================================================
// Default Column Definitions
// ============================================================================

const defaultColDef: AGColDef = {
  sortable: true,
  filter: true,
  resizable: true,
  minWidth: 100,
};

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
    height = 400,
    loading = false,
    columnDefs,
    rowData,
    defaultColDef: userDefaultColDef,
    onGridReady,
    onRowClick,
    gridRef,
    rowSelection,
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

  // Merge default column definitions
  const mergedDefaultColDef = React.useMemo(
    () =>
      ({
        ...defaultColDef,
        ...userDefaultColDef,
      }) as AGColDef<TData>,
    [userDefaultColDef]
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

  return (
    <div
      className={cn(agGridVariants({ variant, size }), className)}
      style={{ height: typeof height === 'number' ? `${height}px` : height }}
    >
      <AgGridReact<TData>
        ref={resolvedRef as React.RefObject<AgGridReact<TData>>}
        columnDefs={columnDefs}
        rowData={rowData}
        defaultColDef={mergedDefaultColDef}
        onGridReady={handleGridReady}
        onRowClicked={handleRowClicked}
        animateRows={false}
        rowSelection={resolvedRowSelection}
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
