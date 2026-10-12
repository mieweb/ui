import * as React from 'react';
import { cn } from '../../utils/cn';
import { Dropdown, DropdownItem } from '../Dropdown';
import { CheckIcon, ChevronUpIcon } from '../Icons';

/** An option in a composer selector-row menu (agent, voice, …). */
export interface ComposerSelectorOption {
  /** Stable id (returned via `onChange`). */
  id: string;
  /** Display label. */
  label: string;
  /** Optional leading icon (falls back to the selector's `icon` in the trigger). */
  icon?: React.ReactNode;
  /** Optional secondary text shown in the menu. */
  description?: string;
}

export interface ComposerSelectorProps {
  /** Options shown as `menuitemradio` items. */
  options: ComposerSelectorOption[];
  /** Selected option id. */
  value: string | null;
  /** Called with the chosen option id. */
  onChange?: (id: string) => void;
  /** Accessible name, and the trigger text while nothing is selected. */
  label: string;
  /** Fixed trigger text (e.g. a feature name); defaults to the selected option's label. */
  triggerLabel?: string;
  /** Trigger icon when the selected option has none. */
  icon?: React.ReactNode;
  disabled?: boolean;
  /** `data-slot` on the trigger button (styling and condensed-density hook). */
  triggerSlot?: string;
}

const selectorTriggerClasses = cn(
  'flex min-w-0 items-center gap-1 rounded-md px-2 py-1 text-xs',
  'text-neutral-600 dark:text-neutral-400',
  'transition-colors duration-150',
  'hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-700 dark:hover:text-white',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
  'disabled:pointer-events-none disabled:opacity-40'
);

/**
 * Quiet text-and-chevron menu for the row below `ChatComposer` (the agent
 * selector and host selectors passed through `selectorsEndSlot`).
 */
export function ComposerSelector({
  options,
  value,
  onChange,
  label,
  triggerLabel,
  icon,
  disabled = false,
  triggerSlot = 'composer-selector-trigger',
}: ComposerSelectorProps) {
  // Controlled: DropdownItem does not close its parent Dropdown on click.
  const [open, setOpen] = React.useState(false);
  // Disabling mid-open must also close the menu, or its items stay clickable.
  if (disabled && open) setOpen(false);
  const selected = options.find((option) => option.id === value) ?? null;

  return (
    <Dropdown
      placement="top-start"
      open={open && !disabled}
      onOpenChange={setOpen}
      disabled={disabled}
      trigger={
        <button
          type="button"
          data-slot={triggerSlot}
          aria-label={selected ? `${label}: ${selected.label}` : label}
          disabled={disabled}
          className={selectorTriggerClasses}
        >
          {selected?.icon ?? icon}
          <span className="min-w-0 truncate">
            {triggerLabel ?? selected?.label ?? label}
          </span>
          <ChevronUpIcon className="h-3 w-3 shrink-0" aria-hidden="true" />
        </button>
      }
    >
      {options.map((option) => (
        <DropdownItem
          key={option.id}
          icon={option.icon}
          role="menuitemradio"
          aria-checked={option.id === value}
          onClick={() => {
            setOpen(false);
            onChange?.(option.id);
          }}
        >
          <span className="flex w-full items-center justify-between gap-2">
            <span className="min-w-0">
              <span className="block truncate">{option.label}</span>
              {option.description && (
                <span className="block truncate text-xs text-neutral-500 dark:text-neutral-400">
                  {option.description}
                </span>
              )}
            </span>
            {option.id === value && (
              <CheckIcon
                className="text-primary-600 dark:text-primary-400 h-4 w-4 shrink-0"
                aria-hidden="true"
              />
            )}
          </span>
        </DropdownItem>
      ))}
    </Dropdown>
  );
}
