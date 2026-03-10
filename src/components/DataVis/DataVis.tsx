/**
 * React wrapper components for wcdatavis.
 *
 * Provides <DataVisSource> and <DataVisGrid> components that declaratively
 * create and manage DataVis Source, ComputedView, and Grid instances.
 *
 * All browser-only side-effect imports (jQuery, plugins, CSS, wcdatavis) are
 * deferred to dynamic imports that run inside useEffect so this module is safe
 * to import in SSR / Node environments without crashing or bloating the bundle.
 */

import React, { createContext, useContext, useEffect, useId, useRef, useState } from 'react';

/** Shape returned by the lazy module loader. */
interface DvModules {
  Source: any;
  ComputedView: any;
  Grid: any;
}

/**
 * Module-level cache for the lazy-loaded DataVis dependencies.
 * Ensures that setup and plugin registration happen exactly once per page load.
 */
let _modulesPromise: Promise<DvModules> | null = null;

function loadDvModules(): Promise<DvModules> {
  if (_modulesPromise !== null) return _modulesPromise;
  _modulesPromise = (async (): Promise<DvModules> => {
    // setup.ts must be first — it sets window.jQuery before plugins load
    await import('./setup');
    // jQuery plugins (side-effect imports — attach to window.jQuery set above)
    await import('jquery-ui/dist/jquery-ui.min.js');
    await import('block-ui');
    await import('flatpickr');
    await import('jquery-contextmenu');
    await import('sumoselect');
    // CSS
    await import('jquery-ui/dist/themes/base/jquery-ui.min.css');
    await import('jquery-contextmenu/dist/jquery.contextMenu.min.css');
    await import('sumoselect/sumoselect.min.css');
    await import('wcdatavis/wcdatavis.css');
    // @ts-expect-error — wcdatavis does not ship type declarations
    const { Source } = await import('wcdatavis/src/source.js');
    // @ts-expect-error — wcdatavis does not ship type declarations
    const { ComputedView } = await import('wcdatavis/src/computed_view.js');
    // @ts-expect-error — wcdatavis does not ship type declarations
    const { Grid } = await import('wcdatavis/src/grid.js');
    return { Source, ComputedView, Grid };
  })();
  return _modulesPromise;
}

/** React context used to pass the ComputedView from DataVisSource to DataVisGrid. */
const SourceContext = createContext<any | null>(null);

// — DataVisSource —

export interface DataVisSourceProps {
  /** Source type: 'http', 'local', or 'file'. */
  type: string;
  /** URL to fetch data from (when type is 'http'). */
  url?: string;
  children?: React.ReactNode;
}

/**
 * Creates a DataVis Source and ComputedView, providing them to children
 * via context. The Source is recreated when `type` or `url` change.
 * Modules are loaded lazily on first render so this is safe in SSR contexts.
 */
function DataVisSource({ type, url, children }: DataVisSourceProps) {
  const [view, setView] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;
    loadDvModules()
      .then(({ Source, ComputedView }) => {
        if (cancelled) return;
        const source = new Source({ type, url });
        const cv = new ComputedView(source);
        cv._dvType = type;
        cv._dvUrl = url;
        setView(cv);
      })
      .catch((err) => {
        if (!cancelled) console.error('[DataVis] Failed to load modules:', err);
      });
    return () => {
      cancelled = true;
      setView(null);
    };
  }, [type, url]);

  return (
    <SourceContext.Provider value={view}>
      {children}
    </SourceContext.Provider>
  );
}

DataVisSource.displayName = 'DataVisSource';

// — DataVisGrid —

export interface DataVisGridProps {
  /** DOM id for the grid container. Auto-generated if omitted. */
  id?: string;
  /** Title shown in the grid's title bar. */
  title?: string;
  /** Whether to show grid controls. Defaults to false. */
  showControls?: boolean;
  /** Column definitions (strings or objects). */
  columns?: Array<string | Record<string, unknown>>;
  /** Table feature flags (limit, rowSelect, etc.). */
  features?: Record<string, unknown>;
  /** Additional CSS class(es) for the container div. */
  className?: string;
  /** Inline styles for the container div. */
  style?: React.CSSProperties;
}

/**
 * Renders a DataVis Grid into a container div. Must be a descendant of
 * DataVisSource so that a ComputedView is available via context.
 * Modules are loaded lazily so this is safe in SSR contexts.
 */
function DataVisGrid({
  id,
  title,
  showControls,
  columns,
  features,
  className,
  style,
}: DataVisGridProps) {
  const computedView = useContext(SourceContext);
  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<any>(null);
  const reactId = useId();

  const domId = id || 'dv-grid-' + reactId.replace(/:/g, '');

  useEffect(() => {
    if (containerRef.current === null || computedView === null) return;

    let cancelled = false;

    loadDvModules()
      .then(({ Grid }) => {
        if (cancelled || containerRef.current === null) return;

        if (gridRef.current !== null) {
          containerRef.current.innerHTML = '';
          gridRef.current = null;
        }

        const defn: Record<string, any> = {
          id: domId,
          computedView,
          table: {} as Record<string, unknown>,
        };

        if (columns !== undefined) defn.table.columns = columns;
        if (features !== undefined) defn.table.features = features;

        const opts: Record<string, unknown> = {};
        if (title !== undefined) opts.title = title;
        if (showControls !== undefined) opts.showControls = showControls;

        gridRef.current = new Grid(defn, opts);
      })
      .catch((err) => {
        if (!cancelled) console.error('[DataVis] Failed to load modules:', err);
      });

    return () => {
      cancelled = true;
      if (containerRef.current !== null) {
        containerRef.current.innerHTML = '';
      }
      gridRef.current = null;
    };
  }, [computedView, domId, title, showControls, columns, features]);

  return (
    <div
      id={domId}
      ref={containerRef}
      className={className}
      style={style}
    />
  );
}

DataVisGrid.displayName = 'DataVisGrid';

export { DataVisSource, DataVisGrid, SourceContext };
