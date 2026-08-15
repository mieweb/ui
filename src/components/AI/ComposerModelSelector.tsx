import * as React from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react';
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

/** A reasoning-effort level offered alongside the model. */
export type ComposerEffortOption = {
  value: string;
  label: string;
  /** Optional secondary line, e.g. a caveat about cost or latency. */
  description?: string;
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
  /**
   * Reasoning-effort levels for the selected model. Omit or pass an empty
   * array to hide the effort row entirely, which is what a model that cannot
   * reason should resolve to — the levels are provider-specific, so the caller
   * owns deciding which apply.
   */
  effortOptions?: ComposerEffortOption[];
  /** Currently selected effort. */
  effort?: string | null;
  /** Effort marked with a "default" badge in the list. */
  defaultEffort?: string;
  onEffortChange?: (value: string) => void;
  effortLabel?: string;
  effortHint?: string;
  defaultBadgeLabel?: string;
  backLabel?: string;
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
  effortOptions,
  effort = null,
  defaultEffort,
  onEffortChange,
  effortLabel = 'Effort',
  effortHint,
  defaultBadgeLabel = 'Default',
  backLabel = 'Back',
}: ComposerModelSelectorProps) {
  const [open, setOpen] = React.useState(false);
  // The menu drills down rather than opening a side panel: one anchored
  // surface is far less fragile near the viewport edge, which is exactly where
  // a composer sits.
  const [view, setView] = React.useState<'models' | 'effort'>('models');
  const [effortHighlight, setEffortHighlight] = React.useState(0);
  const [internalProviderFilter, setInternalProviderFilter] = React.useState<
    string | null
  >(null);
  const [highlightedIndex, setHighlightedIndex] = React.useState(0);
  const listRef = React.useRef<HTMLDivElement>(null);
  const effortListRef = React.useRef<HTMLDivElement>(null);
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
  // The two views are mutually exclusive, so both listboxes carry `menuId` and
  // the trigger's `aria-controls` stays pointed at whichever one is rendered.
  // Option ids are namespaced per view so they cannot collide.
  const getEffortOptionId = React.useCallback(
    (index: number) => `${menuId}-effort-option-${index}`,
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

  const efforts = React.useMemo(() => effortOptions ?? [], [effortOptions]);
  const activeEffortOptionId =
    open && efforts[effortHighlight]
      ? getEffortOptionId(effortHighlight)
      : undefined;
  const selectedEffortOption = efforts.find(
    (option) => option.value === effort
  );

  const selectEffort = React.useCallback(
    (value: string) => {
      onEffortChange?.(value);
      close();
    },
    [close, onEffortChange]
  );

  const handleEffortKeyDown = (event: React.KeyboardEvent) => {
    if (efforts.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setEffortHighlight((current) => (current + 1) % efforts.length);
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setEffortHighlight(
        (current) => (current - 1 + efforts.length) % efforts.length
      );
    }
    if (event.key === 'Home') {
      event.preventDefault();
      setEffortHighlight(0);
    }
    if (event.key === 'End') {
      event.preventDefault();
      setEffortHighlight(efforts.length - 1);
    }
    // Left/Backspace mirrors the drill-down affordance so keyboard users can
    // get back to the model list without reaching for the mouse.
    if (event.key === 'ArrowLeft' || event.key === 'Backspace') {
      event.preventDefault();
      setView('models');
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const highlighted = efforts[effortHighlight];
      if (highlighted) selectEffort(highlighted.value);
    }
  };

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

  // Every open starts on the model list, and the effort list starts on the
  // current value so Enter is a no-op rather than a surprise change.
  React.useEffect(() => {
    if (!open) return;
    setView('models');
    const current = efforts.findIndex((option) => option.value === effort);
    setEffortHighlight(current >= 0 ? current : 0);
  }, [effort, efforts, open]);

  React.useEffect(() => {
    if (!open) return;
    setHighlightedIndex((current) =>
      Math.min(current, Math.max(renderedModels.length - 1, 0))
    );
  }, [open, renderedModels.length]);

  React.useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => {
      const target =
        view === 'effort' ? effortListRef.current : listRef.current;
      target?.focus({ preventScroll: true });
    });
  }, [open, view]);

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
        {selectedEffortOption && (
          <span
            data-slot="composer-model-selector-trigger-effort"
            className="text-muted-foreground min-w-0 truncate font-normal"
          >
            {selectedEffortOption.label}
          </span>
        )}
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
            {view === 'models' && (
              <>
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

                {efforts.length > 0 && (
                  <div className="border-border border-t p-1">
                    <button
                      type="button"
                      data-slot="composer-model-selector-effort-row"
                      aria-haspopup="listbox"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => setView('effort')}
                      className={cn(
                        'flex w-full items-center gap-2 rounded-md px-3 py-2 text-start text-sm',
                        'hover:bg-muted transition-colors',
                        'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none'
                      )}
                    >
                      <span className="min-w-0 flex-1 truncate">
                        {effortLabel}
                      </span>
                      {selectedEffortOption && (
                        <span className="text-muted-foreground min-w-0 truncate">
                          {selectedEffortOption.label}
                        </span>
                      )}
                      <ChevronRight
                        aria-hidden="true"
                        className="text-muted-foreground h-4 w-4 shrink-0"
                      />
                    </button>
                  </div>
                )}
              </>
            )}

            {view === 'effort' && (
              <>
                <div className="border-border flex items-center gap-1 border-b p-2">
                  <button
                    type="button"
                    data-slot="composer-model-selector-effort-back"
                    aria-label={backLabel}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => setView('models')}
                    className={cn(
                      'inline-flex h-6 shrink-0 items-center gap-1 rounded-full px-2 text-xs font-medium',
                      'text-muted-foreground hover:bg-muted hover:text-foreground transition-colors',
                      'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none'
                    )}
                  >
                    <ChevronLeft aria-hidden="true" className="h-3.5 w-3.5" />
                    {effortLabel}
                  </button>
                </div>

                {effortHint && (
                  <p className="text-muted-foreground px-3 pt-2 text-xs">
                    {effortHint}
                  </p>
                )}

                <div
                  ref={effortListRef}
                  id={menuId}
                  role="listbox"
                  aria-label={effortLabel}
                  aria-activedescendant={activeEffortOptionId}
                  tabIndex={-1}
                  onKeyDown={handleEffortKeyDown}
                  className="min-h-0 flex-1 overflow-y-auto p-1"
                >
                  {efforts.map((option, index) => {
                    const selected = option.value === effort;
                    const highlighted = index === effortHighlight;

                    return (
                      <button
                        key={option.value}
                        id={getEffortOptionId(index)}
                        type="button"
                        role="option"
                        aria-selected={selected}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => selectEffort(option.value)}
                        onMouseEnter={() => setEffortHighlight(index)}
                        className={cn(
                          'flex w-full items-center gap-2 rounded-md px-3 py-2 text-start text-sm',
                          'focus-visible:ring-ring transition-colors focus-visible:ring-2 focus-visible:outline-none',
                          highlighted && 'bg-muted',
                          selected && 'bg-primary/10 text-primary'
                        )}
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate">{option.label}</span>
                          {option.description && (
                            <span className="text-muted-foreground block truncate text-xs">
                              {option.description}
                            </span>
                          )}
                        </span>
                        {option.value === defaultEffort && (
                          <span className="bg-muted text-muted-foreground shrink-0 rounded px-1.5 py-0.5 text-xs">
                            {defaultBadgeLabel}
                          </span>
                        )}
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
              </>
            )}
          </div>,
          document.body
        )}
    </>
  );
}

ComposerModelSelector.displayName = 'ComposerModelSelector';
