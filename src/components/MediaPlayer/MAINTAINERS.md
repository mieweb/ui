# MediaPlayer / MediaControls — Maintainer Notes

> **Provider notes** — how to _change_ the player. Consumers should read the
> [Modules/Media/MediaPlayer](MediaPlayer.stories.tsx) story. General
> conventions: [CONTRIBUTING.md](../../../CONTRIBUTING.md).

## What's in here

- [MediaPlayer.tsx](MediaPlayer.tsx) — the `<video>`/`<audio>` surface, the ref
  handle and the error panel. Transport comes from
  [`useMediaTransport`](../../hooks/useMediaTransport.ts).
- [MediaControls.tsx](MediaControls.tsx) — the overlay controls
  (`controlsStyle="overlay"`). Public, for hosts that build their own box.
- [pictureInPicture.ts](pictureInPicture.ts) and
  [overlayButton.ts](overlayButton.ts) — internal, shared with `MediaFeed`.
  Not exported from the package; keep it that way.

## Design contract (don't break these)

- **Two picture-in-picture APIs.** Chrome, Edge, Android Chrome and desktop
  Safari use the standard `requestPictureInPicture`. iPhone Safari only has
  `webkitSetPresentationMode`. `isInPictureInPicture` and `PIP_EVENTS` cover
  both; use them rather than checking `document.pictureInPictureElement`. The
  button hides where neither exists, or when the video sets
  `disablePictureInPicture`.
- **Two full-screen APIs.** The box (video plus controls) goes full screen with
  `requestFullscreen`, so the controls come along. An iPhone can't do that and
  falls back to `webkitEnterFullscreen`, the system player. Exit only a full
  screen these controls entered; a page already full screen (a kiosk) stays.
- **Support is read after mount.** Browser capabilities go into state in an
  effect, so server and first client render match (no hydration mismatch).
- **Speed and captions follow the element.** The speed button cycles
  `playbackRates` through the transport's `setPlaybackRate`. The captions
  toggle reads `video.textTracks` (captions and subtitles only), listens for
  `addtrack`/`removetrack`/`change`, and switches the first track on or all
  off, so a host that changes tracks itself stays in sync. Cues left on the
  default line are lifted to `line = -4`, above the bar, as they become
  active; cues the host positioned keep their place. Several caption
  languages need `native`, which has a menu.
- **The tap surface is `aria-hidden`.** It duplicates the bar's Play for
  pointers. Keyboard and screen-reader users use the bar; don't make the
  surface focusable.
- **The bar is `dir="ltr"` in every language.** Playback controls and the
  timeline follow the media, not the reading direction, so they don't mirror
  (Material's bidirectionality guidance). The labels inside still render in
  their own direction. Don't remove it to "fix" RTL.
- **The box is a dark surface** (`data-theme="dark"`). The scrims are raw
  black on purpose: they sit over arbitrary video frames.
- **Floating clips and their hosts.** A browser closes the picture-in-picture
  window when its video leaves the DOM. `MediaFeed` keeps a floating clip
  playing when its item stops being active; changes to how it pauses or
  unmounts media must keep that.

## Gotchas

- The narrow-player layout is a container query (`@container`, `@max-md:`),
  and the touch sizing uses `pointer-coarse:`/`pointer-fine:`. Both need
  Tailwind 4.1 or the prebuilt `styles.css`; Tailwind 3 preset consumers get
  the wide layout and the default button sizes.
- The seek bar's pointer step is 0.1s, so a tap or drag lands where it's put;
  arrow keys move 2% of the clip (`Slider`'s `keyboardStep`), so they stay
  useful on short and long clips alike. `Slider` reads the time out through
  `formatValue`, which also sets `aria-valuetext`.
- The track sets `dark:bg-white/30` as well as `bg-white/30`: inside the dark
  box, `Slider`'s own `dark:` track colour would otherwise win.
- jsdom has no media playback or full-screen support: the tests stub
  `play`/`pause`, `duration` and the full-screen and picture-in-picture APIs.
  Real behaviour, especially on an iPhone, needs a manual check.
- New class strings are safelisted in both `src/tailwind-preset.ts` and
  `src/tailwind-preset.cjs` (the media block). Keep the two in sync.
