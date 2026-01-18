import type { Meta, StoryObj } from '@storybook/react-vite';
import { VisuallyHidden } from './VisuallyHidden';
import { Button } from '../Button';

const meta: Meta<typeof VisuallyHidden> = {
  title: 'Components/VisuallyHidden',
  component: VisuallyHidden,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
The VisuallyHidden component hides content visually while keeping it accessible to screen readers.
This is essential for providing context to assistive technologies without affecting visual layout.

### Use Cases
- Icon-only buttons that need descriptive labels
- Skip navigation links
- Form labels that should be hidden visually
- Announcements for screen readers
- Additional context for complex interactions

### Accessibility
This component uses a CSS technique that:
- Removes the element from visual flow
- Keeps it in the accessibility tree
- Allows screen readers to announce the content
- Does not use \`display: none\` or \`visibility: hidden\`
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="space-y-4">
      <p className="text-sm text-[var(--mieweb-muted-foreground)]">
        The text below is visually hidden but still accessible to screen
        readers. Open your browser&apos;s accessibility inspector to see it.
      </p>
      <div className="rounded-lg border border-dashed border-[var(--mieweb-border)] p-4">
        <span>Visible text</span>
        <VisuallyHidden>This text is only for screen readers</VisuallyHidden>
      </div>
    </div>
  ),
};

export const IconButton: Story = {
  name: 'Icon Button with Label',
  render: () => (
    <div className="space-y-4">
      <p className="text-sm text-[var(--mieweb-muted-foreground)]">
        An icon-only button with a hidden accessible label:
      </p>
      <Button variant="ghost" size="icon" aria-label="Delete item">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 6h18" />
          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
          <line x1="10" y1="11" x2="10" y2="17" />
          <line x1="14" y1="11" x2="14" y2="17" />
        </svg>
        <VisuallyHidden>Delete item</VisuallyHidden>
      </Button>
    </div>
  ),
};

export const SkipLink: Story = {
  name: 'Skip Navigation Link',
  render: () => (
    <div className="space-y-4">
      <p className="text-sm text-[var(--mieweb-muted-foreground)]">
        A skip link that becomes visible when focused (useful for keyboard
        navigation). Press Tab to focus the skip link:
      </p>
      <a
        href="#main-content"
        className="absolute top-0 left-0 -translate-y-full rounded-b-lg bg-[var(--mieweb-primary-500)] px-4 py-2 text-white transition-transform focus:translate-y-0 focus:ring-2 focus:ring-[var(--mieweb-ring)] focus:outline-none"
        onClick={(e) => e.preventDefault()}
      >
        Skip to main content
      </a>
      <div
        id="main-content"
        className="rounded-lg border border-[var(--mieweb-border)] p-4"
      >
        Main content area
      </div>
    </div>
  ),
};

export const FormLabel: Story = {
  name: 'Hidden Form Label',
  render: () => (
    <div className="space-y-4">
      <p className="text-sm text-[var(--mieweb-muted-foreground)]">
        A search input with a visually hidden label:
      </p>
      <div className="relative">
        <label htmlFor="search-input">
          <VisuallyHidden>Search</VisuallyHidden>
        </label>
        <div className="relative">
          <svg
            className="absolute top-1/2 left-3 -translate-y-1/2 text-[var(--mieweb-muted-foreground)]"
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            id="search-input"
            type="search"
            placeholder="Search..."
            className="w-64 rounded-lg border border-[var(--mieweb-border)] bg-[var(--mieweb-background)] py-2 pr-4 pl-10 focus:ring-2 focus:ring-[var(--mieweb-ring)] focus:outline-none"
          />
        </div>
      </div>
    </div>
  ),
};

export const StatusAnnouncement: Story = {
  name: 'Status Announcement',
  render: () => (
    <div className="space-y-4">
      <p className="text-sm text-[var(--mieweb-muted-foreground)]">
        A visual indicator with hidden text that describes the status for screen
        readers:
      </p>
      <div className="flex items-center gap-2">
        <span className="h-3 w-3 rounded-full bg-green-500" />
        <span>Online</span>
        <VisuallyHidden>User is currently online and available</VisuallyHidden>
      </div>
      <div className="flex items-center gap-2">
        <span className="h-3 w-3 rounded-full bg-yellow-500" />
        <span>Away</span>
        <VisuallyHidden>User is away from their computer</VisuallyHidden>
      </div>
      <div className="flex items-center gap-2">
        <span className="h-3 w-3 rounded-full bg-red-500" />
        <span>Do Not Disturb</span>
        <VisuallyHidden>User does not want to be disturbed</VisuallyHidden>
      </div>
    </div>
  ),
};

export const LoadingState: Story = {
  name: 'Loading State',
  render: () => (
    <div className="space-y-4">
      <p className="text-sm text-[var(--mieweb-muted-foreground)]">
        A loading indicator with a hidden announcement for screen readers:
      </p>
      <div className="flex items-center gap-3">
        <svg
          className="h-5 w-5 animate-spin text-[var(--mieweb-primary-500)]"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <span>Loading...</span>
        <VisuallyHidden role="status" aria-live="polite">
          Content is loading, please wait
        </VisuallyHidden>
      </div>
    </div>
  ),
};
