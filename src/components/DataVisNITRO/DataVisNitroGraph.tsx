import React, { useCallback, useContext, useMemo, useState } from 'react';

import {
  GraphView,
  determineColumns,
  useView,
  type GraphConfig,
  type TableColumn,
  type ViewInstance,
} from '@mieweb/datavis';

import { DataVisNitroContext } from './DataVisNITRO';
import type { DataVisNitroColumn } from './DataVisNITRO';

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

export interface DataVisNitroGraphProps {
  /** Column definitions or field names to include in the graph. */
  columns?: DataVisNitroColumn[];
  /** Initial graph configuration (chart type, axes, etc.). */
  config?: Partial<GraphConfig>;
  /** Locale for formatting. */
  locale?: string;
  /** Additional CSS class name. */
  className?: string;
  /** CSS height for the container. */
  height?: string;
  /** Callback when the user changes graph configuration. */
  onConfigChange?: (config: GraphConfig) => void;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function normalizeTypeInfo(typeInfo: unknown): DataVisTypeInfoMap {
  if (Array.isArray(typeInfo)) {
    return Object.fromEntries(
      typeInfo.filter(isObject).map((entry) => [entry.field, entry])
    ) as DataVisTypeInfoMap;
  }

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
      return column;
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

function DataVisNitroGraphInner({
  computedView,
  columns,
  config: initialConfig,
  locale,
  className,
  height,
  onConfigChange,
}: DataVisNitroGraphProps & { computedView: ViewInstance }) {
  const viewState = useView(computedView);
  const [liveConfig, setLiveConfig] = useState<Partial<GraphConfig> | undefined>(initialConfig);

  const handleConfigChange = useCallback(
    (newConfig: GraphConfig) => {
      setLiveConfig(newConfig);
      onConfigChange?.(newConfig);
    },
    [onConfigChange]
  );

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

  const resolvedColumns = useMemo(
    () => buildResolvedColumns(columns, fallbackFields, normalizedTypeInfo),
    [columns, fallbackFields, normalizedTypeInfo]
  );

  return (
    <div style={height ? { height } : undefined}>
      <GraphView
        viewData={viewState.data}
        columns={resolvedColumns}
        config={liveConfig}
        locale={locale}
        className={className}
        onConfigChange={handleConfigChange}
      />
    </div>
  );
}

function DataVisNitroGraph(props: DataVisNitroGraphProps) {
  const computedView = useContext(DataVisNitroContext);

  if (computedView === null) {
    return null;
  }

  return <DataVisNitroGraphInner {...props} computedView={computedView} />;
}

DataVisNitroGraph.displayName = 'DataVisNitroGraph';

export { DataVisNitroGraph };
