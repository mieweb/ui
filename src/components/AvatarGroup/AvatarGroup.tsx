import * as React from 'react';
import { Eye, Pencil } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Avatar, avatarVariants, type AvatarProps } from '../Avatar/Avatar';

export type AvatarPresence = 'viewing' | 'editing';

export interface AvatarGroupItem {
  /** Stable key, passed back to `onItemClick`. */
  id: string;
  /** Person's name — drives the initials fallback and the accessible name. */
  name: string;
  /** Avatar image URL. */
  src?: string | null;
  /** What the person is doing on the record; adds a ring, badge and label. */
  presence?: AvatarPresence;
  /** Accessible name / tooltip override, e.g. `Bo (2 windows)`. Defaults to `name`. */
  label?: string;
  /** CSS colour for the initials disc, e.g. a collaborator's cursor colour. */
  color?: string;
}

export interface AvatarGroupLabels {
  /** Accessible name of the list. */
  list: string;
  /** Accessible name of a person with a presence state. */
  presence: (name: string, presence: AvatarPresence) => string;
  /** Accessible name / tooltip of the "+N" chip. */
  overflow: (hiddenNames: string[]) => string;
}

export const defaultAvatarGroupLabels: AvatarGroupLabels = {
  list: 'People',
  presence: (name, presence) => `${name} is ${presence}`,
  overflow: (names) => `${names.length} more: ${names.join(', ')}`,
};

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarGroupProps extends Omit<
  React.HTMLAttributes<HTMLUListElement>,
  'children'
> {
  /** People to show, in order (editors are moved to the front). */
  items?: AvatarGroupItem[];
  /** Avatars shown before the rest collapse into a "+N" chip. */
  max?: number;
  /** Size applied to every avatar. */
  size?: AvatarSize;
  /** Makes each avatar a button that reports its item `id`. */
  onItemClick?: (id: string) => void;
  /** Overrides for any user-facing string. */
  labels?: Partial<AvatarGroupLabels>;
  /** Legacy API: `<Avatar>` children instead of `items`. */
  children?: React.ReactNode;
}

const PRESENCE_RING: Record<AvatarPresence, string> = {
  viewing: 'ring-primary-500',
  editing: 'ring-warning-500',
};

const PRESENCE_BADGE: Record<AvatarPresence, string> = {
  viewing: 'bg-primary-500 text-primary-foreground',
  editing: 'bg-warning-500 text-warning-foreground',
};

const BADGE_SIZE: Record<AvatarSize, string> = {
  xs: 'h-3 w-3 [&>svg]:h-2 [&>svg]:w-2',
  sm: 'h-3.5 w-3.5 [&>svg]:h-2 [&>svg]:w-2',
  md: 'h-4 w-4 [&>svg]:h-2.5 [&>svg]:w-2.5',
  lg: 'h-5 w-5 [&>svg]:h-3 [&>svg]:w-3',
  xl: 'h-6 w-6 [&>svg]:h-3.5 [&>svg]:w-3.5',
};

const ITEM = '-ms-2 first:ms-0 relative';
const FOCUS =
  'rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';

/**
 * Overlapping stack of {@link Avatar}s with an optional viewing / editing
 * presence ring per person and a "+N" chip that names everyone it hides.
 *
 * @example
 * ```tsx
 * <AvatarGroup
 *   max={3}
 *   items={[{ id: '1', name: 'Ann Lee', presence: 'editing' }]}
 *   onItemClick={openProfile}
 * />
 * ```
 */
export const AvatarGroup = React.forwardRef<HTMLUListElement, AvatarGroupProps>(
  function AvatarGroup(
    {
      items,
      max,
      size = 'md',
      onItemClick,
      labels: labelOverrides,
      children,
      className,
      ...props
    },
    ref
  ) {
    const labels = { ...defaultAvatarGroupLabels, ...labelOverrides };

    const legacy = items
      ? []
      : React.Children.toArray(children).filter(
          React.isValidElement<AvatarProps>
        );
    const people: AvatarGroupItem[] = items
      ? [
          ...items.filter((i) => i.presence === 'editing'),
          ...items.filter((i) => i.presence !== 'editing'),
        ]
      : legacy.map((child, index) => ({
          id: String(child.key ?? index),
          name: child.props.name ?? child.props.alt ?? '',
        }));

    const visibleCount = max ? Math.min(max, people.length) : people.length;
    const hidden = people.slice(visibleCount);
    const overflowLabel = labels.overflow(hidden.map((h) => h.label ?? h.name));

    return (
      <ul
        ref={ref}
        aria-label={labels.list}
        data-slot="avatar-group"
        className={cn('flex items-center', className)}
        {...props}
      >
        {people.slice(0, visibleCount).map((item, index) => {
          if (!items) {
            const child = legacy[index];
            return (
              <li key={item.id} className={ITEM}>
                {React.cloneElement(child, {
                  size,
                  className: cn(
                    'ring-background ring-2',
                    child.props.className
                  ),
                })}
              </li>
            );
          }
          const name = item.label ?? item.name;
          const label = item.presence
            ? labels.presence(name, item.presence)
            : name;
          const avatar = (
            <>
              <Avatar
                name={item.name}
                src={item.src}
                alt=""
                size={size}
                className={cn(
                  'ring-2',
                  item.presence
                    ? PRESENCE_RING[item.presence]
                    : 'ring-background'
                )}
                style={item.color ? { backgroundColor: item.color } : undefined}
              />
              {item.presence && (
                <span
                  aria-hidden="true"
                  data-slot="avatar-group-presence"
                  className={cn(
                    'ring-background absolute -end-0.5 -bottom-0.5 flex items-center justify-center rounded-full ring-2',
                    PRESENCE_BADGE[item.presence],
                    BADGE_SIZE[size]
                  )}
                >
                  {item.presence === 'editing' ? <Pencil /> : <Eye />}
                </span>
              )}
            </>
          );
          return (
            <li key={item.id} className={ITEM}>
              {onItemClick ? (
                <button
                  type="button"
                  aria-label={label}
                  title={label}
                  onClick={() => onItemClick(item.id)}
                  className={cn('flex', FOCUS)}
                >
                  {avatar}
                </button>
              ) : (
                <span
                  role="img"
                  aria-label={label}
                  title={label}
                  className="flex"
                >
                  {avatar}
                </span>
              )}
            </li>
          );
        })}
        {hidden.length > 0 && (
          <li className={ITEM}>
            <span
              role="img"
              aria-label={overflowLabel}
              title={overflowLabel}
              data-slot="avatar-group-overflow"
              className={cn(
                avatarVariants({ size }),
                'bg-muted text-muted-foreground ring-background ring-2'
              )}
            >
              +{hidden.length}
            </span>
          </li>
        )}
      </ul>
    );
  }
);
