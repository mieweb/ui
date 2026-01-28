import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

// ============================================================================
// Avatar Component
// ============================================================================

const avatarVariants = cva(
  [
    'relative inline-flex items-center justify-center',
    'rounded-full overflow-hidden',
    'bg-primary-800 text-white font-semibold',
  ],
  {
    variants: {
      size: {
        xs: 'h-6 w-6 text-xs',
        sm: 'h-8 w-8 text-sm',
        md: 'h-10 w-10 text-sm',
        lg: 'h-12 w-12 text-base',
        xl: 'h-16 w-16 text-lg',
      },
      ring: {
        true: 'ring-2 ring-primary-400/30',
        false: '',
      },
    },
    defaultVariants: {
      size: 'md',
      ring: false,
    },
  }
);

export interface AvatarProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarVariants> {
  /** Image URL for the avatar */
  src?: string | null;
  /** Alt text for the avatar image */
  alt?: string;
  /** Name to generate initials from (used as fallback when no src) */
  name?: string;
  /** Custom fallback content (overrides name initials) */
  fallback?: React.ReactElement | null;
}

/**
 * Get initials from a name string.
 */
function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * An avatar component for displaying user profile images with fallback to initials.
 *
 * @example
 * ```tsx
 * // With image
 * <Avatar src="/user.jpg" alt="John Doe" />
 *
 * // With initials fallback
 * <Avatar name="John Doe" />
 *
 * // With custom fallback
 * <Avatar fallback={<UserIcon />} />
 * ```
 */
const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, name, fallback, size, ring, ...props }, ref) => {
    const [imageError, setImageError] = React.useState(false);

    // Reset error state when src changes
    React.useEffect(() => {
      setImageError(false);
    }, [src]);

    const showImage = src && !imageError;
    const initials = name ? getInitials(name) : null;

    return (
      <div
        ref={ref}
        className={cn(avatarVariants({ size, ring }), className)}
        {...props}
      >
        {showImage ? (
          <img
            src={src}
            alt={alt || name || 'Avatar'}
            className="h-full w-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : React.isValidElement(fallback) ? (
          fallback
        ) : initials ? (
          initials
        ) : (
          <svg
            className="h-[60%] w-[60%] text-white/80"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

// ============================================================================
// Avatar Group Component
// ============================================================================

export interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Maximum number of avatars to show before +N indicator */
  max?: number;
  /** Size of avatars in the group */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Children should be Avatar components */
  children: React.ReactNode;
}

/**
 * A component for displaying a group of overlapping avatars.
 *
 * @example
 * ```tsx
 * <AvatarGroup max={3}>
 *   <Avatar name="John Doe" />
 *   <Avatar name="Jane Smith" />
 *   <Avatar name="Bob Wilson" />
 *   <Avatar name="Alice Brown" />
 * </AvatarGroup>
 * ```
 */
const AvatarGroup = React.forwardRef<HTMLDivElement, AvatarGroupProps>(
  ({ className, max, size = 'md', children, ...props }, ref) => {
    const childrenArray = React.Children.toArray(children);
    const visibleChildren = max ? childrenArray.slice(0, max) : childrenArray;
    const remainingCount = max ? Math.max(0, childrenArray.length - max) : 0;

    return (
      <div ref={ref} className={cn('flex -space-x-2', className)} {...props}>
        {visibleChildren.map((child, index) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(
              child as React.ReactElement<AvatarProps>,
              {
                key: index,
                size,
                className: cn(
                  'ring-2 ring-white dark:ring-neutral-900',
                  (child as React.ReactElement<AvatarProps>).props.className
                ),
              }
            );
          }
          return child;
        })}
        {remainingCount > 0 && (
          <div
            className={cn(
              avatarVariants({ size }),
              'bg-neutral-200 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300',
              'ring-2 ring-white dark:ring-neutral-900'
            )}
          >
            +{remainingCount}
          </div>
        )}
      </div>
    );
  }
);

AvatarGroup.displayName = 'AvatarGroup';

export { Avatar, AvatarGroup, avatarVariants, getInitials };
