import type * as React from 'react';

/** A navigational call to action. Always rendered as a real anchor so it is crawlable. */
export interface TemplateLink {
  label: string;
  href: string;
  /** Rendered as `data-track` for the site's analytics to pick up. */
  trackingId?: string;
}

export interface TemplateImage {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

/**
 * Surface a section sits on. `brand` is a saturated primary band with light
 * text in both colour modes; the others follow the active theme.
 */
export type SectionTone = 'default' | 'muted' | 'brand';

export type SectionAlign = 'start' | 'center';

/** Props a site's image component receives, e.g. an adapter around `next/image`. */
export interface TemplateImageProps extends TemplateImage {
  className?: string;
  /** True for the likely LCP image (the hero); load it eagerly at high priority. */
  priority?: boolean;
}

/** Props a site's link component receives, e.g. `next/link`. */
export interface TemplateLinkProps {
  href: string;
  className?: string;
  children?: React.ReactNode;
  tabIndex?: number;
  'aria-current'?: 'page';
  'data-slot'?: string;
  'data-track'?: string;
}

/**
 * Swap the plain `<img>` and `<a>` the sections render for the site's own,
 * so pages get optimized images and client-side navigation.
 */
export interface TemplateComponents {
  Image?: React.ComponentType<TemplateImageProps>;
  Link?: React.ComponentType<TemplateLinkProps>;
}

/** Fields every landing section shares. Everything except `components` is JSON-serializable. */
export interface SectionBaseProps extends Omit<
  React.HTMLAttributes<HTMLElement>,
  'title' | 'children'
> {
  /** Anchor id for in-page links (`#faq`). */
  id?: string;
  /** Short label above the heading. */
  eyebrow?: string;
  /** Section heading, rendered as an `<h2>`. */
  title?: string;
  /** Supporting paragraph under the heading. */
  description?: string;
  tone?: SectionTone;
  align?: SectionAlign;
  /** Site image and link components; `LandingPage` passes its own to every section. */
  components?: TemplateComponents;
}
