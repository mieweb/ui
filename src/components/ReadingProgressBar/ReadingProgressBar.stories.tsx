import type { Meta, StoryObj } from '@storybook/react-vite';
import { ReadingProgressBar } from './ReadingProgressBar';

const meta: Meta<typeof ReadingProgressBar> = {
  title: 'Components/Feedback/ReadingProgressBar',
  component: ReadingProgressBar,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A thin progress bar pinned to the top of the viewport, tracking how far the reader ' +
          'has scrolled through the document. Decorative (`aria-hidden`), rAF-throttled, and ' +
          'token-colored — pair it with long-form articles, guides, and reports.',
      },
    },
  },
  tags: ['autodocs'],
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
