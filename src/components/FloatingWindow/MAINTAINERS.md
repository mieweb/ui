# FloatingWindow — Maintainer Notes

> **Provider notes** — how to *change* the FloatingWindow shell. Consumers should
> read the Storybook autodocs. General conventions:
> [CONTRIBUTING.md](../../../CONTRIBUTING.md).

## What's in here

A **self-contained, presentational** window shell ([FloatingWindow.tsx](FloatingWindow.tsx))
used for pop-out editors (notes, letters, etc.). No heavy/external deps — just
`lucide-react` icons, the local `Button`, and `cn`. It has its **own `tsup` entry**
so it's individually tree-shakeable (`@mieweb/ui/components/FloatingWindow`).

## Design contract (don't break these)

- **Fully controlled.** `open`, `minimized`, and the actions (`onClose`,
  `onMinimize`, `onPopOut`) are owned by the host. The component holds **no**
  open/visibility state — only transient `size`/`position` for drag/resize.
- **Two modes via `draggable`:**
  - `false` (default) → centered, modal-style over a dimmed overlay.
  - `true` → freely positioned, draggable by the header.
- **`minimized` renders nothing** — `FloatingWindow` returns `null` when
  minimized. The folder also exports **`MinimizedWindow`** (a taskbar-style
  restore chip) that hosts can render for the collapsed state; wiring the two
  together is the host's job.
- `forwardRef<HTMLDivElement>`; forwards an accessible dialog role. Pass
  `aria-label` when `title` isn't plain text.

## Gotchas

- **Drag/resize is hand-rolled mouse math** (`dragRef` / `resizeRef`, 7 entries
  in `RESIZE_HANDLES`). During a gesture it attaches **`document`-level
  `mousemove` / `mouseup`** listeners and removes them on `mouseup` — make sure
  any change still tears them down on gesture-end / unmount or you'll leak
  listeners and pin the cursor.
- **Size/position are seeded from props once** (`defaultWidth` 1024, `defaultHeight`
  600, `minWidth` 600, `minHeight` 400). They do **not** reset when `open` toggles
  unless the component is remounted. If a consumer wants "reopen at default
  position," they must remount (e.g. via `key`).
- Resize must clamp to `minWidth`/`minHeight`. Keep the clamp when refactoring.
- Persistence/restore of last position is intentionally **out of scope** — it's a
  presentational shell; wire persistence in the host.

## Testing

Unit test: [FloatingWindow.test.tsx](FloatingWindow.test.tsx). Add cases for any
new gesture/clamp behavior. A visual story baseline is worth adding for the two
modes if you change layout.
