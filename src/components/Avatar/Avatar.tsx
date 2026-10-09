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
        data-slot="avatar"
        className={cn(avatarVariants({ size, ring }), className)}
        {...props}
      >
        {showImage ? (
          <img
            src={src}
            alt={alt !== undefined ? alt : name || 'Avatar'}
            className="h-full w-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : React.isValidElement(fallback) ? (
          fallback
        ) : initials ? (
          initials
        ) : (
          <svg
            aria-hidden="true"
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

export { Avatar, avatarVariants, getInitials };
