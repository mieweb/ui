import type { Meta, StoryObj } from '@storybook/react-vite';
import { Avatar, AvatarGroup } from './Avatar';

function avatarDataUri(
  label: string,
  background = '#dbeafe',
  foreground = '#1d4ed8'
): string {
  const escapeXml = (value: string) =>
    value.replace(
      /[&<>"']/g,
      (ch) =>
        (
          ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
          }) as Record<string, string>
        )[ch] ?? ch
    );

  const safeLabel = escapeXml(label);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" rx="50" fill="${background}"/><text x="50" y="58" text-anchor="middle" font-family="Arial, sans-serif" font-size="36" font-weight="700" fill="${foreground}">${safeLabel}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const meta: Meta<typeof Avatar> = {
  id: 'data-display-avatar',
  title: 'Components/Data display/Avatar',
  component: Avatar,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `### What it's for

A **round identity image with graceful fallback**. \`Avatar\` renders \`src\` when it loads, otherwise \`fallback\` (any element), otherwise initials from \`name\` (\`getInitials\`: first letter of the first two words, upper-cased), otherwise a generic person glyph. A failed image flips to the fallback via \`onError\` and resets when \`src\` changes. \`size\` is \`xs\` | \`sm\` | \`md\` | \`lg\` | \`xl\`; \`ring\` adds a faint primary halo. \`AvatarGroup\` overlaps its children (\`-space-x-2\`), forces one \`size\` on all of them and collapses the rest into a "+N" disc after \`max\`. \`avatarVariants\` and \`getInitials\` are exported.

### Use it when

- A person (patient, employee, provider, chat sender) is identified in a header, list row, comment or message bubble.
- A small set of participants should be shown compactly — \`AvatarGroup max={3}\`.

### Don't use it when

- The thing is not a person or you need an arbitrary aspect ratio — use a plain \`<img>\` or a \`Card\` media slot.
- The avatar must open a menu or profile — wrap it in a \`Button\` / \`Dropdown\` trigger; \`Avatar\` has no interactive states.
- You need presence or status (online dot, unread count) — compose a \`Badge\` / \`CountBadge\` beside it; there is no status slot.

### Example

\`\`\`tsx
<div className="flex items-center gap-3">
  <Avatar src={patient.photoUrl} name={patient.displayName} size="lg" ring />
  <div>
    <Text weight="semibold">{patient.displayName}</Text>
    <Badge variant="success" size="sm">Active</Badge>
  </div>
</div>

<AvatarGroup max={3} size="sm">
  {careTeam.map((m) => <Avatar key={m.id} src={m.photoUrl} name={m.name} />)}
</AvatarGroup>
\`\`\`

Image-error state is internal; everything else comes from props.

### Limitations

- Accessibility: the \`<img>\` gets \`alt={alt ?? name ?? 'Avatar'}\` — pass \`alt=""\` when a visible name sits next to it so screen readers do not hear the name twice. The initials and the person glyph (\`aria-hidden\`) have **no accessible name**; when there is no image the surrounding text must identify the person. The "+N" disc in \`AvatarGroup\` is a plain \`<div>\` with no label listing who is hidden.
- \`getInitials\` takes the first letter of each space-separated word and keeps the first two, so "Mary Anne Smith" → "MA" (not "MS"); pre-format the name if you want first + last.
- RTL: \`AvatarGroup\` uses physical \`-space-x-2\`, which still overlaps correctly in RTL because \`space-x\` flips with \`dir\`; the ring/overlap order follows DOM order.
- Theming: the fallback disc is \`bg-primary-800 text-white\`; \`AvatarGroup\` rings are hard-coded \`ring-white dark:ring-neutral-900\` and the "+N" disc \`neutral-200/700\` — they assume a white/neutral page background.
- No lazy loading, no \`srcSet\`, no shape other than a circle. Depends on \`class-variance-authority\`.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'composes with',
          target: 'data-display-badge',
          why: 'Identity plus state: an Avatar with a status Badge beside it is the header pattern in PatientHeader and EmployeeProfile.',
        },
      ],
    },
  },
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
  args: {
    ring: false,
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
      description: 'Size of the avatar',
    },
    ring: {
      control: 'boolean',
      description: 'Whether to show a ring around the avatar',
    },
    src: {
      control: 'text',
      description: 'Image URL for the avatar',
    },
    name: {
      control: 'text',
      description: 'Name to generate initials from',
    },
    alt: {
      control: 'text',
      description: 'Alt text for the image',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Avatar>;

// Basic Stories
export const Default: Story = {
  args: {
    name: 'John Doe',
  },
};

export const WithImage: Story = {
  args: {
    src: avatarDataUri('SO', '#bae6fd', '#0c4a6e'),
    alt: 'Sea Otter',
    name: 'Sea Otter',
  },
};

export const BrokenImage: Story = {
  args: {
    src: 'data:image/svg+xml;base64,broken',
    alt: 'John Doe',
    name: 'John Doe',
  },
};

export const NoNameOrImage: Story = {
  args: {},
};

// Sizes
export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-4">
      <Avatar size="xs" name="XS" />
      <Avatar size="sm" name="SM" />
      <Avatar size="md" name="MD" />
      <Avatar size="lg" name="LG" />
      <Avatar size="xl" name="XL" />
    </div>
  ),
};

// With Ring
export const WithRing: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar name="No Ring" />
      <Avatar name="With Ring" ring />
    </div>
  ),
};

// Initials
export const Initials: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar name="John Doe" />
      <Avatar name="Jane Smith" />
      <Avatar name="Bob" />
      <Avatar name="Alice Williams Brown" />
    </div>
  ),
};

// Custom Fallback
export const CustomFallback: Story = {
  args: {
    fallback: <span>👤</span>,
    size: 'lg',
  },
};

// Avatar Group
export const Group: Story = {
  render: () => (
    <AvatarGroup>
      <Avatar name="John Doe" />
      <Avatar name="Jane Smith" />
      <Avatar name="Bob Wilson" />
    </AvatarGroup>
  ),
};

export const GroupWithMax: Story = {
  render: () => (
    <AvatarGroup max={3}>
      <Avatar name="John Doe" />
      <Avatar name="Jane Smith" />
      <Avatar name="Bob Wilson" />
      <Avatar name="Alice Brown" />
      <Avatar name="Charlie Davis" />
    </AvatarGroup>
  ),
};

export const GroupSizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <AvatarGroup size="sm" max={3}>
        <Avatar name="JD" />
        <Avatar name="JS" />
        <Avatar name="BW" />
        <Avatar name="AB" />
      </AvatarGroup>
      <AvatarGroup size="md" max={3}>
        <Avatar name="JD" />
        <Avatar name="JS" />
        <Avatar name="BW" />
        <Avatar name="AB" />
      </AvatarGroup>
      <AvatarGroup size="lg" max={3}>
        <Avatar name="JD" />
        <Avatar name="JS" />
        <Avatar name="BW" />
        <Avatar name="AB" />
      </AvatarGroup>
    </div>
  ),
};

// With Images Group
export const GroupWithImages: Story = {
  render: () => (
    <AvatarGroup max={4}>
      <Avatar src={avatarDataUri('JD')} name="John Doe" />
      <Avatar
        src={avatarDataUri('JS', '#fde68a', '#92400e')}
        name="Jane Smith"
      />
      <Avatar
        src={avatarDataUri('BW', '#dcfce7', '#166534')}
        name="Bob Wilson"
      />
      <Avatar name="Alice Brown" />
      <Avatar name="Charlie Davis" />
    </AvatarGroup>
  ),
};
