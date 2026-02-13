import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

// ============================================================================
// Dynamic import types for @mieweb/wcdatavis
// ============================================================================

/**
 * Source configuration for DataVis data retrieval.
 *
 * @see {@link https://docs.mieweb.com/datavis/ DataVis Documentation}
 */
export interface DataVisSourceConfig {
  /** Data source type */
  type: 'http' | 'json' | 'array' | 'webchart' | (string & {});
  /** URL for HTTP sources */
  url?: string;
  /** Inline data for json/array sources */
  data?: unknown;
  /** Additional source options passed to DataVis Source constructor */
  [key: string]: unknown;
}

/**
 * Options for the DataVis ComputedView.
 * These control sorting, grouping, filtering, etc.
 */
export interface DataVisViewOptions {
  /** Column sorting configuration */
  sort?: Array<{ column: string; direction?: 'asc' | 'desc' }>;
  /** Column grouping configuration */
  group?: string[];
  /** Filter configuration */
  filter?: Record<string, unknown>;
  /** Additional view options passed to DataVis ComputedView */
  [key: string]: unknown;
}

/**
 * Options for the DataVis Grid display.
 */
export interface DataVisGridOptions {
  /** Grid title displayed in the header */
  title?: string;
  /** Column definitions */
  columns?: Array<{
    field: string;
    title?: string;
    width?: number;
    sortable?: boolean;
    [key: string]: unknown;
  }>;
  /** Whether the grid is editable */
  editable?: boolean;
  /** Whether to show the toolbar */
  toolbar?: boolean;
  /** Whether to show the footer/status bar */
  footer?: boolean;
  /** Enable pagination */
  pagination?: boolean;
  /** Rows per page for pagination */
  pageSize?: number;
  /** Additional grid options passed to DataVis Grid constructor */
  [key: string]: unknown;
}

// ============================================================================
// Variant Styles
// ============================================================================

const dataVisVariants = cva('wc-datavis-themed w-full', {
  variants: {
    /**
     * Visual variant of the grid container
     */
    variant: {
      default: '',
      bordered: 'rounded-lg border border-border shadow-sm',
      card: 'rounded-lg border-0 shadow-card bg-card',
    },
    /**
     * Size/density preset
     */
    size: {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base',
    },
    /**
     * Brand theme variant
     */
    brand: {
      default: '',
      mieweb: '',
      bluehive: '',
      waggleline: '',
      webchart: '',
      'enterprise-health': '',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
    brand: 'default',
  },
});

// ============================================================================
// Component Types
// ============================================================================

export interface DataVisProps extends VariantProps<typeof dataVisVariants> {
  /** Source configuration for data retrieval */
  source: DataVisSourceConfig;
  /** View configuration (sort, group, filter, etc.) */
  viewOptions?: DataVisViewOptions;
  /** Grid display options (title, columns, toolbar, etc.) */
  gridOptions?: DataVisGridOptions;
  /** Additional CSS classes for the container */
  className?: string;
  /** Height of the DataVis container */
  height?: string | number;
  /** Loading state — shows a loading overlay */
  loading?: boolean;
  /** Callback when the grid is ready and rendered */
  onGridReady?: (grid: unknown) => void;
  /** Callback when an error occurs during initialization */
  onError?: (error: Error) => void;
  /** Callback when data is loaded */
  onDataLoaded?: (data: unknown) => void;
  /** Custom loading message or element */
  loadingMessage?: React.ReactNode;
  /** Custom error message or element */
  errorMessage?: React.ReactNode;
  /** Custom empty state message or element */
  emptyMessage?: React.ReactNode;
}

// ============================================================================
// State Types
// ============================================================================

type DataVisState = 'idle' | 'loading' | 'ready' | 'error';

// ============================================================================
// DataVis Component
// ============================================================================

/**
 * A themed React wrapper for MIE DataVis (`@mieweb/wcdatavis`).
 *
 * Provides a declarative React interface around the imperative DataVis library,
 * with full integration into the MIE Web UI design system including:
 * - Multi-brand theming via CSS variables
 * - Dark/light mode support
 * - Size and visual variants
 * - Lifecycle management (mount, update, destroy)
 *
 * **Requirements:**
 * - `@mieweb/wcdatavis` must be installed as a peer dependency
 * - FontAwesome 4.7 CSS must be available for DataVis icons
 *
 * @example
 * ```tsx
 * <DataVis
 *   source={{ type: 'http', url: '/api/data.csv' }}
 *   gridOptions={{ title: 'My Data Grid' }}
 *   variant="bordered"
 *   size="md"
 *   height={500}
 * />
 * ```
 *
 * @example
 * ```tsx
 * // With inline JSON data
 * <DataVis
 *   source={{ type: 'json', data: myJsonData }}
 *   gridOptions={{
 *     title: 'Inline Data',
 *     columns: [
 *       { field: 'name', title: 'Name' },
 *       { field: 'value', title: 'Value' },
 *     ],
 *   }}
 *   brand="bluehive"
 * />
 * ```
 */
const DataVis = React.forwardRef<HTMLDivElement, DataVisProps>(
  (
    {
      source,
      viewOptions,
      gridOptions,
      className,
      variant,
      size,
      brand,
      height,
      loading: externalLoading,
      onGridReady,
      onError,
      onDataLoaded,
      loadingMessage = 'Loading DataVis...',
      errorMessage,
      emptyMessage,
    },
    ref
  ) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const gridInstanceId = React.useId();
    const gridIdRef = React.useRef<string>(
      `datavis-${gridInstanceId.replace(/:/g, '-')}`
    );

    // Hold references to DataVis instances for cleanup
    const instancesRef = React.useRef<{
      source: unknown;
      view: unknown;
      grid: unknown;
    } | null>(null);

    const [state, setState] = React.useState<DataVisState>('idle');
    const [error, setError] = React.useState<Error | null>(null);

    // Combined ref handling
    const setRefs = React.useCallback(
      (node: HTMLDivElement | null) => {
        (
          containerRef as React.MutableRefObject<HTMLDivElement | null>
        ).current = node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }
      },
      [ref]
    );

    // Track the window variable name used for local source bridging
    const localVarRef = React.useRef<string | null>(null);

    // Destroy existing DataVis instances
    const destroyInstances = React.useCallback(() => {
      if (instancesRef.current) {
        try {
          const { grid, view, source: src } = instancesRef.current;
          // DataVis objects may have destroy/dispose methods
          if (
            grid &&
            typeof (grid as Record<string, unknown>).destroy === 'function'
          ) {
            (grid as { destroy: () => void }).destroy();
          }
          if (
            view &&
            typeof (view as Record<string, unknown>).destroy === 'function'
          ) {
            (view as { destroy: () => void }).destroy();
          }
          if (
            src &&
            typeof (src as Record<string, unknown>).destroy === 'function'
          ) {
            (src as { destroy: () => void }).destroy();
          }
        } catch {
          // Silently handle cleanup errors
        }
        instancesRef.current = null;
      }

      // Clean up temporary window variable used for json/array source bridging
      if (localVarRef.current) {
        delete (window as unknown as Record<string, unknown>)[
          localVarRef.current
        ];
        localVarRef.current = null;
      }

      // Clear the container DOM
      if (containerRef.current) {
        const gridEl = containerRef.current.querySelector(
          `#${gridIdRef.current}`
        );
        if (gridEl) {
          gridEl.innerHTML = '';
        }
      }
    }, []);

    // Initialize DataVis
    const initializeDataVis = React.useCallback(async () => {
      if (!containerRef.current) return;

      setState('loading');
      setError(null);

      try {
        // Prefer the scoped package name declared as a peer dependency.
        // Fall back to the unscoped alias for local/dev or Storybook setups.
        let wcdatavisModule: Record<string, unknown>;
        try {
          wcdatavisModule = (await import('@mieweb/wcdatavis')) as Record<
            string,
            unknown
          >;
        } catch {
          // Scoped package not available — fall back to the legacy/unscoped
          // name (used in Storybook via Vite aliases, or local dev).
          wcdatavisModule = (await import('wcdatavis')) as Record<
            string,
            unknown
          >;
        }

        // Resolve the actual exports — handle both default and named exports
        const DataVisModule = wcdatavisModule.default
          ? (wcdatavisModule.default as Record<string, unknown>)
          : wcdatavisModule;

        // Try various export patterns the library may use:
        //   Named exports: Source, ComputedView/View, Grid
        //   MIE.WC_DataVis namespace (browser bundle)
        const mod = DataVisModule as Record<string, unknown>;
        const mieNs =
          ((mod.MIE as Record<string, unknown> | undefined)?.WC_DataVis as
            | Record<string, unknown>
            | undefined) ??
          (mod.WC_DataVis as Record<string, unknown> | undefined);

        const SourceClass = mod.Source ?? mieNs?.Source;
        // v2.x exports ComputedView as "View"; v3.x exports as "ComputedView"
        const ComputedViewClass =
          mod.ComputedView ?? mod.View ?? mieNs?.ComputedView;
        const GridClass = mod.Grid ?? mieNs?.Grid;

        if (!SourceClass || !ComputedViewClass || !GridClass) {
          throw new Error(
            'Could not resolve DataVis classes (Source, ComputedView/View, Grid). ' +
              'Ensure wcdatavis or @mieweb/wcdatavis is installed and the version is compatible.'
          );
        }

        // Clean up previous instances before re-creating
        destroyInstances();

        // Bridge unsupported source types into wcdatavis-native types.
        // wcdatavis Source only supports: local, http, file, table.
        // We translate 'json' and 'array' into 'local' by setting a
        // temporary window variable that LocalSource reads from.
        let resolvedSource: DataVisSourceConfig = source;
        let localVarName: string | null = null;

        if (
          (source.type === 'json' || source.type === 'array') &&
          source.data != null
        ) {
          localVarName = `__datavis_${gridIdRef.current.replace(/-/g, '_')}`;
          const dataArr = Array.isArray(source.data) ? source.data : [];

          // Auto-infer typeInfo from the first data row so wcdatavis can
          // format every cell correctly (avoids "Unable to format - unknown type").
          const typeInfo: Record<string, { field: string; type: string }> = {};
          if (dataArr.length > 0) {
            const sample = dataArr[0] as Record<string, unknown>;
            for (const key of Object.keys(sample)) {
              const val = sample[key];
              let colType = 'string';
              if (typeof val === 'number') colType = 'number';
              else if (typeof val === 'boolean') colType = 'string'; // bool → string for display
              typeInfo[key] = { field: key, type: colType };
            }
          }

          (window as unknown as Record<string, unknown>)[localVarName] = {
            data: dataArr,
            typeInfo,
          };
          resolvedSource = { type: 'local', varName: localVarName };
          localVarRef.current = localVarName;
        }

        // Derive a name for logging from gridOptions.title or the grid id
        const instanceName = gridOptions?.title ?? gridIdRef.current;

        // Create Source — constructor is (spec, params, userTypeInfo, opts)
        const sourceInstance = new (SourceClass as new (
          config: DataVisSourceConfig,
          params?: unknown,
          userTypeInfo?: unknown,
          opts?: { name?: string }
        ) => unknown)(resolvedSource, undefined, undefined, {
          name: instanceName,
        });

        // Create ComputedView — constructor is (source, opts)
        const viewInstance = new (ComputedViewClass as new (
          source: unknown,
          options?: DataVisViewOptions & { name?: string }
        ) => unknown)(sourceInstance, { ...viewOptions, name: instanceName });

        // Create Grid — it renders into the DOM element with the given id
        // The Grid constructor takes (defn, opts, cb)
        const { title, columns, ...restGridOptions } = gridOptions ?? {};
        const gridDisplayOptions: Record<string, unknown> = {
          ...restGridOptions,
          name: instanceName,
        };
        if (title) {
          gridDisplayOptions.title = title;
        }
        if (columns) {
          gridDisplayOptions.columns = columns;
        }

        // Build grid definition — disable floatingHeader since TableTool/floatThead
        // are unavailable in this environment (avoids "tabletool is not available" error)
        const gridDefn: Record<string, unknown> = {
          id: gridIdRef.current,
          computedView: viewInstance,
          table: {
            features: { floatingHeader: false },
          },
        };

        const gridInstance = new (GridClass as new (
          config: Record<string, unknown>,
          options?: Record<string, unknown>
        ) => unknown)(gridDefn, gridDisplayOptions);

        instancesRef.current = {
          source: sourceInstance,
          view: viewInstance,
          grid: gridInstance,
        };

        setState('ready');
        onGridReady?.(gridInstance);
        onDataLoaded?.(sourceInstance);
      } catch (err) {
        const wrappedError =
          err instanceof Error
            ? err
            : new Error(`DataVis initialization failed: ${String(err)}`);
        setError(wrappedError);
        setState('error');
        onError?.(wrappedError);
      }
    }, [
      source,
      viewOptions,
      gridOptions,
      destroyInstances,
      onGridReady,
      onError,
      onDataLoaded,
    ]);

    // Mount / source / option change effect
    // Use a "cancelled" flag to guard against race conditions: if props
    // change while an async init is in-flight, the stale init's state
    // updates and callbacks are skipped.
    React.useEffect(() => {
      let cancelled = false;

      const run = async () => {
        await initializeDataVis();
        // If this effect was cleaned up while the async init was running,
        // tear down the instances it just created so we don't leak.
        if (cancelled) {
          destroyInstances();
        }
      };
      run();

      return () => {
        cancelled = true;
        destroyInstances();
      };
    }, [initializeDataVis, destroyInstances]);

    // -----------------------------------------------------------------------
    // Propagate theme variables to body-level dialogs/popups
    // -----------------------------------------------------------------------
    // jQuery UI appends dialogs to <body>, outside the component tree.
    // We observe the DOM for new .wcdv_dialog / .ui-dialog elements and
    // copy the component's resolved CSS variable values onto them so that
    // dark mode and brand theming work correctly.
    React.useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      // Guard against re-entrant calls (setProperty triggers mutations)
      let propagating = false;

      /** Copy computed --mieweb-* values from the component onto `target`. */
      const propagateVars = (target: HTMLElement) => {
        const cs = getComputedStyle(container);
        const vars = [
          'background',
          'foreground',
          'card',
          'card-foreground',
          'muted',
          'muted-foreground',
          'border',
          'input',
          'ring',
          'destructive',
          'destructive-foreground',
          'success',
          'success-foreground',
          'warning',
          'warning-foreground',
          'primary-50',
          'primary-100',
          'primary-200',
          'primary-300',
          'primary-400',
          'primary-500',
          'primary-600',
          'primary-700',
          'primary-800',
          'primary-900',
          'primary-950',
          'font-sans',
          'font-mono',
          'radius-sm',
          'radius-md',
          'radius-lg',
          'shadow-card',
          'shadow-dropdown',
          'shadow-modal',
        ];
        for (const v of vars) {
          const val = cs.getPropertyValue(`--mieweb-${v}`).trim();
          if (val) {
            target.style.setProperty(`--mieweb-${v}`, val);
          }
        }
      };

      const isDataVisDialog = (el: HTMLElement) =>
        el.classList.contains('wcdv_dialog') ||
        el.classList.contains('ui-dialog') ||
        el.classList.contains('context-menu-list') ||
        el.classList.contains('ui-tooltip') ||
        el.querySelector?.('.wcdv_colconfigwin_table') != null ||
        el.querySelector?.('.wcdv_button_bar') != null;

      /** Tag all existing datavis dialogs on the page. */
      const tagExistingDialogs = () => {
        if (propagating) return;
        propagating = true;
        try {
          const dialogs = document.querySelectorAll<HTMLElement>(
            '.wcdv_dialog, .ui-dialog, .context-menu-list, .ui-tooltip, .SumoSelect > .optWrapper'
          );
          dialogs.forEach(propagateVars);
        } finally {
          propagating = false;
        }
      };

      // Tag once on mount
      tagExistingDialogs();

      // Watch only for new direct children appended to body (dialogs)
      const observer = new MutationObserver((mutations) => {
        if (propagating) return;
        propagating = true;
        try {
          for (const m of mutations) {
            for (const node of m.addedNodes) {
              if (!(node instanceof HTMLElement)) continue;
              if (isDataVisDialog(node)) {
                propagateVars(node);
              }
            }
          }
        } finally {
          propagating = false;
        }
      });

      observer.observe(document.body, { childList: true, subtree: false });

      return () => {
        observer.disconnect();
      };
    }, [state, brand, variant, size]); // Re-run when state or theming changes

    // Compute container style
    const containerStyle = React.useMemo((): React.CSSProperties => {
      const style: React.CSSProperties = {};
      if (height !== undefined) {
        style.height = typeof height === 'number' ? `${height}px` : height;
      }
      return style;
    }, [height]);

    // Determine display state
    const isLoading = externalLoading || state === 'loading';
    const isError = state === 'error' && error;
    const isIdle = state === 'idle';

    return (
      <div
        ref={setRefs}
        className={cn(dataVisVariants({ variant, size, brand }), className)}
        style={containerStyle}
        data-brand={brand}
        data-state={state}
      >
        {/* Loading overlay */}
        {isLoading && (
          <div className="text-muted-foreground flex items-center justify-center p-8">
            {typeof loadingMessage === 'string' ? (
              <div className="flex items-center gap-2">
                <svg
                  className="h-5 w-5 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>{loadingMessage}</span>
              </div>
            ) : (
              loadingMessage
            )}
          </div>
        )}

        {/* Error state */}
        {isError && (
          <div className="text-destructive flex flex-col items-center justify-center gap-2 p-8">
            {errorMessage ?? (
              <>
                <span className="font-medium">Failed to load DataVis</span>
                <span className="text-muted-foreground text-xs">
                  {error.message}
                </span>
              </>
            )}
          </div>
        )}

        {/* Idle / empty state (before initialization) */}
        {isIdle && emptyMessage && (
          <div className="text-muted-foreground flex items-center justify-center p-8">
            {emptyMessage}
          </div>
        )}

        {/* DataVis grid mount point */}
        <div
          id={gridIdRef.current}
          className="datavis-grid-container"
          style={{
            // Hide the mount point while loading/errored so overlays show cleanly
            display: isLoading || isError ? 'none' : undefined,
          }}
        />
      </div>
    );
  }
);

DataVis.displayName = 'DataVis';

export { DataVis, dataVisVariants };
