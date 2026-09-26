# Templates — Maintainer Notes

> **Provider notes** — how to _change_ the Templates tier. Consumers should read
> the [Templates/Pages/Overview](../catalog/Pages.mdx) docs page. General
> conventions: [CONTRIBUTING.md](../../CONTRIBUTING.md).

Covers `src/templates/` (shared internals), `src/templates.ts` (the
`@mieweb/ui/templates` entry), `LandingPage` and every `*Section` component.

## Design contract (don't break these)

- **Server-Component safe.** Nothing reachable from `src/templates.ts` may use
  `useState`, `useEffect`, `useRef`, `useContext`, `createContext` or
  `'use client'` — `useId` is the only hook allowed (it exists under
  `react-server`). Two guards hold the line:
  `src/templates/server-safe.test.ts` scans the module graph, and CI runs
  `pnpm check:templates-rsc` after `pnpm build` to import `dist/templates.js`
  under `--conditions=react-server`. Interactivity uses the platform instead:
  `<details>` for FAQ, CSS for the marquee, a real `<form>` for leads.
- **Import `buttonVariants` from `Button/button-variants`, never from
  `Button/Button`.** The component module carries client hooks; the variants
  module is hook-free.
- **Block data is JSON.** `LandingBlock` strips DOM event handlers, `children`,
  `components` and `icons` (`BlockData<P>` in `LandingPage.tsx`). Anything
  non-serializable — site image/link components, icon registries, custom
  section components — is a `LandingPage` prop, never a block field.
- **Every section destructures `components`.** Sections that render no links
  or images still receive it from `LandingPage`; `SectionShell` swallows it for
  sections that spread `...rest` into the shell. A section that renders its own
  `<section>` must drop it explicitly, or React warns about an unknown DOM
  attribute.
- **Links and images go through `TemplateAnchor` / `TemplateImg`** (in
  `Section.tsx`) so `components.Link`/`Image` and `trackingId` → `data-track`
  work everywhere. Only the hero passes `priority`. Logos stay plain `<img>`:
  they carry no intrinsic size for an image optimizer.
- **Heading contract.** The hero is the only `h1`; section titles are `h2`
  via `SectionHeading`; items are `h3`. Headings always set an explicit colour
  (`headingTextClass`) because host sites style `h1–h4` in a base layer.

## Tones and contrast

`toneClass`, `cardClass`, `mutedTextClass`, `accentTextClass` and
`headingTextClass` in `Section.tsx` are the only place colour is chosen. They
were tuned against axe across all brands in light and dark:

- Accent text is `primary-800` in light mode — the shade `Button`'s primary
  fill already guarantees against white. `primary-700` fails AA for BlueHive.
- On the `muted` tone, secondary text is `foreground/80`, not
  `muted-foreground`, which drops below AA on `bg-muted` in dark mode.
- On the `brand` tone, accents and headings are white.

Re-run the axe pass (`pnpm test:storybook` against the Templates stories) after
touching any of these.

## Adding a section

1. `src/components/<Name>Section/` with the usual component + story + index.
   Build it on `SectionShell` unless the layout needs its own `<section>`.
2. Add it to the `LandingBlock` union, the `sections` map in `LandingPage.tsx`,
   and (if it resolves icon tokens) `takesIcons`.
3. Export it from `src/templates.ts`; add it to a preset's `sequence` if it
   belongs to an archetype.
4. Story under `Templates/<Family>/`, a `contains` relationship on the
   `LandingPage` story, and a row in the family overview (`src/catalog/*.mdx`).
5. Arbitrary values, opacity modifiers and variants go in the "Templates tier"
   block of `miewebUISafelist` — keep `src/tailwind-preset.ts` and `.cjs` in
   sync.

## Gotchas

- The marquee (`mie-marquee` in `src/styles/effects.css`) needs the track to
  hold two copies with per-item end padding, not `gap` — `translateX(-50%)`
  only loops seamlessly when both halves are exactly equal. RTL uses the
  reversed keyframes; reduced motion stops and wraps the row and hides the copy.
- Storybook fixtures live in `storyData.ts` (a non-story file). The
  `VideoSection` story plays `.storybook/public/templates/product-tour.mp4`
  with its `.vtt` captions; nothing loads until play (`preload="none"`).

## Testing

- Unit: `src/templates/sections.test.tsx`, `LandingPage.test.tsx` (every preset
  page renders with one `h1` and validates clean), `server-safe.test.ts`.
- Visual: the `template-*.png` baselines in
  [tests/visual/components.spec.ts](../../tests/visual/components.spec.ts),
  captured full-page with `animations: 'disabled'` (the marquee is pinned at its
  first frame).
