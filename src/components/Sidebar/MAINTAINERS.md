# Sidebar — Maintainer Notes

Short notes on the invariants that are easy to break. User-facing docs live in
[Sidebar.stories.tsx](./Sidebar.stories.tsx).

## `SidebarNavGroup` unmounts its items — on purpose

The items panel is rendered through `AnimatedPresence` and is **absent from the
DOM while collapsed**. Two things depend on that and will break quietly if it is
reverted to a CSS clamp:

1. **Accessibility.** The previous implementation clipped the panel with
   `max-h-0` + `overflow-hidden`, which hides content visually but leaves it
   mounted, focusable and announced. Keyboard users tabbed into rows they could
   not see. Unmounting is what fixes that.
2. **The animation itself.** `height: auto` is not interpolable in CSS, so the
   only pure-CSS option is a hard-coded `max-height` ceiling — which eases
   against dead space on short groups and clips tall ones. The `collapse` preset
   measures real height instead.

There is deliberately **no `fallbackClassName`** on the animated panel. Adding
one would mean reintroducing the `max-height` clamp, which is the bug. Without
the motion entry the panel simply appears and disappears, matching
`CollapsibleContent`'s presence path.

## `collapse` is not covered by `reducedMotion="user"`

`MotionConfig reducedMotion="user"` drops transform and layout animations, but
`height` is a plain value animation to motion and keeps running. The component
calls `usePrefersReducedMotion()` itself and passes `enabled={!prefersReducedMotion}`.
Any future preset that animates `height` needs the same treatment — see
[Motion](../../motion/MAINTAINERS.md).

## Focus must be captured *before* the panel goes

`focusWasInsideRef` exists because by the time an effect can observe the
collapse, the browser has already moved focus and `document.activeElement` is
`<body>`. A check made in the restore effect therefore always answers "no" and
the restore silently never fires. This was shipped broken once; keep the
ordering.

There are **two** recorders and both are load-bearing:

| Recorder | Covers | Why it alone is not enough |
| --- | --- | --- |
| `captureFocusInside()` in `handleToggle` | the group's own trigger | cannot see collapses it did not initiate |
| `focusin` listener | accordion siblings, controlled `groupId`, rail collapse | focus events are **suppressed while the window is unfocused**, so this path silently no-ops there — which is the normal state of an automated browser |

That second row is why the toggle-time capture is not redundant: a
`focusin`-only implementation passes in jsdom and fails in Playwright. There is
a test that drops the `focusin` registration specifically to pin it.

## `itemsVisible` is the single source of truth

Three independent things hide the items — the group collapsing, the desktop rail
collapsing, and `forceMount`'s `hidden` — and **every one of them strands
focus**. They are collapsed into one predicate:

```ts
const itemsVisible = !showCollapsed && effectiveExpanded;
```

Both focus effects key off it. Checking `effectiveExpanded` alone was a bug:
rail collapse removed the panel without restoring focus.

## `aria-controls` tracks the DOM, `aria-expanded` tracks visibility

These two deliberately read different predicates:

- `aria-expanded={itemsVisible}` — what the user can actually see.
- `aria-controls={panelInDom ? contentId : undefined}` — `aria-controls` may only
  reference an element that **exists**. `panelInDom` is `forceMount || itemsVisible`,
  because `forceMount` renders outside the rail gate (always present) while the
  animated branch renders inside it (present exactly when visible).

Using `itemsVisible` for both leaves a dangling `aria-controls` pointing at an id
that is not in the document while the rail is collapsed. Using `effectiveExpanded`
for `panelInDom` has the same effect. Both were caught by tests; keep them.

Neither attribute is dropped while the rail is collapsed. The trigger is still
rendered and still toggles the group, so removing its disclosure state would
leave an operable control that a screen reader cannot describe.

## `forceMount` sits outside the rail gate

It renders **outside** `!showCollapsed`, unlike the animated branch. Gating it
there would unmount the items whenever the sidebar rail collapsed, destroying
exactly the state the prop exists to preserve — the prop would hold its promise
for the group's own toggle and quietly break it for the rail's.

`forceMount` deliberately does **not** animate. `hidden` is `display: none`,
which an animated height cannot run through, and dropping `hidden` for the
animation's duration would reintroduce the tab-into-invisible-content bug above.
Sequencing `hidden` around the animation is the real fix if anyone wants both;
until then, not animating is the safe answer. Same reasoning and same trade-off
as `CollapsibleContent`'s prop of the same name — keep the two consistent.

`forceMount` still needs focus restoration. It avoids *remounting*, not the need
to move focus: the browser blurs a focused element inside a `display: none`
subtree just as surely as one that was removed.

`forceMount` does **not** make collapsed items findable by in-page search.
Browsers do not match text inside `display: none`. The prop's JSDoc claimed
otherwise at one point — `hidden="until-found"` is the feature that would deliver
it, but it is not portable enough to build the API on. Don't reinstate the claim
without changing the visibility contract.

## Testing notes

Assertions on `hidden` alone do not test `forceMount` — they pass even if the
subtree remounts on every toggle, which is the exact thing the prop prevents.
Test the promise instead: type into an uncontrolled input, cycle
open → closed → open, and assert both the node identity and the value survived.
