import * as React from 'react';
import { ArrowRight } from 'lucide-react';
import { cn } from '../../utils/cn';
import {
  SectionShell,
  TemplateAnchor,
  cardClass,
  headingTextClass,
  mutedTextClass,
} from '../../templates/Section';
import type { SectionBaseProps, TemplateLink } from '../../templates/types';

export interface LinkGroup {
  title: string;
  description?: string;
  links: TemplateLink[];
}

export interface LinkGroupsSectionProps extends SectionBaseProps {
  groups: LinkGroup[];
  columns?: 2 | 3;
}

/** Grouped lists of internal links — "explore the pages behind these numbers". */
export const LinkGroupsSection = React.forwardRef<
  HTMLElement,
  LinkGroupsSectionProps
>(({ groups, columns = 3, tone = 'muted', components, ...rest }, ref) => (
  <SectionShell
    ref={ref}
    data-slot="link-groups-section"
    tone={tone}
    components={components}
    {...rest}
  >
    <div
      className={cn(
        'mt-10 grid gap-6',
        columns === 3 ? 'lg:grid-cols-3' : 'md:grid-cols-2'
      )}
    >
      {groups.map((group) => (
        <div
          key={group.title}
          className={cn('rounded-2xl p-6', cardClass(tone))}
        >
          <h3 className={cn('text-lg font-semibold', headingTextClass(tone))}>
            {group.title}
          </h3>
          {group.description && (
            <p className={cn('mt-1 text-sm', mutedTextClass(tone))}>
              {group.description}
            </p>
          )}
          <ul className="mt-4 space-y-1">
            {group.links.map((link) => (
              <li key={link.href}>
                <TemplateAnchor
                  href={link.href}
                  trackingId={link.trackingId}
                  components={components}
                  className={cn(
                    'group flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    tone === 'brand'
                      ? 'hover:bg-white/10'
                      : 'hover:bg-primary-500/10 hover:text-primary-800 dark:hover:text-primary-300'
                  )}
                >
                  <span>{link.label}</span>
                  <ArrowRight
                    aria-hidden="true"
                    className="size-4 flex-none opacity-50 group-hover:opacity-100 rtl:-scale-x-100"
                  />
                </TemplateAnchor>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  </SectionShell>
));
LinkGroupsSection.displayName = 'LinkGroupsSection';
