import * as class_variance_authority_types from 'class-variance-authority/types';
import * as React from 'react';
import { VariantProps } from 'class-variance-authority';

declare const cardVariants: (props?: ({
    padding?: "sm" | "md" | "lg" | "xl" | "none" | null | undefined;
    interactive?: boolean | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface CardProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {
    /** Semantic HTML element to render as */
    as?: 'div' | 'article' | 'section' | 'aside';
}
/**
 * A card container component for grouping related content.
 *
 * @example
 * ```tsx
 * <Card padding="lg">
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

export { Card, CardContent, CardDescription, CardFooter, CardHeader, type CardProps, CardTitle, cardVariants };
