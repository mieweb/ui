---
name: mieweb-ui-templates
description: Marketing and report page sections of @mieweb/ui/templates — HeroSection, CtaSection, PricingSection, FaqSection, TestimonialSection, LeadFormSection, FeatureGridSection, StatsSection, LogoCloudSection and friends, plus the LandingPage renderer, landingPresets archetypes and validateLandingPage. Data-only props, icon tokens, next/image|next/link adapters, Server-Component safety. USE WHEN building a marketing/landing page or static report page, choosing between template sections, wiring LandingPage blocks/presets/validation, or asking whether templates work in React Server Components.
---

# @mieweb/ui templates — marketing & report page sections

Sourced from `src/templates.ts`, `src/templates/MAINTAINERS.md`,
`src/components/LandingPage/` and the catalog pages (Pages, Conversion,
Content, Social proof, Reports).

> **Which section?** Page opening → **HeroSection** (`centered` | `split`).
> Page closing push → **CtaSection** (`band` | `panel`). Parallel capabilities
> → **FeatureGridSection**; one argument beside an image →
> **SplitContentSection**. Ordered how-it-works → **ProcessStepsSection**.
> Plans → **PricingSection**; us-vs-them rows → **ComparisonSection**.
> Q&A → **FaqSection** (native `<details>`). Metrics → **StatsSection**;
> customer quotes → **TestimonialSection**; logo row → **LogoCloudSection**.
> In-page lead capture → **LeadFormSection**. Linked guides/case studies →
> **ResourceCardsSection**; embedded player → **VideoSection**. A whole page
> from data → **LandingPage** with a `landingPresets` archetype.

## The contract: sections are data, not composition

Everything here is designed so a page is a **content file**, not a component
tree. Do not fight this model:

- **Plain-data props only.** No `children`, no event handlers, no render
  props. All visible text is a prop (ready for i18n extraction). A section's
  props survive `JSON.stringify` — that is the point.
- **Icons are string tokens** (`icon: 'shield-check'`), not components.
  Custom icons register in a `TemplateIconRegistry` passed to `LandingPage`
  (or a section's `icons` prop) — never put a component in page data.
- **Links are real anchors.** No `onClick`; analytics via
  `trackingId` → rendered `data-track` attribute.
- **Framework adapters via `components`.** Every section (and `LandingPage`)
  accepts `components?: { Image?, Link? }` to swap the built-in `<img>`/`<a>`
  for `next/image`/`next/link`. Adapters are site code, never block data.
- **Server Component safe.** Nothing in the entry uses client hooks or
  `'use client'` (CI imports the bundle under `--conditions=react-server`).
  Interactivity is platform-native: `<details>` for FAQ, CSS for the logo
  marquee, a real `<form>` for leads. No peers beyond the library itself.
- **Maturity: experimental** — APIs may still move; shipped in production by
  the BlueHive and Enterprise Health marketing sites.

Shared `SectionBaseProps` on every section: `eyebrow?`, `title?`,
`description?`, `tone: 'default' | 'muted' | 'brand'`,
`align: 'start' | 'center'`, `id?` (anchor links), `className?`.

## Section inventory (all from `@mieweb/ui/templates`)

| Family | Component | Key props | Variants |
| --- | --- | --- | --- |
| Conversion | `HeroSection` | `title`, `primaryCta`/`secondaryCta`, `breadcrumbs`, `image`, `highlights`, `meta`, `ctaNote`, `headingLevel` | `centered` \| `split` |
| Conversion | `CtaSection` | `title`, `primaryCta`/`secondaryCta`, `note` | layout `band` \| `panel` |
| Conversion | `PricingSection` | `plans: PricingPlan[]` (name, price/period, `features: string[]`, highlighted) | — |
| Conversion | `LeadFormSection` | `action` (URL string or named Server Action), `fields?`, `hiddenFields?`, `submitLabel?`, `highlights?` | `split` \| `stacked` |
| Content | `FeatureGridSection` | `features[]` (`title`, `description`, `icon?`, `tag?`, `link?`), `columns: 2\|3\|4` | `cards` \| `plain` |
| Content | `SplitContentSection` | `title`, `image`, `bullets?`, CTAs, `caption?` | — |
| Content | `ProcessStepsSection` | `steps[]` (`title`, `description`, `icon?`), `columns?` | — |
| Content | `ComparisonSection` | `columns` (labels), `rows[]` (`feature`, `values: (boolean\|string)[]`), `highlightColumn?` | — |
| Content | `FaqSection` | `items: FaqItem[]` (`question`, `answer`, `id?`) | — |
| Content | `ResourceCardsSection` | `items[]` (`title`, `href`, `image?`, `excerpt?`, `kind?`, `meta?`), `viewAll?` | — |
| Content | `VideoSection` | `video: { youtubeId }` or `{ src, poster, captions }` (WebVTT), `caption?` | — |
| Social proof | `StatsSection` | `stats[]` (`value`, `label`, `prefix?`, `suffix?`, `trend?`), `locale?` (BCP 47 → `Intl.NumberFormat`) | `plain` \| `cards` \| `ruled` |
| Social proof | `LogoCloudSection` | `logos[]` (`name`, `src?`, `href?`, `trackingId?`), `speed?` | `grid` \| `marquee` |
| Social proof | `TestimonialSection` | `testimonials[]` (quote, author, company, `rating?` 1–5, avatar) | `cards` \| `featured` |
| Pages | `LandingPage` | `blocks: LandingBlock[]`, `icons?`, `components?`, `custom?`, `actions?` | — |
| Shared | `SectionShell`, `SectionHeading`, `TemplateIcon`/`templateIcons` | building blocks for site-owned custom sections | — |

**Report sections** (`BenchmarkTableSection`, `RankedListSection`,
`TileCartogramSection`, `MetricListSection`, `MetricStatusBadge`,
`ReportLegend`, `ReportByline`, `ReportMethodology`, `LinkGroupsSection`,
`PdfEmbedSection`) live in this same entry and follow the same contract —
static, server-safe, no sorting/filtering. Their data shapes and selection
guidance are in the **mieweb-ui-charts** skill; when the user needs
interactive sorting/filtering/export, that is a grid — route to DataVis
NITRO (**mieweb-ui-datavis-api** skill), not a report section.

## LandingPage: a page as data

```tsx
import { LandingPage, validateLandingPage } from '@mieweb/ui/templates';
import type { LandingBlock } from '@mieweb/ui/templates';

const blocks: LandingBlock[] = [
  { type: 'hero', variant: 'split', title: 'Occupational health, handled', primaryCta: { label: 'Book a demo', href: '/demo' } },
  { type: 'logos', logos: [{ name: 'Acme', src: '/logos/acme.svg' }] },
  { type: 'features', columns: 3, features: [{ title: 'Scheduling', description: '…', icon: 'calendar' }] },
  { type: 'cta', title: 'Ready?', primaryCta: { label: 'Start', href: '/signup' } },
];

<LandingPage
  blocks={blocks}
  components={{ Image: NextImageAdapter, Link: NextLinkAdapter }}
/>;
```

- Each block is a section's props tagged with a `type`
  (`hero`, `logos`, `features`, `split`, `process`, `stats`, `comparison`,
  `pricing`, `video`, `testimonials`, `resources`, `faq`, `lead-form`, `cta`,
  the report types, or `custom`). `BlockData<P>` strips handlers, `children`,
  `components` and `icons`, so blocks stay JSON — import them from a content
  file or a CMS.
- Non-serializable things are **`LandingPage` props, never block fields**:
  image/link adapters (`components`), icon registry (`icons`), site-owned
  sections (`custom` map, used by `{ type: 'custom', component: 'Name' }`
  blocks), and Server Actions (`actions` map — a `lead-form` block's `action`
  string names an entry; function form actions are React 19 only).
- **`landingPresets`** — seven page archetypes with recommended `sequence`
  and `required` blocks: `vertical-hub`, `service-detail`, `campaign`,
  `comparison`, `resource`, `pricing`, `benchmark-report`.
- **`validateLandingPage(blocks, preset?)`** returns
  `{ severity: 'error' | 'warning', message, index? }[]` — checks the heading
  contract (exactly one `h1` hero, first), unknown block types, unsafe
  `lead-form` actions, and the preset's required blocks and order. Run it in
  a build step or test; `LandingPage` itself renders whatever it is given
  (unknown blocks are skipped silently).

## i18n, RTL & a11y

- All copy is props; label defaults are overridable per section
  (`HeroSectionLabels.breadcrumb`, `TestimonialSectionLabels.rating` —
  `"Rated {rating} out of 5"` — `ComparisonSectionLabels.feature/included/notIncluded`).
- Numbers localize via the `locale` prop (`StatsSection`,
  `BenchmarkTableSection`, `RankedListSection`).
- RTL works without extra wiring: logical CSS properties throughout, mirrored
  chevrons, direction-aware split layouts; `align: 'start'` follows document
  direction.
- `VideoSection` requires a `video.title` for screen readers and supports
  WebVTT captions; `FaqSection` is native `<details>`; `LeadFormSection`
  auto-links labels to inputs.

## Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| Want a click handler / React node in a section prop | Wrong model — sections are data-only. Use `href` links, `trackingId` for analytics, or build a site-owned section with `SectionShell` and register it in `LandingPage`'s `custom` map. |
| Icon prop "doesn't accept my component" | Icons are string tokens. Add custom icons to a `TemplateIconRegistry` and pass it as `LandingPage`'s (or the section's) `icons` prop. |
| A block renders nothing | Unknown `type`, a `custom` component missing from the `custom` map, or an unsafe `lead-form` `action` — all skipped silently. Run `validateLandingPage` in a test to catch them. |
| Next.js images/links not optimized | Pass adapters via `components={{ Image, Link }}` on `LandingPage` or the section — don't edit block data. |
| "Does this work in RSC / app router?" | Yes — the whole entry is Server Component safe (CI-checked); no `'use client'`, no extra peers. |
| Report table needs sorting/filtering/export | Not a template — use DataVis NITRO (see **mieweb-ui-datavis-api**). Report sections are static by design. |
| Marketing site header/footer | `SiteHeader`/`SiteFooter` are in the **main entry**, not `/templates` — see the **mieweb-ui-views** skill. |

Storybook: https://ui.mieweb.org/?path=/docs/conversion-herosection--docs (ids
follow `conversion-*`, `content-*`, `socialproof-*`, `reports-*`, and
`pages-landingpage`). Catalog pages: Pages, Conversion, Content, Social proof,
Reports.
