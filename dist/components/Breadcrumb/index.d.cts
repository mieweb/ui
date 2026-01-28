import * as react_jsx_runtime from 'react/jsx-runtime';
import * as React from 'react';

interface BreadcrumbItem {
    /** Label for the breadcrumb item */
    label: string;
    /** URL to navigate to (optional for the last item) */
    href?: string;
    /** Icon to display before the label */
    icon?: React.ReactNode;
}
interface BreadcrumbProps {
    /** Array of breadcrumb items */
    items: BreadcrumbItem[];
    /** Custom separator between items */
    separator?: React.ReactNode;
    /** Maximum items to display (collapses middle items) */
    maxItems?: number;
    /** Custom renderer for links */
    renderLink?: (item: BreadcrumbItem, index: number) => React.ReactNode;
    /** Additional class name */
    className?: string;
}
/**
 * A navigation breadcrumb component.
 *
 * @example
 * ```tsx
 * <Breadcrumb
 *   items={[
 *     { label: 'Home', href: '/' },
 *     { label: 'Products', href: '/products' },
 *     { label: 'Category', href: '/products/category' },
 *     { label: 'Current Item' },
 *   ]}
 * />
 * ```
 */
declare function Breadcrumb({ items, separator, maxItems, renderLink, className, }: BreadcrumbProps): react_jsx_runtime.JSX.Element;
declare namespace Breadcrumb {
    var displayName: string;
}
declare function BreadcrumbSlash({ className }: {
    className?: string;
}): react_jsx_runtime.JSX.Element;

export { Breadcrumb, type BreadcrumbItem, type BreadcrumbProps, BreadcrumbSlash };
