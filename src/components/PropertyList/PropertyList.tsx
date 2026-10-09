'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../Collapsible';
import { CopyButton } from '../CopyButton';
import {
  InlineEdit,
  type InlineEditLabels,
  type InlineEditOption,
  type InlineEditType,
} from '../InlineEdit';

export interface PropertyListItem {
  key: string;
  label: string;
  value: string | number | null | undefined;
  /** Control used when editing; also drives display formatting. */
  type?: InlineEditType;
  options?: InlineEditOption[];
  /** Edit in place with `InlineEdit` (requires `onSave`). */
  editable?: boolean;
  /** Helper text under the value. */
  hint?: string;
  /** Show a copy-to-clipboard button for non-empty values. */
  copyable?: boolean;
  /** Custom display of a non-empty value. */
  render?: (value: string) => React.ReactNode;
  validate?: (value: string) => string | undefined;
  /** Shown for an empty editable value instead of `labels.empty`. */
  placeholder?: string;
}

export interface PropertyListGroup {
  id: string;
  title: string;
  items: PropertyListItem[];
  /** Defaults to true. */
  defaultOpen?: boolean;
}

export interface PropertyListLabels {
  /** Shown for empty values. */
  empty: string;
  copy: (label: string) => string;
  copied: string;
  showEmpty: (count: number) => string;
  hideEmpty: (count: number) => string;
}

export const defaultPropertyListLabels: PropertyListLabels = {
  empty: '—',
  copy: (label) => `Copy ${label}`,
  copied: 'Copied',
  showEmpty: (count) => `Show ${count} empty field${count === 1 ? '' : 's'}`,
  hideEmpty: (count) => `Hide ${count} empty field${count === 1 ? '' : 's'}`,
};

const listVariants = cva('m-0', {
  variants: {
    density: { comfortable: 'space-y-3', compact: 'space-y-1' },
  },
  defaultVariants: { density: 'comfortable' },
});

const rowVariants = cva('min-w-0', {
  variants: {
    layout: {
      stacked: 'flex flex-col gap-0.5',
      inline:
        'grid gap-0.5 sm:grid-cols-[minmax(7rem,40%)_minmax(0,1fr)] sm:items-baseline sm:gap-3',
    },
  },
  defaultVariants: { layout: 'stacked' },
});

type Layout = NonNullable<VariantProps<typeof rowVariants>['layout']>;
type Density = NonNullable<VariantProps<typeof listVariants>['density']>;

export interface PropertyListProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'>,
    VariantProps<typeof listVariants>,
    VariantProps<typeof rowVariants> {
  /** Flat list of properties. Ignored when `groups` is set. */
  items?: PropertyListItem[];
  /** Collapsible sections of properties. */
  groups?: PropertyListGroup[];
  /** Persist an edited value. Rejecting restores the previous value. */
  onSave?: (key: string, value: string) => void | Promise<void>;
  /** Hide empty values behind a "Show N empty fields" toggle. */
  hideEmpty?: boolean;
  /** Heading level for group titles. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  /** Remember each group's open state in localStorage under `${storageKey}:${group.id}`. */
  storageKey?: string;
  /** Translatable strings. */
  labels?: Partial<PropertyListLabels>;
  /** Strings forwarded to each `InlineEdit`. */
  inlineEditLabels?: Partial<InlineEditLabels>;
}

const toText = (value: PropertyListItem['value']) =>
  value == null ? '' : String(value);

interface RowsProps {
  items: PropertyListItem[];
  layout: Layout;
  density: Density;
  hideEmpty?: boolean;
  onSave?: PropertyListProps['onSave'];
  labels: PropertyListLabels;
  inlineEditLabels?: Partial<InlineEditLabels>;
}

function PropertyRows({
  items,
  layout,
  density,
  hideEmpty,
  onSave,
  labels,
  inlineEditLabels,
}: RowsProps) {
  const [showEmpty, setShowEmpty] = React.useState(false);
  const id = React.useId();
  const isEmpty = (item: PropertyListItem) => toText(item.value).trim() === '';
  const emptyCount = hideEmpty ? items.filter(isEmpty).length : 0;
  const visible =
    hideEmpty && !showEmpty ? items.filter((i) => !isEmpty(i)) : items;

  return (
    <>
      <dl data-slot="property-list-items" className={listVariants({ density })}>
        {visible.map((item, index) => {
          const text = toText(item.value);
          const editable = item.editable && !!onSave;
          const hintId = `${id}-hint-${index}`;
          return (
            <div
              key={item.key}
              data-slot="property-list-row"
              className={rowVariants({ layout })}
            >
              <dt className="text-muted-foreground px-2 text-xs font-medium sm:text-sm">
                {item.label}
              </dt>
              <dd className="m-0 min-w-0">
                <div className="flex min-w-0 items-center gap-1">
                  <InlineEdit
                    className="min-w-0 flex-1"
                    size="sm"
                    label={item.label}
                    value={text}
                    type={item.type}
                    options={item.options}
                    validate={item.validate}
                    formatDisplay={item.render}
                    placeholder={
                      editable
                        ? (item.placeholder ?? labels.empty)
                        : labels.empty
                    }
                    readOnly={!editable}
                    labels={inlineEditLabels}
                    aria-describedby={item.hint ? hintId : undefined}
                    onSave={(next) => onSave?.(item.key, next)}
                  />
                  {item.copyable && text && (
                    <CopyButton
                      value={text}
                      label={labels.copy(item.label)}
                      copiedLabel={labels.copied}
                    />
                  )}
                </div>
                {item.hint && (
                  <p
                    id={hintId}
                    className="text-muted-foreground mt-0.5 px-2 text-xs"
                  >
                    {item.hint}
                  </p>
                )}
              </dd>
            </div>
          );
        })}
      </dl>
      {emptyCount > 0 && (
        <button
          type="button"
          data-slot="property-list-empty-toggle"
          aria-expanded={showEmpty}
          onClick={() => setShowEmpty((v) => !v)}
          className="text-muted-foreground hover:text-foreground focus-visible:ring-ring mt-1 rounded px-2 py-1 text-xs focus-visible:ring-2 focus-visible:outline-none"
        >
          {showEmpty
            ? labels.hideEmpty(emptyCount)
            : labels.showEmpty(emptyCount)}
        </button>
      )}
    </>
  );
}

/**
 * Label/value pairs as a description list, with optional in-place editing,
 * copy buttons and collapsible groups.
 */
export const PropertyList = React.forwardRef<HTMLDivElement, PropertyListProps>(
  function PropertyList(
    {
      items,
      groups,
      onSave,
      hideEmpty,
      layout,
      density,
      headingLevel = 3,
      storageKey,
      labels: labelOverrides,
      inlineEditLabels,
      className,
      ...props
    },
    ref
  ) {
    const labels = { ...defaultPropertyListLabels, ...labelOverrides };
    const rowProps = {
      layout: layout ?? 'stacked',
      density: density ?? 'comfortable',
      hideEmpty,
      onSave,
      labels,
      inlineEditLabels,
    };
    const Heading = `h${headingLevel}` as 'h3';

    return (
      <div
        ref={ref}
        data-slot="property-list"
        className={cn('min-w-0', className)}
        {...props}
      >
        {groups ? (
          groups.map((group) => (
            <Collapsible
              key={group.id}
              defaultOpen={group.defaultOpen ?? true}
              storageKey={storageKey && `${storageKey}:${group.id}`}
              data-slot="property-list-group"
              className="border-border border-b py-1 last:border-b-0"
            >
              <Heading className="m-0">
                <CollapsibleTrigger className="group text-foreground hover:bg-muted focus-visible:ring-ring flex w-full items-center gap-2 rounded-md px-2 py-2 text-start text-sm font-semibold focus-visible:ring-2 focus-visible:outline-none">
                  <ChevronDown
                    aria-hidden="true"
                    className="text-muted-foreground h-4 w-4 shrink-0 transition-transform group-data-[state=closed]:-rotate-90 motion-reduce:transition-none rtl:group-data-[state=closed]:rotate-90"
                  />
                  {group.title}
                </CollapsibleTrigger>
              </Heading>
              <CollapsibleContent>
                <div className="pb-2">
                  <PropertyRows items={group.items} {...rowProps} />
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))
        ) : (
          <PropertyRows items={items ?? []} {...rowProps} />
        )}
      </div>
    );
  }
);

PropertyList.displayName = 'PropertyList';
