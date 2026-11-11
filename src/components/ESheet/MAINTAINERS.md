# ESheet — Maintainer Notes

> **Provider notes** — how to change the eSheet integration. Consumers should
> read the Storybook stories and use `@mieweb/ui/esheet`. General conventions:
> [CONTRIBUTING.md](../../../CONTRIBUTING.md).

## Implementation and package contract

This folder contains Storybook stories; the implementation lives in the
`packages/esheet` git submodule, a pnpm monorepo. Its integration packages are
`@esheet/core`, `@esheet/fields`, `@esheet/adapters`, `@esheet/builder`,
`@esheet/renderer` and `@esheet/styles`.

[src/esheet.ts](../../esheet.ts) exposes the separate `@mieweb/ui/esheet` entry:
the builder, renderer, core definition type, clinical field registrations,
EncounterVisit and its MDY/MCP helpers. Preserve the native eSheet response
contract; EncounterVisit's composition has its own
[maintainer notes](../EncounterVisit/MAINTAINERS.md).

`@esheet/core`, `@esheet/fields`, `@esheet/builder` and `@esheet/renderer` are
externalized optional peers, with a supported floor of 0.0.6-17. All four must
be installed at matching versions for the shared entry. Keep the local
development links and published peer declarations together when changing this
contract. Adapters and styles are supplied by the upstream packages' regular
dependencies. The default UI entry must not acquire an eSheet runtime import.

Builder and Renderer import `@esheet/styles` automatically. Its explicit CSS
export is `@esheet/styles/styles.css`; the shared stylesheet replaces the old
renderer and builder `src/index.output.css` files and their ordering rules.
Composed UI controls also need `@mieweb/ui/styles.css`.

## Development and revision-aware builds

- Edit builder/renderer behavior in the submodule, commit it in the eSheet
  repository, then advance the pointer here.
- Storybook aliases the five TypeScript package entries to submodule source.
  `@esheet/styles` is aliased to its generated shared CSS, also loaded by
  `.storybook/preview.tsx`. TypeScript edits use HMR; CSS source changes need
  the upstream shared stylesheet rebuilt.
- `prebuild` runs [build-esheet.mjs](../../../scripts/build-esheet.mjs). It checks
  JS/declaration artifacts, shared CSS and a build stamp hashed from the current
  submodule revision and tracked diff. It rebuilds on a changed revision/diff or
  missing artifact, even when an old `dist` exists. It runs the upstream frozen
  install and filtered Builder/Renderer dependency builds. Source archives
  without Git metadata fall back to artifact checks.
- Untracked source additions do not contribute to the stamp. Include them in
  the submodule diff, or remove `packages/core/dist/.ui-build-stamp` to force
  `pnpm build:esheet` after such changes.

## Verification and gotchas

- Resolution failures usually mean the submodule needs
  `git submodule update --init --recursive` or `pnpm build:esheet`.
- Root Vitest excludes submodule tests; run the relevant upstream suite for
  implementation changes.
- Keep `src/esheet.ts`'s public surface stable. Test a packed consumer as well as
  local links when changing external peers; workspace aliases can hide missing
  published dependencies.
- EncounterVisit RichEdit needs the optional Kerebron peers and a single
  `prosemirror-view` 1.42.3 resolution with Kerebron 0.8.12. Consumers must apply
  their own override; see the shipped
  [package-manager setup](../../../MIGRATION.md#esheet-and-encountervisit).
