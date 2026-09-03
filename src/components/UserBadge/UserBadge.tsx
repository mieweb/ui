/**
 * UserBadge — the canonical way to render a user's identity inline.
 *
 * Shows an avatar + name (with an optional subtitle), and on hover/focus
 * reveals a rich preview card (avatar, email, presence, roles, last-active and
 * any custom rows) with a "View full profile" affordance. Activating the badge
 * navigates to the user's profile.
 *
 * Navigation is framework-agnostic: pass `href` to render a real anchor, and
 * optionally `onNavigate` to intercept clicks for SPA routing (mirrors the
 * `onNavigate(href)` pattern used by PageHeader / MobileBottomNav).
 *
 * @example
 * ```tsx
 * <UserBadge
 *   name="Will Reiske"
 *   email="will@bluehive.com"
 *   avatarSrc={getGravatarUrl('will@bluehive.com')}
 *   status="active"
 *   roles={['Employer Admin']}
 *   lastActiveLabel="Last seen 2h ago"
 *   href={`/employer/${employerId}/users/${userId}`}
 *   onNavigate={navigate}
 * />
 * ```
 */

import * as React from 'react';

import { cn } from '../../utils/cn';
import { Badge } from '../Badge';
import { UserAvatar, type UserAvatarStatus } from '../UserAvatar';

export interface UserBadgeDetail {
  label: string;
  value: React.ReactNode;
}

export interface UserBadgeProps {
  /** Display name. Used for the label and the avatar initials fallback. */
  name: string;
  /** Email — shown in the hover card (not inline unless passed as `subtitle`). */
  email?: string;
  /** Avatar image URL (e.g. a Gravatar URL). Falls back to initials. */
  avatarSrc?: string | null;
  /** Presence status dot (`active` = green, `inactive` = muted). */
  status?: UserAvatarStatus | null;
  /** Secondary line under the name in the inline badge. */
  subtitle?: React.ReactNode;
  /** Profile destination. When set, the badge becomes interactive. */
  href?: string;
  /** SPA navigation callback; receives `href`. Falls back to anchor nav. */
  onNavigate?: (href: string) => void;
  /** Avatar size for the inline badge. */
  size?: 'xs' | 'sm' | 'md';
  /** Render only the avatar (still hoverable/clickable). */
  avatarOnly?: boolean;
  /** Disable the hover preview card. */
  disableHoverCard?: boolean;
  /** Roles surfaced as chips in the hover card. */
  roles?: string[];
  /** Pre-formatted "last active / last login" label for the hover card. */
  lastActiveLabel?: string;
  /** Extra label/value rows in the hover card. */
  details?: UserBadgeDetail[];
  /** Label for the hover-card profile link. */
  viewProfileLabel?: string;
  /** Horizontal anchor for the hover card (use `right` near a viewport edge). */
  align?: 'left' | 'right';
  className?: string;
  'data-testid'?: string;
}

const HOVER_OPEN_DELAY = 120;
const HOVER_CLOSE_DELAY = 160;

const nameTextSize: Record<'xs' | 'sm' | 'md', string> = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-sm',
};

/** True for plain primary clicks (no modifier / not middle-click). */
function isPlainClick(e: React.MouseEvent): boolean {
  return !(
    e.metaKey ||
    e.ctrlKey ||
    e.shiftKey ||
    e.altKey ||
    e.button === 1
  );
}

export const UserBadge = React.forwardRef<HTMLSpanElement, UserBadgeProps>(
  function UserBadge(
    {
      name,
      email,
      avatarSrc,
      status,
      subtitle,
      href,
      onNavigate,
      size = 'sm',
      avatarOnly = false,
      disableHoverCard = false,
      roles,
      lastActiveLabel,
      details,
      viewProfileLabel = 'View full profile',
      align = 'left',
      className,
      'data-testid': testId,
    },
    ref,
  ) {
    const [open, setOpen] = React.useState(false);
    const wrapperRef = React.useRef<HTMLSpanElement | null>(null);
    const openTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const closeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearTimers = React.useCallback(() => {
      if (openTimer.current) clearTimeout(openTimer.current);
      if (closeTimer.current) clearTimeout(closeTimer.current);
      openTimer.current = null;
      closeTimer.current = null;
    }, []);

    React.useEffect(() => clearTimers, [clearTimers]);

    const hasHoverContent = Boolean(
      email ||
        (roles && roles.length) ||
        lastActiveLabel ||
        (details && details.length) ||
        href,
    );
    const hoverEnabled = !disableHoverCard && hasHoverContent;

    const scheduleOpen = () => {
      if (!hoverEnabled) return;
      if (closeTimer.current) {
        clearTimeout(closeTimer.current);
        closeTimer.current = null;
      }
      openTimer.current = setTimeout(() => setOpen(true), HOVER_OPEN_DELAY);
    };
    const scheduleClose = () => {
      if (openTimer.current) {
        clearTimeout(openTimer.current);
        openTimer.current = null;
      }
      closeTimer.current = setTimeout(() => setOpen(false), HOVER_CLOSE_DELAY);
    };

    const handleClick = (e: React.MouseEvent) => {
      if (href && onNavigate && isPlainClick(e)) {
        e.preventDefault();
        onNavigate(href);
      }
    };

    const setRefs = (node: HTMLSpanElement | null) => {
      wrapperRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    };

    const nameNode = (
      <span className="min-w-0">
        <span
          data-slot="user-badge-name"
          className={cn(
            'block truncate font-medium text-foreground',
            nameTextSize[size],
            href &&
              'group-hover/userbadge:text-primary-600 dark:group-hover/userbadge:text-primary-400',
          )}
        >
          {name}
        </span>
        {subtitle != null && (
          <span className="block truncate text-xs text-muted-foreground">
            {subtitle}
          </span>
        )}
      </span>
    );

    const triggerInner = (
      <>
        <UserAvatar
          src={avatarSrc ?? undefined}
          name={name}
          status={status ?? undefined}
          size={size}
        />
        {!avatarOnly && nameNode}
      </>
    );

    const triggerClass = cn(
      'inline-flex items-center gap-2 rounded-md text-left align-middle',
      href &&
        'group/userbadge cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1 focus-visible:ring-offset-background',
      className,
    );

    const trigger = href ? (
      <a
        href={href}
        onClick={handleClick}
        className={triggerClass}
        data-testid={testId}
      >
        {triggerInner}
      </a>
    ) : (
      <span className={triggerClass} data-testid={testId}>
        {triggerInner}
      </span>
    );

    return (
      <span
        ref={setRefs}
        className="relative inline-flex max-w-full"
        onMouseEnter={scheduleOpen}
        onMouseLeave={scheduleClose}
        onFocus={() => {
          if (hoverEnabled) setOpen(true);
        }}
        onBlur={(e) => {
          if (!wrapperRef.current?.contains(e.relatedTarget as Node | null)) {
            scheduleClose();
          }
        }}
      >
        {trigger}

        {hoverEnabled && open && (
          // `pt-2` is a transparent bridge so the pointer can travel from the
          // trigger into the card without crossing a dead gap (which would
          // dismiss it).
          <span
            role="dialog"
            aria-label={`${name} preview`}
            className={cn(
              'absolute top-full z-50 w-72 max-w-[calc(100vw-2rem)] pt-2',
              align === 'right' ? 'right-0' : 'left-0',
            )}
            onMouseEnter={scheduleOpen}
            onMouseLeave={scheduleClose}
          >
            <span className="block rounded-xl border border-border bg-card p-4 text-left shadow-lg">
              <span className="flex items-start gap-3">
                <UserAvatar
                  src={avatarSrc ?? undefined}
                  name={name}
                  status={status ?? undefined}
                  size="lg"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-foreground">
                    {name}
                  </span>
                  {email && (
                    <span className="block truncate text-sm text-muted-foreground">
                      {email}
                    </span>
                  )}
                  {status && (
                    <span className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span
                        aria-hidden="true"
                        className={cn(
                          'h-2 w-2 rounded-full',
                          status === 'active'
                            ? 'bg-emerald-500'
                            : 'bg-neutral-300 dark:bg-neutral-600',
                        )}
                      />
                      {status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  )}
                </span>
              </span>

              {roles && roles.length > 0 && (
                <span className="mt-3 flex flex-wrap gap-1.5">
                  {roles.map((role) => (
                    <Badge key={role} variant="secondary" size="sm">
                      {role}
                    </Badge>
                  ))}
                </span>
              )}

              {(lastActiveLabel || (details && details.length > 0)) && (
                <span className="mt-3 block space-y-1.5 border-t border-border pt-3 text-sm">
                  {lastActiveLabel && (
                    <span className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Last active</span>
                      <span className="text-right font-medium text-foreground">
                        {lastActiveLabel}
                      </span>
                    </span>
                  )}
                  {details?.map((detail) => (
                    <span
                      key={detail.label}
                      className="flex items-center justify-between gap-3"
                    >
                      <span className="text-muted-foreground">
                        {detail.label}
                      </span>
                      <span className="text-right font-medium text-foreground">
                        {detail.value}
                      </span>
                    </span>
                  ))}
                </span>
              )}

              {href && (
                <a
                  href={href}
                  onClick={handleClick}
                  className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 focus:outline-none focus-visible:underline dark:text-primary-400 dark:hover:text-primary-300"
                >
                  {viewProfileLabel}
                  <svg
                    aria-hidden="true"
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </a>
              )}
            </span>
          </span>
        )}
      </span>
    );
  },
);

UserBadge.displayName = 'UserBadge';
