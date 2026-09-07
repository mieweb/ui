import type { Meta, StoryObj } from '@storybook/react-vite';
import { ScrollArea } from './ScrollArea';

const meta: Meta<typeof ScrollArea> = {
  id: 'layout-scrollarea',
  title: 'Components/Layout/ScrollArea',
  component: ScrollArea,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `### What it's for

**A scroll container with thin, theme-aware scrollbars.** \`ScrollArea\` is a single \`div\` with \`overflow-auto\`, \`scrollbar-width: thin\`, \`scrollbar-color\` from \`--border\`, and matching \`::-webkit-scrollbar\` rules (8px, rounded thumb, brighter on hover). \`orientation\` picks the axis: \`vertical\` (default, hides x), \`horizontal\` (hides y) or \`both\`. **You set the size** (\`h-48\`, \`max-h-[60vh]\`, \`w-full\`) via \`className\`; without a constrained dimension nothing scrolls. \`scrollAreaVariants\` is exported.

### Use it when

- A list, log or long form section must scroll inside a fixed-height region (a dashboard tile, a Sheet body, a sidebar panel) and native scrollbars look out of place.
- A wide table or toolbar needs horizontal scrolling with a visible, styled bar (\`orientation="horizontal"\`).

### Don't use it when

- The page itself should scroll — leave it to the document; this is for nested regions.
- You want content to expand instead of scroll — \`Collapsible\` / \`Accordion\`.
- You need scroll-spy, virtualisation, custom draggable thumbs or scroll shadows — none are provided; pair with \`useScrollSpy\` or a virtual list yourself.

### Example

\`\`\`tsx
const listRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  // keep the newest log line in view
  listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
}, [lines.length]);

<ScrollArea ref={listRef} aria-label="Build log" className="h-64 rounded-md border border-border p-3 font-mono text-xs">
  {lines.map((l) => <div key={l.id}>{l.text}</div>)}
</ScrollArea>
\`\`\`

The ref is the scrolling element, so scroll position is controlled with the native API.

### Limitations

- Accessibility: renders \`role="region"\` with \`tabIndex={0}\` so keyboard users can focus and scroll it, but **no label is set** — an unnamed region landmark is an axe violation; pass \`aria-label\` / \`aria-labelledby\`. Every ScrollArea is a Tab stop even when its content does not overflow.
- Styling only: native scrolling, no custom thumb element, no scroll shadows / fade edges, no \`onScrollEnd\`, no scroll-to-item helper. \`scrollbar-color\` uses \`hsl(var(--border))\` — if a brand defines \`--border\` in another colour space the Firefox bar falls back to the default.
- RTL: native — the vertical bar moves to the start edge automatically; horizontal scroll direction follows the document.
- Theming: \`bg-border\`, \`bg-muted-foreground/40\` hover. No strings. Depends on \`class-variance-authority\`.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'composes with',
          target: 'layout-card',
          why: 'A fixed-height Card scrolls its CardContent through a ScrollArea so long lists keep the tile size in a grid.',
        },
      ],
    },
  },
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
  argTypes: {
    orientation: {
      control: 'select',
      options: ['vertical', 'horizontal', 'both'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Vertical: Story = {
  render: (args) => (
    <ScrollArea
      {...args}
      className="border-border h-48 w-64 rounded-md border p-4"
    >
      {Array.from({ length: 30 }).map((_, i) => (
        <p key={i} className="text-sm leading-7">
          Item {i + 1}
        </p>
      ))}
    </ScrollArea>
  ),
  args: {
    orientation: 'vertical',
  },
};

export const Horizontal: Story = {
  render: (args) => (
    <ScrollArea {...args} className="border-border w-64 rounded-md border p-4">
      <div className="flex gap-3">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="bg-muted flex h-16 w-16 shrink-0 items-center justify-center rounded-md text-sm"
          >
            {i + 1}
          </div>
        ))}
      </div>
    </ScrollArea>
  ),
  args: {
    orientation: 'horizontal',
  },
};
