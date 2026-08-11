import * as React from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronUp } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAnchoredPosition } from '../../hooks/useAnchoredPosition';
import { useClickOutside } from '../../hooks/useClickOutside';
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

type ComposerModelSelectorBaseProps = {
  models: ProviderModelOption[];
  value: ProviderModelValue | null;
  onChange: (value: ProviderModelValue) => void;
  disabled?: boolean;
  className?: string;
  boundaryRef?: React.RefObject<HTMLElement | null>;
  placeholder?: string;
  anyLabel?: string;
  emptyLabel?: string;
  ariaLabel?: string;
};

type ControlledProviderFilterProps = {
  providerFilter: string | null;
  onProviderFilterChange: (provider: string | null) => void;
};

type UncontrolledProviderFilterProps = {
  providerFilter?: undefined;
  onProviderFilterChange?: (provider: string | null) => void;
};

export type ComposerModelSelectorProps = ComposerModelSelectorBaseProps &
  (ControlledProviderFilterProps | UncontrolledProviderFilterProps);

const MENU_OFFSET_PX = 6;
const MENU_MAX_HEIGHT_PX = 320;

function optionKey(option: ProviderModelValue) {
  return `${option.provider}\u0000${option.model}`;
}

function renderedOptionKey(option: ProviderModelOption, index: number) {
  return `${option.id ?? optionKey(option)}\u0000${index}`;
}

type RenderedModelOption = {
  option: ProviderModelOption;
  index: number;
  key: string;
};

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
    models.find((model) => model.provider === provider && model.providerLabel)
      ?.providerLabel ?? provider
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
  anyLabel = 'Any',
  emptyLabel = 'No models',
  ariaLabel = 'Model',
}: ComposerModelSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [internalProviderFilter, setInternalProviderFilter] = React.useState<
    string | null
  >(null);
  const [highlightedIndex, setHighlightedIndex] = React.useState(0);
  const listRef = React.useRef<HTMLDivElement>(null);
  const menuId = React.useId();
  const {
    anchorRef: triggerRef,
    floatingRef: menuRef,
    style: menuStyle,
  } = useAnchoredPosition<HTMLButtonElement, HTMLDivElement>({
    open,
    placement: 'top-start',
    offset: MENU_OFFSET_PX,
    matchMinWidth: true,
    maxHeight: MENU_MAX_HEIGHT_PX,
    allowFlip: false,
    boundaryRef,
  });

  const activeProviderFilter =
    providerFilter === undefined ? internalProviderFilter : providerFilter;
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
      activeProviderFilter === null
        ? models
        : models.filter((model) => model.provider === activeProviderFilter),
    [activeProviderFilter, models]
  );
  const groupedModels = React.useMemo(
    () => groupByProvider(filteredModels),
    [filteredModels]
  );
  const groupedRenderedModels = React.useMemo(() => {
    let index = 0;
    return groupedModels.map((group) => ({
      provider: group.provider,
      options: group.options.map((option) => {
        const rendered: RenderedModelOption = {
          option,
          index,
          key: renderedOptionKey(option, index),
        };
        index += 1;
        return rendered;
      }),
    }));
  }, [groupedModels]);
  const renderedModels = React.useMemo(
    () => groupedRenderedModels.flatMap((group) => group.options),
    [groupedRenderedModels]
  );
  const getOptionId = React.useCallback(
    (index: number) => `${menuId}-option-${index}`,
    [menuId]
  );
  const activeOptionId =
    open && renderedModels[highlightedIndex]
      ? getOptionId(highlightedIndex)
      : undefined;
  const selectedRenderedIndex = React.useMemo(
    () =>
      selectedKey
        ? renderedModels.findIndex(
            (renderedModel) => optionKey(renderedModel.option) === selectedKey
          )
        : -1,
    [renderedModels, selectedKey]
  );

  const setProvider = React.useCallback(
    (provider: string | null) => {
      if (providerFilter === undefined) {
        setInternalProviderFilter(provider);
      }
      onProviderFilterChange?.(provider);
    },
    [onProviderFilterChange, providerFilter]
  );

  const close = React.useCallback(
    (restoreFocus = true) => {
      setOpen(false);
      if (restoreFocus) {
        triggerRef.current?.focus({ preventScroll: true });
      }
    },
    [triggerRef]
  );

  const selectModel = React.useCallback(
    (model: ProviderModelOption) => {
      onChange({ provider: model.provider, model: model.model });
      close();
    },
    [close, onChange]
  );

  const outsideRefs = React.useMemo(
    () => [triggerRef, menuRef],
    [triggerRef, menuRef]
  );

  useClickOutside(outsideRefs, () => close(false), open);

  useEscapeKey(close, open);

  React.useEffect(() => {
    if (!open) return;
    setHighlightedIndex(selectedRenderedIndex >= 0 ? selectedRenderedIndex : 0);
  }, [activeProviderFilter, open, selectedRenderedIndex]);

  React.useEffect(() => {
    if (!open) return;
    setHighlightedIndex((current) =>
      Math.min(current, Math.max(renderedModels.length - 1, 0))
    );
  }, [open, renderedModels.length]);

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
    if (renderedModels.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightedIndex((current) => (current + 1) % renderedModels.length);
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightedIndex(
        (current) =>
          (current - 1 + renderedModels.length) % renderedModels.length
      );
    }
    if (event.key === 'Home') {
      event.preventDefault();
      setHighlightedIndex(0);
    }
    if (event.key === 'End') {
      event.preventDefault();
      setHighlightedIndex(renderedModels.length - 1);
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const highlightedModel = renderedModels[highlightedIndex]?.option;
      if (highlightedModel) {
        selectModel(highlightedModel);
      }
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
        <span className="min-w-0 truncate">
          {selectedOption?.label ?? selectedOption?.model ?? placeholder}
        </span>
        <ChevronUp aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            style={menuStyle}
            data-slot="composer-model-selector-menu"
            className={cn(
              'border-border bg-card text-card-foreground flex w-80 max-w-full flex-col rounded-lg border shadow-lg',
              'animate-in fade-in overflow-hidden duration-100'
            )}
          >
            <div
              data-slot="composer-model-selector-provider-filter"
              className="border-border flex min-h-9 items-center gap-1 overflow-x-auto overflow-y-hidden border-b p-2"
            >
              {[null, ...providers].map((provider) => {
                const selected = activeProviderFilter === provider;
                return (
                  <button
                    key={provider ?? 'all-providers'}
                    type="button"
                    aria-pressed={selected}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => setProvider(provider)}
                    className={cn(
                      'inline-flex h-6 shrink-0 items-center justify-center rounded-full px-2.5 text-xs font-medium whitespace-nowrap transition-colors',
                      'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
                      selected
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    {provider === null
                      ? anyLabel
                      : (providerLabels.get(provider) ?? provider)}
                  </button>
                );
              })}
            </div>

            <div
              ref={listRef}
              id={menuId}
              role="listbox"
              aria-label={ariaLabel}
              aria-activedescendant={activeOptionId}
              tabIndex={-1}
              onKeyDown={handleMenuKeyDown}
              className="min-h-0 flex-1 overflow-y-auto p-1"
            >
              {groupedModels.length === 0 ? (
                <div className="text-muted-foreground px-3 py-4 text-center text-sm">
                  {emptyLabel}
                </div>
              ) : (
                groupedRenderedModels.map((group) => (
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
                    {group.options.map((renderedModel) => {
                      const { index, key, option: model } = renderedModel;

                      const selected = optionKey(model) === selectedKey;
                      const highlighted = index === highlightedIndex;

                      return (
                        <button
                          key={key}
                          id={getOptionId(index)}
                          type="button"
                          role="option"
                          aria-selected={selected}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => selectModel(model)}
                          onMouseEnter={() => setHighlightedIndex(index)}
                          className={cn(
                            'flex w-full items-center gap-2 rounded-md px-3 py-2 text-start text-sm',
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
