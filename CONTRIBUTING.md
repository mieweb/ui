# Contributing to `@mieweb/ui`

> **This is the provider (maintainer) guide** — for people who _build and change_ the
> library. If you only _consume_ `@mieweb/ui` in an app, you want the
> [README](README.md), the [Storybook](https://ui.mieweb.org), and the
> [`lessons/`](lessons/README.md) adoption guides instead.

## Who is this for?

This repository serves two distinct developer audiences. Keep the distinction in
mind whenever you write docs or code comments.

| Audience                        | "I want to…"                                     | Read                                                                                      |
| ------------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| **Consumer** (app developer)    | Use a component, theme it, migrate an app        | [README.md](README.md), [Storybook](https://ui.mieweb.org), [lessons/](lessons/README.md) |
| **Provider / Maintainer** (you) | Add/change a component, fix a bug, cut a release | **This file** + per-component [`MAINTAINERS.md`](#per-component-maintainer-notes)         |

Rule of thumb: **consumer docs answer "why should I choose it, when should I not,
and how does it fit" as well as "how do I use it"; provider docs answer "how do I
change it."** Keep component guidance in Storybook and internals in this guide
and per-component `MAINTAINERS.md` files.

## Documentation ownership

- **Shared introduction:** edit [README.md](README.md). GitHub and npm display it;
  [src/Introduction.mdx](src/Introduction.mdx) imports it as raw Markdown and renders
  it in Storybook. Keep that wrapper free of a second copy of onboarding prose.
- **Portable content:** use ordinary Markdown and absolute links to published
  documentation or GitHub files. Repository-relative links break when rendered
  inside Storybook. Heading anchors must work in both renderers.
- **Component guidance:** keep rationale, limitations, alternatives, related
  components, and composition examples with the component's stories. Link to
  detailed guidance from the introduction instead of maintaining another copy.
- **Agent setup:** the introduction links to [agent/](agent/README.md). Agent rules
  and component policy must agree; this shared introduction does not itself
  synchronize those separate documents or enforce PR review.
- **Contributor setup and releases:** maintain them here, not in the README.

When changing the README, check the Introduction page in local Storybook,
including code blocks, tables, heading links, and mobile layout. The README is
included in the npm package's `files` list. GitHub shows changes on the selected
branch; Storybook and npm show the content from their latest deployment or
release, not necessarily the latest Git commit.

## Repository layout

```
src/
  index.ts              # Public barrel — the main entry point
  ag-grid.ts            # Deprecated entry retained for existing consumers only
  datavis.ts            # Separate entry: @mieweb/ui/datavis (optional datavis-ace dep)
  esheet.ts             # Separate entry: @mieweb/ui/esheet (optional @esheet/* deps)
  tailwind-preset.ts    # Tailwind preset consumers extend
  brands/               # BrandConfig (*.ts) + CSS variable themes (*.css)
  components/<Name>/     # One folder per component (see "Anatomy" below)
  hooks/  utils/  styles/  types/
  test/setup.ts         # Vitest setup
packages/               # Git submodules with heavy/optional implementations
  esheet/  ychart/      # (DataVis NITRO is an npm package, not a submodule)
.storybook/             # Storybook (react-vite) config
tests/visual/           # Playwright visual-regression specs + snapshots
lessons/                # Consumer-facing adoption + policy docs
```

## Prerequisites & setup

This repo uses **pnpm** (`packageManager: pnpm@10.29.1`) and **git submodules**.

```bash
git clone --recurse-submodules https://github.com/mieweb/ui.git
cd ui
pnpm install          # preinstall runs `git submodule update --init --recursive`
pnpm storybook        # http://localhost:6006
```

If you cloned without `--recurse-submodules`, run
`git submodule update --init --recursive` and re-run `pnpm install`.

Use Node.js 24 (the version used by CI) and the pnpm version declared in
`package.json`. The `prestorybook` hook builds eSheet when its required artifacts
are missing; it does not detect every stale build after a submodule update. To
rebuild updated eSheet sources explicitly:

```bash
pnpm --dir packages/esheet --filter '@esheet/builder...' --filter '@esheet/renderer...' build
```

Storybook uses HMR for source and documentation edits. Do not restart it after
each edit; restart when configuration or dependencies change.

## Everyday commands

| Command                           | Purpose                                                                                    |
| --------------------------------- | ------------------------------------------------------------------------------------------ |
| `pnpm dev`                        | `tsup --watch` — rebuild the library on change                                             |
| `pnpm storybook`                  | Storybook dev server on `:6006` (primary dev surface)                                      |
| `pnpm typecheck`                  | `tsc --noEmit`                                                                             |
| `pnpm lint` / `pnpm lint:fix`     | ESLint over `src/**/*.{ts,tsx}`                                                            |
| `pnpm format` / `pnpm format:fix` | Prettier check / write                                                                     |
| `pnpm test` / `pnpm test:watch`   | Vitest unit tests                                                                          |
| `pnpm test:coverage`              | Vitest with coverage (80% thresholds)                                                      |
| `pnpm test:visual`                | Playwright visual regression (serves `storybook-static`; run `pnpm build-storybook` first) |
| `pnpm build`                      | Full library build (tsup + CSS + brand CSS)                                                |

`pnpm dev` rebuilds the library for locally linked consumers; it does not start
Storybook. To try a local build in another application, build the library and use
your package manager's local linking or `file:` dependency support. Import the
same public entry points as a published consumer, including
`@mieweb/ui/styles.css`.

For a static Storybook build, run `pnpm build-storybook`; output is written to
`storybook-static`. Do not hand-edit generated output.

### AI story configuration

For Ozwell-backed stories, follow
[the Ozwell backend guide](src/components/AI/OZWELL-BACKEND.md) for endpoint,
browser-local configuration, and proxy options. Never commit API keys or embed
them in a public Storybook build.

## Quality gates (must pass before opening a PR)

```bash
pnpm typecheck && pnpm lint && pnpm format && pnpm test
```

Visual tests (`pnpm test:visual`) are required when you change anything that
affects rendering. See [Testing](#testing).

## Anatomy of a component

Each component lives in `src/components/<Name>/` and follows this shape:

```
src/components/MyWidget/
├── index.ts              # Re-exports the component + its public types
├── MyWidget.tsx          # Implementation
├── MyWidget.stories.tsx  # Storybook story (autodocs)
├── MyWidget.test.tsx     # Vitest unit test (optional but encouraged)
└── MAINTAINERS.md        # Provider notes — only for non-trivial modules
```

Coding conventions (the full standard lives in
[lessons/component-policy.md](lessons/component-policy.md) → _Tier 2_):

- **Variants** via `class-variance-authority` (CVA); merge classes with the
  `cn()` helper (`clsx` + `tailwind-merge`) from [src/utils](src/utils).
- **`forwardRef`** on anything that wraps a DOM node; forward `className` and
  `...rest`.
- **Theme tokens only** — colors come from `--mieweb-*` CSS variables / Tailwind
  theme utilities (`bg-primary-500`, `text-foreground`, `border-border`). **Never
  hardcode hex colors.** Support dark mode and brand switching.
- **Accessibility** — semantic roles, `aria-*`, keyboard operability, visible
  focus. Modal/overlay components trap focus and close on `Escape`.
- **Icons** from `lucide-react`; dates via `luxon`.

For new date parsing, formatting, and comparisons, use Luxon's `DateTime`. Keep
business timezones explicit with IANA identifiers such as `America/New_York`;
prefer ISO-8601 values in storage and transport and localize at the UI boundary.

After adding a component, export it from [src/index.ts](src/index.ts)
and (if it should be individually importable) add a `tsup` entry — see
[Exports & tree-shaking](#exports-entry-points--tree-shaking).

## Stories & documentation (autodocs convention)

Consumer-facing component docs are generated by Storybook **autodocs**. A story
file should:

- Export **one** `Meta` default export per component (one component per CSF
  file — a file can't drive two autodocs pages).
- Set `tags: ['autodocs']`.
- Provide `argTypes` with a `description` for every meaningful prop.
- Provide the component overview via
  `parameters.docs.description.component` (Markdown).
- Put **shared fixtures in a non-story file** (e.g. `storyData.ts`) so Storybook
  doesn't try to load it as stories. See
  [src/components/AI/storyData.ts](src/components/AI/storyData.ts) and the AI
  story files for the reference pattern.

## Exports, entry points & tree-shaking

- The public API is the barrel [src/index.ts](src/index.ts). Everything a
  consumer can `import { X } from '@mieweb/ui'` must be re-exported there.
- **Heavy/optional integrations get their own subpath entry** so they stay out
  of the default bundle: `@mieweb/ui/datavis` and `@mieweb/ui/esheet` map to
  `src/datavis.ts`, `src/esheet.ts`, and dedicated `tsup` entries.
  The deprecated `@mieweb/ui/ag-grid` entry remains for existing consumers only;
  do not use it as a starting point for new integrations.
- Individually tree-shakeable components are listed explicitly in the `entry`
  map in [tsup.config.ts](tsup.config.ts). Add yours there if it should be
  importable as `@mieweb/ui/components/<Name>`.
- `package.json` `sideEffects` is `["**/*.css"]` — CSS is intentionally
  side-effectful so it isn't tree-shaken away. Keep JS/TS modules side-effect
  free (the deprecated AGGrid integration's `ModuleRegistry` call is a legacy
  exception, not a pattern for new components).

## Build & bundle

- **Bundler:** [tsup](tsup.config.ts) → dual **ESM + CJS**, `target: es2022`,
  `.d.ts` emitted, sourcemaps, `treeshake` + `splitting` on. JSX is `automatic`.
  Types build against [tsconfig.build.json](tsconfig.build.json).
- **External:** `react`, `react-dom`, `datavis-ace`, and `@esheet/*` are never
  bundled (they're peers). Legacy `ag-grid-*` peers remain external for compatibility.
- **CSS:** `pnpm build:css` compiles `src/styles/base.css` → `dist/styles.css`
  via the Tailwind CLI; brand CSS is copied into `dist/brands/`.
- **Submodule builds:** `prebuild` runs `build:esheet`, which builds the
  `@esheet/*` packages (nx) before the main build. The full build runs with
  `--max-old-space-size=8192` because the type graph is large.

## Testing

- **Unit (Vitest, jsdom):** setup in [src/test/setup.ts](src/test/setup.ts),
  alias `@ → src`. Coverage thresholds are **80%** (branches/functions/lines/
  statements). `packages/esheet`, `tests/visual`, and `*.spec.ts` are excluded.
- **Visual regression (Playwright):** specs in [tests/visual](tests/visual).
  Run `pnpm build-storybook` to generate `storybook-static`, then `pnpm test:visual`
  to serve it on `:6006` and compare Chromium screenshots (tolerance `maxDiffPixelRatio: 0.05`).
  - **Updating baselines is a deliberate act.** Only run
    `pnpm test:visual --update-snapshots` when you intentionally changed
    rendering, and review the image diffs in the PR. Never blanket-update to make
    a failing test pass.
- **Storybook a11y:** `pnpm test:storybook` runs the test-runner against a
  running Storybook.

## Brands & theming

- A brand is a `BrandConfig` in `src/brands/<brand>.ts` plus a CSS variable
  theme in `src/brands/<brand>.css`, re-exported from
  [src/brands/index.ts](src/brands/index.ts).
- Components must look correct under **at least two brands** and in **dark mode**.
  Test brand switching via `ThemeProvider`.
- Deep reference: [lessons/tailwind4-integration.md](lessons/tailwind4-integration.md).

## Submodules (esheet, ychart)

Two heavy capabilities live in **git submodules** under `packages/`, not in
`src/`. This is the most common source of "it builds on CI but not locally"
confusion, so know which is which:

| Submodule         | Backs                              | Exposed as          | Notes                                                                                                 |
| ----------------- | ---------------------------------- | ------------------- | ----------------------------------------------------------------------------------------------------- |
| `packages/esheet` | `EsheetBuilder` / `EsheetRenderer` | `@mieweb/ui/esheet` | nx monorepo (`core/fields/adapters/builder/renderer`); built by `build:esheet` before the main build. |
| `packages/ychart` | `YChart` (Storybook only)          | _not exported_      | A vanilla editor class dynamically imported by the story only.                                        |

DataVis NITRO is **not** a submodule: it's consumed from the published
`@mieweb/datavis` npm package (plus the `datavis-ace` peer), exposed as
`@mieweb/ui/datavis`.

If a submodule-backed component fails to resolve, run
`git submodule update --init --recursive` then `pnpm install`.

## Optional peer dependencies

`react` / `react-dom` are required peers. Everything else heavy is **optional**:
`datavis-ace`, `@mieweb/datavis`,
`@esheet/builder`, `@esheet/renderer`, `wavesurfer.js`. Components that need them must live behind a
subpath entry (not the main barrel) so consumers who don't use them aren't forced
to install them.

> **Grids: use DataVis NITRO for new work.** The `@mieweb/ui` AGGrid integration
> is deprecated; `ag-grid-community` and `ag-grid-react` remain optional peers
> only for existing consumers. Its source and maintainer notes document legacy
> maintenance, not a recommended choice. Use
> [DataVisNITRO](src/components/DataVisNITRO/MAINTAINERS.md) (`@mieweb/ui/datavis`).

## Per-component maintainer notes

Non-trivial modules carry a `MAINTAINERS.md` next to the code with the internals a
maintainer needs: invariants, extension points, gotchas, and test/baseline notes.
**Consumers never need these; they document how to _change_ the module, not how to
use it.** Add one when a component has hidden coupling, an optional peer dep, a
submodule, a module-level side effect, or a non-obvious extension point.

Current notes:

| Module                                                         | Why it has notes                                                                                                                        |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| [AI](src/components/AI/MAINTAINERS.md)                         | `renderTextContent` extension point; host owns sanitization; reuses the Messaging composer                                              |
| [AGGrid (deprecated)](src/components/AGGrid/MAINTAINERS.md)    | Legacy maintenance only; retained for existing consumers. Use [DataVis NITRO](src/components/DataVisNITRO/MAINTAINERS.md) for new work. |
| [ESheet](src/components/ESheet/MAINTAINERS.md)                 | Implementation is a submodule (nx); needs `build:esheet`; Storybook-only `src`                                                          |
| [DataVisNITRO](src/components/DataVisNITRO/MAINTAINERS.md)     | Wraps `datavis-ace` + the `@mieweb/datavis` npm package; context/source/grid wiring                                                     |
| [FloatingWindow](src/components/FloatingWindow/MAINTAINERS.md) | Manual drag/resize math; modal vs. floating modes; fully controlled                                                                     |
| [YChart](src/components/YChart/MAINTAINERS.md)                 | Vanilla editor in a submodule, dynamically imported; not in the public API                                                              |

## Commits, versioning & releases

- Follow [Conventional Commits](https://www.conventionalcommits.org/)
  (`feat:`, `fix:`, `docs:`, `chore:`, …).
- Semantic versioning: **major** = breaking API, **minor** = backwards-compatible
  features, **patch** = backwards-compatible fixes.
- `prepublishOnly` runs a full build. Never publish from a dirty/un-built tree.
- **Never publish without explicit confirmation.**

### Release channels

| Channel             | Install                       | Source                                        |
| ------------------- | ----------------------------- | --------------------------------------------- |
| Stable (`latest`)   | `npm install @mieweb/ui`      | Stable version tags                           |
| Prerelease (`next`) | `npm install @mieweb/ui@next` | Eligible pushes to `main` and prerelease tags |

The [release workflow](.github/workflows/release.yml) defines the triggers and
path exclusions. A push changing only root-level Markdown files (such as
`README.md`) does not trigger a `main` prerelease, so a README-only update reaches
npm with the next release. Markdown in subdirectories, such as `lessons/`, is not
excluded by `*.md` and can trigger a prerelease. Changes under `.github/` are also
excluded, except for the release workflow itself.

For a stable release, use GitHub Actions' **Create Stable Release** workflow and
select the semantic version bump. It updates the package version and creates the
tag that triggers publishing. Maintainers can also publish through a deliberate
`v*` tag; inspect the workflow and obtain approval before creating or pushing one.

## Developing Components From a Consuming Application

Before proposing a new component, read this guide and audit the component
catalog, related examples, and existing composition patterns. Evaluate candidates
by behavior and user need, not only by name. Document why using, configuring,
composing, or extending existing components does not adequately solve the problem.
Present the gap and supporting evidence before implementation.

When a reusable gap remains, develop the component so it can be contributed
upstream. Follow the [component checklist](#adding-a-new-component-checklist),
including documentation, accessibility, internationalization, theming, and tests.
Keep application-specific data access and business rules in the consuming
application; expose reusable behavior through a clear public API. Do not invent a
generic abstraction solely to make project-specific code contributable.

### Coordinated Development With a Submodule

1. Obtain approval before introducing a submodule or changing the consuming
   project's dependency strategy. Reuse an existing checkout when available;
   otherwise add `mieweb/ui` as a Git submodule using the project's vendor-directory
   convention and an upstream repository or fork accessible to collaborators.
2. Create a focused feature branch in the submodule for development and the
   upstream PR. A submodule pins an **exact commit**, not a branch; branch tracking
   does not replace the commit recorded by the consuming repository.
3. Configure the application to consume the submodule checkout through its
   established build and dependency tooling. Adding a submodule alone does not
   replace an installed npm dependency. Verify that the application actually uses
   the changed build and does not load a second React runtime.
4. Implement and test the reusable change in the submodule, then verify its
   integration in the consuming application. With the required approvals, commit
   and push the submodule change before recording its tested revision in the
   consumer. The pinned commit must be fetchable by collaborators and CI.
5. Open the upstream and consumer PRs using the process below. After upstream
   release, update the consumer to the released package or corresponding submodule
   commit according to its dependency policy, removing temporary overrides.

### Opening the Pull Requests

Follow each repository's approval requirements for commits, pushes, and PR
creation. This guide is not authorization to publish changes.

1. Run the [quality gates](#quality-gates-must-pass-before-opening-a-pr) and the
   integration checks relevant to the change. Record results and known gaps.
2. Push the feature branch to the upstream repository, or your fork if you lack
   write access. Open a PR targeting `mieweb/ui`'s `main` branch using GitHub's
   **Compare & pull request** flow or `gh pr create`. For a fork, select
   `mieweb/ui:main` as the base and your fork's feature branch as the head.
3. Supply the rationale and evidence below. Use a draft PR while the API, examples,
   or required checks are incomplete. Request maintainer review.
4. Open a separate consumer PR for the integration and pinned submodule revision.
   Link the two PRs in both directions and state any merge or release dependency.
   Do not include application-specific code or private data in the upstream PR.

### Component PR Rationale and Evidence

Every new or materially extended reusable component PR must explain:

- **Problem:** the user need and why it belongs in a shared library.
- **Alternatives:** existing components considered and why reuse, composition,
  or extension was insufficient.
- **Relationships:** what it complements, overlaps with, or replaces, with links
  and selection guidance discoverable from the affected component pages.
- **Boundaries:** when not to use it, known limitations, and application-owned
  responsibilities.
- **Evidence:** a realistic composition example and verification of interactions,
  mobile and desktop layouts, light and dark themes, brand switching,
  accessibility, translated text expansion, and RTL behavior. Explain any
  inapplicable checks or unverified requirements.
- **Compatibility:** API impact, dependencies, and migration guidance where needed.

Put enduring guidance in the component documentation and link to it from the PR.
Use the PR description for change-specific reasoning and verification evidence,
not a second copy of the documentation. Reviewers should be able to understand
why to choose the component, when to choose something else, and how it fits with
the rest of the library without reading its implementation.

## Adding a new component (checklist)

First complete the [alternatives audit and contribution workflow](#developing-components-from-a-consuming-application).
For work directly in this repository, the consumer submodule steps apply only
when a consuming application is involved; the audit and PR requirements still apply.

1. `src/components/<Name>/` with `index.ts`, `<Name>.tsx`, `<Name>.stories.tsx`.
2. Follow the [anatomy](#anatomy-of-a-component) conventions (CVA, `cn`,
   `forwardRef`, theme tokens, a11y).
3. Autodocs story (one component per file, `argTypes`, component description).
4. Export from [src/index.ts](src/index.ts); add a
   `tsup` entry if it should be individually importable.
5. Add a unit test; add a visual story baseline if it has notable rendering.
6. Add a `MAINTAINERS.md` if it's non-trivial (see criteria above).
7. Run the [quality gates](#quality-gates-must-pass-before-opening-a-pr).

## Adding a new brand (checklist)

1. `src/brands/<brand>.ts` (`BrandConfig`) and `src/brands/<brand>.css`
   (CSS variables).
2. Export from [src/brands/index.ts](src/brands/index.ts).
3. Add a `tsup` entry if the brand should be individually importable.
4. Verify representative components in the new brand, light **and** dark.
