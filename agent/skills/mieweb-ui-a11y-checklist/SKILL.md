---
name: mieweb-ui-a11y-checklist
description: Accessibility audit procedure for apps built with @mieweb/ui — ARIA naming, keyboard navigation, focus management, color contrast, and live-region announcements, plus the library's a11y toolkit (useFocusTrap, useLiveAnnouncement, VisuallyHidden, useDragReorder) and known contrast traps. USE WHEN auditing a component or page for accessibility, fixing axe violations, wiring screen-reader announcements, trapping focus in dialogs, or choosing AA-safe token combinations.
---

# Accessibility auditing with @mieweb/ui

Policy baseline is Rule 9 of the installed `mieweb-ui.instructions.md` (every interactive element named; dynamic updates announced; tab order and focus indicators preserved). Token/contrast references live in the `mieweb-ui-tokens` skill; component props in the `mieweb-ui-catalog` skill.

## Audit procedure

Work through the five categories in order; for each finding record file, line, issue, and the library-backed fix.

1. **Accessible names & ARIA.** Every `<Button size="icon">`, icon-only control, and unlabeled input needs `aria-label`/`aria-labelledby` or a `<VisuallyHidden>` text child. Decorative icons get `aria-hidden="true"`. Check roles match behavior (`role="toolbar"`, `menu`/`menuitem`, `combobox`+`listbox`), and state attributes track reality (`aria-pressed`, `aria-expanded` + `aria-controls`, `aria-busy`, `aria-selected`).
2. **Keyboard navigation.** Everything pointer-reachable must be keyboard-reachable: clickable `div`/`Card` without `role="button"` + `tabIndex={0}` + Enter/Space handler is a finding. Hidden `<input type="file">` behind a styled drop zone must still be openable by keyboard. Drag-and-drop needs a keyboard path — the library's `useDragReorder` provides Alt+↑/↓ reordering with `DEFAULT_DRAG_REORDER_LABELS`. Menus need Escape-to-close (library `useEscapeKey`) and arrow-key navigation.
3. **Focus management.** Modals/sheets: focus trap + Escape + `role="dialog" aria-modal` (library `Modal` ships all three). Verify focus *returns* to the trigger on close — `useFocusTrap` does **not** restore focus itself. Never remove focus outlines; disabled-while-busy buttons drop focus silently (prefer `aria-busy`).
4. **Live regions & announcements.** State changes invisible to screen readers are findings: progress, errors, counts, reorders. Prefer `Toast`/`Alert` (announce for free). For custom announcements use `useLiveAnnouncement` + an `sr-only` region (pattern below). `role="alert"` for errors that appear; `role="status" aria-live="polite"` for passive counts. Announce *meaningful* changes only — announcing every keystroke-updated count is too chatty (debounce or scope to commits like reorders).
5. **Contrast.** AA is 4.5:1 small text, 3:1 large/UI. Check both themes and any non-default brand. Known failing combinations are listed below — flag them on sight.

## Library a11y toolkit

| Export (root entry) | Use for | Caveats |
| --- | --- | --- |
| `VisuallyHidden` | Screen-reader-only text (icon buttons, headings) | — |
| `useFocusTrap(enabled)` | Trap Tab/Shift+Tab in dialogs; focuses first focusable on enable | Queries focusables **once** when enabled — re-enable after content changes; no focus-return on close (do it yourself) |
| `useLiveAnnouncement()` | `[message, announce]` for an `aria-live` region; re-announces identical consecutive messages | You render the region yourself (pattern below) |
| `useEscapeKey`, `useClickOutside` | Dismissal plumbing for menus/popovers | — |
| `useDragReorder` | Pointer **and** keyboard (Alt+↑/↓) reordering with announcement labels | Pair with `useLiveAnnouncement` for the announcements |
| `usePrefersReducedMotion` | Gate bespoke animation | `MotionProvider` already respects it |
| `Modal` | Dialog with focus trap, Escape, `aria-modal` built in | — |
| `Toast` / `Alert` | Announced outcomes — never a bespoke alert div | — |

**Live-region pattern** (used across the library's list components):

```tsx
const [announcement, announce] = useLiveAnnouncement();
// on meaningful change: announce('Item moved down');
<div aria-live="polite" className="sr-only">{announcement}</div>
```

**Scrollable region pattern:** a keyboard-scrollable overflow container is `tabIndex={0}` + `role="region"` + `aria-label`, and must be the *single* scroll container (no nested scrolling child).

## Known AA contrast traps (verified failures)

| Combination | Ratio | Use instead |
| --- | --- | --- |
| `text-destructive` on `bg-destructive/10` | 4.14:1 ✗ | `text-destructive-700 dark:text-destructive-300` |
| `text-neutral-500` on `bg-neutral-100` (small text) | 4.34:1 ✗ | `text-neutral-600 dark:text-neutral-400` |
| White on `bg-primary-500` (BlueHive) | 2.65:1 ✗ (even `primary-700` fails) | `<Button variant="primary">` — it uses an AA-safe shade |
| Gray-400 `#9ca3af` on white | 2.53:1 ✗ | gray-500 `#6b7280` (4.83:1) |

Raw styled buttons imitating the primary variant are both a styling finding (Rule 5) and a contrast finding — `<Button>` resolves both.

## Testing

- Automated: run axe on rendered states (`@axe-core/playwright`, axe DevTools, or Storybook's a11y addon). Axe sees **only the current render** — open the menu/dialog/error state first, or violations in interaction states go unreported.
- Manual keyboard pass: Tab through the whole surface; verify visible focus at every stop, no traps outside dialogs, Escape closes layers, focus returns to triggers.
- Screen-reader spot check: are state changes announced exactly once, with meaningful text?

## Verification checklist

- [ ] Every interactive element has an accessible name; decorative icons `aria-hidden`
- [ ] Full keyboard path for every pointer interaction (incl. drag → `useDragReorder`)
- [ ] Dialogs trap focus, close on Escape, and return focus to the trigger
- [ ] Meaningful dynamic changes announced (`Toast`/`Alert` or `useLiveAnnouncement` + `sr-only` region)
- [ ] No known contrast traps; both themes (and active brands) checked
- [ ] Axe clean on default **and** interaction states; manual Tab pass done
