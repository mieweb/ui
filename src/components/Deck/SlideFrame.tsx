import * as React from 'react';
import { cn } from '../../utils/cn';
import { ToneContext, useDeck } from './DeckContext';
import { TONES } from './tones';
import type { Slide, SlideTone } from './types';

export const slideAnchor = (slide: Slide, index: number) =>
  slide.id ?? `slide-${index}`;

export interface SlideFrameProps {
  slide: Slide;
  index: number;
  /** Default tone for this slide type; the slide's own `tone` wins. */
  tone: SlideTone;
  children: React.ReactNode;
  width?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const widthClass = {
  sm: 'max-w-3xl',
  md: 'max-w-4xl',
  lg: 'max-w-5xl',
  xl: 'max-w-6xl',
} as const;

/** The full-viewport snap target every slide renders into. */
export function SlideFrame({
  slide,
  index,
  tone: fallback,
  children,
  width = 'xl',
  className,
}: SlideFrameProps) {
  const { labels } = useDeck();
  const toneName = slide.tone ?? fallback;
  const tone = TONES[toneName];
  const title = 'title' in slide ? slide.title : undefined;
  return (
    <ToneContext.Provider value={tone}>
      <section
        id={slideAnchor(slide, index)}
        data-slot="deck-slide"
        data-index={index}
        data-tone={toneName}
        role="group"
        aria-roledescription={labels.slide}
        aria-label={slide.navLabel ?? title ?? `${index + 1}`}
        className={cn(
          'mie-deck-slide relative isolate flex min-h-dvh w-full snap-start snap-always flex-col items-center justify-center overflow-hidden px-5 py-12 sm:px-8 sm:py-14 md:px-12 lg:px-20',
          tone.surface,
          tone.text,
          className
        )}
      >
        {!tone.isLight && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 overflow-hidden print:hidden"
          >
            <div className="bg-accent/15 absolute -end-24 -top-24 size-[28rem] rounded-full blur-3xl" />
            <div className="bg-primary-500/15 absolute -start-24 -bottom-32 size-[32rem] rounded-full blur-3xl" />
          </div>
        )}
        <div className={cn('relative w-full', widthClass[width])}>
          {children}
        </div>
      </section>
    </ToneContext.Provider>
  );
}
