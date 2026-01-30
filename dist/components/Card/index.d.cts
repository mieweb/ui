import * as class_variance_authority_types from 'class-variance-authority/types';
import * as React from 'react';
import { VariantProps } from 'class-variance-authority';

declare const cardVariants: (props?: ({
    padding?: "sm" | "md" | "lg" | "xl" | "none" | null | undefined;
    variant?: "ghost" | "default" | "filled" | "elevated" | "outlined" | null | undefined;
    interactive?: boolean | null | undefined;
    selected?: boolean | null | undefined;
    orientation?: "horizontal" | "vertical" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
declare const cardAccentVariants: (props?: ({
    color?: "primary" | "success" | "info" | "warning" | "destructive" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface CardProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {
    /** Semantic HTML element to render as */
    as?: 'div' | 'article' | 'section' | 'aside';
    /** Accent color bar on the left side */
    accent?: 'primary' | 'success' | 'warning' | 'destructive' | 'info';
    /** Loading state - shows skeleton overlay */
    loading?: boolean;
}
/**
 * A card container component for grouping related content.
 *
 * @example
 * ```tsx
 * <Card padding="lg" variant="elevated">
 *   <CardHeader>
 *     <CardTitle>Card Title</CardTitle>
 *   </CardHeader>
 *   <CardContent>Card content goes here</CardContent>
 * </Card>
 * ```
 */
declare const Card: React.ForwardRefExoticComponent<CardProps & React.RefAttributes<HTMLDivElement>>;
/**
 * Header section of a Card
 */
declare const CardHeader: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>;
/**
 * Title for a Card
 */
declare const CardTitle: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLHeadingElement> & React.RefAttributes<HTMLHeadingElement>>;
/**
 * Description text for a Card
 */
declare const CardDescription: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLParagraphElement> & React.RefAttributes<HTMLParagraphElement>>;
/**
 * Main content area of a Card
 */
declare const CardContent: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>;
/**
 * Footer section of a Card
 */
declare const CardFooter: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>;
/**
 * Image/Media section for a Card - typically used at the top
 */
interface CardMediaProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    /** Aspect ratio of the media */
    aspectRatio?: 'video' | 'square' | 'wide' | 'auto';
    /** Optional overlay content */
    overlay?: React.ReactNode;
}
declare const CardMedia: React.ForwardRefExoticComponent<CardMediaProps & React.RefAttributes<HTMLDivElement>>;
/**
 * Badge/Label component for Cards
 */
interface CardBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    /** Badge color variant */
    variant?: 'default' | 'primary' | 'success' | 'warning' | 'destructive';
    /** Position of the badge */
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}
declare const CardBadge: React.ForwardRefExoticComponent<CardBadgeProps & React.RefAttributes<HTMLSpanElement>>;
/**
 * Actions area for Card buttons/links
 */
interface CardActionsProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Alignment of actions */
    align?: 'left' | 'center' | 'right' | 'between' | 'around';
}
declare const CardActions: React.ForwardRefExoticComponent<CardActionsProps & React.RefAttributes<HTMLDivElement>>;
/**
 * Divider line within a Card
 */
declare const CardDivider: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLHRElement> & React.RefAttributes<HTMLHRElement>>;
/**
 * Collapsible content section for Cards
 */
interface CardCollapsibleProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Whether the content is expanded */
    expanded?: boolean;
    /** Callback when expand state changes */
    onExpandChange?: (expanded: boolean) => void;
    /** Trigger element/text for expanding */
    trigger?: React.ReactNode;
}
declare const CardCollapsible: React.ForwardRefExoticComponent<CardCollapsibleProps & React.RefAttributes<HTMLDivElement>>;
/**
 * Stat/Metric display for Cards
 */
interface CardStatProps extends React.HTMLAttributes<HTMLDivElement> {
    /** The main value/number */
    value: React.ReactNode;
    /** Label describing the stat */
    label: string;
    /** Trend indicator */
    trend?: {
        value: number;
        label?: string;
    };
    /** Icon to display */
    icon?: React.ReactNode;
}
declare const CardStat: React.ForwardRefExoticComponent<CardStatProps & React.RefAttributes<HTMLDivElement>>;

export { Card, CardActions, type CardActionsProps, CardBadge, type CardBadgeProps, CardCollapsible, type CardCollapsibleProps, CardContent, CardDescription, CardDivider, CardFooter, CardHeader, CardMedia, type CardMediaProps, type CardProps, CardStat, type CardStatProps, CardTitle, cardAccentVariants, cardVariants };
