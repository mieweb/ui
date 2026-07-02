import * as React from 'react';
import { cn } from '../../utils/cn';
import { useClickOutside } from '../../hooks/useClickOutside';
import { useEscapeKey } from '../../hooks/useEscapeKey';

// ============================================================================
// Types
// ============================================================================

export interface PillSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface PillSelectProps {
  options: PillSelectOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function PillSelect({
  options,
  value: controlledValue,
  defaultValue,
  onValueChange,
  label,
  disabled = false,
  className,
}: PillSelectProps) {
  const [internalValue, setInternalValue] = React.useState(
    defaultValue ?? options[0]?.value ?? ''
  );
  const [expanded, setExpanded] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  const value = controlledValue !== undefined ? controlledValue : internalValue;
  const selectedOption = options.find((o) => o.value === value);

  useClickOutside(ref, () => setExpanded(false), expanded);
  useEscapeKey(() => setExpanded(false), expanded);

  function handleSelect(option: PillSelectOption) {
    if (option.disabled) return;
    if (controlledValue === undefined) setInternalValue(option.value);
    onValueChange?.(option.value);
    setExpanded(false);
  }

  const hasOptions = options.length > 0;
  const valuePart = selectedOption?.label ?? value;
  const collapsedLabel =
    label && valuePart ? `${label}: ${valuePart}` : label || valuePart;

  return (
    <div ref={ref} className={cn('inline-flex', className)}>
      {expanded ? (
        <div
          role="group"
          aria-label={label}
          className="border-border bg-muted inline-flex items-center rounded-full border p-0.5"
        >
          {options.map((option) => {
            const selected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                disabled={option.disabled}
                onClick={() => handleSelect(option)}
                aria-pressed={selected}
                className={cn(
                  'focus-visible:ring-ring rounded-full px-3 py-0.5 text-sm transition-colors focus:outline-none focus-visible:ring-2',
                  selected
                    ? 'bg-background text-foreground font-semibold shadow-sm'
                    : 'text-muted-foreground hover:text-foreground font-normal',
                  option.disabled && 'cursor-not-allowed opacity-40'
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled || !hasOptions}
          onClick={() => setExpanded(true)}
          className={cn(
            'border-border bg-muted text-foreground inline-flex items-center rounded-full border px-3 py-0.5 text-sm transition-colors',
            'hover:bg-muted/80 focus-visible:ring-ring focus:outline-none focus-visible:ring-2',
            (disabled || !hasOptions) && 'cursor-not-allowed opacity-50'
          )}
        >
          {collapsedLabel}
        </button>
      )}
    </div>
  );
}
