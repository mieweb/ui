'use client';

import * as React from 'react';
import { cn } from '../../utils';

export interface CSVColumn {
  /** Original column name from CSV */
  name: string;
  /** Sample value from the first data row */
  sampleValue?: string;
  /** Mapped field type (e.g., 'firstName', 'email', 'phone.mobile') */
  mappedTo?: string;
  /** Child field for nested types (e.g., 'type' for phone) */
  childField?: string;
  /** Whether this column should be ignored */
  ignored?: boolean;
  /** Whether mapping is required but missing */
  hasError?: boolean;
}

export interface FieldOption {
  /** Field value (e.g., 'firstName', 'phone') */
  value: string;
  /** Display text */
  label: string;
  /** Whether this field is already mapped to another column */
  disabled?: boolean;
  /** Whether this field has child options */
  hasChildren?: boolean;
}

export interface CSVColumnMapperProps {
  /** Parsed CSV columns with sample data */
  columns: CSVColumn[];
  /** Available field options for mapping */
  fieldOptions: FieldOption[];
  /** Child field options by parent field */
  childFieldOptions?: Record<string, FieldOption[]>;
  /** Callback when column mapping changes */
  onColumnChange?: (
    columnIndex: number,
    mappedTo: string,
    childField?: string
  ) => void;
  /** Callback when column is ignored/included */
  onIgnoreToggle?: (columnIndex: number, ignored: boolean) => void;
  /** Callback for bulk actions */
  onBulkAction?: (
    action: 'ignoreAll' | 'includeAll' | 'ignoreUncompleted'
  ) => void;
  /** Callback when import is triggered */
  onImport?: () => void;
  /** Whether import is in progress */
  importing?: boolean;
  /** Import progress (0-100) */
  importProgress?: number;
  /** Custom class name */
  className?: string;
  /** Labels */
  labels?: {
    ignoreAll?: string;
    includeAll?: string;
    ignoreUncompleted?: string;
    import?: string;
    ignore?: string;
    include?: string;
    incomingSample?: string;
    fieldType?: string;
    ensureAccurateData?: string;
    ensureAccurateDataDescription?: string;
    instructions?: string;
  };
}

export function CSVColumnMapper({
  columns,
  fieldOptions,
  childFieldOptions = {},
  onColumnChange,
  onIgnoreToggle,
  onBulkAction,
  onImport,
  importing = false,
  importProgress = 0,
  className,
  labels = {},
}: CSVColumnMapperProps) {
  const {
    ignoreAll = 'Ignore All',
    includeAll = 'Include All',
    ignoreUncompleted = 'Ignore Uncompleted',
    import: importLabel = 'Import',
    ignore = 'Ignore',
    include = 'Include',
    incomingSample = 'Incoming Sample',
    fieldType = 'Field Type',
    ensureAccurateData = 'Ensure Accurate Employee Data',
    ensureAccurateDataDescription = 'Existing employee profiles will be automatically updated.',
    instructions = 'Map each column from your CSV to the corresponding employee field.',
  } = labels;

  const formatHtmlId = (name: string, ...parts: string[]) => {
    return [name, ...parts]
      .join('-')
      .replace(/[^a-zA-Z0-9-]/g, '-')
      .toLowerCase();
  };

  return (
    <div className={cn('csv-column-mapper', className)}>
      {/* Import Progress Modal */}
      {importing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
            <div className="bg-primary p-4 text-white">
              <h4 className="text-lg font-semibold">Processing Employees</h4>
            </div>
            <div className="p-6">
              <div className="h-4 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full bg-green-500 transition-all duration-300"
                  style={{ width: `${importProgress}%` }}
                />
              </div>
              <p className="text-muted-foreground mt-2 text-center text-sm">
                {importProgress}% complete
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onBulkAction?.('ignoreAll')}
          className="bg-primary hover:bg-primary/90 rounded-lg px-4 py-2 text-white"
        >
          {ignoreAll}
        </button>
        <button
          type="button"
          onClick={() => onBulkAction?.('ignoreUncompleted')}
          className="bg-primary hover:bg-primary/90 rounded-lg px-4 py-2 text-white"
        >
          {ignoreUncompleted}
        </button>
        <button
          type="button"
          onClick={() => onBulkAction?.('includeAll')}
          className="bg-primary hover:bg-primary/90 rounded-lg px-4 py-2 text-white"
        >
          {includeAll}
        </button>
      </div>

      {/* Info Alert */}
      <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <h4 className="mb-1 font-semibold text-blue-800">
          {ensureAccurateData}
        </h4>
        <p className="text-sm text-blue-700">{ensureAccurateDataDescription}</p>
      </div>

      <p className="text-muted-foreground mb-4">{instructions}</p>

      {/* Column Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {columns.map((column, index) => (
          <CSVColumnCard
            key={column.name}
            column={column}
            index={index}
            fieldOptions={fieldOptions}
            childFieldOptions={
              column.mappedTo ? childFieldOptions[column.mappedTo] : undefined
            }
            onMappingChange={(mappedTo, childField) =>
              onColumnChange?.(index, mappedTo, childField)
            }
            onIgnoreToggle={(ignored) => onIgnoreToggle?.(index, ignored)}
            formatHtmlId={formatHtmlId}
            labels={{ ignore, include, incomingSample, fieldType }}
          />
        ))}
      </div>

      {/* Import Button */}
      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={onImport}
          disabled={importing}
          className="rounded-lg bg-green-600 px-6 py-2 text-white hover:bg-green-700 disabled:bg-gray-300"
        >
          {importLabel}
        </button>
      </div>
    </div>
  );
}

interface CSVColumnCardProps {
  column: CSVColumn;
  index: number;
  fieldOptions: FieldOption[];
  childFieldOptions?: FieldOption[];
  onMappingChange: (mappedTo: string, childField?: string) => void;
  onIgnoreToggle: (ignored: boolean) => void;
  formatHtmlId: (name: string, ...parts: string[]) => string;
  labels: {
    ignore: string;
    include: string;
    incomingSample: string;
    fieldType: string;
  };
}

function CSVColumnCard({
  column,
  index: _index,
  fieldOptions,
  childFieldOptions,
  onMappingChange,
  onIgnoreToggle,
  formatHtmlId,
  labels,
}: CSVColumnCardProps) {
  const needsMapping = !column.ignored && !column.mappedTo;
  const hasError = column.hasError || needsMapping;

  return (
    <div
      className={cn(
        'rounded-lg border bg-white shadow-sm',
        column.ignored && 'opacity-50',
        hasError && !column.ignored && 'border-red-500'
      )}
    >
      {/* Card Header */}
      <div className="border-b bg-gray-50 p-3">
        <h6
          className="truncate text-center text-sm font-medium"
          title={column.name}
        >
          {column.name}
        </h6>
      </div>

      {/* Card Body */}
      <div className="p-4">
        {/* Sample Value */}
        <div className="mb-3">
          <span className="text-muted-foreground text-xs">
            {labels.incomingSample}
          </span>
          <div className="truncate text-sm" title={column.sampleValue}>
            {column.sampleValue || (
              <em className="text-muted-foreground">Empty</em>
            )}
          </div>
        </div>

        <hr className="my-3" />

        {/* Field Type Select */}
        <div className="mb-3">
          <label htmlFor={formatHtmlId(column.name)} className="sr-only">
            {labels.fieldType}
          </label>
          <select
            id={formatHtmlId(column.name)}
            value={column.mappedTo || ''}
            onChange={(e) => onMappingChange(e.target.value, undefined)}
            disabled={column.ignored}
            className={cn(
              'w-full rounded-lg border p-2 text-sm',
              column.ignored && 'cursor-not-allowed bg-gray-100'
            )}
          >
            <option value="" disabled>
              Select field...
            </option>
            {fieldOptions.map((opt) => (
              <option
                key={opt.value}
                value={opt.value}
                disabled={opt.disabled}
                className={opt.disabled ? 'text-red-500' : ''}
              >
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Child Field Select (for nested fields like phone.type) */}
        {childFieldOptions &&
          childFieldOptions.length > 0 &&
          column.mappedTo && (
            <div className="mb-3">
              <label
                htmlFor={formatHtmlId(column.name, column.mappedTo)}
                className="sr-only"
              >
                Sub-field
              </label>
              <select
                id={formatHtmlId(column.name, column.mappedTo)}
                value={column.childField || ''}
                onChange={(e) =>
                  onMappingChange(column.mappedTo!, e.target.value)
                }
                disabled={column.ignored}
                className={cn(
                  'w-full rounded-lg border p-2 text-sm',
                  column.ignored && 'cursor-not-allowed bg-gray-100'
                )}
              >
                <option value="" disabled>
                  Select sub-field...
                </option>
                {childFieldOptions.map((opt) => (
                  <option
                    key={opt.value}
                    value={opt.value}
                    disabled={opt.disabled}
                    className={opt.disabled ? 'text-red-500' : ''}
                  >
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}
      </div>

      {/* Card Footer */}
      <div className="border-t bg-gray-50 p-3 text-center">
        <button
          type="button"
          onClick={() => onIgnoreToggle(!column.ignored)}
          className={cn(
            'w-full rounded-lg px-4 py-2 text-sm font-medium',
            column.ignored
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-primary hover:bg-primary/90 text-white'
          )}
        >
          {column.ignored ? labels.include : labels.ignore}
        </button>
      </div>
    </div>
  );
}

/* File Upload Component */

export interface CSVFileUploadProps {
  /** Callback when file is selected */
  onFileSelect?: (file: File) => void;
  /** Whether file is being processed */
  processing?: boolean;
  /** Accepted file types */
  accept?: string;
  /** Custom class name */
  className?: string;
  /** Labels */
  labels?: {
    selectFile?: string;
    dragAndDrop?: string;
    selectButton?: string;
  };
}

export function CSVFileUpload({
  onFileSelect,
  processing = false,
  accept = '.csv',
  className,
  labels = {},
}: CSVFileUploadProps) {
  const {
    selectFile = 'Select a file to upload or drag and drop',
    selectButton = 'Select File to Upload',
  } = labels;

  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  const handleDrop = React.useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && file.name.endsWith('.csv')) {
        onFileSelect?.(file);
      }
    },
    [onFileSelect]
  );

  const handleDragOver = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = React.useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onFileSelect?.(file);
      }
    },
    [onFileSelect]
  );

  return (
    <div
      className={cn(
        'flex min-h-[300px] flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-colors',
        isDragging
          ? 'border-primary bg-primary/5'
          : 'border-gray-300 bg-gray-50',
        className
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
        id="csv-file-upload"
      />

      {processing ? (
        <div className="flex flex-col items-center">
          <div className="border-primary h-12 w-12 animate-spin rounded-full border-4 border-t-transparent" />
          <p className="text-muted-foreground mt-4">Processing file...</p>
        </div>
      ) : (
        <>
          <i className="fas fa-file-csv mb-4 text-5xl text-gray-400" />
          <p className="text-muted-foreground mb-4 text-lg">{selectFile}</p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="bg-primary hover:bg-primary/90 rounded-lg px-6 py-3 text-white"
          >
            {selectButton}
          </button>
        </>
      )}
    </div>
  );
}

export default CSVColumnMapper;
