import * as React from 'react';
import { cva } from 'class-variance-authority';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Badge } from '../Badge/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../Tabs/Tabs';

export interface RecordLayoutTab {
  id: string;
  label: string;
  count?: number;
  content: React.ReactNode;
}

export interface RecordLayoutLabels {
  sidebar: string;
  aside: string;
  main: string;
  tabs: string;
  sidebarToggle: string;
}

export const defaultRecordLayoutLabels: RecordLayoutLabels = {
  sidebar: 'Record details',
  aside: 'Related records',
  main: 'Record content',
  tabs: 'Record sections',
  sidebarToggle: 'Details',
};

const bodyVariants = cva('grid grid-cols-1 items-start gap-6 p-4 sm:p-6', {
  variants: {
    sidebar: { true: '', false: '' },
    aside: { true: '', false: '' },
  },
  compoundVariants: [
    {
      sidebar: true,
      aside: false,
      class:
        'md:grid-cols-[18rem_minmax(0,1fr)] xl:grid-cols-[20rem_minmax(0,1fr)]',
    },
    {
      sidebar: true,
      aside: true,
      class:
        'md:grid-cols-[18rem_minmax(0,1fr)] xl:grid-cols-[20rem_minmax(0,1fr)_20rem]',
    },
    {
      sidebar: false,
      aside: true,
      class: 'xl:grid-cols-[minmax(0,1fr)_20rem]',
    },
  ],
});

export interface RecordLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Usually a `RecordHeader`. */
  header?: React.ReactNode;
  /** Start column: the record's fields. */
  sidebar?: React.ReactNode;
  /** End column from `xl`; below the main column on tablet and mobile. */
  aside?: React.ReactNode;
  /** Rendered with `Tabs` in the main column; replaces `children`. */
  tabs?: RecordLayoutTab[];
  activeTab?: string;
  defaultTab?: string;
  onTabChange?: (id: string) => void;
  /** Query parameter that mirrors the active tab (uncontrolled only). */
  tabsUrlParam?: string;
  /** Below `md`, hide the sidebar behind a toggle. */
  sidebarCollapsible?: boolean;
  defaultSidebarOpen?: boolean;
  /** Persists the mobile sidebar's open state in `localStorage`. */
  sidebarStorageKey?: string;
  labels?: Partial<RecordLayoutLabels>;
}

function readOpen(key: string): boolean | undefined {
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? undefined : raw === 'true';
  } catch {
    return undefined;
  }
}

export const RecordLayout = React.forwardRef<HTMLDivElement, RecordLayoutProps>(
  (
    {
      header,
      sidebar,
      aside,
      tabs,
      activeTab,
      defaultTab,
      onTabChange,
      tabsUrlParam,
      sidebarCollapsible = true,
      defaultSidebarOpen = false,
      sidebarStorageKey,
      labels: labelsProp,
      className,
      children,
      ...rest
    },
    ref
  ) => {
    const labels = { ...defaultRecordLayoutLabels, ...labelsProp };
    const sidebarId = React.useId();
    const [open, setOpen] = React.useState(defaultSidebarOpen);

    React.useEffect(() => {
      if (!sidebarStorageKey) return;
      const stored = readOpen(sidebarStorageKey);
      if (stored !== undefined) setOpen(stored);
    }, [sidebarStorageKey]);

    const toggle = () => {
      const next = !open;
      setOpen(next);
      if (!sidebarStorageKey) return;
      try {
        window.localStorage.setItem(sidebarStorageKey, String(next));
      } catch {
        // Storage blocked: the preference just doesn't persist.
      }
    };

    const hasSidebar = sidebar != null;
    const hasAside = aside != null;

    return (
      <div
        ref={ref}
        data-slot="record-layout"
        className={cn('bg-background flex flex-col', className)}
        {...rest}
      >
        {header}
        <div
          data-slot="record-layout-body"
          className={bodyVariants({ sidebar: hasSidebar, aside: hasAside })}
        >
          {hasSidebar && (
            <aside
              data-slot="record-layout-sidebar"
              aria-label={labels.sidebar}
              className={cn(
                'min-w-0 md:sticky md:top-[var(--record-layout-sticky-top,1rem)] md:max-h-[calc(100dvh-var(--record-layout-sticky-top,1rem)-1rem)] md:overflow-y-auto',
                hasAside && 'md:row-span-2 xl:row-span-1'
              )}
            >
              {sidebarCollapsible && (
                <button
                  type="button"
                  aria-expanded={open}
                  aria-controls={sidebarId}
                  onClick={toggle}
                  className="border-border bg-card text-foreground hover:bg-muted focus-visible:ring-ring flex w-full items-center justify-between rounded-lg border px-4 py-3 text-sm font-medium focus-visible:ring-2 focus-visible:outline-none md:hidden"
                >
                  {labels.sidebarToggle}
                  <ChevronDown
                    aria-hidden="true"
                    className={cn(
                      'h-4 w-4 transition-transform motion-reduce:transition-none',
                      open && 'rotate-180'
                    )}
                  />
                </button>
              )}
              <div
                id={sidebarId}
                className={cn(
                  sidebarCollapsible && 'mt-3 md:mt-0',
                  sidebarCollapsible && !open && 'hidden md:block'
                )}
              >
                {sidebar}
              </div>
            </aside>
          )}
          <section
            data-slot="record-layout-main"
            aria-label={labels.main}
            className="min-w-0"
          >
            {tabs && tabs.length > 0 ? (
              <Tabs
                value={activeTab}
                defaultValue={defaultTab ?? tabs[0].id}
                onValueChange={onTabChange}
                urlParam={tabsUrlParam}
                urlValues={tabs.map((t) => t.id)}
              >
                <TabsList aria-label={labels.tabs} className="overflow-x-auto">
                  {tabs.map((t) => (
                    <TabsTrigger key={t.id} value={t.id}>
                      {t.label}
                      {t.count != null && (
                        <>
                          {' '}
                          <Badge size="sm" variant="secondary">
                            {t.count}
                          </Badge>
                        </>
                      )}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {tabs.map((t) => (
                  <TabsContent key={t.id} value={t.id}>
                    {t.content}
                  </TabsContent>
                ))}
              </Tabs>
            ) : (
              children
            )}
          </section>
          {hasAside && (
            <aside
              data-slot="record-layout-aside"
              aria-label={labels.aside}
              className="flex min-w-0 flex-col gap-4"
            >
              {aside}
            </aside>
          )}
        </div>
      </div>
    );
  }
);

RecordLayout.displayName = 'RecordLayout';
