import type { Meta, StoryObj } from '@storybook/react-vite';
import { Spinner, SpinnerWithLabel } from './Spinner';
import { Button } from '../Button';

const meta: Meta<typeof Spinner> = {
  id: 'loading-spinner',
  title: 'Components/Loading/Spinner',
  component: Spinner,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `### What it's for

An indeterminate "working" indicator: a spinning ring in five \`size\`s and three \`variant\`s (\`default\` uses the current text colour, \`muted\`, \`white\` for dark buttons). \`SpinnerWithLabel\` adds visible text; \`FullPageSpinner\` centres one in the viewport. It announces itself with \`role="status"\` and a visually hidden \`label\` (default "Loading").

### Use it when

- A wait is short (under a few seconds) and you cannot predict the shape of what will arrive: a button submitting, a small panel refreshing, a search running.
- Inline in a control — \`Button isLoading\` already does this for you.

### Don't use it when

- The layout of the incoming content is known — use \`Skeleton\` so nothing jumps when data lands.
- Progress is measurable (upload, import) — \`Progress\` / \`CircularProgress\` with a real value.
- The entire route is loading — \`LoadingPage\` composes the spinner with a message and layout.

### Example

\`\`\`tsx
{isSearching ? <SpinnerWithLabel size="sm" label="Searching…" /> : <ResultCount n={results.length} />}
\`\`\`

### Limitations

- Pure CSS \`animate-spin\`; it does not currently pause for \`prefers-reduced-motion\`.
- \`label\` is the only text and defaults to English — translate it; several spinners on one screen each announce.
- Sized in fixed steps; for a custom size pass \`className\` with \`h-*/w-*\`.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'alternative to',
          target: 'loading-skeleton',
          why: 'Skeleton preserves the layout of known content; Spinner for short waits of unknown shape.',
        },
        {
          type: 'alternative to',
          target: 'loading-progress',
          why: 'Progress when you can report a real percentage; Spinner when you cannot.',
        },
      ],
    },
  },
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
  argTypes: {
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
    variant: {
      control: 'select',
      options: ['default', 'muted', 'white'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Spinner size="xs" />
      <Spinner size="sm" />
      <Spinner size="md" />
      <Spinner size="lg" />
      <Spinner size="xl" />
    </div>
  ),
};

export const Variants: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Spinner variant="default" />
      <Spinner variant="muted" />
      <div className="rounded-lg bg-neutral-800 p-4">
        <Spinner variant="white" />
      </div>
    </div>
  ),
};

export const WithLabel: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <SpinnerWithLabel label="Loading..." />
      <SpinnerWithLabel label="Processing" labelPosition="right" />
      <SpinnerWithLabel label="Please wait" labelPosition="left" />
      <SpinnerWithLabel label="Saving changes" labelPosition="top" />
    </div>
  ),
};

export const InsideButton: Story = {
  render: () => (
    <div className="flex gap-4">
      <Button disabled>
        <Spinner size="sm" variant="white" />
        <span>Loading...</span>
      </Button>
      <Button variant="secondary" disabled>
        <Spinner size="sm" variant="muted" />
        <span>Processing</span>
      </Button>
    </div>
  ),
};

export const FullPage: Story = {
  render: () => (
    <div className="border-border relative h-[300px] w-[400px] overflow-hidden rounded-lg border">
      <p className="text-muted-foreground p-4">Content behind the spinner...</p>
      <div className="bg-background/80 absolute inset-0 flex items-center justify-center backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="xl" />
          <p className="text-muted-foreground text-sm">Loading your data...</p>
        </div>
      </div>
    </div>
  ),
};

export const InlineLoading: Story = {
  render: () => (
    <div className="text-muted-foreground flex items-center gap-2 text-sm">
      <Spinner size="sm" variant="muted" />
      <span>Saving your changes...</span>
    </div>
  ),
};

export const LoadingCard: Story = {
  render: () => (
    <div className="border-border bg-card flex w-80 flex-col items-center gap-4 rounded-xl border p-8">
      <Spinner size="lg" />
      <div className="text-center">
        <h3 className="font-semibold">Loading Data</h3>
        <p className="text-muted-foreground text-sm">
          Please wait while we fetch your information
        </p>
      </div>
    </div>
  ),
};
