# @mieweb/ui Compliance Prompt

> Copy this prompt and paste it into a new AI coding session to bring any project into compliance with `@mieweb/ui`. Replace `[PROJECT_DIR]` with the actual path.

---

## The Prompt

```
You are auditing and migrating the project at [PROJECT_DIR] to use @mieweb/ui
(ui.mieweb.org) for all UI components. Follow this process step by step.

## Context

@mieweb/ui is a React component library with 126+ components, Tailwind CSS 4
theming, dark mode, brand switching, and built-in accessibility. All MIE
projects must use it for every UI element — no raw <button>, <input>, <select>,
<table>, <textarea>, or custom modal/card/badge markup.

## Step 1: Audit

Run these grep commands against the project source and report the counts:

1. Raw <button> elements (excluding test files)
2. Raw <input> elements (excluding test files)
3. Raw <select> elements
4. Raw <table>/<thead>/<tbody>/<tr>/<td>/<th> elements
5. Raw <textarea> elements
6. Custom modal/dialog divs
7. Custom card containers (div with card-like classes)
8. Custom badge/pill/tag spans
9. Existing @mieweb/ui imports (to see current adoption)

Present the results as a table with file paths and line counts per category.

## Step 2: CSS Foundation Check

Verify the CSS entry point has:
- [ ] `@source "../node_modules/@mieweb/ui/dist"` directive
- [ ] `@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *))`
- [ ] `@theme` block with fallback values on all `var(--mieweb-*)` references
- [ ] PostCSS config uses `@tailwindcss/postcss`, NOT `tailwindcss`

If any are missing, fix them. If no CSS entry point exists, create one using:
  @import '@mieweb/ui/init.css';

## Step 3: Resolution Plan

Create a prioritized replacement plan:
1. Layout shell — AppHeader, Sidebar, SiteFooter
2. Buttons — Replace all raw <button> with Button from @mieweb/ui
3. Form elements — Input, Select, Checkbox, Radio, Textarea, Switch
4. Cards & Modals — Card/CardContent, Modal/ModalBody
5. Tables — Table/TableHeader/TableBody/TableRow/TableCell
6. Feedback — Badge, Toast, Spinner, Progress, Skeleton
7. Navigation — Tabs, Breadcrumb, Pagination

Work through the plan file by file. For each file:
- Add the @mieweb/ui import
- Replace raw elements with @mieweb/ui components
- Preserve existing functionality and event handlers
- Add aria-label attributes to interactive elements that lack them

## Step 4: Theme & Brand Hooks

Ensure the project has:
1. A `useTheme` hook that sets BOTH `.dark` class AND `data-theme` attribute
   on document.documentElement (both are required for @mieweb/ui dark mode)
2. A `useBrand` hook that uses `generateBrandCSS()` and `brands` from
   '@mieweb/ui/brands' for dynamic brand switching

If these don't exist, create them.

## Step 5: Testing

After all replacements, verify:
1. Light mode — all components render with correct colors, no transparent gaps
2. Dark mode — toggle dark mode, verify ALL surfaces invert (cards, inputs,
   modals, tables, sidebar, badges)
3. Brand switch — switch to a non-default brand, verify primary colors change
   on buttons, focus rings, links, active states
4. Dark mode + non-default brand — both working simultaneously
5. Keyboard navigation — Tab through the page, verify focus indicators visible
6. TypeScript — `npx tsc --noEmit` passes clean

## Step 6: Gap Detection

Report any UI patterns that have no @mieweb/ui equivalent:
- Component name, file location, screenshot/description
- Recommend whether it should be built locally or contributed upstream
- For local builds: follow @mieweb/ui patterns (CVA variants, forwardRef,
  theme CSS variables, dark mode support, ARIA labels)

## Step 7: Final Compliance Report

Output a summary table:

| Category | Before | After | Status |
|----------|--------|-------|--------|
| Raw <button> | X | 0 | ✅ |
| Raw <input> | X | 0 | ✅ |
| Raw <select> | X | 0 | ✅ |
| Raw <table> | X | 0 | ✅ |
| Raw <textarea> | X | 0 | ✅ |
| Custom modals | X | 0 | ✅ |
| @mieweb/ui imports | X | Y | ✅ |
| Dark mode works | - | - | ✅/❌ |
| Brand switching works | - | - | ✅/❌ |
| TypeScript clean | - | - | ✅/❌ |
| Gaps identified | - | N | 📝 |

## Component Mapping Reference

| Raw Element | @mieweb/ui Import |
|------------|-------------------|
| <button> | Button |
| <input> | Input |
| <input type="checkbox"> | Checkbox |
| <input type="radio"> | Radio |
| <textarea> | Textarea |
| <select> | Select |
| <table>/<thead>/<tbody>/<tr>/<td>/<th> | Table, TableHeader, TableBody, TableRow, TableCell |
| Custom modal divs | Modal, ModalHeader, ModalBody, ModalFooter |
| Custom card containers | Card, CardHeader, CardContent |
| Badge/pill/tag spans | Badge |
| Avatar circles | Avatar |
| Loading spinners | Spinner |
| Skeleton loaders | Skeleton |
| Progress bars | Progress |
| Tabs | Tabs |
| Tooltips | Tooltip |
| Toasts/notifications | Toast |
| Breadcrumbs | Breadcrumb |
| Date pickers | DateRangePicker, DateInput |
| Phone inputs | PhoneInput |
| Sliders | Slider |
| Toggle switches | Switch |
| Dropdowns | Dropdown |
| Pagination | Pagination |
| Chat/messaging UI | MessageBubble, MessageList, MessageComposer |
| App headers | AppHeader, PageHeader, SiteHeader |
| Sidebar navigation | Sidebar |
| Footer | SiteFooter |
| Step indicators | StepIndicator |
| Command palettes | CommandPalette |
| File uploads | DropzoneOverlay, FileManager |

All imports: `import { ComponentName } from '@mieweb/ui';`
Brands: `import { generateBrandCSS, brands } from '@mieweb/ui/brands';`
```

---

## Usage

1. Open a new AI coding session (Copilot, Claude, etc.)
2. Paste the prompt above, replacing `[PROJECT_DIR]` with the actual project path
3. The AI will audit, plan, replace, test, and report
4. Review the final compliance report and address any gaps

## Customization

Add project-specific context after the prompt:

```
Additional context for this project:
- Framework: [Next.js / Vite / Meteor / Remix / etc.]
- Source directory: [src/ / app/ / imports/ / etc.]
- Existing component library: [if migrating from another library]
- Priority pages: [list the most important pages to migrate first]
- Known constraints: [any limitations or special requirements]
```
