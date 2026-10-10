<!-- Smallest viable change: one problem, fewest files. Link the issue. -->

## What & why

<!-- For new or materially changed components, include the rationale and
evidence required by CONTRIBUTING.md → "Component PR Rationale and Evidence". -->

## Checklist

- [ ] `pnpm typecheck && pnpm lint && pnpm format && pnpm test` pass
- [ ] Visual tests pass / baselines updated if rendering changed (`pnpm test:visual`)

### RTL — see [CONTRIBUTING.md → RTL & direction-agnostic styling](https://github.com/mieweb/ui/blob/main/CONTRIBUTING.md#rtl--direction-agnostic-styling)

- [ ] No new physical-direction classes or inline styles (`ml-`, `left-`, `marginLeft`, `left:`, `textAlign: 'left'`, …) — `pnpm rtl:scan` passes
- [ ] Directional icons flip with `rtl:-scale-x-100`; genuinely physical usages annotated `// rtl-ignore -- <reason>`
- [ ] `ArrowLeft`/`ArrowRight` handlers are direction-aware (`useDirection()`)
- [ ] New class strings safelisted in **both** `src/tailwind-preset.ts` and `src/tailwind-preset.cjs`
- [ ] Direction-sensitive rendering has RTL visual coverage: screenshot **plus** computed-style/geometry assertions
