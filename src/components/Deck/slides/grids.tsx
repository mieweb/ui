import * as React from 'react';
import { ChevronRight, ExternalLink, Play } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { TemplateImg, safeHref } from '../../../templates/Section';
import { useDeck, useTone } from '../DeckContext';
import {
  Card,
  CountUp,
  DeckIcon,
  SlideHeader,
  SourceLink,
  reveal,
} from '../primitives';
import { SlideFrame } from '../SlideFrame';
import { accent, toneOf } from '../tones';
import type {
  Certification,
  CertificationGridSlide,
  ShowcaseSlide,
  SlideRendererProps,
} from '../types';

// --- certification grid ------------------------------------------------------------

function BadgeCard({ cert, i }: { cert: Certification; i: number }) {
  const { components } = useDeck();
  const tone = useTone();
  const a = accent(cert.accent ?? 'accent', tone.isLight);
  return (
    <Card i={i} className="flex flex-col items-center p-3 text-center">
      {cert.image ? (
        <div className="mb-2 flex h-11 items-center justify-center rounded-lg bg-white px-2.5">
          <TemplateImg
            {...cert.image}
            components={components}
            className="h-7 w-auto max-w-[72px] object-contain"
          />
        </div>
      ) : (
        <div
          aria-hidden="true"
          className={cn(
            'mb-2 flex size-10 items-center justify-center rounded-lg border text-sm font-extrabold',
            a.soft,
            a.border,
            a.text
          )}
        >
          {cert.badge ?? cert.name.slice(0, 3).toUpperCase()}
        </div>
      )}
      <div className="text-[0.8rem] leading-tight font-bold">{cert.name}</div>
      {cert.issuer && (
        <div
          className={cn(
            'mt-0.5 text-[0.62rem] tracking-wide uppercase',
            tone.muted
          )}
        >
          {cert.issuer}
        </div>
      )}
      {cert.source && <SourceLink source={cert.source} className="mt-1.5" />}
    </Card>
  );
}

export function CertificationGridRenderer({
  slide,
  index,
}: SlideRendererProps<CertificationGridSlide>) {
  const { components } = useDeck();
  const tone = toneOf(slide, 'deep');
  const count = slide.certifications.length;
  const featured = slide.featured;
  const cols = featured
    ? 'sm:grid-cols-3 lg:grid-cols-4'
    : count >= 5
      ? 'sm:grid-cols-3 lg:grid-cols-5'
      : count === 4
        ? 'sm:grid-cols-2 lg:grid-cols-4'
        : 'sm:grid-cols-3';
  return (
    <SlideFrame slide={slide} index={index} tone="deep">
      <SlideHeader
        eyebrow={slide.eyebrow}
        title={slide.title}
        subtitle={slide.subtitle}
      />
      <div
        className={
          featured
            ? 'mt-7 grid items-center gap-8 lg:grid-cols-[auto_minmax(0,1fr)] lg:gap-12'
            : 'mt-6'
        }
      >
        {featured && (
          <div
            {...reveal(3)}
            className="mie-deck-reveal flex flex-col items-center text-center"
          >
            <div className="flex size-40 items-center justify-center rounded-full bg-white p-2 shadow-2xl sm:size-48">
              {featured.image ? (
                <TemplateImg
                  {...featured.image}
                  components={components}
                  className="size-full object-contain"
                />
              ) : (
                <span className="text-2xl font-extrabold text-neutral-900">
                  {featured.badge ?? featured.name}
                </span>
              )}
            </div>
            <p className="mt-4 font-semibold">{featured.name}</p>
            {featured.description && (
              <p
                className={cn(
                  'mt-1 max-w-[15rem] text-sm leading-snug',
                  tone.muted
                )}
              >
                {featured.description}
              </p>
            )}
            {featured.source && (
              <SourceLink source={featured.source} className="mt-2.5" />
            )}
          </div>
        )}
        <div className={cn('grid grid-cols-2 gap-3', cols)}>
          {slide.certifications.map((cert, i) => (
            <BadgeCard key={cert.name} cert={cert} i={4 + i} />
          ))}
        </div>
      </div>
      {slide.footnote && (
        <SourceLink source={slide.footnote} className="mt-6" />
      )}
    </SlideFrame>
  );
}

// --- showcase ----------------------------------------------------------------------

const VISIBLE = 3;

function ShowcaseCategory({
  category,
  i,
}: {
  category: ShowcaseSlide['categories'][number];
  i: number;
}) {
  const { labels } = useDeck();
  const tone = useTone();
  const a = accent('primary', tone.isLight);
  const [open, setOpen] = React.useState(false);
  const listId = React.useId();
  const hidden = category.items.length - VISIBLE;
  return (
    <Card i={i} className="p-4">
      <h3
        className={cn(
          'mb-3 flex items-center gap-2 text-xs font-bold tracking-wider uppercase',
          a.text
        )}
      >
        {category.icon && <DeckIcon name={category.icon} className="size-4" />}
        {category.title}
        <span className={cn('ms-auto tabular-nums', tone.muted)}>
          {category.items.length}
        </span>
      </h3>
      <ul id={listId} className="space-y-1">
        {(open ? category.items : category.items.slice(0, VISIBLE)).map(
          (item) => (
            <li
              key={item}
              className={cn('flex gap-2 text-xs leading-relaxed', tone.muted)}
            >
              <ChevronRight
                aria-hidden="true"
                className="mt-0.5 size-3 flex-none rtl:-scale-x-100"
              />
              {item}
            </li>
          )
        )}
      </ul>
      {hidden > 0 && (
        <button
          type="button"
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => setOpen((o) => !o)}
          className={cn(
            'mt-2 text-xs font-medium underline-offset-2 hover:underline',
            a.text
          )}
        >
          {open ? labels.less : labels.more(hidden)}
        </button>
      )}
    </Card>
  );
}

export function ShowcaseRenderer({
  slide,
  index,
}: SlideRendererProps<ShowcaseSlide>) {
  const { components, labels } = useDeck();
  const tone = toneOf(slide, 'deep');
  const a = accent('accent', tone.isLight);
  const video = slide.video;
  // Slide JSON is content data; a video link with an executable scheme is dropped.
  const videoHref = video ? safeHref(video.href) : undefined;
  return (
    <SlideFrame slide={slide} index={index} tone="deep">
      <div className="mb-6 flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
        <SlideHeader
          eyebrow={slide.eyebrow}
          title={slide.title}
          subtitle={slide.subtitle}
        />
        {slide.total && (
          <div
            {...reveal(2)}
            className={cn(
              'mie-deck-reveal flex flex-none items-baseline gap-2 rounded-full border px-5 py-2',
              a.soft,
              a.border
            )}
          >
            <span className={cn('text-3xl font-bold', a.text)}>
              <CountUp value={slide.total.value} />
            </span>
            <span className={cn('text-sm', tone.muted)}>
              {slide.total.label}
            </span>
          </div>
        )}
      </div>
      <div
        className={cn('grid gap-6', videoHref && 'lg:grid-cols-[1fr_300px]')}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {slide.categories.map((cat, i) => (
            <ShowcaseCategory key={cat.title} category={cat} i={3 + i} />
          ))}
        </div>
        {video && videoHref && (
          <a
            href={videoHref}
            target="_blank"
            rel="noopener noreferrer"
            {...reveal(5)}
            className={cn(
              'mie-deck-reveal group flex flex-col overflow-hidden rounded-xl border lg:self-start',
              tone.hairline,
              tone.card
            )}
          >
            <div className="relative flex aspect-video items-center justify-center overflow-hidden bg-neutral-900">
              {video.thumbnail && (
                <TemplateImg
                  {...video.thumbnail}
                  components={components}
                  className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              )}
              <div className="absolute inset-0 bg-black/30" />
              <span className="bg-primary-600 relative flex size-14 items-center justify-center rounded-full border-2 border-white/30 shadow-xl transition-transform group-hover:scale-110">
                <Play
                  aria-hidden="true"
                  className="ms-1 size-6 fill-white text-white"
                />
              </span>
              {video.duration && (
                <span className="absolute end-2 bottom-2 rounded bg-black/60 px-2 py-0.5 font-mono text-xs text-white tabular-nums">
                  {video.duration}
                </span>
              )}
            </div>
            <div className="p-4">
              <p className="mb-1 text-sm font-semibold">{video.title}</p>
              {video.speaker && (
                <p className={cn('mb-2 text-xs', tone.muted)}>
                  {video.speaker}
                </p>
              )}
              <span
                className={cn(
                  'inline-flex items-center gap-1 text-xs font-medium',
                  a.text
                )}
              >
                {video.cta ?? labels.watchVideo}
                <ExternalLink aria-hidden="true" className="size-3" />
              </span>
            </div>
          </a>
        )}
      </div>
    </SlideFrame>
  );
}
