import * as React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils/cn';
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
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const selectedOptionRef = React.useRef<HTMLButtonElement>(null);
  const firstEnabledOptionRef = React.useRef<HTMLButtonElement>(null);
  const listboxId = React.useId();
  const [menuStyle, setMenuStyle] = React.useState<React.CSSProperties>({});

  const value = controlledValue !== undefined ? controlledValue : internalValue;
  const selectedOption = options.find((o) => o.value === value);
  const close = React.useCallback((restoreFocus = false) => {
    setExpanded(false);
    if (restoreFocus) {
      requestAnimationFrame(() =>
        triggerRef.current?.focus({ preventScroll: true })
      );
    }
  }, []);

  const updateMenuPosition = React.useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const viewportPadding = 8;
    const menuWidth = Math.max(rect.width, 160);
    const maxWidth = Math.max(window.innerWidth - viewportPadding * 2, 0);
    const left = Math.min(
      Math.max(rect.left, viewportPadding),
      window.innerWidth - menuWidth - viewportPadding
    );

    setMenuStyle({
      position: 'fixed',
      top: rect.bottom + 4,
      left,
      minWidth: rect.width,
      width: menuWidth,
      maxWidth,
      zIndex: 9999,
    });
  }, []);

  React.useEffect(() => {
    if (!expanded) return;

    updateMenuPosition();
    window.addEventListener('scroll', updateMenuPosition, true);
    window.addEventListener('resize', updateMenuPosition);

    return () => {
      window.removeEventListener('scroll', updateMenuPosition, true);
      window.removeEventListener('resize', updateMenuPosition);
    };
  }, [expanded, updateMenuPosition]);

  React.useEffect(() => {
    if (!expanded) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }

      close();
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [close, expanded]);

  React.useEffect(() => {
    if (!expanded) return;

    requestAnimationFrame(() => {
      (selectedOptionRef.current ?? firstEnabledOptionRef.current)?.focus({
        preventScroll: true,
      });
    });
  }, [expanded, value]);

  useEscapeKey(() => close(true), expanded);

  function handleSelect(option: PillSelectOption) {
    if (disabled || option.disabled) return;
    if (controlledValue === undefined) setInternalValue(option.value);
    onValueChange?.(option.value);
    close(true);
  }

  const hasOptions = options.length > 0;
  const valuePart = selectedOption?.label ?? value;
  const collapsedLabel =
    label && valuePart
      ? `${label}: ${valuePart}`
      : label || valuePart || 'No options';
  let firstEnabledOptionRefAssigned = false;

  return (
    <div className={cn('inline-flex', className)}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled || !hasOptions}
        onClick={() => setExpanded((open) => !open)}
        aria-haspopup="listbox"
        aria-expanded={expanded}
        aria-controls={expanded ? listboxId : undefined}
        className={cn(
          'border-border bg-muted text-foreground inline-flex items-center rounded-full border px-3 py-0.5 text-sm transition-colors',
          'hover:bg-muted/80 focus-visible:ring-ring focus:outline-none focus-visible:ring-2',
          (disabled || !hasOptions) && 'cursor-not-allowed opacity-50'
        )}
      >
        {collapsedLabel}
      </button>

      {expanded &&
        createPortal(
          <div
            ref={menuRef}
            id={listboxId}
            role="listbox"
            aria-label={label ? `${label} options` : 'Options'}
            style={menuStyle}
            className="border-border bg-card animate-in fade-in zoom-in-95 flex flex-col rounded-lg border p-1 shadow-lg duration-100"
          >
            {options.map((option) => {
              const selected = option.value === value;
              const optionDisabled = disabled || option.disabled;
              const isFirstEnabled =
                !optionDisabled && !firstEnabledOptionRefAssigned;
              if (isFirstEnabled) firstEnabledOptionRefAssigned = true;

              return (
                <button
                  key={option.value}
                  ref={
                    selected && !optionDisabled
                      ? selectedOptionRef
                      : isFirstEnabled
                        ? firstEnabledOptionRef
                        : undefined
                  }
                  type="button"
                  role="option"
                  disabled={optionDisabled}
                  onClick={() => handleSelect(option)}
                  aria-selected={selected}
                  className={cn(
                    'focus-visible:ring-ring flex w-full items-center rounded-md px-3 py-1.5 text-left text-sm transition-colors focus:outline-none focus-visible:ring-2',
                    selected
                      ? 'bg-muted text-foreground font-semibold'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground font-normal',
                    optionDisabled && 'cursor-not-allowed opacity-40'
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </div>
  );
}
