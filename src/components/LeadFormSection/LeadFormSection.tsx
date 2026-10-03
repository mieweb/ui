import * as React from 'react';
import { CircleCheck } from 'lucide-react';
import { cn } from '../../utils/cn';
import { buttonVariants } from '../Button/button-variants';
import { RequiredMark, inputVariants } from '../Input';
import {
  SectionHeading,
  accentTextClass,
  cardClass,
  containerClass,
  mutedTextClass,
  safeHref,
  toneClass,
} from '../../templates/Section';
import type { SectionBaseProps } from '../../templates/types';

export interface LeadFormField {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'tel' | 'textarea' | 'select';
  required?: boolean;
  autoComplete?: string;
  placeholder?: string;
  /** Choices for `type: 'select'`. */
  options?: string[];
  /** `half` pairs two fields on one row from the `sm` breakpoint. */
  width?: 'full' | 'half';
}

export interface LeadFormSectionProps extends Omit<
  SectionBaseProps,
  'align' | 'onSubmit'
> {
  title: string;
  /**
   * A URL, or a React form action such as a Next.js Server Action. A URL is
   * page data: if its scheme is not http(s), mailto or tel the section
   * renders nothing, so an executable action never reaches the form.
   */
  action: string | ((formData: FormData) => void | Promise<void>);
  /** Only used with a URL `action`. */
  method?: 'post' | 'get';
  fields?: LeadFormField[];
  /** Posted with the form, e.g. `{ source: 'industry-construction' }`. */
  hiddenFields?: Record<string, string>;
  submitLabel?: string;
  /** Privacy or consent line under the button. */
  note?: string;
  /** Rendered as `data-track` on the submit button. */
  submitTrackingId?: string;
  /** `split` puts the heading beside the form; `stacked` centres it above. */
  layout?: 'split' | 'stacked';
  /** What the visitor gets, as a checked list under the heading — e.g. a gated report's contents. */
  highlights?: string[];
}

export const defaultLeadFormFields: LeadFormField[] = [
  {
    name: 'firstName',
    label: 'First name',
    required: true,
    autoComplete: 'given-name',
    width: 'half',
  },
  {
    name: 'lastName',
    label: 'Last name',
    required: true,
    autoComplete: 'family-name',
    width: 'half',
  },
  {
    name: 'email',
    label: 'Work email',
    type: 'email',
    required: true,
    autoComplete: 'email',
  },
  {
    name: 'company',
    label: 'Company',
    required: true,
    autoComplete: 'organization',
  },
];

const controlClass = cn(
  // Input's field styling (single source of truth for form controls); h-auto
  // and py-2.5 because this one class also sizes <textarea> and <select>.
  inputVariants({ size: 'md' }),
  'block h-auto py-2.5'
);

export const LeadFormSection = React.forwardRef<
  HTMLElement,
  LeadFormSectionProps
>(
  (
    {
      eyebrow,
      title,
      description,
      action,
      method = 'post',
      fields = defaultLeadFormFields,
      hiddenFields,
      submitLabel = 'Submit',
      note,
      layout = 'split',
      highlights,
      tone = 'muted',
      submitTrackingId,
      components,
      className,
      ...rest
    },
    ref
  ) => {
    void components; // the form renders no links or images
    const baseId = React.useId();
    const titleId = `${baseId}-title`;
    const split = layout === 'split';
    // Same trust boundary as TemplateAnchor hrefs — and after the hooks, so
    // the hook count stays stable if `action` changes.
    const resolvedAction =
      typeof action === 'string' ? safeHref(action) : action;
    if (resolvedAction == null) return null;
    return (
      <section
        ref={ref}
        data-slot="lead-form-section"
        data-tone={tone}
        aria-labelledby={titleId}
        className={cn('py-16 sm:py-24', toneClass(tone), className)}
        {...rest}
      >
        <div
          className={cn(
            containerClass(split ? 'wide' : 'narrow'),
            split && 'grid items-start gap-12 lg:grid-cols-2'
          )}
        >
          <div>
            <SectionHeading
              eyebrow={eyebrow}
              title={title}
              description={description}
              align={split ? 'start' : 'center'}
              tone={tone}
              titleId={titleId}
            />
            {highlights && highlights.length > 0 && (
              <ul
                className={cn(
                  'mt-6 space-y-2',
                  !split && 'mx-auto w-fit',
                  mutedTextClass(tone)
                )}
              >
                {highlights.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CircleCheck
                      aria-hidden="true"
                      className={cn(
                        'mt-0.5 size-4 shrink-0',
                        accentTextClass(tone)
                      )}
                    />
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <form
            action={resolvedAction}
            method={typeof resolvedAction === 'string' ? method : undefined}
            aria-labelledby={titleId}
            className={cn(
              'grid gap-5 rounded-2xl p-6 sm:grid-cols-2 sm:p-8',
              // The form card always uses the theme surface so inputs stay legible on a brand band.
              cardClass('default'),
              !split && 'mt-10'
            )}
          >
            {hiddenFields &&
              Object.entries(hiddenFields).map(([name, value]) => (
                <input key={name} type="hidden" name={name} value={value} />
              ))}
            {fields.map((field) => {
              const id = `${baseId}-${field.name}`;
              const common = {
                id,
                name: field.name,
                required: field.required,
                autoComplete: field.autoComplete,
                className: controlClass,
              };
              return (
                <div
                  key={field.name}
                  className={cn(field.width !== 'half' && 'sm:col-span-2')}
                >
                  <label
                    htmlFor={id}
                    className="mb-1.5 block text-sm font-medium"
                  >
                    {field.label}
                    {field.required && <RequiredMark />}
                  </label>
                  {field.type === 'textarea' ? (
                    <textarea
                      {...common}
                      rows={4}
                      placeholder={field.placeholder}
                    />
                  ) : field.type === 'select' ? (
                    <select {...common} defaultValue="">
                      <option value="" disabled>
                        {field.placeholder ?? ''}
                      </option>
                      {field.options?.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      {...common}
                      type={field.type ?? 'text'}
                      placeholder={field.placeholder}
                    />
                  )}
                </div>
              );
            })}
            <div className="sm:col-span-2">
              <button
                type="submit"
                data-track={submitTrackingId}
                className={cn(
                  buttonVariants({
                    variant: 'primary',
                    size: 'lg',
                    fullWidth: true,
                  }),
                  'h-auto min-h-12 py-3 whitespace-normal'
                )}
              >
                {submitLabel}
              </button>
              {note && (
                <p className={cn('mt-3 text-xs', mutedTextClass('default'))}>
                  {note}
                </p>
              )}
            </div>
          </form>
        </div>
      </section>
    );
  }
);
LeadFormSection.displayName = 'LeadFormSection';
