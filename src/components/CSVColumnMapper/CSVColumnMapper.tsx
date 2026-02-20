'use client';

import * as React from 'react';
import { cn } from '../../utils';
import { Button } from '../Button';
import { Select, type SelectOption } from '../Select';

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
        <div className="bg-foreground/50 fixed inset-0 z-50 flex items-center justify-center">
          <div className="bg-card text-card-foreground w-full max-w-lg rounded-lg shadow-xl">
            <div className="bg-primary text-primary-foreground p-4">
              <h4 className="text-lg font-semibold">Processing Employees</h4>
            </div>
            <div className="p-6">
              <div className="bg-muted h-4 w-full overflow-hidden rounded-full">
                <div
                  className="bg-success h-full transition-all duration-300"
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
        <Button
          variant="primary"
          size="sm"
          onClick={() => onBulkAction?.('ignoreAll')}
        >
          {ignoreAll}
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={() => onBulkAction?.('ignoreUncompleted')}
        >
          {ignoreUncompleted}
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={() => onBulkAction?.('includeAll')}
        >
          {includeAll}
        </Button>
      </div>

      {/* Info Alert */}
      <div className="bg-primary/10 border-primary/30 mb-4 rounded-lg border p-4">
        <h4 className="text-primary-800 dark:text-primary-200 mb-1 font-semibold">
          {ensureAccurateData}
        </h4>
        <p className="text-primary-800 dark:text-primary-300 text-sm">
          {ensureAccurateDataDescription}
        </p>
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
          />
        ))}
      </div>

      {/* Import Button */}
      <div className="mt-6 flex justify-end">
        <Button variant="primary" onClick={onImport} disabled={importing}>
          {importLabel}
        </Button>
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
}

function CSVColumnCard({
  column,
  index: _index,
  fieldOptions,
  childFieldOptions,
  onMappingChange,
  onIgnoreToggle,
  formatHtmlId,
}: CSVColumnCardProps) {
  const needsMapping = !column.ignored && !column.mappedTo;
  const hasError = column.hasError || needsMapping;

  // Convert fieldOptions to SelectOption format
  const selectOptions: SelectOption[] = fieldOptions.map((opt) => ({
    value: opt.value,
    label: opt.label,
    disabled: opt.disabled,
  }));

  // Convert childFieldOptions to SelectOption format
  const childSelectOptions: SelectOption[] | undefined = childFieldOptions?.map(
    (opt) => ({
      value: opt.value,
      label: opt.label,
      disabled: opt.disabled,
    })
  );

  const isMapped = !!column.mappedTo && !column.ignored;

  return (
    <div
      className={cn(
        'bg-card text-card-foreground rounded-xl border-2 shadow-sm',
        column.ignored
          ? 'border-border opacity-50'
          : isMapped
            ? 'border-success/30'
            : 'border-warning/30'
      )}
    >
      {/* Card Header */}
      <div className="flex items-center gap-2 px-4 py-3">
        {!column.ignored &&
          (isMapped ? (
            <span className="bg-success-700 text-success-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full">
              <svg
                className="h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </span>
          ) : (
            <span className="bg-warning-700 text-warning-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full">
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" fill="currentColor" />
                <circle cx="12" cy="12" r="4" className="fill-warning" />
              </svg>
            </span>
          ))}
        <h6 className="truncate text-sm font-semibold" title={column.name}>
          {column.name}
        </h6>
      </div>

      {/* Card Body */}
      <div className="space-y-4 px-4 pb-4">
        {/* Sample Value */}
        <div>
          <span className="text-muted-foreground mb-1 block text-xs font-semibold tracking-wider uppercase">
            Sample Data
          </span>
          <div
            className="bg-muted truncate rounded-md px-3 py-2 font-mono text-sm"
            title={column.sampleValue}
          >
            {column.sampleValue || (
              <em className="text-neutral-600 dark:text-neutral-300">Empty</em>
            )}
          </div>
        </div>

        {/* Field Type Select */}
        <div>
          <span className="text-muted-foreground mb-1 block text-xs font-semibold tracking-wider uppercase">
            Map to Field
          </span>
          <div
            className={cn(
              'rounded-md',
              hasError &&
                !column.ignored &&
                'ring-warning-700/50 dark:ring-warning-400/50 ring-2'
            )}
          >
            <Select
              id={formatHtmlId(column.name)}
              options={selectOptions}
              value={column.mappedTo || ''}
              onValueChange={(value) => onMappingChange(value, undefined)}
              disabled={column.ignored}
              placeholder="Select a field..."
              size="sm"
              hideLabel
              className={cn(
                hasError &&
                  !column.ignored &&
                  'border-warning-700 text-warning-700 placeholder:text-warning-700 dark:border-warning-400 dark:text-warning-400 dark:placeholder:text-warning-400'
              )}
            />
          </div>
        </div>

        {/* Child Field Select (for nested fields like phone.type) */}
        {childSelectOptions &&
          childSelectOptions.length > 0 &&
          column.mappedTo && (
            <div>
              <span className="text-muted-foreground mb-1 block text-xs font-semibold tracking-wider uppercase">
                Sub-field
              </span>
              <Select
                id={formatHtmlId(column.name, column.mappedTo)}
                options={childSelectOptions}
                value={column.childField || ''}
                onValueChange={(value) =>
                  onMappingChange(column.mappedTo!, value)
                }
                disabled={column.ignored}
                placeholder="Select sub-field..."
                size="sm"
                hideLabel
              />
            </div>
          )}

        {/* Ignore/Include Link */}
        <button
          type="button"
          onClick={() => onIgnoreToggle(!column.ignored)}
          className="text-muted-foreground hover:text-foreground mx-auto flex items-center gap-1 text-xs transition-colors"
        >
          {column.ignored ? (
            <svg
              className="h-3 w-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
          ) : (
            <svg
              className="h-3 w-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          )}
          {column.ignored ? 'Include Column' : 'Ignore Column'}
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
        isDragging ? 'border-primary bg-primary/5' : 'border-border bg-muted',
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
          <p className="mt-4 text-neutral-600 dark:text-neutral-300">
            Processing file...
          </p>
        </div>
      ) : (
        <>
          <i className="fas fa-file-csv mb-4 text-5xl text-neutral-600 dark:text-neutral-300" />
          <p className="mb-4 text-lg text-neutral-600 dark:text-neutral-300">
            {selectFile}
          </p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-6 py-3"
          >
            {selectButton}
          </button>
        </>
      )}
    </div>
  );
}

export default CSVColumnMapper;
