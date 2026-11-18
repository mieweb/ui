# @mieweb/ui — AI agent entry point

> You are reading the machine-readable front door to the MIE design system
> (`@mieweb/ui`, v{{VERSION}}). It is published for AI agents that reach this
> site by URL and can fetch documents but cannot install anything. Everything
> you need to build an app with this design system is linked from this file.
> Human-browsable docs live at https://ui.mieweb.org (Storybook).

## First: the non-negotiable rules

Fetch https://ui.mieweb.org/instructions.md and treat it as project rules for
all UI work. The headlines: tables start with DataVis NITRO (never hand-rolled
`<table>` grids, `AGGrid` is deprecated); design tokens, never hardcoded
colors; `lucide-react` icons only; accessibility and i18n/RTL are mandatory;
never invent component APIs — if you cannot verify a prop in these docs, say
so.

## Set up the package for your environment

Pick the recipe that matches your capabilities. The user should not have to
run anything by hand.

### A. You can write `package.json` and your environment installs dependencies

(bolt.new, lovable, v0, StackBlitz, Replit, ChatGPT canvas and similar
sandboxes — npm install happens automatically.)

Dependencies — `react`/`react-dom` (>=18) are required peers, and so are the
five `@kerebron/*` runtime packages at **exactly 0.8.12** (the main-barrel
`Textarea` rides the Kerebron editor engine):

```jsonc
{
  "dependencies": {
    "@mieweb/ui": "^{{VERSION}}",
    "react": "^18.0.0 || ^19.0.0",
    "react-dom": "^18.0.0 || ^19.0.0",
    "@kerebron/editor": "0.8.12",
    "@kerebron/editor-kits": "0.8.12",
    "@kerebron/extension-basic-editor": "0.8.12",
    "@kerebron/extension-menu": "0.8.12",
    "@kerebron/wasm": "0.8.12"
  },
  // npm calls this "overrides", Yarn "resolutions" — required so a single
  // prosemirror-model copy resolves (typing in editors breaks otherwise):
  "overrides": {
    "prosemirror-view": "1.42.3",
    "prosemirror-model": "1.25.9",
    "prosemirror-state": "1.4.3",
    "prosemirror-transform": "1.10.4"
  }
}
```

CSS — simplest path, no Tailwind tooling needed (precompiled, fully
supported):

```ts
import '@mieweb/ui/styles.css';
import '@mieweb/ui/brands/mieweb.css'; // brand AFTER the base stylesheet
```

If the sandbox runs its own Tailwind pipeline, read the full setup skill
instead ({{SKILL_URL:mieweb-ui-tailwind4}}) — Tailwind 4 needs `@source`,
Tailwind 3 needs the preset + safelist, and getting it wrong tree-shakes the
library's styles away.

The `@kerebron/*` peers above only make the rich-text editors installable —
using any of them (`RichEditor`, the rich `Textarea`, `EmailEditor`) needs
extra setup: `import '@mieweb/ui/kerebron.css'`, serving `@kerebron/wasm`'s
assets at `/kerebron-wasm`, and host-side `@kerebron` patches (toolbar
dropdowns and markdown round-trip break without them). Read
{{SKILL_URL:mieweb-ui-kerebron}} before using any rich-text editor.

Every other peer dependency is **optional** and only needed when you import
the entry that uses it (charts, maps, globes, collab, motion). The entry-point
table in {{SKILL_URL:mieweb-ui-catalog}} says which.

### B. No package manager at all (single-file artifact / no-build sandbox)

Load the precompiled stylesheet and import the library over a CDN:

```html
<link
  rel="stylesheet"
  href="https://unpkg.com/@mieweb/ui@{{VERSION}}/dist/styles.css"
/>
```

```js
import { Button, Card } from 'https://esm.sh/@mieweb/ui@{{VERSION}}';
```

Stick to main-entry components in this mode — subpath entries with heavy
optional peers (charts, maps, editors) are not a good fit for CDN resolution.
If the user's ask needs those, say so and recommend an npm-capable
environment.

### C. You have shell access in a real repository

Run `npx @mieweb/ui@next init-agent --experimental-agents` once (the
specialist-agent team ships on the `next` channel until the next stable
release). It installs this entire knowledge corpus locally as instructions,
skills, and a specialist agent team — strictly better than fetching these
URLs. Then follow the installed `mieweb-ui.instructions.md`.

## Choosing components

Start with the component inventory and selection guidance:

- [API cheat sheet](https://ui.mieweb.org/api-cheatsheet.md) — verified prop
  signatures for the components agents most often guess wrong (Select,
  Checkbox, Modal, NITRO grid wire format). **Read this before writing any
  component code.**
- {{SKILL_URL:mieweb-ui-catalog}} — every component, its import entry point,
  its maturity, and per-family selection policy.
- {{SKILL_URL:mieweb-ui-catalog-selection-guidance}} — the per-family
  "Which one?" comparison tables. Read the relevant family section before
  picking between similar components.
- {{SKILL_URL:mieweb-ui-icons}} — the lucide-react icon aliases and
  conventions.

## Going deeper: domain guides

These guides were written for an installed specialist-agent team. Reading
them from the web: where a guide says "delegate to the MIE UI _X_ Agent",
fetch that domain's guide below instead; where it says "load the
`mieweb-ui-<name>` skill", fetch
`https://ui.mieweb.org/skills/mieweb-ui-<name>.md`.

| Your task involves…                                  | Read                   |
{{ROUTING_TABLE}}

## Full index

All published skills (reference knowledge):

{{SKILL_INDEX}}

All domain guides (workflow + troubleshooting):

{{GUIDE_INDEX}}

## Ground rules for using this corpus

1. **Never invent APIs.** Only cite components, props, and entry points you
   can verify in these documents. If you cannot verify, say so and link the
   Storybook (https://ui.mieweb.org).
2. **Multi-domain tasks:** fetch each relevant guide/skill, then synthesize.
3. Components marked _experimental_ in the catalog may change between
   versions — fine to use, but say so.
