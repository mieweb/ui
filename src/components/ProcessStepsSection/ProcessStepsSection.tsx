import * as React from 'react';
import { cn } from '../../utils/cn';
import {
  SectionShell,
  headingTextClass,
  mutedTextClass,
} from '../../templates/Section';
import { TemplateIcon, type TemplateIconRegistry } from '../../templates/icons';
import type { SectionBaseProps } from '../../templates/types';

export interface ProcessStep {
  title: string;
  description: string;
  /** Icon token shown in the step marker instead of its number. */
  icon?: string;
}

export interface ProcessStepsSectionProps extends SectionBaseProps {
  steps: ProcessStep[];
  icons?: TemplateIconRegistry;
}

const columnClass = [
  '',
  '',
  'lg:grid-cols-2',
  'lg:grid-cols-3',
  'lg:grid-cols-4',
] as const;

// Runs from the first marker's centre to the last: half a column in from each edge.
const connectorInset = [
  '',
  '',
  'inset-x-[25%]',
  'inset-x-[16.667%]',
  'inset-x-[12.5%]',
] as const;

export const ProcessStepsSection = React.forwardRef<
  HTMLElement,
  ProcessStepsSectionProps
>(({ steps, icons, tone = 'default', align = 'center', ...rest }, ref) => {
  const columns = Math.min(steps.length, 4);
  return (
    <SectionShell
      ref={ref}
      data-slot="process-steps-section"
      tone={tone}
      align={align}
      {...rest}
    >
      <div className="relative mt-12">
        {steps.length > 1 && steps.length <= 4 && (
          <div
            aria-hidden="true"
            className={cn(
              'absolute top-6 hidden h-px lg:block',
              connectorInset[columns],
              tone === 'brand' ? 'bg-white/25' : 'bg-border'
            )}
          />
        )}
        <ol className={cn('relative grid gap-10', columnClass[columns])}>
          {steps.map((step, i) => (
            <li
              key={step.title}
              className="flex flex-col items-center text-center"
            >
              <span
                aria-hidden="true"
                className={cn(
                  'flex size-12 items-center justify-center rounded-full text-lg font-bold',
                  tone === 'brand'
                    ? 'text-primary-900 bg-white'
                    : 'bg-primary-800 text-white'
                )}
              >
                {step.icon ? (
                  <TemplateIcon name={step.icon} icons={icons} />
                ) : (
                  i + 1
                )}
              </span>
              <h3
                className={cn(
                  'mt-5 text-lg font-semibold',
                  headingTextClass(tone)
                )}
              >
                {step.title}
              </h3>
              <p className={cn('mt-2 max-w-xs', mutedTextClass(tone))}>
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </SectionShell>
  );
});
ProcessStepsSection.displayName = 'ProcessStepsSection';
