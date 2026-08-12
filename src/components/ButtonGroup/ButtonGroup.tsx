import * as React from 'react';
import { cn } from '../../utils/cn';

export interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Force a layout instead of measuring. 'auto' stacks only when labels would truncate. */
  orientation?: 'auto' | 'horizontal' | 'vertical';
  /**
   * Split the row into a left and right section. `true` puts the first button
   * on the left; a number puts that many buttons on the left. The rest align
   * right. Ignored while stacked. Default: no split, all buttons align right.
   */
  split?: boolean | number;
}

/**
 * Lays out buttons in a row, automatically stacking them vertically when the
 * available space would truncate their labels.
 *
 * Detection: each Button renders its label in a `data-slot="button-label"`
 * span with `truncate`. When laid out in a row, a truncated label has
 * `scrollWidth > clientWidth`. The group measures the extra width needed and
 * stacks when the row cannot fit; it returns to a row once the container is
 * wide enough again.
 *
 * @example
 * ```tsx
 * <ModalFooter>
 *   <ButtonGroup className="w-full" split>
 *     <Button variant="ghost">Back</Button>
 *     <Button variant="secondary">Cancel</Button>
 *     <Button variant="danger">Permanently delete this record</Button>
 *   </ButtonGroup>
 * </ModalFooter>
 * ```
 */
const ButtonGroup = React.forwardRef<HTMLDivElement, ButtonGroupProps>(
  ({ orientation = 'auto', split, className, children, ...props }, ref) => {
    const innerRef = React.useRef<HTMLDivElement>(null);
    React.useImperativeHandle(ref, () => innerRef.current as HTMLDivElement);

    const [stacked, setStacked] = React.useState(false);
    // Width the row layout needs to show every label in full.
    const requiredWidth = React.useRef(0);

    React.useLayoutEffect(() => {
      if (orientation !== 'auto') return;
      const el = innerRef.current;
      if (!el) return;

      const measure = () => {
        if (!stacked) {
          // In row mode, a truncated label reports scrollWidth > clientWidth.
          const overflow = Array.from(
            el.querySelectorAll<HTMLElement>('[data-slot="button-label"]')
          ).reduce(
            (sum, label) =>
              sum + Math.max(0, label.scrollWidth - label.clientWidth),
            0
          );
          if (overflow > 0) {
            requiredWidth.current = el.clientWidth + overflow;
            setStacked(true);
          }
        } else if (el.clientWidth >= requiredWidth.current) {
          setStacked(false);
        }
      };

      measure();
      const observer = new window.ResizeObserver(measure);
      observer.observe(el);
      return () => observer.disconnect();
    }, [orientation, stacked, children]);

    const isStacked =
      orientation === 'vertical' || (orientation === 'auto' && stacked);

    const items = React.Children.toArray(children);
    const splitCount =
      split === true ? 1 : typeof split === 'number' ? split : 0;
    const splitIndex =
      !isStacked && splitCount > 0 && splitCount < items.length
        ? splitCount
        : 0;

    return (
      <div
        ref={innerRef}
        data-slot="button-group"
        data-orientation={isStacked ? 'vertical' : 'horizontal'}
        className={cn(
          'flex gap-3',
          isStacked
            ? 'flex-col items-stretch'
            : 'flex-row items-center justify-end',
          className
        )}
        {...props}
      >
        {splitIndex > 0 ? (
          <>
            {items.slice(0, splitIndex)}
            <div className="flex-1" aria-hidden="true" />
            {items.slice(splitIndex)}
          </>
        ) : (
          children
        )}
      </div>
    );
  }
);

ButtonGroup.displayName = 'ButtonGroup';

export { ButtonGroup };
