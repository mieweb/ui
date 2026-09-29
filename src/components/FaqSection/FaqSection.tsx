import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';
import {
  SectionShell,
  cardClass,
  mutedTextClass,
} from '../../templates/Section';
import type { SectionBaseProps } from '../../templates/types';

export interface FaqItem {
  question: string;
  /** Plain text; line breaks are preserved. */
  answer: string;
  /** Anchor id so a link can open straight to this answer. */
  id?: string;
}

export interface FaqSectionProps extends SectionBaseProps {
  items: FaqItem[];
}

export const FaqSection = React.forwardRef<HTMLElement, FaqSectionProps>(
  ({ items, tone = 'default', align = 'center', ...rest }, ref) => (
    <SectionShell
      ref={ref}
      data-slot="faq-section"
      tone={tone}
      align={align}
      width="narrow"
      {...rest}
    >
      <div className="mt-10 space-y-3">
        {items.map((item) => (
          <details
            key={item.id ?? item.question}
            id={item.id}
            className={cn('group rounded-xl', cardClass(tone))}
          >
            <summary
              className={cn(
                'flex cursor-pointer list-none items-center justify-between gap-4 rounded-xl px-5 py-4 text-start font-semibold',
                'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
                '[&::-webkit-details-marker]:hidden'
              )}
            >
              {item.question}
              <ChevronDown
                aria-hidden="true"
                className="size-5 shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none"
              />
            </summary>
            <div
              className={cn(
                'px-5 pb-5 whitespace-pre-line',
                mutedTextClass(tone)
              )}
            >
              {item.answer}
            </div>
          </details>
        ))}
      </div>
    </SectionShell>
  )
);
FaqSection.displayName = 'FaqSection';
