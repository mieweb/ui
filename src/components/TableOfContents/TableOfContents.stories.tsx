import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { TableOfContents, type TocItem } from './TableOfContents';

// =============================================================================
// Meta
// =============================================================================

const meta: Meta<typeof TableOfContents> = {
  title: 'Components/Navigation/TableOfContents',
  component: TableOfContents,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    smooth: { control: 'boolean' },
    indentLines: { control: 'boolean' },
    maxDepth: { control: { type: 'range', min: 1, max: 6, step: 1 } },
    scrollOffset: { control: { type: 'number' } },
    title: { control: 'text' },
    hideWhenEmpty: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// =============================================================================
// Helpers
// =============================================================================

/** A sample article with real headings the ToC can discover or reference. */
function SampleArticle() {
  return (
    <article className="prose dark:prose-invert max-w-none">
      <h2 id="introduction">Introduction</h2>
      <p>
        This is a demonstration of the TableOfContents component. Scroll down to
        see the active heading highlight as you move through sections.
      </p>

      <h2 id="getting-started">Getting Started</h2>
      <p>
        Follow these steps to set up the project in your development
        environment.
      </p>

      <h3 id="prerequisites">Prerequisites</h3>
      <p>You&apos;ll need Node.js 18+ and a package manager like pnpm.</p>

      <h3 id="installation">Installation</h3>
      <p>Run `pnpm add @mieweb/ui` to install the library.</p>

      <h2 id="usage">Usage</h2>
      <p>
        Import the TableOfContents component and drop it alongside your content.
      </p>

      <h3 id="auto-discovery">Auto-Discovery Mode</h3>
      <p>
        By default the component scans the page for h2, h3, and h4 elements with
        id attributes and builds the navigation list automatically.
      </p>

      <h3 id="manual-items">Manual Items</h3>
      <p>
        Pass an explicit `items` prop if you want full control over the
        navigation structure.
      </p>

      <h2 id="api-reference">API Reference</h2>
      <p>Full prop documentation for TableOfContents and useScrollSpy.</p>

      <h3 id="table-of-contents-props">TableOfContents Props</h3>
      <p>See the Controls panel for all available props.</p>

      <h3 id="use-scroll-spy-hook">useScrollSpy Hook</h3>
      <p>
        The hook accepts selectors or explicit IDs and returns the currently
        active element ID via IntersectionObserver.
      </p>

      <h2 id="customization">Customization</h2>
      <p>
        Override styles with className or extend the component via composition.
      </p>

      <h2 id="accessibility">Accessibility</h2>
      <p>
        The component renders a &lt;nav&gt; landmark with aria-label and uses
        aria-current to indicate the active section.
      </p>
    </article>
  );
}

const manualItems: TocItem[] = [
  { id: 'introduction', title: 'Introduction', level: 2 },
  { id: 'getting-started', title: 'Getting Started', level: 2 },
  { id: 'prerequisites', title: 'Prerequisites', level: 3 },
  { id: 'installation', title: 'Installation', level: 3 },
  { id: 'usage', title: 'Usage', level: 2 },
  { id: 'auto-discovery', title: 'Auto-Discovery Mode', level: 3 },
  { id: 'manual-items', title: 'Manual Items', level: 3 },
  { id: 'api-reference', title: 'API Reference', level: 2 },
  { id: 'table-of-contents-props', title: 'TableOfContents Props', level: 3 },
  { id: 'use-scroll-spy-hook', title: 'useScrollSpy Hook', level: 3 },
  { id: 'customization', title: 'Customization', level: 2 },
  { id: 'accessibility', title: 'Accessibility', level: 2 },
];

// =============================================================================
// Stories
// =============================================================================

/**
 * The default story uses manual items and renders alongside a sample article.
 * Scroll the article panel to see the active heading highlight.
 */
export const Default: Story = {
  args: {
    items: manualItems,
    title: 'On this page',
    smooth: true,
    indentLines: true,
    maxDepth: 3,
    scrollOffset: 0,
  },
  render: (args) => (
    <div className="flex gap-8">
      <aside className="sticky top-4 w-56 shrink-0 self-start">
        <TableOfContents {...args} />
      </aside>
      <div className="min-h-[200vh]">
        <SampleArticle />
      </div>
    </div>
  ),
};

/**
 * Auto-discovers headings from the article—no manual items required.
 */
export const AutoDiscovery: Story = {
  args: {
    title: 'On this page',
    selector: 'h2, h3',
  },
  render: (args) => (
    <div className="flex gap-8">
      <aside className="sticky top-4 w-56 shrink-0 self-start">
        <TableOfContents {...args} />
      </aside>
      <div className="min-h-[200vh]">
        <SampleArticle />
      </div>
    </div>
  ),
};

/**
 * Flat list without indentation lines.
 */
export const FlatNoLines: Story = {
  args: {
    items: manualItems,
    title: 'Contents',
    indentLines: false,
    maxDepth: 2,
  },
  render: (args) => (
    <div className="w-56">
      <TableOfContents {...args} />
    </div>
  ),
};

/**
 * Deep nesting up to h4 with indent lines.
 */
export const DeepNesting: Story = {
  args: {
    items: [
      { id: 'chapter-1', title: 'Chapter 1', level: 2 },
      { id: 'section-1-1', title: 'Section 1.1', level: 3 },
      { id: 'subsection-1-1-1', title: 'Subsection 1.1.1', level: 4 },
      { id: 'subsection-1-1-2', title: 'Subsection 1.1.2', level: 4 },
      { id: 'section-1-2', title: 'Section 1.2', level: 3 },
      { id: 'chapter-2', title: 'Chapter 2', level: 2 },
      { id: 'section-2-1', title: 'Section 2.1', level: 3 },
    ],
    title: 'Outline',
    indentLines: true,
    maxDepth: 4,
  },
  render: (args) => (
    <div className="w-56">
      <TableOfContents {...args} />
    </div>
  ),
};

/**
 * No title, minimal style.
 */
export const Minimal: Story = {
  args: {
    items: manualItems.filter((i) => i.level === 2),
  },
  render: (args) => (
    <div className="w-48">
      <TableOfContents {...args} />
    </div>
  ),
};

/**
 * With controlled activeId — the highlight doesn't move with scrolling,
 * but is set externally.
 */
function ControlledExample() {
  const [activeId, setActiveId] = React.useState('usage');
  return (
    <div className="flex gap-8">
      <div className="w-56 space-y-4">
        <TableOfContents
          items={manualItems}
          activeId={activeId}
          title="Controlled"
        />
        <div className="flex flex-wrap gap-2">
          {manualItems
            .filter((i) => i.level === 2)
            .map((i) => (
              <button
                key={i.id}
                onClick={() => setActiveId(i.id)}
                className="hover:bg-muted rounded border px-2 py-1 text-xs"
              >
                {i.title}
              </button>
            ))}
        </div>
      </div>
      <SampleArticle />
    </div>
  );
}

export const Controlled: Story = {
  render: () => <ControlledExample />,
};

// =============================================================================
// Long scrollable article with sticky ToC
// =============================================================================

function LongArticle() {
  return (
    <article className="prose dark:prose-invert max-w-none">
      <h2 id="long-overview">Overview</h2>
      <p>
        This guide walks through every aspect of building a modern design system
        from scratch. Each section covers a distinct topic in depth, providing
        enough content to demonstrate the sticky sidebar behavior of the
        TableOfContents component.
      </p>
      <p>
        Scroll down to see the active heading highlight track your position. The
        sidebar stays fixed while the content scrolls beneath it.
      </p>

      <h2 id="long-design-tokens">Design Tokens</h2>
      <p>
        Design tokens are the atomic values that make up a design system —
        colors, spacing, typography scales, border radii, shadows, and timing
        functions. They bridge the gap between design tools and code, ensuring
        every product speaks the same visual language.
      </p>
      <p>
        Start by auditing your existing products for recurring values. Group
        them into semantic categories: <code>color.primary</code>,{' '}
        <code>spacing.md</code>, <code>font.heading</code>. Export them as CSS
        custom properties, JSON, or both — whichever your toolchain consumes.
      </p>
      <p>
        Token naming matters. Prefer semantic names (<code>color-danger</code>)
        over raw values (<code>color-red-500</code>). This lets you swap
        palettes for theming or white-labeling without touching component code.
      </p>

      <h3 id="long-color-tokens">Color Tokens</h3>
      <p>
        Define a core palette (neutral, primary, secondary) plus semantic
        aliases (success, warning, danger, info). Each should have a full scale
        from 50 to 950 for flexibility. Dark mode inverts the mapping: what was
        100 becomes 900, and vice versa.
      </p>
      <p>
        Consider contrast ratios early. WCAG 2.1 AA requires 4.5:1 for normal
        text and 3:1 for large text. Build a contrast checker into your token
        pipeline so violations are caught at design time, not in a11y audits.
      </p>

      <h3 id="long-spacing-tokens">Spacing &amp; Layout Tokens</h3>
      <p>
        A 4px base grid is the industry standard. Your spacing scale should be
        multiples of 4: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64. This keeps layouts
        rhythmic without requiring a calculator. Map these to semantic names:{' '}
        <code>spacing.xs</code> through <code>spacing.3xl</code>.
      </p>
      <p>
        For responsive layouts, define breakpoints as tokens too. This
        centralizes the values that media queries and container queries
        reference.
      </p>

      <h2 id="long-typography">Typography</h2>
      <p>
        Typography is the backbone of any UI. Choose a type scale (1.25 major
        third is popular), define heading sizes h1–h6, body, caption, and
        overline styles. Each gets a font-size, line-height, letter-spacing, and
        font-weight tuple.
      </p>
      <p>
        Favor system font stacks for performance, or load a single variable font
        to cover all weights. Avoid loading more than two font families — it
        adds latency and visual complexity.
      </p>
      <p>
        Test typography across platforms. macOS renders fonts thicker than
        Windows due to subpixel antialiasing differences. What looks elegant on
        a Retina display can appear spindly on a 1080p monitor.
      </p>

      <h3 id="long-font-loading">Font Loading Strategy</h3>
      <p>
        Use <code>font-display: swap</code> to avoid invisible text during load.
        Preload the primary font weight with{' '}
        <code>&lt;link rel=&quot;preload&quot;&gt;</code>. For critical
        above-the-fold content, consider inlining the font as a base64 data URI
        in the initial CSS — but only for the most-used weight (usually 400).
      </p>

      <h3 id="long-responsive-type">Responsive Typography</h3>
      <p>
        Use <code>clamp()</code> to create fluid type scales that interpolate
        between a minimum and maximum size based on viewport width. This
        eliminates abrupt jumps at breakpoints and produces smoother reading
        experiences across devices.
      </p>

      <h2 id="long-components">Component Architecture</h2>
      <p>
        Components are the building blocks. Start with primitives (Button,
        Input, Badge, Avatar) and compose them into patterns (Form, Card,
        Dialog). Each component should own its layout, behavior, and
        accessibility — consumers shouldn&apos;t need to add ARIA attributes
        manually.
      </p>
      <p>
        Use a compound component pattern for complex widgets (Tabs, Accordion,
        Select). This gives consumers flexibility in composition while keeping
        internal state management hidden. Context providers wire the pieces
        together.
      </p>

      <h3 id="long-variants">Variants &amp; Sizes</h3>
      <p>
        Use <code>class-variance-authority</code> (CVA) to define variant maps.
        Every component gets a base style, then variants for intent (primary,
        secondary, destructive), size (sm, md, lg), and state (disabled,
        loading). The variant API is the public styling contract.
      </p>
      <p>
        Resist adding one-off variants. If a design calls for a unique button
        color, push back — add a semantic variant or use className overrides.
        One-off variants erode consistency.
      </p>

      <h3 id="long-composition">Composition Patterns</h3>
      <p>
        Prefer composition over configuration. A Card component with 15 boolean
        props is harder to use than Card, CardHeader, CardContent, CardFooter
        composed together. The compound pattern scales better and is more
        readable in JSX.
      </p>
      <p>
        Forwarded refs and <code>asChild</code> patterns (like Radix) let
        consumers swap the underlying DOM element. A Button that renders as an
        anchor, a Card that renders as a link — polymorphism without wrapper div
        soup.
      </p>

      <h2 id="long-accessibility">Accessibility</h2>
      <p>
        Accessibility isn&apos;t a feature — it&apos;s a baseline. Every
        interactive component needs keyboard navigation, focus management, ARIA
        roles, and screen reader announcements. Build these into the component
        itself so consumers get them for free.
      </p>
      <p>
        Use semantic HTML first. A <code>&lt;button&gt;</code> gives you click
        handling, keyboard activation, and focus for free. A{' '}
        <code>&lt;div onClick&gt;</code> gives you none of that and requires
        manual ARIA role, tabIndex, and keyDown handling.
      </p>
      <p>
        Test with real assistive technology. VoiceOver on macOS, NVDA on
        Windows, TalkBack on Android. Automated tools catch about 30% of issues;
        the rest require manual testing with actual screen readers.
      </p>

      <h3 id="long-focus-management">Focus Management</h3>
      <p>
        Dialogs must trap focus. When a modal opens, focus moves to the first
        focusable element inside it. Tab cycles within the dialog. Pressing
        Escape closes it and returns focus to the trigger element. This is the
        WAI-ARIA dialog pattern.
      </p>
      <p>
        For complex widgets like comboboxes, implement roving tabindex. Only one
        item in the group has tabindex=0; arrow keys move focus between items.
        This keeps tab order simple while allowing keyboard navigation within
        the widget.
      </p>

      <h3 id="long-color-contrast">Color Contrast</h3>
      <p>
        WCAG 2.1 Level AA requires 4.5:1 contrast for normal text and 3:1 for
        large text (18px+ or 14px+ bold). Level AAA bumps these to 7:1 and
        4.5:1. Build contrast checking into your design token pipeline and CI.
      </p>
      <p>
        Don&apos;t rely on color alone to convey information. Error states need
        icons or text in addition to red coloring. Success indicators need
        checkmarks, not just green. This helps users with color vision
        deficiencies.
      </p>

      <h2 id="long-theming">Theming</h2>
      <p>
        A robust theming system lets products customize the design system
        without forking it. CSS custom properties are the foundation — define
        them at the root, override them per theme. Components reference
        variables, not hard values.
      </p>
      <p>
        Support light and dark modes at minimum. Some products need
        high-contrast mode or brand-specific themes. Structure your tokens in
        layers: global → semantic → component. Override at the semantic layer to
        change an entire theme in one place.
      </p>

      <h3 id="long-css-variables">CSS Custom Properties</h3>
      <p>
        Define variables at <code>:root</code> for the default theme. Use{' '}
        <code>[data-theme=&quot;dark&quot;]</code> or <code>.dark</code>{' '}
        selectors to override. Components reference the variables:{' '}
        <code>color: var(--color-text)</code>. This makes theme switching
        instantaneous — no re-render, no flash.
      </p>

      <h3 id="long-brand-variants">Brand Variants</h3>
      <p>
        For white-label products, define brand tokens separately from the base
        theme. A brand layer overrides primary colors, logo, and typography
        while leaving the component library untouched. This is the power of
        token-based architecture.
      </p>

      <h2 id="long-testing">Testing Strategy</h2>
      <p>
        Test at multiple levels: unit tests for logic, component tests for
        rendering and interaction, visual regression tests for appearance, and
        accessibility audits for compliance. Each layer catches different
        classes of bugs.
      </p>
      <p>
        Use Vitest for unit and component tests. React Testing Library
        encourages testing behavior over implementation. Avoid testing internal
        state — test what the user sees and does.
      </p>

      <h3 id="long-visual-regression">Visual Regression Testing</h3>
      <p>
        Capture screenshots of every Storybook story in CI. Compare against
        baselines. Tools like Playwright, Chromatic, or Percy automate this.
        Visual regression catches CSS regressions that unit tests miss — a
        changed padding, a wrong color, a broken layout.
      </p>
      <p>
        Keep baselines in version control or a dedicated service. Review visual
        diffs in PRs alongside code diffs. Approve intentional changes, flag
        unintentional ones. This is your safety net for pixel-level consistency.
      </p>

      <h3 id="long-a11y-testing">Accessibility Testing</h3>
      <p>
        Run axe-core in your test suite. Storybook has an a11y addon that runs
        checks on every story. In CI, use Playwright with the axe integration to
        check rendered pages. This catches missing labels, broken roles, and
        contrast violations automatically.
      </p>

      <h2 id="long-documentation">Documentation</h2>
      <p>
        Documentation is the product. If developers can&apos;t find how to use a
        component, they&apos;ll build their own. Storybook serves as living docs
        — every story is a usage example. Add MDX pages for guides, patterns,
        and migration notes.
      </p>
      <p>
        Include copy-pasteable code snippets for every component. Show common
        patterns, edge cases, and anti-patterns. Keep examples updated as the
        API evolves. Stale docs are worse than no docs.
      </p>

      <h3 id="long-storybook">Storybook as Documentation</h3>
      <p>
        Organize stories by category: primitives, patterns, layouts, pages. Use
        the autodocs feature to generate prop tables from TypeScript types. Add
        play functions for interactive demos that show state transitions.
      </p>

      <h3 id="long-changelog">Changelog &amp; Migration Guides</h3>
      <p>
        Maintain a CHANGELOG.md with every release. For breaking changes,
        provide a migration guide with before/after code examples and a codemod
        if the change is mechanical. This reduces adoption friction and builds
        trust.
      </p>

      <h2 id="long-conclusion">Conclusion</h2>
      <p>
        A design system is a living product. It evolves with your organization,
        your users, and the web platform. Invest in strong foundations — tokens,
        accessibility, testing, documentation — and the components will follow.
      </p>
      <p>
        The TableOfContents component you&apos;re looking at right now is one
        small piece of that system. But it demonstrates the philosophy: build it
        once, build it well, make it flexible, and let everyone benefit.
      </p>
    </article>
  );
}

/**
 * A long-form documentation page with a sticky sidebar ToC.
 * Scroll the content to see the active heading track your position.
 * The sidebar stays fixed in place while the article flows beneath it.
 */
export const StickyScrollExample: Story = {
  parameters: {
    layout: 'fullscreen',
  },
  render: () => (
    <div className="flex min-h-screen">
      <aside className="border-border sticky top-0 h-screen w-64 shrink-0 overflow-y-auto border-r p-6">
        <TableOfContents
          title="On this page"
          selector="h2, h3"
          smooth
          indentLines
        />
      </aside>
      <main className="flex-1 p-8 lg:p-12">
        <LongArticle />
      </main>
    </div>
  ),
};
