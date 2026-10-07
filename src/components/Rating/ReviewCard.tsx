import * as React from 'react';
import { DateTime } from 'luxon';
import { cn } from '../../utils/cn';
import { Avatar } from '../Avatar/Avatar';
import { ClampedText } from '../ClampedText/ClampedText';
import { Rating, type RatingLabels } from './Rating';

export interface ReviewCardLabels {
  /** Source line, e.g. `via Google`. */
  source: (source: string) => string;
  /** Accessible name of the reply region. */
  reply: string;
  showMore: string;
  showLess: string;
}

export const defaultReviewCardLabels: ReviewCardLabels = {
  source: (source) => `via ${source}`,
  reply: 'Reply',
  showMore: 'Show more',
  showLess: 'Show less',
};

export interface ReviewCardProps extends React.HTMLAttributes<HTMLElement> {
  /** Who wrote the review. */
  author: { name: string; avatarUrl?: string | null };
  /** When it was written — ISO string or Date. */
  date: string | Date;
  /** Show the date as `3 days ago` (default) or as a localized date. */
  dateStyle?: 'relative' | 'absolute';
  /** BCP 47 locale for the date; defaults to the runtime locale. */
  locale?: string;
  /** Star rating, half-star precision. */
  rating: number;
  /** Review text; long bodies clamp with a Show more toggle. */
  body: string;
  /** Where the review came from, e.g. `Google`. */
  source?: string;
  /** Owner response shown under the review. */
  reply?: React.ReactNode;
  /** Lines shown before the body clamps. */
  bodyLines?: 2 | 3 | 4 | 5 | 6;
  /** Overrides for any user-facing string. */
  labels?: Partial<ReviewCardLabels>;
  /** Forwarded to the embedded Rating. */
  ratingLabels?: Partial<RatingLabels>;
}

/**
 * One review: author, star rating, date, source, clamped body and an optional
 * owner reply.
 *
 * @example
 * ```tsx
 * <ReviewCard author={{ name: 'Ann L.' }} date="2026-09-01" rating={4} body={text} source="Google" />
 * ```
 */
export const ReviewCard = React.forwardRef<HTMLElement, ReviewCardProps>(
  function ReviewCard(
    {
      author,
      date,
      dateStyle = 'relative',
      locale,
      rating,
      body,
      source,
      reply,
      bodyLines = 4,
      labels: labelOverrides,
      ratingLabels,
      className,
      ...props
    },
    ref
  ) {
    const labels = { ...defaultReviewCardLabels, ...labelOverrides };
    const parsed =
      typeof date === 'string'
        ? DateTime.fromISO(date)
        : DateTime.fromJSDate(date);
    const dt = locale ? parsed.setLocale(locale) : parsed;
    const absolute = dt.toLocaleString(DateTime.DATE_MED);

    return (
      <article
        ref={ref}
        data-slot="review-card"
        className={cn(
          'bg-card text-card-foreground border-border rounded-lg border p-4',
          className
        )}
        {...props}
      >
        <header className="flex items-start gap-3">
          <Avatar name={author.name} src={author.avatarUrl} alt="" size="md" />
          <div className="min-w-0 flex-1">
            <p className="text-foreground truncate text-sm font-medium">
              {author.name}
            </p>
            <div className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
              <Rating value={rating} size="sm" labels={ratingLabels} />
              <time dateTime={dt.toISO() ?? undefined} title={absolute}>
                {dateStyle === 'relative' ? dt.toRelative() : absolute}
              </time>
              {source && <span>{labels.source(source)}</span>}
            </div>
          </div>
        </header>
        <ClampedText
          text={body}
          lines={bodyLines}
          showMoreLabel={labels.showMore}
          showLessLabel={labels.showLess}
          className="text-foreground mt-3 block text-sm"
        />
        {reply && (
          <section
            aria-label={labels.reply}
            data-slot="review-card-reply"
            className="border-border text-muted-foreground mt-3 border-s-2 ps-3 text-sm"
          >
            {reply}
          </section>
        )}
      </article>
    );
  }
);
