import * as class_variance_authority_types from 'class-variance-authority/types';
import * as react_jsx_runtime from 'react/jsx-runtime';
import * as React from 'react';

interface TabsProps {
    /** The controlled value of the selected tab */
    value?: string;
    /** The default value of the selected tab (uncontrolled) */
    defaultValue?: string;
    /** Callback when the selected tab changes */
    onValueChange?: (value: string) => void;
    /** Visual variant of the tabs */
    variant?: 'underline' | 'pills' | 'enclosed';
    /** Tab content */
    children: React.ReactNode;
    /** Additional class name */
    className?: string;
}
/**
 * Accessible tabs component with keyboard navigation.
 *
 * @example
 * ```tsx
 * <Tabs defaultValue="tab1">
 *   <TabsList>
 *     <TabsTrigger value="tab1">Tab 1</TabsTrigger>
 *     <TabsTrigger value="tab2">Tab 2</TabsTrigger>
 *   </TabsList>
 *   <TabsContent value="tab1">Content 1</TabsContent>
 *   <TabsContent value="tab2">Content 2</TabsContent>
 * </Tabs>
 * ```
 */
declare function Tabs({ value: controlledValue, defaultValue, onValueChange, variant, children, className, }: TabsProps): react_jsx_runtime.JSX.Element;
declare namespace Tabs {
    var displayName: string;
}
declare const tabsListVariants: (props?: ({
    variant?: "underline" | "pills" | "enclosed" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
type TabsListProps = React.HTMLAttributes<HTMLDivElement>;
/**
 * Container for tab triggers.
 */
declare const TabsList: React.ForwardRefExoticComponent<TabsListProps & React.RefAttributes<HTMLDivElement>>;
declare const tabsTriggerVariants: (props?: ({
    variant?: "underline" | "pills" | "enclosed" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    /** The value that identifies this tab */
    value: string;
    /** Icon to show before the label */
    icon?: React.ReactNode;
}
/**
 * A tab trigger button.
 */
declare const TabsTrigger: React.ForwardRefExoticComponent<TabsTriggerProps & React.RefAttributes<HTMLButtonElement>>;
interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
    /** The value that identifies this content panel */
    value: string;
    /** Force mount the content (useful for animations) */
    forceMount?: boolean;
}
/**
 * Content panel for a tab.
 */
declare const TabsContent: React.ForwardRefExoticComponent<TabsContentProps & React.RefAttributes<HTMLDivElement>>;

export { Tabs, TabsContent, type TabsContentProps, TabsList, type TabsListProps, type TabsProps, TabsTrigger, type TabsTriggerProps, tabsListVariants, tabsTriggerVariants };
