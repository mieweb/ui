import * as React from 'react';
import { ArrowRight } from 'lucide-react';
import { buttonVariants } from '../components/Button/button-variants';
import { cn } from '../utils/cn';
import { TemplateIcon, type TemplateIconRegistry } from './icons';
import type {
  SectionAlign,
  SectionTone,
  TemplateComponents,
  TemplateImageProps,
  TemplateLink,
  TemplateLinkProps,
} from './types';

const toneSurface: Record<SectionTone, string> = {
  default: 'bg-background text-foreground',
  muted: 'bg-muted text-foreground',
  brand: 'bg-primary-900 text-white',
};

export const toneClass = (tone: SectionTone) => toneSurface[tone];

/** Card surface that reads correctly on the given section tone. */
export const cardClass = (tone: SectionTone) =>
  tone === 'brand'
    ? 'border border-white/15 bg-white/5 text-white'
    : 'border border-border bg-card text-card-foreground';

// muted-foreground on bg-muted drops below AA in dark mode, so the muted tone mixes foreground instead.
export const mutedTextClass = (tone: SectionTone) =>
  tone === 'brand'
    ? 'text-white/80'
    : tone === 'muted'
      ? 'text-foreground/80'
      : 'text-muted-foreground';

// Explicit, because host sites often colour h1–h4 in a base layer that beats inheritance.
export const headingTextClass = (tone: SectionTone) =>
  tone === 'brand' ? 'text-white' : 'text-foreground';

// 800 (light) is the shade Button's primary fill already guarantees against white.
export const accentTextClass = (tone: SectionTone) =>
  tone === 'brand' ? 'text-white' : 'text-primary-800 dark:text-primary-300';

export const containerClass = (width: 'wide' | 'narrow' = 'wide') =>
  cn(
    'mx-auto w-full px-4 sm:px-6 lg:px-8',
    width === 'narrow' ? 'max-w-3xl' : 'max-w-7xl'
  );

/** An anchor, or the site's `components.Link`, with `trackingId` as `data-track`. */
export function TemplateAnchor({
  components,
  trackingId,
  children,
  ...props
}: TemplateLinkProps & {
  components?: TemplateComponents;
  trackingId?: string;
}) {
  const Link = components?.Link;
  const all = { ...props, 'data-track': trackingId };
  return Link ? <Link {...all}>{children}</Link> : <a {...all}>{children}</a>;
}

/** An `<img>`, or the site's `components.Image`. */
export function TemplateImg({
  components,
  priority,
  ...image
}: TemplateImageProps & { components?: TemplateComponents }) {
  const Image = components?.Image;
  if (Image) return <Image {...image} priority={priority} />;
  return (
    <img
      {...image}
      alt={image.alt}
      loading={priority ? undefined : 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
      decoding="async"
    />
  );
}

export interface SectionHeadingProps {
  eyebrow?: string;
  title?: string;
  description?: string;
  /** Heading element. Sections use `h2`; only a page's hero is `h1`. */
  as?: 'h1' | 'h2' | 'h3';
  size?: 'section' | 'hero';
  align?: SectionAlign;
  tone?: SectionTone;
  titleId?: string;
  className?: string;
}

/** Eyebrow, heading and supporting text — the opener every landing section shares. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  as: Heading = 'h2',
  size = 'section',
  align = 'start',
  tone = 'default',
  titleId,
  className,
}: SectionHeadingProps) {
  if (!eyebrow && !title && !description) return null;
  return (
    <div
      data-slot="section-heading"
      className={cn(
        'max-w-3xl',
        align === 'center' && 'mx-auto text-center',
        className
      )}
    >
      {eyebrow && (
        <p
          className={cn(
            'mb-3 text-sm font-semibold tracking-wider uppercase',
            accentTextClass(tone)
          )}
        >
          {eyebrow}
        </p>
      )}
      {title && (
        <Heading
          id={titleId}
          className={cn(
            'font-bold tracking-tight text-balance',
            headingTextClass(tone),
            size === 'hero'
              ? 'text-4xl sm:text-5xl lg:text-6xl'
              : 'text-3xl sm:text-4xl'
          )}
        >
          {title}
        </Heading>
      )}
      {description && (
        <p
          className={cn(
            'mt-4 text-pretty',
            size === 'hero' ? 'text-lg sm:text-xl' : 'text-lg',
            mutedTextClass(tone)
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}

export interface SectionShellProps extends Omit<
  React.HTMLAttributes<HTMLElement>,
  'title'
> {
  eyebrow?: string;
  title?: string;
  description?: string;
  tone?: SectionTone;
  align?: SectionAlign;
  width?: 'wide' | 'narrow';
  spacing?: 'default' | 'compact';
  /** Accepted so sections can forward their props; the shell renders no links or images. */
  components?: TemplateComponents;
}

/**
 * The `<section>` + container + heading frame every landing section renders.
 * Exported so a site can build its own section that sits flush with the rest.
 */
export const SectionShell = React.forwardRef<HTMLElement, SectionShellProps>(
  (
    {
      eyebrow,
      title,
      description,
      tone = 'default',
      align = 'start',
      width = 'wide',
      spacing = 'default',
      className,
      children,
      components,
      ...rest
    },
    ref
  ) => {
    void components; // kept off the DOM
    const titleId = React.useId();
    return (
      <section
        ref={ref}
        data-slot="landing-section"
        data-tone={tone}
        aria-labelledby={title ? titleId : undefined}
        className={cn(
          spacing === 'compact' ? 'py-10 sm:py-14' : 'py-16 sm:py-24',
          toneClass(tone),
          className
        )}
        {...rest}
      >
        <div className={containerClass(width)}>
          <SectionHeading
            eyebrow={eyebrow}
            title={title}
            description={description}
            align={align}
            tone={tone}
            titleId={titleId}
            className={cn(width === 'narrow' && 'max-w-none')}
          />
          {children}
        </div>
      </section>
    );
  }
);
SectionShell.displayName = 'SectionShell';

export interface CtaLinksProps {
  primary?: TemplateLink;
  secondary?: TemplateLink;
  tone?: SectionTone;
  align?: SectionAlign;
  className?: string;
  components?: TemplateComponents;
}

/** Primary + secondary calls to action as button-styled anchors. */
export function CtaLinks({
  primary,
  secondary,
  tone = 'default',
  align = 'start',
  className,
  components,
}: CtaLinksProps) {
  if (!primary && !secondary) return null;
  const onBrand = tone === 'brand';
  // Long or translated labels must wrap rather than overflow on phones.
  const wrap = 'h-auto min-h-12 py-3 whitespace-normal text-center';
  return (
    <div
      data-slot="cta-links"
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:flex-wrap',
        align === 'center' && 'sm:justify-center',
        className
      )}
    >
      {primary && (
        <TemplateAnchor
          href={primary.href}
          trackingId={primary.trackingId}
          components={components}
          data-slot="cta-primary"
          className={cn(
            buttonVariants({ variant: 'primary', size: 'lg' }),
            wrap,
            onBrand &&
              'text-primary-900 hover:bg-primary-50 active:bg-primary-100 bg-white'
          )}
        >
          {primary.label}
          <ArrowRight aria-hidden="true" className="size-5 rtl:-scale-x-100" />
        </TemplateAnchor>
      )}
      {secondary && (
        <TemplateAnchor
          href={secondary.href}
          trackingId={secondary.trackingId}
          components={components}
          data-slot="cta-secondary"
          className={cn(
            buttonVariants({ variant: 'outline', size: 'lg' }),
            wrap,
            onBrand &&
              'border-white/70 text-white hover:bg-white/10 hover:text-white dark:border-white/70 dark:text-white dark:hover:bg-white/10'
          )}
        >
          {secondary.label}
        </TemplateAnchor>
      )}
    </div>
  );
}

export interface IconTileProps {
  name: string;
  icons?: TemplateIconRegistry;
  tone?: SectionTone;
  className?: string;
}

export function IconTile({
  name,
  icons,
  tone = 'default',
  className,
}: IconTileProps) {
  return (
    <span
      data-slot="icon-tile"
      className={cn(
        'inline-flex size-11 shrink-0 items-center justify-center rounded-xl',
        tone === 'brand'
          ? 'bg-white/10 text-white'
          : 'bg-primary-100 text-primary-900 dark:bg-primary-900/60 dark:text-primary-200',
        className
      )}
    >
      <TemplateIcon name={name} icons={icons} />
    </span>
  );
}
