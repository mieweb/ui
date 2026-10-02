import * as React from 'react';
import { cva } from 'class-variance-authority';
import { ArrowLeft, MoreHorizontal, type LucideIcon } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Avatar } from '../Avatar/Avatar';
import { Badge, type BadgeProps } from '../Badge/Badge';
import { Button, type ButtonProps } from '../Button/Button';
import { buttonVariants } from '../Button/button-variants';
import { Dropdown, DropdownItem } from '../Dropdown/Dropdown';

export interface RecordHeaderBadge {
  id: string;
  label: string;
  variant?: BadgeProps['variant'];
}

export interface RecordHeaderMetaItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  href?: string;
}

export interface RecordHeaderAction {
  id: string;
  label: string;
  icon?: LucideIcon;
  /** With `href`, call `event.preventDefault()` to route client-side. */
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
  href?: string;
  /** Defaults to `primary` for the first action and `outline` for the rest. */
  variant?: ButtonProps['variant'];
  disabled?: boolean;
}

export interface RecordHeaderLabels {
  back: string;
  moreActions: string;
  meta: string;
}

export const defaultRecordHeaderLabels: RecordHeaderLabels = {
  back: 'Back',
  moreActions: 'More actions',
  meta: 'Details',
};

const recordHeaderVariants = cva(
  'border-border bg-background flex flex-col gap-3 border-b px-4 py-4 sm:px-6',
  {
    variants: {
      sticky: {
        true: 'sticky top-0 z-20',
        false: '',
      },
    },
    defaultVariants: { sticky: false },
  }
);

export interface RecordHeaderProps extends Omit<
  React.HTMLAttributes<HTMLElement>,
  'title'
> {
  title: React.ReactNode;
  headingLevel?: 'h1' | 'h2' | 'h3';
  subtitle?: React.ReactNode;
  avatar?: { src?: string | null; name: string };
  icon?: LucideIcon;
  /** Replaces avatar/icon, e.g. a company logo. */
  media?: React.ReactNode;
  badges?: RecordHeaderBadge[];
  meta?: RecordHeaderMetaItem[];
  actions?: RecordHeaderAction[];
  /** Actions shown as buttons from `sm` up; the rest go to the overflow menu. */
  maxVisibleActions?: number;
  presence?: React.ReactNode;
  breadcrumbs?: React.ReactNode;
  onBack?: (event: React.MouseEvent<HTMLElement>) => void;
  backHref?: string;
  sticky?: boolean;
  labels?: Partial<RecordHeaderLabels>;
}

const menuLinkClass =
  'text-foreground hover:bg-muted focus-visible:bg-muted flex w-full items-center gap-3 rounded-lg px-3 py-2 text-start text-sm font-medium focus:outline-none';

export const RecordHeader = React.forwardRef<HTMLElement, RecordHeaderProps>(
  (
    {
      title,
      headingLevel: Heading = 'h1',
      subtitle,
      avatar,
      icon: Icon,
      media,
      badges,
      meta,
      actions = [],
      maxVisibleActions = 2,
      presence,
      breadcrumbs,
      onBack,
      backHref,
      sticky,
      labels: labelsProp,
      className,
      children,
      ...rest
    },
    ref
  ) => {
    const labels = { ...defaultRecordHeaderLabels, ...labelsProp };
    const [menuOpen, setMenuOpen] = React.useState(false);
    const hasOverflow = actions.length > maxVisibleActions;
    const variantOf = (a: RecordHeaderAction, i: number) =>
      a.variant ?? (i === 0 ? 'primary' : 'outline');

    const leading = media ? (
      <div data-slot="record-header-media" className="shrink-0">
        {media}
      </div>
    ) : avatar ? (
      <Avatar
        data-slot="record-header-media"
        size="lg"
        src={avatar.src}
        name={avatar.name}
        className="shrink-0"
      />
    ) : Icon ? (
      <div
        data-slot="record-header-media"
        className="bg-muted text-muted-foreground flex h-12 w-12 shrink-0 items-center justify-center rounded-lg"
      >
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
    ) : null;

    const backClass = cn(
      buttonVariants({ variant: 'ghost', size: 'icon' }),
      'shrink-0 rtl:[&_svg]:-scale-x-100'
    );
    const back = backHref ? (
      <a
        href={backHref}
        onClick={onBack}
        aria-label={labels.back}
        className={backClass}
      >
        <ArrowLeft className="h-5 w-5" aria-hidden="true" />
      </a>
    ) : onBack ? (
      <button
        type="button"
        onClick={onBack}
        aria-label={labels.back}
        className={backClass}
      >
        <ArrowLeft className="h-5 w-5" aria-hidden="true" />
      </button>
    ) : null;

    const renderButton = (a: RecordHeaderAction, i: number) => {
      const ActionIcon = a.icon;
      const iconEl = ActionIcon ? (
        <ActionIcon className="h-4 w-4" aria-hidden="true" />
      ) : undefined;
      const hiddenOnMobile = 'hidden sm:inline-flex';
      if (a.href && !a.disabled) {
        return (
          <a
            key={a.id}
            href={a.href}
            onClick={a.onClick}
            className={cn(
              buttonVariants({ variant: variantOf(a, i), size: 'sm' }),
              'gap-2',
              hiddenOnMobile
            )}
          >
            {iconEl}
            {a.label}
          </a>
        );
      }
      return (
        <Button
          key={a.id}
          size="sm"
          variant={variantOf(a, i)}
          leftIcon={iconEl}
          onClick={a.onClick}
          disabled={a.disabled}
          className={hiddenOnMobile}
        >
          {a.label}
        </Button>
      );
    };

    const renderMenuItem = (a: RecordHeaderAction, i: number) => {
      const ActionIcon = a.icon;
      const iconEl = ActionIcon ? (
        <ActionIcon className="h-4 w-4" aria-hidden="true" />
      ) : undefined;
      // Items that are also buttons only appear in the menu below `sm`.
      const mobileOnly = i < maxVisibleActions && 'sm:hidden';
      const select = (event: React.MouseEvent<HTMLElement>) => {
        setMenuOpen(false);
        a.onClick?.(event);
      };
      if (a.href && !a.disabled) {
        return (
          <a
            key={a.id}
            role="menuitem"
            data-slot="dropdown-item"
            href={a.href}
            onClick={select}
            className={cn(menuLinkClass, mobileOnly)}
          >
            {iconEl && <span className="h-4 w-4 shrink-0">{iconEl}</span>}
            {a.label}
          </a>
        );
      }
      return (
        <DropdownItem
          key={a.id}
          icon={iconEl}
          variant={variantOf(a, i) === 'danger' ? 'danger' : 'default'}
          disabled={a.disabled}
          onClick={select}
          className={cn(mobileOnly)}
        >
          {a.label}
        </DropdownItem>
      );
    };

    return (
      <header
        ref={ref}
        data-slot="record-header"
        className={cn(recordHeaderVariants({ sticky }), className)}
        {...rest}
      >
        {breadcrumbs && (
          <div data-slot="record-header-breadcrumbs">{breadcrumbs}</div>
        )}
        <div
          data-slot="record-header-row"
          className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
        >
          <div className="flex min-w-0 flex-1 items-start gap-3 sm:gap-4">
            {back}
            {leading}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Heading
                  data-slot="record-header-title"
                  className="text-foreground min-w-0 text-xl font-semibold break-words"
                >
                  {title}
                </Heading>
                {badges?.map((b) => (
                  <Badge key={b.id} size="sm" variant={b.variant}>
                    {b.label}
                  </Badge>
                ))}
              </div>
              {subtitle && (
                <p
                  data-slot="record-header-subtitle"
                  className="text-muted-foreground mt-0.5 text-sm"
                >
                  {subtitle}
                </p>
              )}
              {meta && meta.length > 0 && (
                <ul
                  data-slot="record-header-meta"
                  aria-label={labels.meta}
                  className="text-muted-foreground mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm"
                >
                  {meta.map(({ id, label, icon: MetaIcon, href }) => {
                    const content = (
                      <>
                        {MetaIcon && (
                          <MetaIcon
                            className="h-4 w-4 shrink-0"
                            aria-hidden="true"
                          />
                        )}
                        {label}
                      </>
                    );
                    return (
                      <li key={id} className="inline-flex items-center gap-1.5">
                        {href ? (
                          <a
                            href={href}
                            className="hover:text-foreground focus-visible:ring-ring inline-flex items-center gap-1.5 rounded-sm underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:outline-none"
                          >
                            {content}
                          </a>
                        ) : (
                          content
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
          {(presence || actions.length > 0) && (
            <div
              data-slot="record-header-actions"
              className="flex shrink-0 items-center gap-2 sm:justify-end"
            >
              {presence}
              {actions.slice(0, maxVisibleActions).map(renderButton)}
              {actions.length > 0 && (
                <Dropdown
                  open={menuOpen}
                  onOpenChange={setMenuOpen}
                  placement="bottom-end"
                  trigger={
                    <Button
                      variant="outline"
                      size="sm"
                      aria-label={labels.moreActions}
                      className={cn(!hasOverflow && 'sm:hidden')}
                    >
                      <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  }
                >
                  {actions.map(renderMenuItem)}
                </Dropdown>
              )}
            </div>
          )}
        </div>
        {children}
      </header>
    );
  }
);

RecordHeader.displayName = 'RecordHeader';
