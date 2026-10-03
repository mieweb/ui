# Deck — Maintainer Notes

> **Provider notes** — how to _change_ the deck. Consumers should read the
> [Modules/Presentations/Deck](../../catalog/Presentations.mdx) docs page.

Covers `src/components/Deck/` and the `@mieweb/ui/deck` entry (`src/deck.ts`).

## Design contract

- **Slides are JSON.** `types.ts` is the schema; nothing in a slide may be a
  function or element. Site behaviour comes in through `Deck` props
  (`renderers`, `graphics`, `components`, `icons`, `onSlideChange`).
- **No animation dependency.** Reveal, bar growth, the cycle spin and diagram
  flow dots are CSS in `src/styles/effects.css` (`mie-deck-*`). Content is only
  hidden after mount (`[data-ready]`), each slide reveals once (`[data-seen]`,
  set by the Deck's observer), and reduced motion and print show everything.
- **Renderers sit outside their tone.** `SlideFrame` provides the slide's tone
  to children through context; a renderer reading tone for itself must use
  `toneOf(slide, fallback)` with the same fallback it passes the frame.
- **Colours come from tokens.** `tones.ts` is the only place a slide surface or
  accent is chosen. No hex values — charts use `fill-*` / `stroke-*` utilities.
- **Every chart has an `sr-only` table** of its values; the drawing is
  `aria-hidden`.
- **Keys don't fight.** The Deck's window key handler ignores inputs and
  `role="tab"`; the tabs slide stops propagation of its arrow keys.

## Adding a slide type

1. Add the interface and union member in `types.ts`.
2. Write the renderer in the matching `slides/*.tsx` file on `SlideFrame` and
   the primitives; register it in `registry.tsx` (the `satisfies` fails until you do).
3. Add an example to `storyData.ts` (the `AllSlideTypes` story and the tests
   iterate it) and list the type in the Deck story's docs.
4. New arbitrary values or opacity modifiers go in the "Reports + Deck tier"
   block of `miewebUISafelist` — keep `src/tailwind-preset.ts` and `.cjs` in sync.

## Testing

`Deck.test.tsx` stubs `IntersectionObserver`; call `show(i)` to simulate a
slide scrolling into view.
