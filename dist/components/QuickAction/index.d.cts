import * as react_jsx_runtime from 'react/jsx-runtime';
import * as class_variance_authority_types from 'class-variance-authority/types';
import * as React from 'react';

declare const quickActionIconVariants: (props?: ({
    color?: "primary" | "green" | "purple" | "orange" | "blue" | "red" | "amber" | "neutral" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
declare const quickActionVariants: (props?: ({
    disabled?: boolean | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
type QuickActionColor = 'primary' | 'green' | 'purple' | 'orange' | 'blue' | 'red' | 'amber' | 'neutral';
interface QuickActionProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'color' | 'disabled'> {
    /** The main title text */
    title: string;
    /** The subtitle/description text */
    subtitle: string;
    /** Icon to display in the colored background */
    icon: React.ReactNode;
    /** Color theme for the icon background */
    color?: QuickActionColor;
    /** Render as a different element (e.g., 'a' for links) */
    as?: 'button' | 'a';
    /** URL when rendered as a link */
    href?: string;
    /** Whether the action is disabled */
    disabled?: boolean;
}
/**
 * A quick action card component for dashboard navigation.
 * Displays an icon, title, and subtitle in a compact, clickable card.
 *
 * @example
 * ```tsx
 * <QuickAction
 *   title="Schedule Exam"
 *   subtitle="Find providers nearby"
 *   color="primary"
 *   icon={<CalendarIcon className="h-5 w-5" />}
 *   onClick={() => navigate('/schedule')}
 * />
 * ```
 */
declare const QuickAction: React.ForwardRefExoticComponent<QuickActionProps & React.RefAttributes<HTMLButtonElement>>;
declare const QuickActionIcons: {
    Calendar: (props: React.SVGProps<globalThis.SVGSVGElement>) => react_jsx_runtime.JSX.Element;
    Clipboard: (props: React.SVGProps<globalThis.SVGSVGElement>) => react_jsx_runtime.JSX.Element;
    User: (props: React.SVGProps<globalThis.SVGSVGElement>) => react_jsx_runtime.JSX.Element;
    Document: (props: React.SVGProps<globalThis.SVGSVGElement>) => react_jsx_runtime.JSX.Element;
    Settings: (props: React.SVGProps<globalThis.SVGSVGElement>) => react_jsx_runtime.JSX.Element;
    Help: (props: React.SVGProps<globalThis.SVGSVGElement>) => react_jsx_runtime.JSX.Element;
    Search: (props: React.SVGProps<globalThis.SVGSVGElement>) => react_jsx_runtime.JSX.Element;
    Bell: (props: React.SVGProps<globalThis.SVGSVGElement>) => react_jsx_runtime.JSX.Element;
};
/**
 * A group/container component for displaying multiple QuickAction cards in a grid.
 *
 * @example
 * ```tsx
 * <QuickActionGroup title="Quick Actions">
 *   <QuickAction title="Action 1" ... />
 *   <QuickAction title="Action 2" ... />
 * </QuickActionGroup>
 * ```
 */
interface QuickActionGroupProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Optional title to display above the quick actions */
    title?: string;
    /** Number of columns on different screen sizes */
    columns?: {
        base?: 1 | 2;
        sm?: 1 | 2;
        md?: 2 | 3 | 4;
        lg?: 2 | 3 | 4;
    };
}
declare const QuickActionGroup: React.ForwardRefExoticComponent<QuickActionGroupProps & React.RefAttributes<HTMLDivElement>>;

export { QuickAction, type QuickActionColor, QuickActionGroup, type QuickActionGroupProps, QuickActionIcons, type QuickActionProps, quickActionIconVariants, quickActionVariants };
