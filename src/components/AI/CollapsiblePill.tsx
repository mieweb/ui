import * as React from 'react';
import { cn } from '../../utils/cn';
import { ChevronIcon } from './icons';

export interface CollapsiblePillProps {
  label: string;
  leadingIcon?: React.ReactNode;
  density?: 'standard' | 'condensed';
  defaultOpen?: boolean;
  pillClassName?: string;
  className?: string;
  /** Native tooltip shown on hover (e.g. "Show details") */
  title?: string;
  children?: React.ReactNode;
}

export function CollapsiblePill({
  label,
  leadingIcon,
  density = 'standard',
  defaultOpen = false,
  pillClassName,
  className,
  title,
  children,
}: CollapsiblePillProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);
  const contentId = React.useId();

  React.useEffect(() => {
    setIsOpen(defaultOpen);
  }, [defaultOpen]);

  const toggle = () => {
    setIsOpen((open) => !open);
  };

  return (
    <div data-slot="collapsible-pill" className={className}>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={isOpen}
        aria-controls={children ? contentId : undefined}
        title={title}
        className={cn(
          'focus-visible:ring-ring inline-flex items-center gap-1.5 border font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
          density === 'condensed'
            ? 'rounded-[8px] px-2 py-0.5 text-[10px]'
            : 'rounded-[10px] px-[11px] py-1 text-[11px]',
          pillClassName
        )}
      >
        {leadingIcon}
        <span>{label}</span>
        <ChevronIcon
          direction={isOpen ? 'down' : 'right'}
          className={
            density === 'condensed'
              ? 'h-2.5 w-2.5 opacity-60'
              : 'h-3 w-3 opacity-60'
          }
        />
      </button>
      {children && (
        <div
          id={contentId}
          aria-hidden={!isOpen}
          inert={!isOpen || undefined}
          className={cn(
            'overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out',
            isOpen
              ? 'max-h-[500px] overflow-y-auto opacity-100'
              : 'max-h-0 opacity-0'
          )}
        >
          <div className="mt-1.5">{children}</div>
        </div>
      )}
    </div>
  );
}
