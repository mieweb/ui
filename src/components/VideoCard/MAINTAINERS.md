# VideoCard / PlayButton / useYouTubeHoverPreview — Maintainer Notes

> **Provider notes** — how to _change_ the video-card stack. Consumers should
> read the [Modules/Media/VideoCard](VideoCard.stories.tsx) story. General
> conventions: [CONTRIBUTING.md](../../../CONTRIBUTING.md).

## What's in here

- [VideoCard.tsx](VideoCard.tsx) — card + `plate` variant, thumbnail, duration
  pill, eyebrow/description/footer copy stack. Exports `VideoCard`,
  `PlayButton`.
- [../../hooks/useYouTubeHoverPreview.ts](../../hooks/useYouTubeHoverPreview.ts)
  — the "silent autoplay on dwell" engine, exported from `@mieweb/ui/hooks` so
  custom cards can reuse it.

## Design contract (don't break these)

- **The IFrame API loads lazily and once.** `loadYouTubeIframeApi()` injects
  the script the first time any card dwells, caches the promise, and — on
  failure or the 10s timeout (`YT_API_TIMEOUT_MS`) — _clears_ the cached
  promise so a later hover can retry. Keep failure non-fatal: `handleEnter`
  catches and falls back to the static thumbnail (`stopPreview`). A dead
  youtube.com must never break the card.
- **Dwell before mount.** The muted player mounts only after `dwellMs`
  (default 600ms) of continuous hover; leaving during the dwell cancels the
  timer. This is what keeps casual mouse-traffic free.
- **Preview is always muted and looping** (`mute: 1`, playlist loop). Sound is
  the click-through's job, never the preview's.
- **PlayButton's conic ring is plain CSS** (`[background:conic-gradient(...)]`
  + `mie-spin`), no JS animation — it must render finished-looking with
  animations disabled.

## Gotchas

- The hook is single-`youtubeId`: one hook instance per card. Grids render
  many cards; don't lift the hook to the grid.
- Thumbnails come from `i.ytimg.com` when only `youtubeId` is given —
  external, so the visual test masks the `<img>`.
- Tailwind classes here are safelisted in `src/tailwind-preset.{ts,cjs}` (the
  "EH frontdoor ports" block) — keep both in sync when class strings change.

## Testing

- Visual: `videocard-default.png` (thumbnail masked) and `playbutton-only.png`
  in [tests/visual/components.spec.ts](../../../tests/visual/components.spec.ts).
- The hover-preview path needs a real YouTube embed and is not covered by CI;
  verify manually in Storybook (`HoverPreview` story) when touching the hook.
