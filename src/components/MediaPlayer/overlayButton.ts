// Internal to the media components; not part of the public API.

/**
 * The round, translucent icon button over a video (the feed's Previous/Next,
 * its inactive item's Play). Pass it to `<Button variant="ghost" size="icon">`;
 * it sets the `dark:` colours too, because these buttons sit inside a
 * `data-theme="dark"` surface. Add `bg-transparent` where the button sits on a
 * scrim already, as the player's bar does. The scrim is black on purpose: it
 * has to read over any frame of the video.
 */
export const overlayButtonClass = [
  'rounded-full bg-black/45 text-white backdrop-blur-sm',
  'hover:bg-black/65 hover:text-white active:bg-black/75',
  'dark:text-white dark:hover:bg-black/65 dark:active:bg-black/75',
  'focus-visible:ring-white focus-visible:ring-offset-0',
  'pointer-fine:h-9 pointer-fine:w-9',
].join(' ');

/** The large round ▶ in the middle of a paused video, and its glyph. */
export const playBadgeClass =
  'flex h-14 w-14 items-center justify-center rounded-full bg-black/60 text-white';
// Optical centring; media glyphs don't flip in RTL.
export const playBadgeIconClass = 'h-6 w-6 translate-x-0.5 fill-current';
