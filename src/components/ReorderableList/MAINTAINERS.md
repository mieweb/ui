# ReorderableList — Maintainer Notes

> **Provider notes** — how to _change_ ReorderableList. Consumers should read the
> Storybook docs page (Modules/Views/ReorderableList). General conventions:
> [CONTRIBUTING.md](../../../CONTRIBUTING.md).

## What's in here

| File                                                       | Contents                                                                                                      |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| [ReorderableList.tsx](ReorderableList.tsx)                 | The list, one `Row` per item, and the move buttons                                                            |
| [ReorderableList.stories.tsx](ReorderableList.stories.tsx) | Basic (`storageKey`), WithoutGrip, WithHandle, WithMoveButtons, Grouped, Sections, SavedOnServer, Mobile, RTL |
| [ReorderableList.test.tsx](ReorderableList.test.tsx)       | Keyboard, buttons, `canDropOn`, pointer drag (mocked layout)                                                  |
| [storyData.ts](storyData.ts)                               | Fixtures and `inOrder` for stories and tests                                                                  |

## Two engines, one order

A move can come from three places, and they are deliberately split:

| Input                | Handled by                          | Why                                                                       |
| -------------------- | ----------------------------------- | ------------------------------------------------------------------------- |
| Pointer / touch drag | `@dnd-kit/sortable` (`useSortable`) | Rows slide aside while dragging, which HTML5 drag-and-drop can't do       |
| Alt+↑ / Alt+↓        | `useDragReorder().moveBy`           | Same keys, `canDropOn` boundaries and announcements as the clinical lists |
| Move buttons         | `useDragReorder().moveButtonProps`  | Disabled-at-the-edges logic and labels come for free                      |

Every path ends in the same `commit(ids)`: it saves through `useOrderPersistence`
when `storageKey` is set, then calls `onReorder(ids)`.

## Who owns the order

- **With `storageKey`** the list holds the order: `useOrderPersistence` with
  `localStorageOrderAdapter(storageKey)` merges the saved ids with `items`
  (`mergeOrder`: saved first, new ids appended, gone ids dropped) and rows render
  in that order. `items` only supplies the rows.
- **Without it** a no-op adapter is passed (hooks can't be conditional) and the
  list renders `items` exactly as given; the caller owns the order.
- The saved order is **read once on mount** (`useOrderPersistence` loads in a
  mount effect), like `CustomizableDashboard`'s `storageKey`. To switch keys at
  runtime, remount with a React `key`.

## Invariants & gotchas

- **dnd-kit's announcements are silenced on purpose** (`silent` in the
  component). Its defaults are English and read raw ids. Keyboard and button
  moves announce through `useDragReorder`'s localised `labels.moved` in the
  polite region after the list. If you add a pointer-drop announcement, route it
  through `labels`, never through dnd-kit's strings.
- **dnd-kit's keyboard sensor is not used.** Alt+Arrow on the row is the
  keyboard path. Adding `KeyboardSensor` would give two competing keyboard
  models on the same row.
- **`canDropOn` is enforced in two places.** During a drag, rows the dragged row
  may not land on are made non-droppable (`locked`), so the sorting strategy
  never opens a gap there; `onDragEnd` checks again. `useDragReorder` enforces it
  for keys and buttons. Change one, change all three.
- **Activation constraints keep clicks working.** Mouse drags start after 5 px.
  On touch, the grip starts at once (it is `touch-none`), while a whole-row drag
  needs a 250 ms press so the page can still scroll. Don't drop these without
  re-testing row buttons and scrolling on a phone.
- **`canDrag` separates "picked up" from "dropped on".** A row it refuses
  passes `draggable: false` to `useSortable` but stays droppable, so the
  sorting strategy still moves it aside and rows can cross it (the Sections
  story's divider). It gets no grip, `tabIndex`, Alt+Arrow or move buttons;
  neighbours' keyboard/button moves swap with it like any row.
- **Keys from controls inside a row are ignored** (`e.target !== e.currentTarget`),
  so Alt+Arrow in an input or a menu inside a row isn't hijacked.
- **Reduced motion** turns the slide transition off (`transition: null`); the
  drag itself still follows the pointer.
- **The live region sits outside the list** so a `ul`/`ol` only ever contains
  `li`. Keep it there; that's also why table rows (`tbody`/`tr`) aren't
  supported.

## Testing

jsdom has no layout, so the pointer-drag tests mock `getBoundingClientRect`
(each row 40 px tall) and wrap every mouse step in its own `act()` — dnd-kit
measures droppables in an effect after the drag starts. Real-browser behaviour
(the slide-aside animation, touch) is checked in Storybook.
