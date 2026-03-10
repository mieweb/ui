/**
 * React wrapper components for wcdatavis.
 *
 * Provides <DataVisSource> and <DataVisGrid> components that declaratively
 * create and manage DataVis Source, ComputedView, and Grid instances.
 */

import React, { createContext, useContext, useEffect, useId, useRef } from 'react';
// setup.ts must be first — it sets window.jQuery before plugins load
import './setup';
// jQuery plugins (side-effect imports — attach to window.jQuery set above)
import 'jquery-ui/dist/jquery-ui.min.js';
import 'block-ui';
import 'flatpickr';
import 'jquery-contextmenu';
import 'sumoselect';
// CSS
import 'jquery-ui/dist/themes/base/jquery-ui.min.css';
import 'jquery-contextmenu/dist/jquery.contextMenu.min.css';
import 'sumoselect/sumoselect.min.css';
import 'wcdatavis/wcdatavis.css';
// @ts-expect-error — wcdatavis does not ship type declarations
import { Source } from 'wcdatavis/src/source.js';
// @ts-expect-error — wcdatavis does not ship type declarations
import { ComputedView } from 'wcdatavis/src/computed_view.js';
// @ts-expect-error — wcdatavis does not ship type declarations
import { Grid } from 'wcdatavis/src/grid.js';

/** React context used to pass the ComputedView from DataVisSource to DataVisGrid. */
const SourceContext = createContext<InstanceType<typeof ComputedView> | null>(null);

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
 */
function DataVisSource({ type, url, children }: DataVisSourceProps) {
  const viewRef = useRef<any>(null);

  if (
    viewRef.current === null ||
    viewRef.current._dvType !== type ||
    viewRef.current._dvUrl !== url
  ) {
    const source = new Source({ type, url });
    const view = new ComputedView(source);
    view._dvType = type;
    view._dvUrl = url;
    viewRef.current = view;
  }

  return (
    <SourceContext.Provider value={viewRef.current}>
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
  const gridRef = useRef<InstanceType<typeof Grid> | null>(null);
  const reactId = useId();

  const domId = id || 'dv-grid-' + reactId.replace(/:/g, '');

  useEffect(() => {
    if (containerRef.current === null || computedView === null) return;

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

    return () => {
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
