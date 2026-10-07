# Adopting MediaFeed from the standalone news widget

The proposed replacement for `@mieweb/news-widget` is the native `MediaFeed`
module in `@mieweb/ui`. It renders records supplied by the application and can
show media attached to the same conversation that SuperChat displays as a thread.
This is a migration of the presentation surface; applications continue to own
their feeds, authentication, comments, persistence, and navigation.

**Migration status:** pending acceptance of the UI pull request and a verified
UI release. The standalone repository and its npm `1.0.0` package remain in
place. This change does not remove, replace, or rewrite that published package.

## What changes at the application boundary

| Standalone news widget                                                                     | Native UI integration                                                                                                       |
| ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `NewsWidget` exports the entire `App`, including its landing page and fixed feed registry. | `MediaFeed<T>` receives application records through `items` and accessor props.                                             |
| Hooks fetch RSS and Discourse topics, manage authentication, and persist pending comments. | The application supplies records and loading/error state, and handles engagement through callbacks or action slots.         |
| The widget writes hash routes and installs application navigation behavior.                | The application owns selected records and navigation; `onActiveItemChange` reports selection.                               |
| The app and cards carry their own global and component CSS.                                | The native module uses UI theme tokens, scoped slots, and the existing `MediaPlayer`.                                       |
| News posts have a separate widget-specific model.                                          | SuperChat messages can carry typed media attachments; a derived feed presents those attachments from the same conversation. |

`MediaFeed` is not a drop-in export of the old `App`. Keep the application's RSS
or Discourse adapter outside the component. Convert each post's media into
`MediaFeedMedia`, supply `getId` and `getMedia`, and use optional title, caption,
author, action, and media-rendering slots for the desired presentation. The host
handles likes, comment submission, login, and URL changes. The native component
does not import the old proxy configuration or test backend.

For SuperChat, store attachments on `SuperChatMessage.media` as
`SuperChatMediaAttachment[]`. `getConversationMediaItems` derives feed entries
that retain their conversation, message, attachment, and participant context.
Playing a thread attachment opens its media feed; Back to conversation restores
the thread's reading position and draft. This changes presentation of that
conversation; it does not create another feed store or infer attachments from
arbitrary message text.
Keep custom media rendering and engagement callbacks at the host boundary.

Native audio/video playback uses `MediaPlayer`. YouTube remains an external
embed: availability, network access, and browser autoplay policies still apply.
Verify actual playback in the intended host browser as well as unit and visual
tests before switching production consumers.

## Origin and retained history

The source is
[`mieweb/news-widget`](https://github.com/mieweb/news-widget) at
[`14f8f2a1d45507779c1b47f1458329ac8d3c3234`](https://github.com/mieweb/news-widget/commit/14f8f2a1d45507779c1b47f1458329ac8d3c3234).
Its 34 original commits, authored by Doug Horner, are retained through the
migration merge without rewriting their commit IDs. The native UI tree does
not retain a copied standalone app, a subtree mirror, or another package to
publish. The original source remains inspectable through the imported history:

Accept the migration PR with a **merge commit**. A squash or rebase merge would
discard the original repository's parent history from UI's accepted branch,
defeating the history import. The local migration commit has UI's base as its
first parent and the pinned news-widget commit as its second parent.

```bash
git show 14f8f2a1d45507779c1b47f1458329ac8d3c3234:news-widget/src/index.tsx
git show 14f8f2a1d45507779c1b47f1458329ac8d3c3234:news-widget/src/components/FeedCard.tsx
git show 14f8f2a1d45507779c1b47f1458329ac8d3c3234:news-widget/src/hooks/useFeed.ts
```

Use those files to understand prior behavior and provenance. Application
adapters can preserve any needed RSS/auth behavior without bringing those
services into the UI module. New fixes belong to the native implementation.

## Complete the migration before retiring the repository

These are follow-up actions after acceptance and release, not actions performed
by the migration pull request:

1. Publish the accepted UI implementation and verify its exported types,
   Storybook examples, real media playback, and thread/feed conversation
   presentation in a consuming application.
2. Move affected consumers to that release and preserve their RSS, authentication,
   comments, storage, and navigation behavior in host adapters. Identify any
   consumers that still need the standalone package.
3. Add a README redirect in `mieweb/news-widget` naming the released UI version,
   supported import paths, migration guide, and remaining compatibility limits.
4. Stop future standalone npm publishing by disabling its release/manual publish
   workflow. Leave the existing npm `1.0.0` package available; do not unpublish or
   rewrite it as part of repository retirement.
5. Archive the GitHub repository only after confirming the replacement release
   and documentation are reachable, the imported history is present on UI's
   accepted branch, and remaining consumers have a documented path forward.

Repository redirects, workflow changes, npm actions, and GitHub archival require
their own follow-up execution. None is performed by this UI change.
