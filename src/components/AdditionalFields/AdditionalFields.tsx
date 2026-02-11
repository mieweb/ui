import * as React from 'react';
import { cn } from '../../utils/cn';
import { Button } from '../Button';
import { ChevronDownIcon, PlusIcon, TrashIcon } from '../Icons';
import { Input } from '../Input';

// =============================================================================
// Types
// =============================================================================

export interface KeyValueEntry {
  id: string;
  name: string;
  value: string;
}

export interface AdditionalFieldsProps {
  /** Array of key-value entries */
  value: KeyValueEntry[];
  /** Callback when entries change */
  onChange: (entries: KeyValueEntry[]) => void;
  /** Title for the collapsible section */
  title?: string;
  /** Whether the section is initially expanded */
  defaultExpanded?: boolean;
  /** Whether the fields are disabled */
  disabled?: boolean;
  /** Placeholder for the field name input */
  namePlaceholder?: string;
  /** Placeholder for the field value input */
  valuePlaceholder?: string;
  /** Label for the add button */
  addButtonLabel?: string;
  /** Maximum number of entries allowed */
  maxEntries?: number;
  /** Custom className */
  className?: string;
  /** Whether to show as collapsible (default: true) */
  collapsible?: boolean;
}

/**
 * Generate a unique ID for new entries
 */
function generateId(): string {
  return `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * A collapsible section for adding custom key-value pairs.
 * Useful for additional/custom fields that don't fit into structured forms.
 *
 * @example
 * ```tsx
 * const [fields, setFields] = useState<KeyValueEntry[]>([]);
 *
 * <AdditionalFields
 *   title="Additional Information (Optional)"
 *   value={fields}
 *   onChange={setFields}
 * />
 * ```
 */
function AdditionalFields({
  value,
  onChange,
  title = 'Additional Information (Optional)',
  defaultExpanded = false,
  disabled = false,
  namePlaceholder = 'Field Name',
  valuePlaceholder = 'Field Value',
  addButtonLabel = 'Add Additional Information',
  maxEntries = 20,
  className,
  collapsible = true,
}: AdditionalFieldsProps) {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);
  const contentId = React.useId();

  const handleNameChange = (id: string, name: string) => {
    const updated = value.map((entry) =>
      entry.id === id ? { ...entry, name } : entry
    );
    onChange(updated);
  };

  const handleValueChange = (id: string, newValue: string) => {
    const updated = value.map((entry) =>
      entry.id === id ? { ...entry, value: newValue } : entry
    );
    onChange(updated);
  };

  const handleRemove = (id: string) => {
    onChange(value.filter((entry) => entry.id !== id));
  };

  const handleAdd = () => {
    if (value.length < maxEntries) {
      onChange([
        ...value,
        {
          id: generateId(),
          name: '',
          value: '',
        },
      ]);
      // Auto-expand when adding first entry
      if (!isExpanded) {
        setIsExpanded(true);
      }
    }
  };

  const canAdd = value.length < maxEntries;

  const content = (
    <>
      {/* Existing entries */}
      {value.map((entry) => (
        <div key={entry.id} className="mb-3 flex items-center gap-2">
          {/* Field name */}
          <div className="min-w-0 flex-1">
            <Input
              value={entry.name}
              onChange={(e) => handleNameChange(entry.id, e.target.value)}
              placeholder={namePlaceholder}
              disabled={disabled}
              label="Field name"
              hideLabel
            />
          </div>

          {/* Field value */}
          <div className="min-w-0 flex-1">
            <Input
              value={entry.value}
              onChange={(e) => handleValueChange(entry.id, e.target.value)}
              placeholder={valuePlaceholder}
              disabled={disabled}
              label="Field value"
              hideLabel
            />
          </div>

          {/* Remove button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => handleRemove(entry.id)}
            disabled={disabled}
            aria-label="Remove field"
            className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300"
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
        </div>
      ))}

      {/* Add button */}
      <Button
        type="button"
        variant="ghost"
        onClick={handleAdd}
        disabled={disabled || !canAdd}
        leftIcon={<PlusIcon className="h-4 w-4" />}
        className="text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-900/20"
      >
        {addButtonLabel}
      </Button>
    </>
  );

  if (!collapsible) {
    return (
      <div className={cn('space-y-3', className)}>
        {title && (
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {title}
          </h3>
        )}
        {content}
      </div>
    );
  }

  return (
    <div className={cn('', className)}>
      {/* Collapsible header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'flex w-full items-center gap-2 text-left text-sm font-medium',
          'text-gray-700 hover:text-gray-900',
          'dark:text-gray-300 dark:hover:text-gray-100',
          'transition-colors'
        )}
        aria-expanded={isExpanded}
        aria-controls={contentId}
      >
        <span>{title}</span>
        <ChevronDownIcon
          className={cn(
            'h-4 w-4 transition-transform duration-200',
            isExpanded ? 'rotate-180' : ''
          )}
        />
        {value.length > 0 && (
          <span className="bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 ml-1 rounded-full px-2 py-0.5 text-xs">
            {value.length}
          </span>
        )}
      </button>

      {/* Collapsible content */}
      <div
        id={contentId}
        className={cn(
          'transition-all duration-200',
          isExpanded ? 'mt-4 opacity-100' : 'max-h-0 overflow-hidden opacity-0'
        )}
        hidden={!isExpanded}
      >
        {content}
      </div>
    </div>
  );
}

AdditionalFields.displayName = 'AdditionalFields';

export { AdditionalFields, generateId };
