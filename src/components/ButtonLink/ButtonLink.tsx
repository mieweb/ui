import * as React from 'react';
import { type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import { buttonVariants } from '../Button/Button';

type ButtonLinkOwnProps = VariantProps<typeof buttonVariants> & {
  /**
   * Element or component to render. Defaults to a plain anchor; pass a
   * client-side router's link component (react-router `Link`, Next.js `Link`,
   * …) to keep SPA navigation.
   */
  as?: React.ElementType;
  /** Optional icon element to render before the link text */
  leftIcon?: React.ReactElement | null;
  /** Optional icon element to render after the link text */
  rightIcon?: React.ReactElement | null;
};

export type ButtonLinkProps<T extends React.ElementType = 'a'> =
  ButtonLinkOwnProps & { as?: T } & Omit<
      React.ComponentPropsWithoutRef<T>,
      keyof ButtonLinkOwnProps
    >;

type ButtonLinkComponent = (<T extends React.ElementType = 'a'>(
  props: ButtonLinkProps<T> & { ref?: React.ComponentPropsWithRef<T>['ref'] }
) => React.ReactNode) & { displayName?: string };

/**
 * A navigation link styled exactly like {@link Button}. Use this instead of
 * wrapping a `<Button>` in an anchor or router link: nesting interactive
 * elements is invalid HTML, produces a double tab stop, and hides the link
 * cursor behind the button's. Because it renders a real link it keeps native
 * link affordances — middle-click / Ctrl+click to open in a new tab, copy
 * link address, correct semantics for assistive technology.
 *
 * Deliberately not a `Button` prop (`as`/`asChild`): buttons and links have
 * different disabled/loading semantics, so each keeps its own honest API.
 *
 * @example
 * ```tsx
 * <ButtonLink href="/docs" variant="outline">Docs</ButtonLink>
 *
 * // With a client-side router (react-router shown):
 * <ButtonLink as={Link} to="/users/new" variant="primary" leftIcon={<Plus />}>
 *   New user
 * </ButtonLink>
 * ```
 */
const ButtonLink = React.forwardRef<HTMLAnchorElement, ButtonLinkProps>(
  function ButtonLink(
    {
      as,
      className,
      variant,
      size,
      fullWidth,
      leftIcon,
      rightIcon,
      children,
      ...props
    },
    ref
  ) {
    const Comp: React.ElementType = as ?? 'a';
    const resolvedSize = size ?? 'md';
    return (
      <Comp
        data-slot="button"
        data-size={resolvedSize}
        className={cn(
          buttonVariants({ variant, size: resolvedSize, fullWidth }),
          className
        )}
        ref={ref}
        {...props}
      >
        {React.isValidElement(leftIcon) && (
          <span className="shrink-0">{leftIcon}</span>
        )}
        {children}
        {React.isValidElement(rightIcon) && (
          <span className="shrink-0">{rightIcon}</span>
        )}
      </Comp>
    );
  }
) as unknown as ButtonLinkComponent;

ButtonLink.displayName = 'ButtonLink';

export { ButtonLink };
