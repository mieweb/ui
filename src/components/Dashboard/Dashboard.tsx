import * as React from 'react';
import { cn } from '../../utils/cn';

type DashboardRootProps = React.HTMLAttributes<HTMLDivElement> & {
  density?: 'comfortable' | 'compact';
};

const DashboardRoot = React.forwardRef<HTMLDivElement, DashboardRootProps>(
  ({ className, density, children, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="dashboard"
      data-density={density}
      className={cn(
        'bg-background text-foreground gap-brand-lg p-brand-lg md:p-brand-xl flex w-full flex-col',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
DashboardRoot.displayName = 'Dashboard';

const DashboardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <header
    ref={ref}
    data-slot="dashboard-header"
    className={cn(
      'flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between',
      className
    )}
    {...props}
  >
    {children}
  </header>
));
DashboardHeader.displayName = 'Dashboard.Header';

const DashboardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, children, ...props }, ref) => (
  <h1
    ref={ref}
    data-slot="dashboard-title"
    className={cn(
      'text-foreground text-2xl font-semibold sm:text-3xl',
      className
    )}
    {...props}
  >
    {children}
  </h1>
));
DashboardTitle.displayName = 'Dashboard.Title';

const DashboardSubtitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => (
  <p
    ref={ref}
    data-slot="dashboard-subtitle"
    className={cn('text-muted-foreground text-sm', className)}
    {...props}
  >
    {children}
  </p>
));
DashboardSubtitle.displayName = 'Dashboard.Subtitle';

const DashboardActions = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="dashboard-actions"
    className={cn('flex flex-wrap items-center gap-2', className)}
    {...props}
  >
    {children}
  </div>
));
DashboardActions.displayName = 'Dashboard.Actions';

const DashboardGrid = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="dashboard-grid"
    className={cn(
      'gap-brand-md sm:gap-brand-lg grid grid-cols-1 sm:grid-cols-6 lg:grid-cols-12',
      className
    )}
    {...props}
  >
    {children}
  </div>
));
DashboardGrid.displayName = 'Dashboard.Grid';

type ColSpan = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

type DashboardWidgetProps = React.HTMLAttributes<HTMLDivElement> & {
  colSpan?: ColSpan;
  smColSpan?: 1 | 2 | 3 | 4 | 5 | 6;
};

const colSpanClasses: Record<ColSpan, string> = {
  1: 'lg:col-span-1',
  2: 'lg:col-span-2',
  3: 'lg:col-span-3',
  4: 'lg:col-span-4',
  5: 'lg:col-span-5',
  6: 'lg:col-span-6',
  7: 'lg:col-span-7',
  8: 'lg:col-span-8',
  9: 'lg:col-span-9',
  10: 'lg:col-span-10',
  11: 'lg:col-span-11',
  12: 'lg:col-span-12',
};

const smColSpanClasses: Record<
  NonNullable<DashboardWidgetProps['smColSpan']>,
  string
> = {
  1: 'sm:col-span-1',
  2: 'sm:col-span-2',
  3: 'sm:col-span-3',
  4: 'sm:col-span-4',
  5: 'sm:col-span-5',
  6: 'sm:col-span-6',
};

const DashboardWidgetSlot = React.forwardRef<
  HTMLDivElement,
  DashboardWidgetProps
>(({ className, colSpan = 12, smColSpan, children, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="dashboard-widget"
    className={cn(
      'col-span-full',
      smColSpan ? smColSpanClasses[smColSpan] : '',
      colSpanClasses[colSpan],
      className
    )}
    {...props}
  >
    {children}
  </div>
));
DashboardWidgetSlot.displayName = 'Dashboard.Widget';

type DashboardComponent = typeof DashboardRoot & {
  Header: typeof DashboardHeader;
  Title: typeof DashboardTitle;
  Subtitle: typeof DashboardSubtitle;
  Actions: typeof DashboardActions;
  Grid: typeof DashboardGrid;
  Widget: typeof DashboardWidgetSlot;
};

export const Dashboard = DashboardRoot as DashboardComponent;
Dashboard.Header = DashboardHeader;
Dashboard.Title = DashboardTitle;
Dashboard.Subtitle = DashboardSubtitle;
Dashboard.Actions = DashboardActions;
Dashboard.Grid = DashboardGrid;
Dashboard.Widget = DashboardWidgetSlot;

export type { DashboardWidgetProps, ColSpan };
