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
    <article className="prose max-w-none dark:prose-invert">
      <h2 id="introduction">Introduction</h2>
      <p>
        This is a demonstration of the TableOfContents component. Scroll down
        to see the active heading highlight as you move through sections.
      </p>

      <h2 id="getting-started">Getting Started</h2>
      <p>Follow these steps to set up the project in your development environment.</p>

      <h3 id="prerequisites">Prerequisites</h3>
      <p>You&apos;ll need Node.js 18+ and a package manager like pnpm.</p>

      <h3 id="installation">Installation</h3>
      <p>Run `pnpm add @mieweb/ui` to install the library.</p>

      <h2 id="usage">Usage</h2>
      <p>Import the TableOfContents component and drop it alongside your content.</p>

      <h3 id="auto-discovery">Auto-Discovery Mode</h3>
      <p>
        By default the component scans the page for h2, h3, and h4 elements
        with id attributes and builds the navigation list automatically.
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
      <p>Override styles with className or extend the component via composition.</p>

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
                className="rounded border px-2 py-1 text-xs hover:bg-muted"
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
