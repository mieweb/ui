# PortalShell maintenance

Consumer guidance belongs in `PortalShell.stories.tsx`. This module composes AppHeader, Sidebar and SidebarProvider; changes to their viewport or focus behavior must be checked in the shell too.

## State and navigation invariants

- SidebarProvider owns desktop collapse persistence, mobile-open state and the top-level accordion. The shell forwards `storageKey`; consumers with independent shells need distinct keys.
- Provider viewport detection and `lg` layout utilities share the 1024px boundary. Test both sides when changing it.
- Labeled top-level groups share the provider accordion. Recursive child groups omit `groupId` so their independent expansion does not collapse ancestors. Hidden items must not affect visible navigation; active descendants seed expansion.
- Preserve native anchor behavior when no navigation callback is supplied. With callbacks, the caller owns routing and authorization. Rendering a hidden item is not an access-control mechanism.

## Accessibility and layout

The skip link targets the single `portal-main-content` landmark. Keep that ID and `tabIndex=-1` synchronized. The shell owns the viewport height; the main element scrolls within it.

Sidebar owns mobile focus trapping, Escape, dismissal and focus restoration. PortalBody becomes inert only while the mobile drawer is open. Do not move the drawer into that inert subtree or make desktop content inert when resizing. Verify keyboard navigation, focus return and body scrolling at mobile widths and at the breakpoint.

## Verification

Run PortalShell and Sidebar unit tests, `pnpm rtl:scan`, and the desktop/mobile `tests/visual/portal-review.spec.ts` cases after rendering changes. Build Storybook first. Check long translated navigation labels, nested active routes, collapse persistence and both navigation callback/native-link paths. Consumer portal accessibility tests provide additional coverage for focus and reflow.
