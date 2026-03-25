import React, { createContext, useContext, useMemo, useRef } from 'react';
import { ComputedView } from 'wcdatavis/src/computed_view.js';
import { Source } from 'wcdatavis/src/source.js';

import {
  DataGrid,
  type DataGridProps,
  type GridTableDef,
} from 'datavis/src/components/DataGrid';
import { determineColumns } from 'datavis/src/adapters/colconfig-adapter';
import { getBuiltinGroupFunctions } from 'datavis/src/adapters/group-adapter';
import { buildAggregateFunctions } from 'datavis/src/adapters/wcdatavis-interop';
import { useView, type ViewInstance } from 'datavis/src/adapters/use-data';
import {
  TableRenderer,
  type TableRendererProps,
} from 'datavis/src/components/table/TableRenderer';
import type {
  TableColumn,
  TableFeatures,
} from 'datavis/src/components/table/types';
import type { ColumnFilterConfig } from 'datavis/src/components/filters/types';
import type { AggregateFunction } from 'datavis/src/components/controls/AggregateSection';
import type { GroupFunction as GroupFunctionDef } from 'datavis/src/components/dialogs/GroupFunctionDialog';

type TranslateFn = (key: string, ...args: unknown[]) => string;

type DataVisNitroSourceType = 'http' | 'local' | 'file';

interface HttpDataVisNitroSourceProps {
  type: 'http';
  url: string;
  children?: React.ReactNode;
}

interface LocalDataVisNitroSourceProps {
  type: 'local';
  children?: React.ReactNode;
}

interface FileDataVisNitroSourceProps {
  type: 'file';
  children?: React.ReactNode;
}

export type DataVisNitroSourceProps =
  | HttpDataVisNitroSourceProps
  | LocalDataVisNitroSourceProps
  | FileDataVisNitroSourceProps;

type TrackedViewInstance = ViewInstance & {
  _dvType: DataVisNitroSourceType;
  _dvUrl: string | undefined;
};

type DataVisTypeInfoEntry = {
  type?: string;
  displayText?: string;
  format?: string | Record<string, unknown>;
  internalType?: string;
};

type DataVisTypeInfoMap = Record<string, DataVisTypeInfoEntry>;

type DataVisTypeInfoOrdMap = {
  keys?: () => string[];
  get?: (key: string) => DataVisTypeInfoEntry | undefined;
};

export type DataVisNitroColumn = string | TableColumn;

export interface DataVisNitroGridProps
  extends
    Omit<DataGridProps, 'view' | 'children' | 'allColumns'>,
    Pick<
      TableRendererProps,
      | 'formatCell'
      | 'onColumnReorder'
      | 'onColumnResize'
      | 'onHeaderContextMenu'
      | 'onRowClick'
      | 'onRowDoubleClick'
      | 'onSelectionChange'
    > {
  columns?: DataVisNitroColumn[];
  allColumns?: TableColumn[];
  features?: TableFeatures;
  filterColumns?: ColumnFilterConfig[];
  aggregateFunctions?: AggregateFunction[];
  groupFunctionDefs?: GroupFunctionDef[];
  style?: React.CSSProperties;
  trans?: TranslateFn;
}

export const DataVisNitroContext = createContext<ViewInstance | null>(null);

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function normalizeTypeInfo(typeInfo: unknown): DataVisTypeInfoMap {
  if (!isObject(typeInfo)) {
    return {};
  }

  const maybeOrdMap = typeInfo as DataVisTypeInfoOrdMap;
  if (
    typeof maybeOrdMap.keys === 'function' &&
    typeof maybeOrdMap.get === 'function'
  ) {
    return Object.fromEntries(
      maybeOrdMap.keys().map((field) => [field, maybeOrdMap.get?.(field) ?? {}])
    );
  }

  return Object.fromEntries(
    Object.entries(typeInfo).filter(([, value]) => isObject(value))
  ) as DataVisTypeInfoMap;
}

function normalizeFieldType(type: string | undefined): string | undefined {
  if (!type) return undefined;
  if (type === 'integer') return 'number';
  if (type === 'boolean') return 'string';
  return type;
}

function buildColumnFromField(
  field: string,
  typeInfo: DataVisTypeInfoMap
): TableColumn {
  const info = typeInfo[field];
  const normalizedType = normalizeFieldType(info?.type);

  return {
    field,
    header: info?.displayText ?? field,
    sortable: true,
    filterable: true,
    resizable: true,
    reorderable: true,
    ...(normalizedType
      ? {
          typeInfo: {
            type: normalizedType,
            ...(info?.format !== undefined ? { format: info.format } : {}),
            ...(info?.internalType !== undefined
              ? { internalType: info.internalType }
              : {}),
          },
        }
      : {}),
  };
}

function mergeColumnWithTypeInfo(
  column: TableColumn,
  typeInfo: DataVisTypeInfoMap
): TableColumn {
  const fallbackColumn = buildColumnFromField(column.field, typeInfo);
  return {
    ...fallbackColumn,
    ...column,
    header: column.header ?? fallbackColumn.header,
    typeInfo: column.typeInfo ?? fallbackColumn.typeInfo,
  };
}

function buildResolvedColumns(
  columns: DataVisNitroColumn[] | undefined,
  fallbackFields: string[],
  typeInfo: DataVisTypeInfoMap
): TableColumn[] {
  if (columns && columns.length > 0) {
    return columns.map((column) => {
      if (typeof column === 'string') {
        return buildColumnFromField(column, typeInfo);
      }

      return mergeColumnWithTypeInfo(column, typeInfo);
    });
  }

  return fallbackFields.map((field) => buildColumnFromField(field, typeInfo));
}

function buildFallbackFieldOrder(
  typeInfo: DataVisTypeInfoMap,
  data: unknown[] | null
): string[] {
  const rows = Array.isArray(data)
    ? data.filter((row): row is Record<string, unknown> => isObject(row))
    : null;

  const normalizedEntries = Object.fromEntries(
    Object.entries(typeInfo).map(([field, info]) => [
      field,
      {
        type: normalizeFieldType(info.type) ?? 'string',
        ...(info.displayText !== undefined
          ? { displayText: info.displayText }
          : {}),
      },
    ])
  );

  return determineColumns(null, normalizedEntries, rows);
}

function buildControlFields(
  columns: TableColumn[]
): NonNullable<DataGridProps['controlFields']> {
  return columns.map((column) => ({
    field: column.field,
    displayName: column.header,
    type: column.typeInfo?.type,
  }));
}

function buildAggregateFields(
  columns: TableColumn[]
): NonNullable<DataGridProps['aggregateFields']> {
  return columns.map((column) => ({
    field: column.field,
    displayName: column.header,
  }));
}

function mergeTableDef(
  tableDef: GridTableDef | undefined,
  features: TableFeatures | undefined
): GridTableDef | undefined {
  if (!tableDef && !features) {
    return undefined;
  }

  const { rowMode, ...featureFlags } = features ?? {};

  return {
    ...tableDef,
    ...(rowMode !== undefined ? { rowMode } : {}),
    ...(Object.keys(featureFlags).length > 0
      ? {
          features: {
            ...(tableDef?.features ?? {}),
            ...featureFlags,
          },
        }
      : {}),
  };
}

function DataVisNitroSource(props: DataVisNitroSourceProps) {
  const { type, children } = props;
  const url = props.type === 'http' ? props.url : undefined;
  const viewRef = useRef<TrackedViewInstance | null>(null);

  if (
    viewRef.current === null ||
    viewRef.current._dvType !== type ||
    viewRef.current._dvUrl !== url
  ) {
    const source =
      props.type === 'http'
        ? new Source({ type, url: props.url })
        : new Source({ type });

    viewRef.current = Object.assign(
      new ComputedView(source) as unknown as ViewInstance,
      { _dvType: type, _dvUrl: url }
    );
  }

  return (
    <DataVisNitroContext.Provider value={viewRef.current}>
      {children}
    </DataVisNitroContext.Provider>
  );
}

function DataVisNitroGridInner({
  computedView,
  columns,
  allColumns,
  features,
  filterColumns,
  controlFields,
  aggregateFields,
  aggregateFunctions,
  groupFunctionDefs,
  tableDef,
  formatCell,
  onColumnReorder,
  onColumnResize,
  onHeaderContextMenu,
  onRowClick,
  onRowDoubleClick,
  onSelectionChange,
  style,
  trans,
  ...dataGridProps
}: DataVisNitroGridProps & { computedView: ViewInstance }) {
  const viewState = useView(computedView, false);

  const normalizedTypeInfo = useMemo(
    () =>
      normalizeTypeInfo(viewState.typeInfo ?? computedView?.typeInfo ?? null),
    [computedView, viewState.typeInfo]
  );

  const fallbackFields = useMemo(
    () =>
      buildFallbackFieldOrder(normalizedTypeInfo, viewState.data?.data ?? null),
    [normalizedTypeInfo, viewState.data?.data]
  );

  const resolvedAllColumns = useMemo(() => {
    if (allColumns && allColumns.length > 0) {
      return allColumns.map((column) =>
        mergeColumnWithTypeInfo(column, normalizedTypeInfo)
      );
    }

    return buildResolvedColumns(columns, fallbackFields, normalizedTypeInfo);
  }, [allColumns, columns, fallbackFields, normalizedTypeInfo]);

  const resolvedColumns = useMemo(() => {
    if (columns && columns.length > 0) {
      return buildResolvedColumns(
        columns,
        fallbackFields,
        normalizedTypeInfo
      ).filter((column) => column.visible !== false);
    }

    return resolvedAllColumns.filter((column) => column.visible !== false);
  }, [columns, fallbackFields, normalizedTypeInfo, resolvedAllColumns]);

  const effectiveAggregateFunctions = useMemo(
    () => aggregateFunctions ?? buildAggregateFunctions(),
    [aggregateFunctions]
  );

  const effectiveGroupFunctionDefs = useMemo(
    () =>
      groupFunctionDefs ??
      getBuiltinGroupFunctions(trans as TranslateFn | undefined),
    [groupFunctionDefs, trans]
  );

  const effectiveTableDef = useMemo(
    () => mergeTableDef(tableDef, features),
    [tableDef, features]
  );

  const aggFnLabels = useMemo(
    () =>
      Object.fromEntries(
        effectiveAggregateFunctions.map((fn) => [fn.name, fn.label])
      ),
    [effectiveAggregateFunctions]
  );

  return (
    <div style={style}>
      <DataGrid
        {...dataGridProps}
        view={computedView}
        tableDef={effectiveTableDef}
        allColumns={resolvedAllColumns}
        filterColumns={filterColumns ?? []}
        controlFields={controlFields ?? buildControlFields(resolvedAllColumns)}
        aggregateFields={
          aggregateFields ?? buildAggregateFields(resolvedAllColumns)
        }
        aggregateFunctions={effectiveAggregateFunctions}
        groupFunctionDefs={effectiveGroupFunctionDefs}
      >
        <TableRenderer
          viewData={viewState.data}
          columns={resolvedColumns}
          features={
            (effectiveTableDef?.features as TableFeatures | undefined) ??
            features
          }
          totalRows={viewState.totalRowCount || viewState.rowCount}
          loading={viewState.loading || !viewState.ready}
          formatCell={formatCell}
          aggFnLabels={aggFnLabels}
          onColumnReorder={onColumnReorder}
          onColumnResize={onColumnResize}
          onHeaderContextMenu={onHeaderContextMenu}
          onRowClick={onRowClick}
          onRowDoubleClick={onRowDoubleClick}
          onSelectionChange={onSelectionChange}
        />
      </DataGrid>
    </div>
  );
}

function DataVisNitroGrid(props: DataVisNitroGridProps) {
  const computedView = useContext(DataVisNitroContext);

  if (computedView === null) {
    return null;
  }

  return <DataVisNitroGridInner {...props} computedView={computedView} />;
}

DataVisNitroSource.displayName = 'DataVisNitroSource';
DataVisNitroGrid.displayName = 'DataVisNitroGrid';

export { DataVisNitroGrid, DataVisNitroSource };
