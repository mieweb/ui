---
name: mieweb-ui-i18n-checklist
description: Internationalization and RTL audit procedure for apps built with @mieweb/ui — string externalization, locale-bundle completeness, Intl formatting with the active locale, and RTL-safe layout (logical properties, direction-aware JS), plus the library's direction toolkit (useDirection, isRtl, isRtlLocale) and known RTL layout gotchas. USE WHEN auditing a component, page, or diff for i18n/RTL compliance, adding a new locale, fixing hardcoded strings or locales, or making a layout work right-to-left.
---

# i18n & RTL auditing with @mieweb/ui

Policy baseline is Rule 10 of the installed `mieweb-ui.instructions.md`
(externalize all user-facing text; RTL-safe logical classes; `Intl` APIs for
dates/numbers/currency). The reference implementation of the org's i18n
pattern is `@mieweb/ui/datavis` (`packages/datavis/src/i18n/` in the library
repo): i18next + react-i18next with a canonical `en-US.json` plus one JSON
bundle per locale, and a `LocaleProvider`/`useLocale()` context that feeds
`Intl`/`toLocale*` formatting.

## Audit procedure

Work through the four categories in order; for each finding record file,
line, issue, and fix.

1. **String externalization.** Every user-facing string in JSX or in values
   handed to the UI (toast/alert messages, `aria-label`s, placeholders,
   button labels, empty-state text, error messages) must go through the
   project's translation function (`t('…')` from `useTranslation()`).
   Grep targets: quoted text in JSX children, string props named
   `label`/`title`/`placeholder`/`aria-label`/`alt`, string arguments to
   toast/alert/announce calls. Dev-only output (`console.*`, thrown `Error`
   messages not shown to users) is exempt — note it as a judgment call, not
   a finding.
2. **Localized in the same commit + bundle completeness.** New `t()` keys
   must land with entries in **every** locale bundle in the same commit —
   not just `en-US`. A key present in the canonical bundle but missing from
   any sibling bundle is a finding (i18next silently falls back to
   `fallbackLng`, so the gap ships invisibly). Audit by diffing key sets:
   every bundle must have exactly the canonical bundle's keys — flag missing
   *and* orphaned (removed-from-canonical but lingering) keys.
3. **Formatting via `Intl` with the active locale.** Dates, numbers, and
   currency go through `Intl.*` / `toLocale*` APIs with the locale flowing
   from the active language — `useLocale()` where the datavis-style
   `LocaleProvider` is in scope, otherwise `i18n.language`. Findings:
   - a hardcoded BCP-47 tag (`toLocaleDateString('en-US', …)`) — pins every
     user to one locale;
   - manual string formatting (`` `${month}/${day}/${year}` ``, `+ '%'`,
     `'$' + amount`) where an `Intl` formatter belongs;
   - **string concatenation or interpolation around `t()`** —
     `t('greeting') + name` or `` `${t('count.prefix')} ${n}` `` breaks
     word-order in other languages. Use i18next interpolation and plurals:
     `t('greeting', { name })`, `t('items', { count })`.
4. **RTL layout and direction-aware JS.** Everything below.

## RTL checklist

The library is logical-properties-first; its CI ratchet
(`pnpm rtl:scan` against `scripts/rtl-baseline.json`, currently zero debt)
blocks new physical-direction styling in library code. Apps should hold the
same line:

- **Classes:** `ms-*`/`me-*`, `ps-*`/`pe-*`, `start-*`/`end-*`,
  `text-start`/`text-end`, `border-s-*`/`border-e-*`, `rounded-s-*`/`rounded-e-*`
  — never `ml-*`/`mr-*`, `pl-*`/`pr-*`, `left-*`/`right-*`,
  `text-left`/`text-right`. `rtl:` variants only for true exceptions.
- **Inline styles evade class greps** — also check `style={{ … }}` for
  `marginLeft`, `paddingRight`, `left`, `right`, `textAlign: 'left'`,
  `float`; use `marginInlineStart`, `insetInlineStart`, `textAlign: 'start'`.
- **Directional icons** (chevrons, back/forward arrows) flip with
  `rtl:-scale-x-100`; checkmarks, media controls, and up/down arrows do not.
- **Keyboard handlers:** ArrowLeft/ArrowRight must follow *visual*
  direction. Use `isRtl(event.currentTarget)` inside handlers; use
  `useDirection(ref)` (reactive) whenever direction drives rendering or
  positioning math. Content rendered through a portal must read direction
  from a non-portaled ref — the portal escapes local `dir` overrides.
- **Genuinely physical UI stays physical** — viewport-pinned toasts, resize
  handles, geometry math tied to screen coordinates, LTR data islands
  (code, phone numbers, URLs — wrap in `dir="ltr"`). Deliberate exceptions
  deserve a comment, not a silent physical class.

## Library direction toolkit

| Export (root entry) | Use for | Caveats |
| --- | --- | --- |
| `useDirection(ref?)` | Reactive `'ltr' \| 'rtl'` from the nearest `dir` attribute | Prefer it over `isRtl()` whenever direction drives rendering; pass a ref to respect local `dir` overrides |
| `isRtl(element?)` | One-shot check in event handlers | Snapshot, not reactive — stale if stored across renders; never call with a portaled element |
| `isRtlLocale(locale)` / `RTL_LOCALES` | Mapping a locale choice to `dir` (`ar`, `he`, `fa`, `ur`) | Checks the language subtag only |
| `cn()` (from `@mieweb/ui`) | Class merging where physical ⇄ logical pairs conflict correctly | Consumer `className="ml-2"` overrides still win over `ms-2` |

Set direction at the root: `<html dir="rtl">` (or a scoped
`dir` attribute), typically derived from the active language via
`isRtlLocale(i18n.language)`.

## Adding a locale (datavis-style setup)

1. Add `<locale>.json` next to the existing bundles with the **complete**
   key set of the canonical bundle.
2. Register it in the i18next `resources` map where `ensureI18nInit()` (or
   the app's equivalent init) builds the instance.
3. Expose it in the app's language selector; on change call
   `i18n.changeLanguage(code)` and update `dir` if `isRtlLocale(code)`.
4. Verify `Intl` output (dates, numbers) in the new locale — no code changes
   should be needed if locales were never hardcoded.

## Testing

- Pseudo-check by switching language at runtime: untranslated strings stay
  English (missing keys fall back silently — category 2).
- Flip `dir="rtl"` (the library Storybook has a direction toolbar;
  `ar`/`he`/`fa`/`ur` locales imply it) and walk the layout: alignment,
  icon direction, horizontal arrow keys, popover/tooltip anchoring.
- Long-text expansion: German/Russian strings run ~30% longer — look for
  truncation and overflow at realistic lengths.

## Verification checklist

- [ ] No hardcoded user-facing strings — all text through `t()`
- [ ] Every locale bundle has exactly the canonical bundle's keys (new keys added to all bundles in the same commit)
- [ ] No hardcoded locale tags — `Intl`/`toLocale*` driven by the active language
- [ ] No concatenation around `t()` — interpolation and `count` plurals
- [ ] No new physical-direction classes or inline styles; directional icons flip; arrow keys follow visual direction
- [ ] Layout verified in `dir="rtl"` and with a long-text locale
