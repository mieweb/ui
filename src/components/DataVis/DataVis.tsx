/**
 * React wrapper components for wcdatavis.
 *
 * Provides <DataVisSource> and <DataVisGrid> components that declaratively
 * create and manage DataVis Source, ComputedView, and Grid instances.
 */

import React, { createContext, useContext, useEffect, useId, useMemo, useRef } from 'react';
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

  // Serialize to stable strings so that array/object literals passed by callers
  // do not trigger a re-init on every render due to reference inequality.
  const columnsKey = useMemo(() => JSON.stringify(columns), [columns]);
  const featuresKey = useMemo(() => JSON.stringify(features), [features]);

  // Keep refs to the latest values so the effect always uses up-to-date data
  // without those values needing to be in the dependency array themselves.
  const columnsRef = useRef(columns);
  const featuresRef = useRef(features);
  columnsRef.current = columns;
  featuresRef.current = features;

  useEffect(() => {
    if (containerRef.current === null || computedView === null) return;

    if (gridRef.current !== null) {
      containerRef.current.innerHTML = '';
      gridRef.current = null;
    }

    const currentColumns = columnsRef.current;
    const currentFeatures = featuresRef.current;

    const defn: {
      id: string;
      computedView: InstanceType<typeof ComputedView>;
      table: { columns?: typeof columns; features?: typeof features };
    } = {
      id: domId,
      computedView,
      table: {},
    };

    if (currentColumns !== undefined) defn.table.columns = currentColumns;
    if (currentFeatures !== undefined) defn.table.features = currentFeatures;

    const opts: Record<string, unknown> = {};
    if (title !== undefined) opts.title = title;
    opts.showControls = showControls ?? false;

    gridRef.current = new Grid(defn, opts);

    return () => {
      if (containerRef.current !== null) {
        containerRef.current.innerHTML = '';
      }
      gridRef.current = null;
    };
  }, [computedView, domId, title, showControls, columnsKey, featuresKey]);

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
