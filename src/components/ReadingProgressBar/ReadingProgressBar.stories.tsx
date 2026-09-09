import type { Meta, StoryObj } from '@storybook/react-vite';
import { ReadingProgressBar } from './ReadingProgressBar';

const meta: Meta<typeof ReadingProgressBar> = {
  id: 'navigation-readingprogressbar',
  title: 'Components/Navigation/ReadingProgressBar',
  component: ReadingProgressBar,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `### What it's for

A **thin bar fixed to the top of the viewport whose width is how far the reader has scrolled** through the document (\`documentElement.scrollTop / (scrollHeight − clientHeight)\`). It listens to window \`scroll\` (passive) and \`resize\`, coalesces updates to one per animation frame, and is purely decorative (\`aria-hidden\`, \`pointer-events-none\`). \`barClassName\` recolours the fill (default \`bg-primary-500\`); \`className\` restyles the track (height, z-index, offset). Everything else in \`HTMLAttributes<HTMLDivElement>\` passes through except \`children\`.

### Use it when

- Long-form reading — articles, guides, policy documents, reports — where a sense of "how much is left" helps and the page itself scrolls.

### Don't use it when

- The value is a **task or upload percentage** the host knows — \`Progress\` (determinate, labelled, \`role="progressbar"\`).
- The reader needs to **jump** to sections — \`TableOfContents\` or \`SectionSpyNav\`; add this bar alongside them for feedback.
- The content scrolls in a container, not the window — this reads \`document.documentElement\` only and will stay at 0.
- The page is short or the bar would sit behind a fixed header — restyle with \`className\` (\`top-16\`) or drop it.

### Example

\`\`\`tsx
export function ArticleLayout({ children }) {
  return (
    <>
      <ReadingProgressBar className="top-16 h-0.5" barClassName="bg-warning" />
      <SiteHeader … />
      <article className="prose mx-auto">{children}</article>
    </>
  );
}
\`\`\`

No props to control; the component owns the percentage. Mount it once per page.

### Limitations

- Accessibility: intentionally \`aria-hidden\` — nothing is announced and there is no \`role="progressbar"\`; if reading position matters to assistive tech, expose it separately (e.g. a visually hidden live region driven by your own scroll listener).
- Window-only: no \`root\`/container option and no SSR-safe initial value (starts at 0 until the effect runs). Pages whose height changes after load (lazy images) will jump on the next scroll or resize event.
- Fixed \`z-50 inset-x-0 top-0 h-1\` by default; it does not know about your header — offset it with \`className\`.
- RTL: the fill is a block with a percentage \`width\`, so it grows from the inline start — from the right under \`dir="rtl"\`.
- Theming: default \`bg-primary-500\` on a transparent track; 150ms width transition. No dependencies, no strings.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'composes with',
          target: 'navigation-tableofcontents',
          why: 'Viewport-top bar for how far through the document the reader is, beside an outline for jumping between sections; they share no state.',
        },
        {
          type: 'composes with',
          target: 'navigation-sectionspynav',
          why: 'Viewport-top bar for how far through the page the reader is, beside a band for jumping between sections; they share no state.',
        },
        {
          type: 'alternative to',
          target: 'loading-progress',
          why: 'ReadingProgressBar binds to window scroll and is decorative; Progress is a determinate, labelled progressbar for a value the host owns.',
        },
      ],
    },
  },
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
  argTypes: {
    barClassName: {
      description: 'Class for the filled bar (default bg-primary-500).',
      control: 'text',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

function LongArticle() {
  return (
    <main className="mx-auto flex max-w-xl flex-col gap-6 px-6 py-10">
      <h1 className="text-foreground text-2xl font-bold">
        Scroll to see the bar fill
      </h1>
      {Array.from({ length: 14 }, (_, i) => (
        <p key={i} className="text-muted-foreground text-sm leading-relaxed">
          Section {i + 1} — placeholder prose standing in for a long-form
          article. The bar at the very top of the viewport tracks overall
          document progress as you scroll, updating at most once per frame.
        </p>
      ))}
    </main>
  );
}

export const Default: Story = {
  render: (args) => (
    <div>
      <ReadingProgressBar {...args} />
      <LongArticle />
    </div>
  ),
};

export const CustomBar: Story = {
  args: { barClassName: 'bg-warning', className: 'h-0.5' },
  render: (args) => (
    <div>
      <ReadingProgressBar {...args} />
      <LongArticle />
    </div>
  ),
};
