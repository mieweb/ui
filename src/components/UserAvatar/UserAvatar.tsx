import * as React from 'react';

import { cn } from '../../utils/cn';
import { Avatar, type AvatarProps } from '../Avatar';

export type UserAvatarStatus = 'active' | 'inactive';

export interface UserAvatarProps extends Omit<AvatarProps, 'fallback'> {
  /**
   * Presence status to render as a small dot overlay. Omit to hide the dot.
   * `active` renders a green dot; `inactive` renders a muted/gray dot.
   */
  status?: UserAvatarStatus | null;
  /** Accessible label for the status dot. Defaults to the status word. */
  statusLabel?: string;
  /** Custom fallback content for the underlying Avatar. */
  fallback?: AvatarProps['fallback'];
  /** Optional class applied to the outer wrapper (not the Avatar itself). */
  wrapperClassName?: string;
}

/**
 * Dot size classes keyed by Avatar size so the presence indicator scales with
 * the avatar.
 */
const dotSizeClasses: Record<NonNullable<AvatarProps['size']>, string> = {
  xs: 'h-1.5 w-1.5',
  sm: 'h-2 w-2',
  md: 'h-2.5 w-2.5',
  lg: 'h-3 w-3',
  xl: 'h-3.5 w-3.5',
};

/**
 * A user avatar with an optional presence dot overlay. Wraps the base
 * `Avatar` component — pass a precomputed `src` (for example the result of
 * `getGravatarUrl(email)` from `@bluehive/utils`), `name` for initials
 * fallback, and optionally `status` to render a colored dot.
 *
 * @example
 * ```tsx
 * <UserAvatar
 *   src={getGravatarUrl(user.email)}
 *   name={`${user.firstName} ${user.lastName}`}
 *   status="active"
 *   size="lg"
 * />
 * ```
 */
const UserAvatar = React.forwardRef<HTMLDivElement, UserAvatarProps>(
  (
    {
      status,
      statusLabel,
      wrapperClassName,
      size = 'md',
      className,
      ...avatarProps
    },
    ref
  ) => {
    const effectiveSize = size ?? 'md';
    const showDot = status === 'active' || status === 'inactive';
    const dotColor =
      status === 'active'
        ? 'bg-emerald-500'
        : 'bg-neutral-300 dark:bg-neutral-600';
    const label = statusLabel ?? (status === 'active' ? 'Active' : 'Inactive');

    return (
      <span className={cn('relative inline-block shrink-0', wrapperClassName)}>
        <Avatar
          ref={ref}
          size={effectiveSize}
          className={className}
          {...avatarProps}
        />
        {showDot ? (
          <span
            aria-hidden="true"
            className={cn(
              'absolute bottom-0 right-0 rounded-full ring-2 ring-background',
              dotSizeClasses[effectiveSize],
              dotColor
            )}
          />
        ) : null}
        {showDot ? <span className="sr-only">{label}</span> : null}
      </span>
    );
  }
);

UserAvatar.displayName = 'UserAvatar';

export { UserAvatar };
