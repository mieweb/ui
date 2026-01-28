import * as class_variance_authority_types from 'class-variance-authority/types';
import * as React from 'react';
import { VariantProps } from 'class-variance-authority';

declare const avatarVariants: (props?: ({
    size?: "xs" | "sm" | "md" | "lg" | "xl" | null | undefined;
    ring?: boolean | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface AvatarProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof avatarVariants> {
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
declare function getInitials(name: string): string;
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
declare const Avatar: React.ForwardRefExoticComponent<AvatarProps & React.RefAttributes<HTMLDivElement>>;
interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
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
declare const AvatarGroup: React.ForwardRefExoticComponent<AvatarGroupProps & React.RefAttributes<HTMLDivElement>>;

export { Avatar, AvatarGroup, type AvatarGroupProps, type AvatarProps, avatarVariants, getInitials };
