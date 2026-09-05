# @mieweb/ui

**Build applications that feel familiar from the first interaction.**

People should not have to relearn how to navigate, fill out a form, or recover
from an error every time they open another application. Clean, consistent
interfaces let users carry what they already know from one task to the next.
Predictable controls and clear feedback reduce hesitation and leave more
attention for the work that matters.

That consistency should extend beyond appearance. A coherent experience adapts
from mobile to desktop, remains legible in light and dark mode, accommodates
different languages and right-to-left layouts, and supports keyboard and
assistive-technology users. Responsive design, internationalization (i18n), and
accessibility (a11y) belong in the foundation, not on a finishing checklist.

`@mieweb/ui` brings that approach to your browser interface through reusable
controls, navigation, forms, feedback, and data displays. Shared interaction
patterns provide familiarity; theme and brand tokens give you room to make the
application your own. Developed at MIE, the library is available for applications
in any domain under its [license terms](#license), not just MIE products.

The components are built with React, but your application does not have to be.
Use them throughout a React application or embed them in selected areas of
Bootstrap-based, server-rendered, or other non-React pages. Adopt a component or
a workflow at a time without rewriting the rest of your interface.

Start with a common foundation and spend more time on what makes your application
valuable. The components support inclusive design; they do not automatically
translate your content or guarantee accessibility. Validate their composition,
language, and behavior with the people and devices your application serves.

**The library is `@mieweb/ui`. Storybook is its documentation and experimentation
environment**, where you can explore those components without building an app
first. This introduction is shared by GitHub, npm, and Storybook.

- [See it in action](#see-it-in-action), no installation needed.
- [Get started](#get-started), with or without an AI coding agent.
- [Explore and compose components](#explore-and-compose-components).
- [Contribute or run locally](#contribute-or-run-locally).

## See It In Action

[![Open the interactive dashboard demo: navigation, summary cards, recent orders, and activity](https://ui.mieweb.org/dashboard-preview.png)](https://ui.mieweb.org/?path=/story/product-feature-modules-dashboard--dashboard)

**[Open the interactive dashboard](https://ui.mieweb.org/?path=/story/product-feature-modules-dashboard--dashboard)**
to see navigation, headers, cards, and data displays working together in an
application layout. Try the brand and theme switchers to see how the same
components adapt. No installation required.

## Get Started

### Install in Your Application

The components require React 18+ and React DOM 18+ to render, including when
embedded in a non-React page. If your project already has those dependencies:

```bash
npm install @mieweb/ui
```

Use `pnpm add @mieweb/ui` or `yarn add @mieweb/ui` if that is your project's
package manager. You do not need to clone this repository or run Storybook to use
the library.

For a project without React, install the rendering dependencies:

```bash
npm install react react-dom
```

Using an AI coding agent? [Set up its instructions](#set-up-your-ai-coding-agent)
and [read the component-selection and integration rules](https://github.com/mieweb/ui/blob/main/agent/mieweb-ui.instructions.md)
before asking it to add components to your application.

Mount components into a dedicated DOM element with React DOM's `createRoot`, leaving the rest of
the page under its existing framework's control. Unmount the React root when the
host removes that area. This requires a JavaScript build that supports React;
the components are not framework-free HTML widgets.

When embedding alongside Bootstrap or other stylesheets, check CSS resets,
global selectors, and theme styles for conflicts. Mounting into a separate DOM
element does not isolate CSS.

### Set Up Your AI Coding Agent

From your application's repository root, run:

```bash
npx @mieweb/ui init-agent
```

This installs component-selection, composition, theming, and accessibility rules
so your agent can start with existing library components. It writes
`mieweb-ui.instructions.md` in `.github/instructions/` for VS Code Copilot and
updates a managed block in `AGENTS.md` for agents that read that file. Rerun after upgrading
`@mieweb/ui` to refresh the rules.

Read the [agent setup guide and rules](https://github.com/mieweb/ui/tree/main/agent).
These are instructions for coding agents, not an automatic PR reviewer or merge
gate. Agent-assisted and manual development use the same library and setup below.

### Render Your First Component

Import the precompiled stylesheet once in your application's entry point or root
layout. Import a brand stylesheet after it when you want that brand's tokens:

```tsx
import '@mieweb/ui/styles.css';
import '@mieweb/ui/brands/bluehive.css';
```

This CSS path does not require Tailwind in your application. For a first interactive
example, render a theme switcher inside the provider:

```tsx
import { Button, ThemeProvider, useThemeContext } from '@mieweb/ui';

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useThemeContext();

  return (
    <Button
      aria-label="Dark mode"
      aria-pressed={resolvedTheme === 'dark'}
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
    >
      Dark mode
    </Button>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>
  );
}
```

In production, supply translated labels through your application's i18n system.
In Next.js App Router, put this interactive example in a client component and
import global styles from the root layout.

Already using Tailwind? Follow the
[Tailwind 4 integration guide](https://github.com/mieweb/ui/blob/main/lessons/tailwind4-integration.md)
for CSS-first configuration, `@source`, and theme tokens. Tailwind 3 consumers can
use `@mieweb/ui/tailwind-preset`. Do not apply a Tailwind 3 configuration as a
Tailwind 4 setup.

### Add Specialized Capabilities When Needed

Heavy integrations use separate entry points and optional peer dependencies so
you only install what you need:

- **Data grids:** [DataVis NITRO](https://ui.mieweb.org/?path=/docs/components-text-data-display-datavis-nitro--docs), imported from `@mieweb/ui/datavis`.
- **Form authoring and rendering:** [eSheet integration](https://github.com/mieweb/ui/blob/main/src/components/ESheet/MAINTAINERS.md), imported from `@mieweb/ui/esheet`.
- **Rich text and code editing:** [Kerebron editor setup](https://github.com/mieweb/ui/tree/main/src/components/RichEditor), imported from `@mieweb/ui/kerebron`.

Check the selected integration's dependencies before importing its entry point.
AGGrid is deprecated for new work; start with DataVis NITRO for tabular data.

## Explore and Compose Components

Open [the component explorer](https://ui.mieweb.org/). Storybook is the wrapper
around the examples: its sidebar selects components, a **story** demonstrates a
particular configuration, and **Docs** presents guidance and the API. **Controls**
change example props; theme and brand tools let you inspect different appearances.
Those tools belong to Storybook, not to the component you install.

Start with the user's task, then compare components before choosing an API:

- **Browse and work with records:** start with [DataVis NITRO](https://ui.mieweb.org/?path=/docs/components-text-data-display-datavis-nitro--docs)
  and compare [Table](https://ui.mieweb.org/?path=/docs/components-layout-structure-table--docs).
  NITRO provides integrated data tooling; Table provides lower-level markup.
  Consider the behavior your application would need to supply and consult the
  selection rules before choosing an exception.
- **Navigate a long document:** compare [TableOfContents](https://ui.mieweb.org/?path=/docs/components-navigation-tableofcontents--docs)
  and [ReadingProgressBar](https://ui.mieweb.org/?path=/docs/components-feedback-readingprogressbar--docs).
  A TOC provides named destinations and navigation. A reading bar is a decorative
  document-scroll cue, not navigation or proof of reading. They can complement
  each other; neither may be needed for short content.
- **Assemble an application view:** explore the [Dashboard example](https://ui.mieweb.org/?path=/story/product-feature-modules-dashboard--dashboard).
  Inspect how navigation, headers, and content fit together, then adapt the
  composition to your workflow rather than copying the layout indiscriminately.

For each choice, ask why it fits, when an alternative would be better, what state
your application owns, and how it behaves alongside neighboring components.
Exercise loading, empty, error, keyboard, and narrow-screen states in the actual
application, not only the isolated story.

The catalog is still being improved: not every component has comparison or
composition guidance yet. Do not treat an isolated example as evidence that no
related component exists. Use the
[component policy](https://github.com/mieweb/ui/blob/main/lessons/component-policy.md)
and flag missing or conflicting guidance in a
[documentation issue](https://github.com/mieweb/ui/issues/new).

### Go Deeper

- [Branding](https://ui.mieweb.org/?path=/docs/branding--docs): the brand system and visual tokens.
- [Adoption guides](https://github.com/mieweb/ui/blob/main/lessons/README.md): integration pitfalls and migration paths for existing applications.
- [AI-assisted migration plan](https://github.com/mieweb/ui/blob/main/lessons/execution-plan.md): an ordered approach to adopting the library.
- [Meteor migration](https://github.com/mieweb/ui/blob/main/lessons/migration-meteor-blaze-to-react.md): framework-specific migration guidance.

## Contribute or Run Locally

To change the library, improve its guidance, or run your own Storybook, follow
[CONTRIBUTING.md](https://github.com/mieweb/ui/blob/main/CONTRIBUTING.md). It covers
repository setup, local development, tests, component conventions, and releases.
Those steps are not required to consume the npm package.

Found unclear selection advice or an undocumented relationship? Documentation
contributions are welcome alongside component fixes.
[Edit this introduction](https://github.com/mieweb/ui/edit/main/README.md) to
improve the shared GitHub, npm, and Storybook content. Published copies update
when the package is released or the documentation site is deployed.

## License

Copyright © 2026 Medical Informatics Engineering, Inc. All rights reserved.

This software is **source available**:

- **Free for open source projects:** use, modify, and distribute in open source projects with attribution.
- **Free for non-commercial use:** personal projects, education, and research.
- **Commercial license required:** for proprietary products or commercial use, contact [licensing@mieweb.com](mailto:licensing@mieweb.com).

See the [LICENSE](https://github.com/mieweb/ui/blob/main/LICENSE) for full terms.
