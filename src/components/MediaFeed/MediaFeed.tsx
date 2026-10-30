import * as React from 'react';
import { ChevronDown, ChevronUp, Maximize2 } from 'lucide-react';
import { cn } from '../../utils/cn';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { Avatar } from '../Avatar';
import { Button } from '../Button';
import { defaultMediaControlsLabels } from '../MediaPlayer/MediaControls';
import { overlayButtonClass } from '../MediaPlayer/overlayButton';
import {
  exitPictureInPicture,
  isInPictureInPicture,
} from '../MediaPlayer/pictureInPicture';
import { Modal, ModalClose, ModalHeader, ModalTitle } from '../Modal';
import { FeedMedia } from './FeedMedia';
import type {
  MediaFeedAuthor,
  MediaFeedClassNames,
  MediaFeedLabels,
  MediaFeedProps,
} from './types';

const defaultLabels: MediaFeedLabels = {
  feed: 'Media feed',
  loading: 'Loading media…',
  empty: 'No media to display.',
  error: 'Unable to load the media feed.',
  retry: 'Retry',
  fullscreen: 'Open fullscreen',
  close: 'Close fullscreen',
  previous: 'Previous item',
  next: 'Next item',
  play: 'Play',
  pause: 'Pause',
  // The player's own controls, in the overlay layout.
  mute: defaultMediaControlsLabels.mute,
  unmute: defaultMediaControlsLabels.unmute,
  seek: defaultMediaControlsLabels.seek,
  playerFullscreen: defaultMediaControlsLabels.fullscreen,
  exitPlayerFullscreen: defaultMediaControlsLabels.exitFullscreen,
  pictureInPicture: defaultMediaControlsLabels.pictureInPicture,
  exitPictureInPicture: defaultMediaControlsLabels.exitPictureInPicture,
  time: defaultMediaControlsLabels.time,
  playerRate: defaultMediaControlsLabels.rate,
  playerSpeed: defaultMediaControlsLabels.speed,
  showCaptions: defaultMediaControlsLabels.showCaptions,
  hideCaptions: defaultMediaControlsLabels.hideCaptions,
  showMore: 'Show more',
  showLess: 'Show less',
  blockedAutoplay: 'Playback did not start. Press Play to try again.',
  mediaError: 'This media is unavailable.',
  openSource: 'Open source',
  youtubeNotice: 'If embedded playback is unavailable, open the source.',
  item: (position, total) => `Media item ${position} of ${total}`,
  position: (position, total) => `${position} / ${total}`,
};

/**
 * The `overlay` layout's details: who posted it, its title and caption, over
 * the top of the clip on a gradient. Only its own controls take a tap; the
 * rest of a tap reaches the player beneath (play/pause). An untitled item
 * shows no title: the position counter already names it on screen, and the
 * item's `aria-label` names it for assistive tech.
 */
function OverlayDetails({
  author,
  title,
  caption,
  actions,
  fullscreenButton,
  labels,
  classNames,
}: {
  author?: MediaFeedAuthor;
  title?: string;
  caption?: React.ReactNode;
  actions?: React.ReactNode;
  fullscreenButton: React.ReactNode;
  labels: MediaFeedLabels;
  classNames: MediaFeedClassNames;
}) {
  // Only words that add something: not empty, not the title over again.
  const showCaption =
    caption != null &&
    caption !== '' &&
    !(typeof caption === 'string' && caption.trim() === (title ?? '').trim());
  const textId = React.useId();
  const titleRef = React.useRef<HTMLHeadingElement>(null);
  const captionRef = React.useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = React.useState(false);
  const [clipped, setClipped] = React.useState(false);
  // Is the one-line title or the two-line caption cut off? Measured again
  // whenever their boxes change (a phone turned, the window resized, fonts
  // arriving), since that decides whether Show more is needed.
  React.useLayoutEffect(() => {
    if (expanded) return;
    const titleEl = titleRef.current;
    const captionEl = captionRef.current;
    const measure = () =>
      setClipped(
        (!!titleEl && titleEl.scrollWidth > titleEl.clientWidth + 1) ||
          (!!captionEl && captionEl.scrollHeight > captionEl.clientHeight + 1)
      );
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    for (const el of [titleEl, captionEl]) if (el) observer.observe(el);
    return () => observer.disconnect();
  }, [title, caption, expanded]);
  return (
    <div
      data-slot="details"
      data-expanded={expanded || undefined}
      className={cn(
        'pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start gap-2 bg-gradient-to-b from-black/80 via-black/60 to-transparent px-3 pt-2 pb-10 text-white [text-shadow:0_1px_2px_rgb(0_0_0/0.6)]',
        // A darker scrim behind the full text, which can run over a bright frame.
        expanded && 'via-black/75',
        classNames.details
      )}
    >
      {author && (
        <Avatar
          name={author.name}
          src={author.avatar}
          alt=""
          size="xs"
          className="mt-0.5 shrink-0"
        />
      )}
      <div id={textId} className="min-w-0 flex-1 leading-5">
        {author && (
          <p
            data-slot="author"
            // Host text can be in any language: each line takes its own
            // direction, so it truncates at its own end, and is only as wide
            // as its text, so it still sits at the page's start edge.
            dir="auto"
            className={cn(
              'm-0 w-fit max-w-full truncate text-xs font-medium',
              classNames.author
            )}
          >
            {author.name}
          </p>
        )}
        {title && (
          <h3
            ref={titleRef}
            data-slot="title"
            dir="auto"
            className={cn(
              'm-0 w-fit max-w-full text-sm font-semibold',
              expanded ? 'break-words' : 'truncate',
              classNames.title
            )}
          >
            {title}
          </h3>
        )}
        {showCaption && (
          // A div, not a p: a host caption can hold block content, and its
          // links stay tappable through the details layer. Expanded, it
          // scrolls within 40% of the screen, so a short landscape phone
          // still shows the clip.
          <div
            ref={captionRef}
            data-slot="caption"
            dir="auto"
            className={cn(
              'pointer-events-auto m-0 w-fit max-w-full text-xs break-words text-white/90',
              expanded
                ? 'max-h-[40dvh] overflow-y-auto overscroll-contain'
                : 'line-clamp-2',
              classNames.caption
            )}
          >
            {caption}
          </div>
        )}
        {(clipped || expanded) && (
          <button
            type="button"
            data-slot="details-toggle"
            aria-expanded={expanded}
            aria-controls={textId}
            onClick={() => setExpanded((open) => !open)}
            className="pointer-events-auto mt-0.5 rounded-sm text-xs font-semibold text-white underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-white/70"
          >
            {expanded ? labels.showLess : labels.showMore}
          </button>
        )}
      </div>
      {(actions || fullscreenButton) && (
        <div className="pointer-events-auto -me-1 -mt-1 flex shrink-0 items-center gap-1">
          {actions && (
            <div
              data-slot="actions"
              className={cn(
                'flex flex-wrap items-center justify-end gap-2',
                classNames.actions
              )}
            >
              {actions}
            </div>
          )}
          {fullscreenButton}
        </div>
      )}
    </div>
  );
}

/**
 * A vertical, caller-owned media collection with one active playback surface.
 * Native players share MediaPlayer; provider-specific players can use the
 * renderMedia slot. Records, engagement actions and navigation belong to the host.
 */
function MediaFeedInner<T>(
  {
    items,
    getId,
    getMedia,
    getTitle,
    getCaption,
    getAuthor,
    renderActions,
    renderMedia,
    layout = 'stacked',
    allowFullscreen: allowFullscreenProp,
    activeItemId,
    defaultActiveItemId,
    onActiveItemChange,
    playbackRequest,
    loading = false,
    error,
    onRetry,
    autoPlay = true,
    muted = true,
    loop = true,
    labels: labelOverrides,
    classNames = {},
    className,
    ...rest
  }: MediaFeedProps<T>,
  forwardedRef: React.ForwardedRef<HTMLDivElement>
) {
  const labels = { ...defaultLabels, ...labelOverrides };
  const overlay = layout === 'overlay';
  // The overlay already fills its space and the player has its own full
  // screen, so the viewer is opt-in there.
  const allowFullscreen = allowFullscreenProp ?? !overlay;
  const prefersReducedMotion = usePrefersReducedMotion();
  const allowAutoPlay = autoPlay && !prefersReducedMotion;
  const ids = items.map(getId);
  const idsKey = JSON.stringify(ids);
  const [internalActiveId, setInternalActiveId] = React.useState(
    () => defaultActiveItemId ?? ids[0]
  );
  const requestedId = activeItemId ?? internalActiveId;
  const activeId =
    requestedId !== undefined && ids.includes(requestedId)
      ? requestedId
      : ids[0];
  const activeIndex = activeId === undefined ? -1 : ids.indexOf(activeId);
  const [fullscreen, setFullscreen] = React.useState(false);
  const [retrying, setRetrying] = React.useState(false);
  const [retryFailed, setRetryFailed] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const viewportRef = React.useRef<HTMLDivElement | null>(null);
  const cardRefs = React.useRef(new Map<string, HTMLElement>());
  const playbackPositions = React.useRef(
    new Map<string, { src: string; timeMs: number; playRequested?: boolean }>()
  );
  const consumedPlaybackRequests = React.useRef(
    new Map<string, string | number>()
  );
  const fullscreenTriggerRef = React.useRef<HTMLButtonElement | null>(null);
  const hasObserver = typeof IntersectionObserver !== 'undefined';
  // Hydration safety: the server cannot know whether the client supports
  // IntersectionObserver, so both environments start "not visible" and the
  // mount effects below establish real visibility (observer callbacks, or the
  // no-observer fallback). Offscreen autoplay therefore never starts early.
  const [visibleId, setVisibleId] = React.useState<string | null>(null);
  const visibleIdRef = React.useRef(visibleId);
  const [viewportVisible, setViewportVisible] = React.useState(false);
  const [pageVisible, setPageVisible] = React.useState(
    () =>
      typeof document === 'undefined' || document.visibilityState !== 'hidden'
  );
  const latest = React.useRef({
    items,
    ids,
    activeId,
    activeItemId,
    onActiveItemChange,
    fullscreen,
  });
  latest.current = {
    items,
    ids,
    activeId,
    activeItemId,
    onActiveItemChange,
    fullscreen,
  };

  const setRoot = React.useCallback(
    (node: HTMLDivElement | null) => {
      rootRef.current = node;
      if (typeof forwardedRef === 'function') forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    },
    [forwardedRef]
  );

  const select = React.useCallback((id: string) => {
    const current = latest.current;
    const index = current.ids.indexOf(id);
    if (index < 0 || id === current.activeId) return;
    if (current.activeItemId === undefined) setInternalActiveId(id);
    current.onActiveItemChange?.(current.items[index]);
  }, []);

  // Visibility belongs to this feed, never a global keyboard/player singleton.
  // A separate viewport observer also pauses a feed scrolled off the host page.
  React.useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof IntersectionObserver === 'undefined') {
      // No-observer fallback: assume the feed is on screen.
      setViewportVisible(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      setViewportVisible(entry.isIntersecting);
    });
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || typeof IntersectionObserver === 'undefined') return;
    const ratios = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = (entry.target as HTMLElement).dataset.mediaId;
          if (id !== undefined)
            ratios.set(id, entry.isIntersecting ? entry.intersectionRatio : 0);
        }
        let bestId: string | null = null;
        let bestRatio = 0;
        for (const [id, ratio] of ratios) {
          if (ratio > bestRatio) {
            bestId = id;
            bestRatio = ratio;
          }
        }
        visibleIdRef.current = bestId;
        setVisibleId(bestId);
        if (bestId !== null && !latest.current.fullscreen) select(bestId);
      },
      { root: viewport, threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    cardRefs.current.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [idsKey, loading, error, select]);

  React.useEffect(() => {
    const update = () => setPageVisible(document.visibilityState !== 'hidden');
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);

  // Controlled selection and initial deep links scroll within the feed, without
  // moving the surrounding inbox/page. Observer selections are already visible.
  React.useEffect(() => {
    if (activeId === undefined) return;
    if (!hasObserver) {
      visibleIdRef.current = activeId;
      setVisibleId(activeId);
    }
    if (visibleIdRef.current === activeId && hasObserver) return;
    const card = cardRefs.current.get(activeId);
    if (card && viewportRef.current) {
      viewportRef.current.scrollTo?.({ top: card.offsetTop, behavior: 'auto' });
    }
  }, [activeId, idsKey, hasObserver, loading, error]);

  React.useEffect(() => {
    if (!items.length || !allowFullscreen) setFullscreen(false);
  }, [items.length, allowFullscreen]);

  // The gesture targets an already selected, visible surface. Consume it once
  // per feed so a later source/fullscreen remount cannot resurrect a paused clip.
  React.useEffect(() => {
    if (
      loading ||
      error ||
      activeIndex < 0 ||
      !playbackRequest ||
      playbackRequest.itemId !== activeId
    )
      return;
    if (
      !pageVisible ||
      (!fullscreen && (!viewportVisible || visibleId !== activeId))
    )
      return;
    consumedPlaybackRequests.current.set(
      playbackRequest.itemId,
      playbackRequest.requestId
    );
  }, [
    activeId,
    activeIndex,
    fullscreen,
    pageVisible,
    viewportVisible,
    visibleId,
    playbackRequest,
    loading,
    error,
  ]);

  React.useEffect(() => {
    const positions = playbackPositions.current;
    for (const id of positions.keys()) {
      if (!latest.current.ids.includes(id)) positions.delete(id);
    }
  }, [idsKey]);

  React.useEffect(() => {
    if (fullscreen || !fullscreenTriggerRef.current) return;
    if (fullscreenTriggerRef.current.isConnected)
      fullscreenTriggerRef.current.focus();
    else viewportRef.current?.focus();
    fullscreenTriggerRef.current = null;
  }, [fullscreen]);

  const navigate = (index: number, focus = false) => {
    const id = ids[Math.max(0, Math.min(index, ids.length - 1))];
    if (id === undefined) return;
    select(id);
    const card = cardRefs.current.get(id);
    if (card && viewportRef.current) {
      viewportRef.current.scrollTo?.({ top: card.offsetTop, behavior: 'auto' });
      if (focus) card.focus({ preventScroll: true });
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    // Never steal arrows/Space from a player, reaction button or chat composer.
    const target = event.target as HTMLElement;
    if (event.target !== event.currentTarget && target.dataset?.slot !== 'item')
      return;
    let next: number;
    switch (event.key) {
      case 'ArrowDown':
      case 'PageDown':
        next = activeIndex + 1;
        break;
      case 'ArrowUp':
      case 'PageUp':
        next = activeIndex - 1;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = items.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    navigate(next, event.target !== event.currentTarget);
  };

  const retry = async () => {
    if (!onRetry || retrying) return;
    setRetrying(true);
    setRetryFailed(false);
    try {
      await onRetry();
    } catch {
      setRetryFailed(true);
    } finally {
      setRetrying(false);
    }
  };

  const renderCard = (item: T, index: number, immersive: boolean) => {
    const id = getId(item);
    const media = getMedia(item);
    let playbackPosition = playbackPositions.current.get(id);
    if (!playbackPosition || playbackPosition.src !== media.src) {
      playbackPosition = { src: media.src, timeMs: 0 };
      playbackPositions.current.set(id, playbackPosition);
    }
    const ownTitle = getTitle?.(item);
    const title = ownTitle || labels.item(index + 1, items.length);
    const author = getAuthor?.(item);
    const caption = getCaption?.(item);
    const active =
      !loading &&
      !error &&
      pageVisible &&
      (immersive
        ? fullscreen && id === activeId
        : !fullscreen &&
          viewportVisible &&
          id === activeId &&
          id === visibleId);
    const playbackRequestId =
      active &&
      playbackRequest?.itemId === id &&
      consumedPlaybackRequests.current.get(id) !== playbackRequest.requestId
        ? playbackRequest.requestId
        : undefined;
    const fullscreenButton = allowFullscreen && !immersive && (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-label={labels.fullscreen}
        title={labels.fullscreen}
        className={
          overlay
            ? cn(overlayButtonClass, 'shrink-0 bg-transparent')
            : undefined
        }
        onClick={(event) => {
          fullscreenTriggerRef.current = event.currentTarget;
          const open = () => {
            select(id);
            setFullscreen(true);
          };
          // A clip floating in picture in picture comes back first, so it
          // stops with the inline feed instead of playing alongside the viewer.
          const video = event.currentTarget
            .closest('[data-slot="item"]')
            ?.querySelector('video');
          if (isInPictureInPicture(video))
            void exitPictureInPicture(video).then(open);
          else open();
        }}
      >
        <Maximize2 className="h-4 w-4" aria-hidden="true" />
      </Button>
    );
    const mediaSlot = (
      <div
        data-slot="media"
        className={cn(
          overlay
            ? // Black letterboxing around the clip, as on VideoCard.
              'absolute inset-0 flex items-center justify-center bg-black'
            : 'bg-muted flex min-h-0 flex-1 items-center justify-center p-3',
          classNames.media
        )}
      >
        {renderMedia ? (
          renderMedia(media, {
            item,
            active,
            autoPlay: allowAutoPlay,
            muted,
            loop,
            playbackRequestId,
          })
        ) : (
          <FeedMedia
            key={`${id}:${media.kind}:${media.src}:${immersive}`}
            media={media}
            title={title}
            active={active}
            autoPlay={allowAutoPlay}
            muted={muted}
            loop={loop}
            labels={labels}
            onActivate={() => select(id)}
            playbackPosition={playbackPosition}
            playbackRequestId={playbackRequestId}
            overlay={overlay}
          />
        )}
      </div>
    );
    return (
      <article
        key={id}
        ref={
          immersive
            ? undefined
            : (node) => {
                if (node) cardRefs.current.set(id, node);
                else cardRefs.current.delete(id);
              }
        }
        data-slot="item"
        data-media-id={id}
        data-active={active}
        aria-label={title}
        aria-posinset={index + 1}
        aria-setsize={items.length}
        tabIndex={id === activeId ? 0 : -1}
        className={cn(
          overlay
            ? 'relative h-full min-h-0 w-full snap-start snap-always overflow-hidden bg-black focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white/70'
            : 'border-border bg-card text-card-foreground focus-visible:ring-ring flex min-h-0 w-full snap-start flex-col overflow-hidden border focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset',
          overlay
            ? immersive
              ? 'flex-1'
              : 'shrink-0'
            : immersive
              ? 'h-full flex-1 border-0'
              : 'h-full shrink-0 rounded-xl',
          classNames.item
        )}
      >
        {overlay ? (
          <>
            {/* The details come first in the DOM so focus visits them before
                the player's bar, matching what's on screen. */}
            <OverlayDetails
              author={author}
              title={ownTitle}
              caption={caption}
              actions={renderActions?.(item)}
              fullscreenButton={fullscreenButton}
              labels={labels}
              classNames={classNames}
            />
            {mediaSlot}
          </>
        ) : (
          <>
            {mediaSlot}
            <div
              data-slot="details"
              className={cn(
                'flex max-h-[40%] shrink-0 flex-col gap-2 overflow-y-auto p-4',
                classNames.details
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  {author && (
                    <div
                      data-slot="author"
                      className={cn(
                        'mb-2 flex items-center gap-2',
                        classNames.author
                      )}
                    >
                      <Avatar
                        name={author.name}
                        src={author.avatar}
                        alt=""
                        size="sm"
                      />
                      <span className="truncate text-sm font-medium">
                        {author.name}
                      </span>
                    </div>
                  )}
                  <h3
                    data-slot="title"
                    className={cn(
                      'm-0 text-base font-semibold',
                      classNames.title
                    )}
                  >
                    {title}
                  </h3>
                </div>
                {fullscreenButton}
              </div>
              {caption != null && (
                <div
                  data-slot="caption"
                  className={cn(
                    'text-muted-foreground text-sm',
                    classNames.caption
                  )}
                >
                  {caption}
                </div>
              )}
              {renderActions && (
                <div
                  data-slot="actions"
                  className={cn(
                    'flex flex-wrap items-center gap-2',
                    classNames.actions
                  )}
                >
                  {renderActions(item)}
                </div>
              )}
            </div>
          </>
        )}
      </article>
    );
  };

  const controls = overlay ? (
    // Over the feed's end edge, stacked the way the feed scrolls, clear of the
    // details along the top and the player's bar along the bottom.
    <div
      data-slot="controls"
      className={cn(
        'pointer-events-none absolute end-2 top-1/2 z-10 flex -translate-y-1/2 flex-col items-center gap-1.5',
        classNames.controls
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={labels.previous}
        title={labels.previous}
        className={cn(overlayButtonClass, 'pointer-events-auto')}
        disabled={activeIndex <= 0}
        onClick={() => navigate(activeIndex - 1)}
      >
        <ChevronUp className="h-5 w-5" aria-hidden="true" />
      </Button>
      <span
        role="status"
        aria-live="polite"
        className="rounded-full bg-black/45 px-1.5 py-0.5 text-xs whitespace-nowrap text-white tabular-nums backdrop-blur-sm"
      >
        {/* Its own direction: "2 / 3" stays in order in an RTL page, and a
            translated "2 من 3" still reads right to left. */}
        <bdi>{labels.position(activeIndex + 1, items.length)}</bdi>
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={labels.next}
        title={labels.next}
        className={cn(overlayButtonClass, 'pointer-events-auto')}
        disabled={activeIndex >= items.length - 1}
        onClick={() => navigate(activeIndex + 1)}
      >
        <ChevronDown className="h-5 w-5" aria-hidden="true" />
      </Button>
    </div>
  ) : (
    <div
      data-slot="controls"
      className={cn(
        'flex shrink-0 items-center justify-between gap-3 py-2',
        classNames.controls
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-auto min-h-8 flex-1 py-2 [&_[data-slot=button-label]]:whitespace-normal"
        disabled={activeIndex <= 0}
        onClick={() => navigate(activeIndex - 1)}
        leftIcon={<ChevronUp className="h-4 w-4" aria-hidden="true" />}
      >
        {labels.previous}
      </Button>
      <span
        role="status"
        aria-live="polite"
        className="text-muted-foreground shrink-0 text-sm whitespace-nowrap"
      >
        {/* Its own direction: "2 / 3" stays in order in an RTL page, and a
            translated "2 من 3" still reads right to left. */}
        <bdi>{labels.position(activeIndex + 1, items.length)}</bdi>
      </span>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-auto min-h-8 flex-1 py-2 [&_[data-slot=button-label]]:whitespace-normal"
        disabled={activeIndex >= items.length - 1}
        onClick={() => navigate(activeIndex + 1)}
        rightIcon={<ChevronDown className="h-4 w-4" aria-hidden="true" />}
      >
        {labels.next}
      </Button>
    </div>
  );

  return (
    <div
      ref={setRoot}
      data-slot="root"
      data-component="media-feed"
      data-layout={layout}
      // The overlay layout is a dark surface in every theme, as video players
      // are; scoping the dark theme keeps library and host content inside it
      // (actions, errors, Retry) on their dark-theme colours.
      data-theme={overlay ? 'dark' : undefined}
      className={cn(
        'bg-background text-foreground flex h-[min(48rem,80dvh)] min-h-0 w-full flex-col',
        overlay && 'relative',
        classNames.root,
        className
      )}
      {...rest}
    >
      {loading || error || !items.length ? (
        <div
          data-slot="status"
          role={error ? 'alert' : 'status'}
          aria-busy={loading || retrying}
          className={cn(
            'flex min-h-0 flex-1 flex-col items-center justify-center gap-4 p-6 text-center',
            classNames.status
          )}
        >
          <p className="m-0">
            {loading ? labels.loading : error || labels.empty}
          </p>
          {error && onRetry && (
            <Button
              type="button"
              variant="outline"
              isLoading={retrying}
              loadingText={labels.loading}
              onClick={() => {
                void retry();
              }}
            >
              {labels.retry}
            </Button>
          )}
          {retryFailed && (
            <p role="alert" className="m-0">
              {labels.error}
            </p>
          )}
        </div>
      ) : (
        <>
          {/* ARIA feeds are focusable composites with scoped item navigation. */}
          {/* eslint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex */}
          <div
            ref={viewportRef}
            data-slot="viewport"
            role="feed"
            aria-label={labels.feed}
            aria-busy={false}
            tabIndex={0}
            onKeyDown={handleKeyDown}
            className={cn(
              'focus-visible:ring-ring relative flex min-h-0 flex-1 snap-y snap-mandatory flex-col overflow-y-auto overscroll-contain focus-visible:ring-2 focus-visible:outline-none',
              !overlay && 'gap-4',
              classNames.viewport
            )}
          >
            {items.map((item, index) => renderCard(item, index, false))}
          </div>
          {/* eslint-enable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex */}
          {controls}
        </>
      )}
      <Modal
        open={
          allowFullscreen && fullscreen && !loading && !error && !!items.length
        }
        onOpenChange={setFullscreen}
        size="full"
        className="h-dvh min-h-0 sm:h-[calc(100dvh-2rem)]"
      >
        <ModalHeader>
          <ModalTitle>{labels.feed}</ModalTitle>
          <ModalClose aria-label={labels.close} />
        </ModalHeader>
        {/* Fullscreen keeps the same feed navigation; controls retain their keys. */}
        {/* eslint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex */}
        <div
          data-slot="fullscreen"
          data-component="media-feed"
          data-layout={layout}
          // Set again here in case Modal ever portals its content out of the
          // feed's dark scope.
          data-theme={overlay ? 'dark' : undefined}
          role="feed"
          aria-label={labels.feed}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          className={cn(
            'flex min-h-0 flex-1 flex-col px-2 pb-2 sm:px-4',
            overlay && 'relative',
            classNames.fullscreen
          )}
        >
          {activeIndex >= 0 &&
            renderCard(items[activeIndex], activeIndex, true)}
          {controls}
        </div>
        {/* eslint-enable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex */}
      </Modal>
    </div>
  );
}

export const MediaFeed = React.forwardRef(MediaFeedInner) as <T>(
  props: MediaFeedProps<T> & React.RefAttributes<HTMLDivElement>
) => React.ReactElement;

(MediaFeed as React.NamedExoticComponent).displayName = 'MediaFeed';
