/**
 * React wrapper components for wcdatavis.
 *
 * Provides <WCDVSOURCE> and <WCDVGRID> components that declaratively
 * create and manage DataVis Source, ComputedView, and Grid instances.
 */

import React, { createContext, useContext, useEffect, useId, useRef } from 'react';
// setup.ts must be first — it sets window.jQuery before plugins load
import './setup';
import { Source, ComputedView, Grid } from 'wcdatavis/index.js';

import 'wcdatavis/wcdatavis.css';

/** React context used to pass the ComputedView from WCDVSOURCE to WCDVGRID. */
const SourceContext = createContext<InstanceType<typeof ComputedView> | null>(null);

// — WCDVSOURCE —

type WCDVSOURCEType = 'http' | 'local' | 'file';

interface HttpWCDVSOURCE_props {
  /** Source type: 'http'. */
  type: 'http';
  /** URL to fetch data from (required when type is 'http'). */
  url: string;
  children?: React.ReactNode;
}

interface LocalWCDVSOURCE_props {
  /** Source type: 'local'. */
  type: 'local';
  children?: React.ReactNode;
}

interface FileWCDVSOURCE_props {
  /** Source type: 'file'. */
  type: 'file';
  children?: React.ReactNode;
}

export type WCDVSOURCE_props =
  | HttpWCDVSOURCE_props
  | LocalWCDVSOURCE_props
  | FileWCDVSOURCE_props;
/** ComputedView augmented with bookkeeping fields used to detect prop changes. */
type TrackedComputedView = InstanceType<typeof ComputedView> & {
  _dvType: WCDVSOURCEType;
  _dvUrl: string | undefined;
};

/**
 * Creates a DataVis Source and ComputedView, providing them to children
 * via context. The Source is recreated when `type` or `url` change.
 */
function WCDVSOURCE(props: WCDVSOURCE_props) {
  const { type, children } = props;
  const url = props.type === 'http' ? props.url : undefined;
  const viewRef = useRef<TrackedComputedView | null>(null);

  if (
    viewRef.current === null ||
    viewRef.current._dvType !== type ||
    viewRef.current._dvUrl !== url
  ) {
    const source = props.type === 'http'
      ? new Source({ type, url: props.url })
      : new Source({ type });
    viewRef.current = Object.assign(new ComputedView(source), { _dvType: type, _dvUrl: url });
  }

  return (
    <SourceContext.Provider value={viewRef.current}>
      {children}
    </SourceContext.Provider>
  );
}

WCDVSOURCE.displayName = 'WCDVSOURCE';

// — WCDVGRID —

export interface WCDVGRID_props {
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
 * WCDVSOURCE so that a ComputedView is available via context.
 */
function WCDVGRID({
  id,
  title,
  showControls,
  columns,
  features,
  className,
  style,
}: WCDVGRID_props) {
  const computedView = useContext(SourceContext);
  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<InstanceType<typeof Grid> | null>(null);
  const reactId = useId();

  const domId = id || 'dv-grid-' + reactId.replace(/:/g, '');

  useEffect(() => {
    const container = containerRef.current;

    if (container === null || computedView === null) return;

    if (gridRef.current !== null) {
      container.innerHTML = '';
      gridRef.current = null;
    }

    const defn: {
      id: string;
      computedView: InstanceType<typeof ComputedView>;
      table: { columns?: typeof columns; features?: typeof features };
    } = {
      id: domId,
      computedView,
      table: {},
    };

    if (columns !== undefined) defn.table.columns = columns;
    if (features !== undefined) defn.table.features = features;

    const opts: Record<string, unknown> = {};
    if (title !== undefined) opts.title = title;
    opts.showControls = showControls ?? false;

    gridRef.current = new Grid(defn, opts);

    return () => {
      container.innerHTML = '';
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

WCDVGRID.displayName = 'WCDVGRID';

export { WCDVSOURCE, WCDVGRID, SourceContext };
