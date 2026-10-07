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
the inline copy before the modal starts another player.
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
slots. When changing the shared media model, run the MediaFeed, MediaPlayer, and
SuperChat tests together and inspect both conversation views. Browser playback
and external YouTube availability also need verification in Storybook; unit
tests alone cannot establish them.
