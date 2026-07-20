import * as React from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useEscapeKey } from '../../hooks/useEscapeKey';

export type ProviderModelValue = {
  provider: string;
  model: string;
};

export type ProviderModelOption = ProviderModelValue & {
  label?: string;
  providerLabel?: string;
  id?: string;
};

export interface ComposerModelSelectorProps {
  models: ProviderModelOption[];
  value: ProviderModelValue | null;
  providerFilter?: string | 'any';
  onProviderFilterChange?: (provider: string | 'any') => void;
  onChange: (value: ProviderModelValue) => void;
  disabled?: boolean;
  className?: string;
  boundaryRef?: React.RefObject<HTMLElement | null>;
  placeholder?: string;
}

type MenuStyle = React.CSSProperties & {
  '--composer-model-list-max-height'?: string;
};

function optionKey(option: ProviderModelValue) {
  return `${option.provider}\u0000${option.model}`;
}

function groupByProvider(models: ProviderModelOption[]) {
  const groups = new Map<string, ProviderModelOption[]>();

  for (const model of models) {
    const group = groups.get(model.provider);
    if (group) {
      group.push(model);
    } else {
      groups.set(model.provider, [model]);
    }
  }

  return Array.from(groups, ([provider, options]) => ({ provider, options }));
}

function getProviderLabel(models: ProviderModelOption[], provider: string) {
  return (
    models.find((model) => model.provider === provider)?.providerLabel ??
    provider
  );
}

export function ComposerModelSelector({
  models,
  value,
  providerFilter,
  onProviderFilterChange,
  onChange,
  disabled = false,
  className,
  boundaryRef,
  placeholder = 'Model',
}: ComposerModelSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [internalProviderFilter, setInternalProviderFilter] =
    React.useState<string>('any');
  const [highlightedIndex, setHighlightedIndex] = React.useState(0);
  const [menuStyle, setMenuStyle] = React.useState<MenuStyle>({});

  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  const menuId = React.useId();

  const activeProviderFilter = providerFilter ?? internalProviderFilter;
  const selectedKey = value ? optionKey(value) : null;
  const selectedOption = models.find(
    (model) => optionKey(model) === selectedKey
  );
  const providers = React.useMemo(
    () => Array.from(new Set(models.map((model) => model.provider))),
    [models]
  );
  const providerLabels = React.useMemo(
    () =>
      new Map(
        providers.map((provider) => [
          provider,
          getProviderLabel(models, provider),
        ])
      ),
    [models, providers]
  );
  const filteredModels = React.useMemo(
    () =>
      activeProviderFilter === 'any'
        ? models
        : models.filter((model) => model.provider === activeProviderFilter),
    [activeProviderFilter, models]
  );
  const groupedModels = React.useMemo(
    () => groupByProvider(filteredModels),
    [filteredModels]
  );

  const setProvider = React.useCallback(
    (provider: string | 'any') => {
      if (providerFilter === undefined) {
        setInternalProviderFilter(provider);
      }
      onProviderFilterChange?.(provider);
      setHighlightedIndex(0);
    },
    [onProviderFilterChange, providerFilter]
  );

  const close = React.useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus({ preventScroll: true });
  }, []);

  const selectModel = React.useCallback(
    (model: ProviderModelOption) => {
      onChange({ provider: model.provider, model: model.model });
      close();
    },
    [close, onChange]
  );

  const updateMenuPosition = React.useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const boundary = boundaryRef?.current?.getBoundingClientRect() ?? {
      top: 0,
      right: window.innerWidth,
      bottom: window.innerHeight,
      left: 0,
      width: window.innerWidth,
      height: window.innerHeight,
    };
    const gap = 6;
    const menuWidth = Math.min(320, Math.max(248, boundary.width - 16));
    const spaceAbove = rect.top - boundary.top - gap;
    const spaceBelow = boundary.bottom - rect.bottom - gap;
    const openAbove = spaceBelow < 260 && spaceAbove > spaceBelow;
    const availableHeight = Math.max(openAbove ? spaceAbove : spaceBelow, 120);
    const listMaxHeight = Math.max(Math.min(availableHeight - 49, 272), 72);
    const left = Math.min(
      Math.max(rect.left, boundary.left + 8),
      boundary.right - menuWidth - 8
    );

    setMenuStyle({
      position: 'fixed',
      left,
      width: menuWidth,
      ...(openAbove
        ? { bottom: window.innerHeight - rect.top + gap }
        : { top: rect.bottom + gap }),
      '--composer-model-list-max-height': `${listMaxHeight}px`,
      zIndex: 9999,
    });
  }, [boundaryRef]);

  React.useEffect(() => {
    if (!open) return;

    updateMenuPosition();
    window.addEventListener('resize', updateMenuPosition);
    window.addEventListener('scroll', updateMenuPosition, true);
    return () => {
      window.removeEventListener('resize', updateMenuPosition);
      window.removeEventListener('scroll', updateMenuPosition, true);
    };
  }, [open, updateMenuPosition]);

  React.useEffect(() => {
    if (!open) return;

    const handlePointerDown = (
      event: globalThis.MouseEvent | globalThis.TouchEvent
    ) => {
      const target = event.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [open]);

  useEscapeKey(close, open);

  React.useEffect(() => {
    if (!open) return;
    setHighlightedIndex(0);
  }, [activeProviderFilter, open]);

  React.useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() =>
      listRef.current?.focus({ preventScroll: true })
    );
  }, [open]);

  const handleTriggerKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setOpen(true);
    }
  };

  const handleMenuKeyDown = (event: React.KeyboardEvent) => {
    if (filteredModels.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightedIndex((current) => (current + 1) % filteredModels.length);
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightedIndex(
        (current) =>
          (current - 1 + filteredModels.length) % filteredModels.length
      );
    }
    if (event.key === 'Home') {
      event.preventDefault();
      setHighlightedIndex(0);
    }
    if (event.key === 'End') {
      event.preventDefault();
      setHighlightedIndex(filteredModels.length - 1);
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      selectModel(filteredModels[highlightedIndex]);
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={handleTriggerKeyDown}
        data-slot="composer-model-selector-trigger"
        className={cn(
          'inline-flex h-8 max-w-full items-center gap-1.5 rounded-full border px-2.5 text-sm font-medium',
          'border-border bg-background text-foreground shadow-sm',
          'hover:bg-muted/50',
          'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
      >
        <span className="max-w-40 min-w-0 truncate">
          {selectedOption?.label ?? selectedOption?.model ?? placeholder}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            'h-3.5 w-3.5 shrink-0 transition-transform',
            open && 'rotate-180'
          )}
        />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            style={menuStyle}
            data-slot="composer-model-selector-menu"
            className={cn(
              'border-border bg-card text-card-foreground rounded-lg border shadow-lg',
              'animate-in fade-in zoom-in-95 overflow-hidden duration-100'
            )}
          >
            <div
              data-slot="composer-model-selector-provider-filter"
              className="border-border flex gap-1 overflow-x-auto border-b p-2"
            >
              {['any', ...providers].map((provider) => {
                const selected = activeProviderFilter === provider;
                return (
                  <button
                    key={provider}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setProvider(provider)}
                    className={cn(
                      'shrink-0 rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
                      'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
                      selected
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    {provider === 'any'
                      ? 'Any'
                      : (providerLabels.get(provider) ?? provider)}
                  </button>
                );
              })}
            </div>

            <div
              ref={listRef}
              id={menuId}
              role="listbox"
              aria-label="Model"
              tabIndex={-1}
              onKeyDown={handleMenuKeyDown}
              className="max-h-[var(--composer-model-list-max-height)] overflow-y-auto p-1"
            >
              {groupedModels.length === 0 ? (
                <div className="text-muted-foreground px-3 py-4 text-center text-sm">
                  No models
                </div>
              ) : (
                groupedModels.map((group) => (
                  <div
                    key={group.provider}
                    role="group"
                    aria-label={
                      providerLabels.get(group.provider) ?? group.provider
                    }
                  >
                    <div className="text-muted-foreground px-3 py-1.5 text-xs font-semibold uppercase">
                      {providerLabels.get(group.provider) ?? group.provider}
                    </div>
                    {group.options.map((model) => {
                      const index = filteredModels.findIndex(
                        (item) => optionKey(item) === optionKey(model)
                      );
                      const selected = optionKey(model) === selectedKey;
                      const highlighted = index === highlightedIndex;

                      return (
                        <button
                          key={model.id ?? optionKey(model)}
                          type="button"
                          role="option"
                          aria-selected={selected}
                          onClick={() => selectModel(model)}
                          onMouseEnter={() => setHighlightedIndex(index)}
                          className={cn(
                            'flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm',
                            'focus-visible:ring-ring transition-colors focus-visible:ring-2 focus-visible:outline-none',
                            highlighted && 'bg-muted',
                            selected && 'bg-primary/10 text-primary'
                          )}
                        >
                          <span className="min-w-0 flex-1 truncate">
                            {model.label ?? model.model}
                          </span>
                          {selected && (
                            <Check
                              aria-hidden="true"
                              className="text-primary h-4 w-4 shrink-0"
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

ComposerModelSelector.displayName = 'ComposerModelSelector';
