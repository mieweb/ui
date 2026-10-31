# MediaFeed — Maintainer Notes

Provider notes for changing the native media feed. Consumer guidance belongs in
its Storybook stories; migration context is in
[`news-widget-migration.md`](https://github.com/mieweb/ui/blob/main/lessons/news-widget-migration.md).
Follow the Modules contract in
[`CONTRIBUTING.md`](https://github.com/mieweb/ui/blob/main/CONTRIBUTING.md).

## Origin

This module adopts the feed presentation from
[`mieweb/news-widget`](https://github.com/mieweb/news-widget) at
`14f8f2a1d45507779c1b47f1458329ac8d3c3234`. The migration retains all 34 original
commits through an unrelated-history merge. Original files remain accessible
with `git show <source-sha>:news-widget/<path>`; there is no copied app or subtree
mirror in the current UI source tree.

The original package's `NewsWidget` was an alias of `App`, with fixed feeds,
RSS/Discourse hooks, hash routing, and a development backend. `MediaFeed` is a
native collection component. Completion of the migration and retirement of the
standalone repository remain pending UI pull request acceptance and a verified
release. Published `@mieweb/news-widget@1.0.0` is unchanged.

## Data and navigation stay with the host

- `MediaFeed<T>` accepts `items`, `getId`, and `getMedia`, plus optional title,
  caption, author, action, and media-rendering accessors/slots. Do not add a
  widget-owned post store or require callers to adopt a backend-specific type.
- RSS parsing, HTTP requests, subscriptions, authentication, storage, likes,
  comment persistence, and routers belong in application adapters. Loading,
  errors, retry, and mutations cross the component boundary through props and
  callbacks.
- Selected items may be controlled by `activeItemId` and
  `onActiveItemChange`. The feed must not write `window.location`, install a
  router, or hijack keys while focus is in a control or another surface.
- User-visible labels and `classNames`/`data-slot` extension points are part of
  the public contract. Keep theme tokens and container layout; do not restore
  the standalone app's body reset, fixed feed registry, or viewport-wide CSS.

## Layouts

`layout="stacked"` (the default) and `layout="overlay"` share one `renderCard`;
only the item's markup, the Previous/Next controls and the player's
`controlsStyle` differ. Keep the stacked markup unchanged unless you mean to
change it for every consumer: its visual baselines are the regression check.

- **Overlay is dark by scoping, not by colour.** The root and the full-screen
  viewer set `data-theme="dark"`, so tokens, library components and the host's
  `renderActions` resolve to their dark-theme values. Raw `black` is only for
  the letterbox behind the clip and the scrims over it (`bg-black/xx`), which
  must read over any frame. The library's own text over the scrim (author,
  title, caption) is white on purpose; host content (`renderActions`) gets
  its colours from the tokens, so it needs no overrides.
- **Two orientations.** `vertical` (default) scrolls up and down like a reel;
  `horizontal` swipes side to side like a chat app's photo viewer (SuperChat's
  media view uses it). Sideways, the left and right arrows move (mirrored when
  the nearest `dir` is `rtl`), a card scrolls into place with
  `scrollIntoView` (a `scrollBy` in a snapping row stops at the next card), Previous/Next sit on the side edges and
  hide on touch screens, and the position is announced (`sr-only`) for the host
  to show its own.
- **Images zoom in the overlay.** A double tap (or the zoom button) widens the
  image to 250% inside its own scrolling stage, toward where it was tapped;
  that stage is `overscroll-contain`, so panning to an edge doesn't swipe the
  feed on, and leaving the item zooms back out.
- **The viewer is opt-in in the overlay.** `allowFullscreen` defaults to
  `layout !== 'overlay'`: the overlay already fills its space and the player
  has its own full screen. Opening the viewer brings a floating clip back
  from picture in picture first, so the two never play at once.
- **Condensed mode leaves the overlay alone.** The root carries
  `data-layout`, and `condensed-view.css` scopes its padding, gap and radius
  rules to the stacked layout.
- **Details come before the media in the DOM.** Focus then visits the title,
  caption and actions before the player's bar, matching the screen. The
  absolute positioning, not the DOM order, places them.
- **Taps go through the details.** The details layer is `pointer-events-none`
  with its controls opted back in, so a tap on the picture still reaches the
  player's tap-to-play surface.
- **Caption rules live in `OverlayDetails`:** empty or repeats-the-title
  captions are dropped. The title shows one line and the caption two; when
  either is cut off (measured, and re-measured on resize), a **Show more**
  toggle (`labels.showMore`/`showLess`) opens both in full, the caption
  scrolling within `40dvh`. The toggle is separate from the text, so rich
  captions keep working links. `ClampedText` isn't used: it decides by
  character count, where this needs measured overflow over the video.
- The overlay's icon buttons share `overlayButtonClass`
  (`../MediaPlayer/overlayButton.ts`) with `MediaControls`; change it there.

## Shared conversation media

`MediaFeedMedia` describes the presentation source shared with SuperChat.
`SuperChatMediaAttachment` adds attachment identity and optional title/caption,
and messages retain those records on `SuperChatMessage.media`.
`getConversationMediaItems` derives entries with conversation, message,
attachment, and participant context. The thread and feed are two views of the
same host-owned conversation, not independently synchronized stores.

Keep attachment IDs stable. The derived feed ID includes the conversation,
message, and attachment IDs so repeated attachment IDs in different messages do
not collide. Presentation callbacks can inspect the original records. Do not
guess attachments from Markdown links or couple this model to RSS or Discourse.

## Playback and verification

Native video/audio playback composes `MediaPlayer`; images use their source and
alt text, and YouTube uses an external embed with a source-link fallback. Custom
`renderMedia` receives item context and the active/autoplay/mute/loop intent. An
inactive or background feed must pause media, and opening fullscreen must stop
the inline copy before the modal starts another player. One exception: a clip
floating in picture in picture keeps playing when its item stops being active
(`pauseForOwnership` checks `isInPictureInPicture`), and pauses when it comes
back to an inactive item, which has no controls.
Native media position is retained per item ID and source URL, and restored when
metadata is ready, so inline/fullscreen switches continue from the same time.
Provider iframe playback has no time-capture API here and restarts when its
surface remounts. Custom renderers own any provider-specific continuity.

Selection and explicit Play gestures are separate. A host launching a clip from
a conversation passes the selected ID plus
`playbackRequest={{ itemId, requestId }}`, with a fresh token for each gesture.
The request waits for its matching item to become selected, visible, and ready
for presentation, then attempts playback once even when reduced motion or
`autoPlay={false}` suppresses automatic playback. It never changes selection or
plays another item. Clearing the request does not stop an already playing clip.
The feed consumes tokens across surface/source remounts; a fresh token is needed
to replay a paused item. Native manual-play intent and position transfer between
inline/fullscreen surfaces until the user pauses. Custom players receive the
pending token as `playbackRequestId` only on its active target and must handle
each token once while respecting `active`.

Use the actual playback state and errors when showing playback controls. A
requested autoplay is not proof that a browser or external provider started
playing. Do not silently substitute another video when a source fails.

Verify collection states, controlled selection, keyboard/control isolation,
media activation, fullscreen focus/close behavior, localized labels, and custom
slots, in both layouts. For `overlay`, also check the player's overlay controls
and the phone portrait and landscape stories. When changing the shared media model, run the MediaFeed, MediaPlayer, and
SuperChat tests together and inspect both conversation views. Browser playback
and external YouTube availability also need verification in Storybook; unit
tests alone cannot establish them.
