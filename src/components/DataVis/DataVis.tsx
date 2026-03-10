/**
 * React wrapper components for wcdatavis.
 *
 * Provides <DataVisSource> and <DataVisGrid> components that declaratively
 * create and manage DataVis Source, ComputedView, and Grid instances.
 */

import React, { createContext, useContext, useEffect, useId, useRef } from 'react';
// setup.ts must be first — it sets window.jQuery before plugins load
import './setup';
import { Source, ComputedView, Grid } from 'wcdatavis/index.js';

import 'wcdatavis/wcdatavis.css';

/** React context used to pass the ComputedView from DataVisSource to DataVisGrid. */
const SourceContext = createContext<InstanceType<typeof ComputedView> | null>(null);

// — DataVisSource —

type DataVisSourceType = 'http' | 'local' | 'file';

interface HttpDataVisSourceProps {
  /** Source type: 'http'. */
  type: 'http';
  /** URL to fetch data from (required when type is 'http'). */
  url: string;
  children?: React.ReactNode;
}

interface LocalDataVisSourceProps {
  /** Source type: 'local'. */
  type: 'local';
  children?: React.ReactNode;
}

interface FileDataVisSourceProps {
  /** Source type: 'file'. */
  type: 'file';
  children?: React.ReactNode;
}

export type DataVisSourceProps =
  | HttpDataVisSourceProps
  | LocalDataVisSourceProps
  | FileDataVisSourceProps;
/**
 * Creates a DataVis Source and ComputedView, providing them to children
 * via context. The Source is recreated when `type` or `url` change.
 */
function DataVisSource(props: DataVisSourceProps) {
  const { type, children } = props;
  const url = props.type === 'http' ? props.url : undefined;
  const viewRef = useRef<any>(null);

  if (
    viewRef.current === null ||
    viewRef.current._dvType !== type ||
    viewRef.current._dvUrl !== url
  ) {
    const source = props.type === 'http'
      ? new Source({ type, url: props.url })
      : new Source({ type });
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
