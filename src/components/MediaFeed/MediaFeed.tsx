import * as React from 'react';
import { ChevronDown, ChevronUp, Maximize2 } from 'lucide-react';
import { cn } from '../../utils/cn';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { Avatar } from '../Avatar';
import { Button } from '../Button';
import { Modal, ModalClose, ModalHeader, ModalTitle } from '../Modal';
import { FeedMedia } from './FeedMedia';
import type { MediaFeedLabels, MediaFeedProps } from './types';

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
  blockedAutoplay: 'Playback did not start. Press Play to try again.',
  mediaError: 'This media is unavailable.',
  openSource: 'Open source',
  youtubeNotice: 'If embedded playback is unavailable, open the source.',
  item: (position, total) => `Media item ${position} of ${total}`,
  position: (position, total) => `${position} / ${total}`,
};

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
    if (!items.length) setFullscreen(false);
  }, [items.length]);

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
    const title = getTitle?.(item) || labels.item(index + 1, items.length);
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
          'border-border bg-card text-card-foreground focus-visible:ring-ring flex min-h-0 w-full snap-start flex-col overflow-hidden border focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset',
          immersive ? 'h-full flex-1 border-0' : 'h-full shrink-0 rounded-xl',
          classNames.item
        )}
      >
        <div
          data-slot="media"
          className={cn(
            'bg-muted flex min-h-0 flex-1 items-center justify-center p-3',
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
            />
          )}
        </div>
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
                className={cn('m-0 text-base font-semibold', classNames.title)}
              >
                {title}
              </h3>
            </div>
            {!immersive && (
              <Button
                variant="ghost"
                size="sm"
                aria-label={labels.fullscreen}
                title={labels.fullscreen}
                onClick={(event) => {
                  fullscreenTriggerRef.current = event.currentTarget;
                  select(id);
                  setFullscreen(true);
                }}
              >
                <Maximize2 className="h-4 w-4" aria-hidden="true" />
              </Button>
            )}
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
      </article>
    );
  };

  const controls = (
    <div
      data-slot="controls"
      className={cn(
        'flex shrink-0 items-center justify-between gap-3 py-2',
        classNames.controls
      )}
    >
      <Button
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
        {labels.position(activeIndex + 1, items.length)}
      </span>
      <Button
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
      className={cn(
        'bg-background text-foreground flex h-[min(48rem,80dvh)] min-h-0 w-full flex-col',
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
              'focus-visible:ring-ring relative flex min-h-0 flex-1 snap-y snap-mandatory flex-col gap-4 overflow-y-auto overscroll-contain focus-visible:ring-2 focus-visible:outline-none',
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
        open={fullscreen && !loading && !error && !!items.length}
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
          role="feed"
          aria-label={labels.feed}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          className={cn(
            'flex min-h-0 flex-1 flex-col px-2 pb-2 sm:px-4',
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
