import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../utils/cn';
import {
  SectionShell,
  TemplateAnchor,
  accentTextClass,
  cardClass,
  headingTextClass,
  mutedTextClass,
} from '../../templates/Section';
import { buttonVariants } from '../Button/button-variants';
import type { SectionBaseProps, TemplateLink } from '../../templates/types';

export interface PricingPlan {
  name: string;
  /** Display price as written, e.g. "$49", "Custom" or "Free". */
  price: string;
  /** Billing unit after the price, e.g. "per employee / month". */
  period?: string;
  description?: string;
  features: string[];
  cta?: TemplateLink;
  /** Emphasise this plan and show `badge`. */
  highlighted?: boolean;
  badge?: string;
}

export interface PricingSectionProps extends SectionBaseProps {
  plans: PricingPlan[];
  /** Small print under the plans (taxes, contract terms). */
  note?: string;
}

const columnClass = [
  '',
  'lg:grid-cols-1',
  'lg:grid-cols-2',
  'lg:grid-cols-3',
  'lg:grid-cols-4',
] as const;

export const PricingSection = React.forwardRef<
  HTMLElement,
  PricingSectionProps
>(
  (
    { plans, note, tone = 'default', align = 'center', components, ...rest },
    ref
  ) => (
    <SectionShell
      ref={ref}
      data-slot="pricing-section"
      tone={tone}
      align={align}
      {...rest}
    >
      <ul
        className={cn(
          'mt-12 grid items-stretch gap-6 md:grid-cols-2',
          columnClass[Math.min(plans.length, 4)],
          plans.length === 1 && 'mx-auto max-w-md'
        )}
      >
        {plans.map((plan) => (
          <li
            key={plan.name}
            className={cn(
              'relative flex flex-col rounded-2xl p-6 sm:p-8',
              cardClass(tone),
              plan.highlighted &&
                'ring-primary-600 dark:ring-primary-400 ring-2'
            )}
          >
            {plan.highlighted && plan.badge && (
              <p className="bg-primary-800 absolute start-6 -top-3 rounded-full px-3 py-1 text-xs font-semibold text-white">
                {plan.badge}
              </p>
            )}
            <h3 className={cn('text-lg font-semibold', headingTextClass(tone))}>
              {plan.name}
            </h3>
            {plan.description && (
              <p className={cn('mt-2 text-sm', mutedTextClass(tone))}>
                {plan.description}
              </p>
            )}
            <p className="mt-6 flex flex-wrap items-baseline gap-x-2">
              <span
                className={cn(
                  'text-4xl font-bold tracking-tight',
                  headingTextClass(tone)
                )}
              >
                {plan.price}
              </span>
              {plan.period && (
                <span className={cn('text-sm', mutedTextClass(tone))}>
                  {plan.period}
                </span>
              )}
            </p>
            <ul className="mt-6 flex-1 space-y-3 text-sm">
              {plan.features.map((feature) => (
                <li key={feature} className="flex gap-3">
                  <Check
                    aria-hidden="true"
                    className={cn(
                      'mt-0.5 size-4 shrink-0',
                      accentTextClass(tone)
                    )}
                  />
                  {feature}
                </li>
              ))}
            </ul>
            {plan.cta && (
              <TemplateAnchor
                href={plan.cta.href}
                trackingId={plan.cta.trackingId}
                components={components}
                className={cn(
                  buttonVariants({
                    variant: plan.highlighted ? 'primary' : 'outline',
                    size: 'lg',
                    fullWidth: true,
                  }),
                  'mt-8 h-auto min-h-12 py-3 whitespace-normal',
                  tone === 'brand' &&
                    (plan.highlighted
                      ? 'text-primary-900 hover:bg-primary-50 bg-white'
                      : 'border-white/70 text-white hover:bg-white/10 hover:text-white dark:border-white/70 dark:text-white')
                )}
              >
                {plan.cta.label}
              </TemplateAnchor>
            )}
          </li>
        ))}
      </ul>
      {note && (
        <p
          className={cn(
            'mt-8 text-sm',
            mutedTextClass(tone),
            align === 'center' && 'text-center'
          )}
        >
          {note}
        </p>
      )}
    </SectionShell>
  )
);
PricingSection.displayName = 'PricingSection';
