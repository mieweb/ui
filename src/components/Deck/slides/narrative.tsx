import * as React from 'react';
import { ArrowRight, Check, Copy } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { TemplateAnchor, TemplateImg } from '../../../templates/Section';
import { useDeck, useTone } from '../DeckContext';
import {
  Bullet,
  Eyebrow,
  HighlightFigure,
  SlideHeader,
  SlideTitle,
  SourceLink,
  Subtitle,
  reveal,
} from '../primitives';
import { SlideFrame } from '../SlideFrame';
import { accent, toneOf } from '../tones';
import type {
  BulletListSlide,
  ConclusionSlide,
  CoverSlide,
  DeckLink,
  DefinitionListSlide,
  ImageSlide,
  OutlineEntry,
  QuoteSlide,
  SectionDividerSlide,
  SlideRendererProps,
  TableOfContentsSlide,
} from '../types';

function Highlights({
  items,
}: {
  items: Array<{ value: string; label: string }>;
}) {
  const r = reveal(3);
  return (
    <div
      className={cn(
        r.className,
        'mt-10 flex flex-wrap items-center justify-center gap-x-10 gap-y-6'
      )}
      style={r.style}
    >
      {items.map((h) => (
        <HighlightFigure key={h.label} value={h.value} label={h.label} />
      ))}
    </div>
  );
}

export function CoverRenderer({
  slide,
  index,
}: SlideRendererProps<CoverSlide>) {
  const { components } = useDeck();
  const tone = toneOf(slide, 'brand');
  return (
    <SlideFrame slide={slide} index={index} tone="brand" width="md">
      <div className="flex flex-col items-center text-center">
        {slide.image && (
          <TemplateImg
            {...slide.image}
            priority={index === 0}
            components={components}
            className="mb-8 h-32 w-auto object-contain sm:h-40"
          />
        )}
        {slide.eyebrow && <Eyebrow>{slide.eyebrow}</Eyebrow>}
        <SlideTitle size="xl">{slide.title}</SlideTitle>
        {slide.subtitle && (
          <Subtitle className="mx-auto sm:text-xl">{slide.subtitle}</Subtitle>
        )}
        {slide.highlights && slide.highlights.length > 0 && (
          <Highlights items={slide.highlights} />
        )}
        {(slide.dateline || slide.preparedBy) && (
          <p className={cn('mt-10 text-sm', tone.muted)}>
            {[slide.preparedBy, slide.dateline].filter(Boolean).join(' · ')}
          </p>
        )}
      </div>
    </SlideFrame>
  );
}

export function SectionDividerRenderer({
  slide,
  index,
}: SlideRendererProps<SectionDividerSlide>) {
  const { components } = useDeck();
  const tone = toneOf(slide, 'glow');
  const a = accent('accent', tone.isLight);
  const hasImage = !!slide.image;
  return (
    <SlideFrame slide={slide} index={index} tone="glow">
      <div
        className={
          hasImage
            ? 'grid items-center gap-10 md:grid-cols-2 lg:gap-16'
            : 'flex flex-col items-center text-center'
        }
      >
        {slide.image && (
          <div {...reveal(0)} className="mie-deck-reveal order-2 md:order-1">
            <TemplateImg
              {...slide.image}
              components={components}
              className="mx-auto aspect-[3/4] w-full max-w-sm rounded-2xl object-cover"
            />
          </div>
        )}
        <div className={hasImage ? 'order-1 md:order-2' : 'max-w-4xl'}>
          {slide.eyebrow && <Eyebrow>{slide.eyebrow}</Eyebrow>}
          {slide.statement && (
            <p
              {...reveal(1)}
              className="mie-deck-reveal text-6xl font-extrabold tracking-tight text-balance sm:text-7xl lg:text-8xl"
            >
              {slide.statement}
            </p>
          )}
          <SlideTitle
            size={slide.statement ? 'md' : 'lg'}
            className={cn(slide.statement && 'mt-3 font-semibold opacity-80')}
          >
            {slide.title}
          </SlideTitle>
          {slide.description && (
            <Subtitle className={cn(!hasImage && 'mx-auto')}>
              {slide.description}
            </Subtitle>
          )}
          <div
            aria-hidden="true"
            className={cn(
              'mt-8 h-1 w-24 rounded-full',
              a.fill,
              !hasImage && 'mx-auto'
            )}
          />
        </div>
      </div>
    </SlideFrame>
  );
}

export function TableOfContentsRenderer({
  slide,
  index,
}: SlideRendererProps<TableOfContentsSlide>) {
  const { slides, activeSlide, goTo, labels } = useDeck();
  const tone = toneOf(slide, 'brand');
  const a = accent('accent', tone.isLight);
  const sections =
    slide.sections ??
    Object.entries(
      slides.reduce<Record<string, OutlineEntry[]>>((acc, s, i) => {
        if (i === index || !('title' in s) || !s.title) return acc;
        (acc[s.section ?? ''] ??= []).push({
          number: i + 1,
          title: s.navLabel ?? s.title,
        });
        return acc;
      }, {})
    ).map(([heading, items]) => ({ heading: heading || undefined, items }));
  return (
    <SlideFrame slide={slide} index={index} tone="brand">
      <SlideHeader
        eyebrow={slide.eyebrow}
        title={slide.title}
        subtitle={slide.description}
      />
      <nav aria-label={labels.outline} className="mt-6 md:columns-2 md:gap-12">
        {sections.map((section, s) => (
          <div
            key={section.heading ?? s}
            {...reveal(3 + s)}
            className="mie-deck-reveal mb-5 break-inside-avoid"
          >
            {section.heading && (
              <h3
                className={cn(
                  'mb-1.5 text-xs font-semibold tracking-[0.2em] uppercase',
                  a.text
                )}
              >
                {section.heading}
              </h3>
            )}
            <ul className="flex flex-col gap-0.5">
              {section.items.map((entry) => {
                const target = entry.number - 1;
                const current = target === activeSlide;
                return (
                  <li key={entry.number}>
                    <button
                      type="button"
                      onClick={() => goTo(target)}
                      aria-current={current ? 'true' : undefined}
                      className={cn(
                        'flex w-full items-baseline gap-3 rounded-lg px-3 py-1 text-start transition-colors',
                        current
                          ? a.soft
                          : tone.isLight
                            ? 'hover:bg-neutral-100'
                            : 'hover:bg-white/5'
                      )}
                    >
                      <span
                        className={cn(
                          'text-sm font-semibold tabular-nums',
                          a.text
                        )}
                      >
                        {String(entry.number).padStart(2, '0')}
                      </span>
                      <span>
                        {entry.title}
                        {entry.subtitle && (
                          <span className={cn('block text-xs', tone.muted)}>
                            {entry.subtitle}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </SlideFrame>
  );
}

export function BulletListRenderer({
  slide,
  index,
}: SlideRendererProps<BulletListSlide>) {
  const tone = toneOf(slide, 'brand');
  const r = reveal(3);
  return (
    <SlideFrame slide={slide} index={index} tone="brand" width="lg">
      <SlideHeader
        eyebrow={slide.eyebrow}
        title={slide.title}
        subtitle={slide.subtitle}
      />
      <ul
        className={cn(r.className, 'mt-10 flex flex-col gap-4')}
        style={r.style}
      >
        {slide.items.map((item, i) => (
          <Bullet key={i} item={item} />
        ))}
      </ul>
      {slide.note && (
        <p className={cn('mt-8 text-sm italic', tone.muted)}>{slide.note}</p>
      )}
    </SlideFrame>
  );
}

export function QuoteRenderer({
  slide,
  index,
}: SlideRendererProps<QuoteSlide>) {
  const tone = toneOf(slide, 'brand');
  const a = accent('accent', tone.isLight);
  return (
    <SlideFrame
      slide={{
        ...slide,
        navLabel: slide.navLabel ?? slide.title ?? slide.attribution,
      }}
      index={index}
      tone="brand"
      width="md"
    >
      <figure className="flex flex-col items-center text-center">
        {slide.eyebrow && <Eyebrow>{slide.eyebrow}</Eyebrow>}
        {slide.title && (
          <SlideTitle size="md" className="mb-6">
            {slide.title}
          </SlideTitle>
        )}
        <span
          aria-hidden="true"
          className={cn('text-7xl leading-none sm:text-8xl', a.text)}
        >
          &ldquo;
        </span>
        <blockquote
          {...reveal(2)}
          className="mie-deck-reveal -mt-4 text-2xl leading-snug font-semibold text-balance sm:text-3xl lg:text-4xl"
        >
          {slide.quote}
        </blockquote>
        {(slide.attribution || slide.role) && (
          <figcaption {...reveal(3)} className="mie-deck-reveal mt-8">
            {slide.attribution && (
              <span className={cn('text-lg font-semibold', a.text)}>
                {slide.attribution}
              </span>
            )}
            {slide.role && (
              <span className={cn('block text-sm', tone.muted)}>
                {slide.role}
              </span>
            )}
          </figcaption>
        )}
        {slide.source && <SourceLink source={slide.source} className="mt-5" />}
      </figure>
    </SlideFrame>
  );
}

export function ImageRenderer({
  slide,
  index,
}: SlideRendererProps<ImageSlide>) {
  const { components } = useDeck();
  const tone = toneOf(slide, 'ink');
  return (
    <SlideFrame slide={slide} index={index} tone="ink">
      <SlideTitle className="mb-8 text-center">{slide.title}</SlideTitle>
      <figure {...reveal(2)} className="mie-deck-reveal">
        <TemplateImg
          {...slide.image}
          components={components}
          className="mx-auto max-h-[65dvh] w-auto rounded-2xl object-contain shadow-2xl"
        />
        {slide.caption && (
          <figcaption className={cn('mt-4 text-center text-sm', tone.muted)}>
            {slide.caption}
          </figcaption>
        )}
      </figure>
    </SlideFrame>
  );
}

export function DefinitionListRenderer({
  slide,
  index,
}: SlideRendererProps<DefinitionListSlide>) {
  const tone = toneOf(slide, 'brand');
  const a = accent('accent', tone.isLight);
  return (
    <SlideFrame slide={slide} index={index} tone="brand">
      <SlideHeader
        eyebrow={slide.eyebrow}
        title={slide.title}
        subtitle={slide.subtitle}
      />
      <dl className="mt-6 flex flex-col gap-2">
        {slide.terms.map((term, i) => {
          const initial = term.term.charAt(0);
          const r = reveal(3 + i);
          return (
            // A <dl> group div may contain only <dt>/<dd> (axe dlitem).
            <div
              key={term.term}
              className={cn(
                r.className,
                'rounded-xl border p-3',
                tone.card,
                tone.hairline
              )}
              style={r.style}
            >
              <dt className="flex items-center gap-4 text-base font-bold sm:text-lg">
                <span
                  aria-hidden="true"
                  className={cn(
                    'flex size-10 flex-none items-center justify-center rounded-lg border text-xl font-extrabold',
                    a.soft,
                    a.border,
                    a.text
                  )}
                >
                  {initial}
                </span>
                {term.term}
              </dt>
              <dd
                className={cn(
                  'ms-14 mt-0.5 text-sm leading-relaxed',
                  tone.muted
                )}
              >
                {term.lead && (
                  <span className={cn('font-semibold', tone.text)}>
                    {term.lead}{' '}
                  </span>
                )}
                {term.definition}
              </dd>
            </div>
          );
        })}
      </dl>
      {slide.source && <SourceLink source={slide.source} className="mt-4" />}
    </SlideFrame>
  );
}

function CopyLink({ url }: { url: string }) {
  const { labels } = useDeck();
  const tone = useTone();
  const [copied, setCopied] = React.useState(false);
  React.useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);
  return (
    <div
      className={cn(
        'mt-8 flex w-full max-w-xl items-center gap-2 rounded-xl border p-2',
        tone.card,
        tone.hairline
      )}
    >
      <code className="min-w-0 flex-1 truncate px-2 text-start text-sm">
        {url}
      </code>
      <button
        type="button"
        onClick={() =>
          navigator.clipboard?.writeText(url).then(
            () => setCopied(true),
            () => {}
          )
        }
        className={cn(
          'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold',
          tone.isLight
            ? 'bg-neutral-900 text-white'
            : 'bg-white text-neutral-900'
        )}
      >
        {copied ? (
          <Check aria-hidden="true" className="size-4" />
        ) : (
          <Copy aria-hidden="true" className="size-4" />
        )}
        <span aria-live="polite">{copied ? labels.copied : labels.copy}</span>
      </button>
    </div>
  );
}

function CtaButton({ link, primary }: { link: DeckLink; primary?: boolean }) {
  const { components } = useDeck();
  const tone = useTone();
  return (
    <TemplateAnchor
      href={link.href}
      trackingId={link.trackingId}
      components={components}
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-colors',
        primary
          ? 'bg-accent text-neutral-950 hover:opacity-90'
          : cn(
              'border',
              tone.hairline,
              tone.isLight ? 'hover:bg-neutral-100' : 'hover:bg-white/10'
            )
      )}
    >
      {link.label}
      {primary && (
        <ArrowRight aria-hidden="true" className="size-4 rtl:-scale-x-100" />
      )}
    </TemplateAnchor>
  );
}

export function ConclusionRenderer({
  slide,
  index,
}: SlideRendererProps<ConclusionSlide>) {
  const tone = toneOf(slide, 'brand');
  return (
    <SlideFrame slide={slide} index={index} tone="brand" width="sm">
      <div className="flex flex-col items-center text-center">
        {slide.eyebrow && <Eyebrow>{slide.eyebrow}</Eyebrow>}
        <SlideTitle>{slide.title}</SlideTitle>
        {slide.body && <Subtitle className="mx-auto">{slide.body}</Subtitle>}
        {slide.highlights && slide.highlights.length > 0 && (
          <Highlights items={slide.highlights} />
        )}
        {slide.takeaways && slide.takeaways.length > 0 && (
          <ul
            {...reveal(4)}
            className="mie-deck-reveal mt-10 flex flex-col gap-3 text-start"
          >
            {slide.takeaways.map((t) => (
              <Bullet key={t} item={t} />
            ))}
          </ul>
        )}
        {slide.share && (
          <>
            {slide.share.instructions && (
              <p className={cn('mt-10 text-sm', tone.muted)}>
                {slide.share.instructions}
              </p>
            )}
            <CopyLink url={slide.share.url} />
          </>
        )}
        {(slide.cta || slide.secondaryCta) && (
          <div
            {...reveal(5)}
            className="mie-deck-reveal mt-12 flex flex-wrap items-center justify-center gap-4"
          >
            {slide.cta && <CtaButton link={slide.cta} primary />}
            {slide.secondaryCta && <CtaButton link={slide.secondaryCta} />}
          </div>
        )}
        {(slide.preparedBy || slide.dateline) && (
          <p className={cn('mt-10 text-sm', tone.muted)}>
            {[slide.preparedBy, slide.dateline].filter(Boolean).join(' · ')}
          </p>
        )}
        {slide.confidentiality && (
          <p
            className={cn('mt-3 text-xs tracking-wider uppercase', tone.muted)}
          >
            {slide.confidentiality}
          </p>
        )}
      </div>
    </SlideFrame>
  );
}
