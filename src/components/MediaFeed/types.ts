import type * as React from 'react';

/** A caller-owned media resource. Provider embeds can also use `renderMedia`. */
export interface MediaFeedMedia {
  kind: 'image' | 'video' | 'audio' | 'youtube';
  src: string;
  poster?: string;
  alt?: string;
  /**
   * Its size in pixels (or any width and height in proportion), when the host
   * knows it, so a thread's tile keeps its space before the picture loads.
   */
  width?: number;
  height?: number;
}

export interface MediaFeedAuthor {
  name: string;
  avatar?: string;
}

/** An explicit Play gesture, separate from item selection and automatic playback. */
export interface MediaFeedPlaybackRequest {
  itemId: string;
  /** Use a fresh token for each gesture, including repeated Play on the same item. */
  requestId: string | number;
}

/** Custom players must stop playback whenever `active` is false. */
export interface MediaFeedRenderContext<T> {
  item: T;
  active: boolean;
  autoPlay: boolean;
  muted: boolean;
  loop: boolean;
  /** A pending manual Play token for this active item. Handle each token once. */
  playbackRequestId?: string | number;
}

/** Every string authored by the feed can be localized by its host. */
export interface MediaFeedLabels {
  feed: string;
  loading: string;
  empty: string;
  error: string;
  retry: string;
  fullscreen: string;
  close: string;
  previous: string;
  next: string;
  /** An image's zoom button in the overlay layout (a double tap zooms too). */
  zoomIn: string;
  zoomOut: string;
  play: string;
  pause: string;
  /** The player's own controls in the `overlay` layout. */
  mute: string;
  unmute: string;
  seek: string;
  playerFullscreen: string;
  exitPlayerFullscreen: string;
  pictureInPicture: string;
  exitPictureInPicture: string;
  /** The player's elapsed and total time, already formatted. */
  time: (current: string, duration: string) => string;
  /** The player's speed button: its text for a rate, and its name. */
  playerRate: (rate: number) => string;
  playerSpeed: (rate: string) => string;
  showCaptions: string;
  hideCaptions: string;
  /** The overlay's toggle for a title or caption that doesn't fit. */
  showMore: string;
  showLess: string;
  blockedAutoplay: string;
  mediaError: string;
  openSource: string;
  youtubeNotice: string;
  item: (position: number, total: number) => string;
  position: (position: number, total: number) => string;
}

/** Keys match the feed's `data-slot` attributes. */
export interface MediaFeedClassNames {
  root?: string;
  viewport?: string;
  item?: string;
  media?: string;
  details?: string;
  author?: string;
  title?: string;
  caption?: string;
  actions?: string;
  status?: string;
  controls?: string;
  fullscreen?: string;
}

export interface MediaFeedProps<T> extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'children' | 'onError'
> {
  /** Records in presentation order. The feed never fetches or mutates them. */
  items: readonly T[];
  /** A stable, unique ID for each record. */
  getId: (item: T) => string;
  getMedia: (item: T) => MediaFeedMedia;
  getTitle?: (item: T) => string;
  getCaption?: (item: T) => React.ReactNode;
  getAuthor?: (item: T) => MediaFeedAuthor;
  /** Host-owned actions, such as reactions or opening a conversation. */
  renderActions?: (item: T) => React.ReactNode;
  /**
   * `stacked` (default): each item is a card, its details under the media.
   * `overlay`: the media fills each item edge to edge on a dark stage, with
   * the details over its top, Previous/Next on the end edge, and the player's
   * touch-first overlay controls. Suits a phone or a full-height pane, upright
   * or sideways.
   */
  layout?: 'stacked' | 'overlay';
  /**
   * Which way the feed moves between items. `vertical` (default) scrolls up
   * and down, like a reel. `horizontal` swipes side to side (left and right
   * arrows, mirrored in a right-to-left page), as a chat app's photo viewer
   * does; its Previous/Next sit on the side edges, hidden on touch screens,
   * and its position is announced but not shown, for the host to show its own.
   */
  orientation?: 'vertical' | 'horizontal';
  /**
   * Offer the full-screen viewer, an expand button on each item. Defaults to
   * `true` for `stacked` and `false` for `overlay`, where the feed already
   * fills its space and the player has its own full screen.
   */
  allowFullscreen?: boolean;
  /** Replace the built-in player, respecting its active playback boundary. */
  renderMedia?: (
    media: MediaFeedMedia,
    context: MediaFeedRenderContext<T>
  ) => React.ReactNode;
  /** Controlled selection. Changes scroll the selected record into view. */
  activeItemId?: string;
  /** Initial selection for an uncontrolled feed. */
  defaultActiveItemId?: string;
  /** Fires for user navigation and visibility changes, with the original item. */
  onActiveItemChange?: (item: T) => void;
  /**
   * Attempt explicit playback once the requested item is selected and visible.
   * This bypasses reduced-motion/autoplay suppression for that gesture only;
   * it does not change selection. Browsers can still require another gesture.
   */
  playbackRequest?: MediaFeedPlaybackRequest;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void | Promise<void>;
  /** Attempt visible playback unless reduced motion is preferred; a gesture may be required. */
  autoPlay?: boolean;
  /** Native playback begins muted by default. Native controls can unmute it. */
  muted?: boolean;
  loop?: boolean;
  labels?: Partial<MediaFeedLabels>;
  classNames?: MediaFeedClassNames;
}
