import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './Button';
import {
  Plus,
  Minus,
  Check,
  X,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ArrowLeft,
  Search,
  Settings,
  User,
  Users,
  Mail,
  Phone,
  Calendar,
  Clock,
  Heart,
  Star,
  Trash2,
  Edit,
  Copy,
  Download,
  Upload,
  Share,
  Send,
  Save,
  Loader2,
  RefreshCw,
  ExternalLink,
  Link as LinkIcon,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Bell,
  BellOff,
  Home,
  Menu,
  MoreHorizontal,
  MoreVertical,
  Filter,
  SortAsc,
  SortDesc,
  Zap,
  type LucideIcon,
} from 'lucide-react';

// Icon registry for Storybook controls
const iconRegistry: Record<string, LucideIcon | undefined> = {
  None: undefined,
  Plus,
  Minus,
  Check,
  X,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ArrowLeft,
  Search,
  Settings,
  User,
  Users,
  Mail,
  Phone,
  Calendar,
  Clock,
  Heart,
  Star,
  Trash2,
  Edit,
  Copy,
  Download,
  Upload,
  Share,
  Send,
  Save,
  Loader2,
  RefreshCw,
  ExternalLink,
  Link: LinkIcon,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Bell,
  BellOff,
  Home,
  Menu,
  MoreHorizontal,
  MoreVertical,
  Filter,
  SortAsc,
  SortDesc,
  Zap,
};

const iconOptions = Object.keys(iconRegistry);

// Helper to render icon from name
const renderIcon = (iconName: string | undefined) => {
  if (!iconName || iconName === 'None') return undefined;
  const IconComponent = iconRegistry[iconName];
  return IconComponent ? <IconComponent size={16} /> : undefined;
};

const meta: Meta<typeof Button> = {
  id: 'actions-button',
  title: 'Inputs/Actions/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `### What it's for

The one clickable control for actions: six intents (\`primary\`, \`secondary\`, \`outline\`, \`ghost\`, \`danger\`, \`link\`), four sizes (\`sm\`, \`md\`, \`lg\`, \`icon\`), \`leftIcon\` / \`rightIcon\` slots and an \`isLoading\` state that swaps in a spinner and \`loadingText\`. It is a real \`<button>\` with \`forwardRef\`, so every native attribute (\`type\`, \`disabled\`, \`aria-*\`) passes through.

**Icon placement:** prefer the \`leftIcon\` / \`rightIcon\` props — they render outside the truncating label, never shrink, and inherit the button's \`gap\`. Icons inside \`children\` are also supported (the label keeps SVGs inline so they never wrap onto their own line), but they truncate together with the text; use the props when the icon must stay visible.

### Use it when

- The user triggers an action (submit, open, save, delete). One \`primary\` per view; \`secondary\`/\`outline\` for the rest; \`danger\` for destructive actions that are confirmed elsewhere.
- **Two or more buttons sit together, or a single label is long, translated or user-supplied** — always wrap them in a \`ButtonGroup\`. Its default \`orientation="auto"\` measures the labels and stacks before anything truncates.
- You need a link that looks like a button: pass \`variant="link"\`, or render an \`<a>\` styled with the same classes when navigation is the intent.

### Don't use it when

- The control has an on/off state that persists — use \`Toggle\` (toolbar formatting, view switches) or \`Switch\` in forms.
- It is a large, icon-led shortcut on a dashboard — \`QuickAction\` is the card-shaped variant.
- The action is "copy this value" — \`CopyButton\` handles clipboard and the success state.
- Per-row list actions revealed on hover — \`RowActionToolbar\`.

### Example

\`\`\`tsx
<ModalFooter>
  <ButtonGroup className="w-full" split>
    <Button variant="ghost" onClick={onBack}>Back</Button>
    <Button variant="secondary" onClick={onCancel}>Cancel</Button>
    <Button variant="danger" isLoading={saving} loadingText="Deleting…" onClick={onDelete}>
      Permanently delete this record
    </Button>
  </ButtonGroup>
</ModalFooter>
\`\`\`

### Limitations

- Keyboard and focus are native; a visible \`focus-visible\` ring is always rendered. An \`icon\` button has no text, so **you must pass \`aria-label\`**.
- While \`isLoading\`, the button is disabled and announces \`loadingText\` — keep that text short and translated.
- Labels render in a \`data-slot="button-label"\` span with \`truncate\`; without a \`ButtonGroup\` a long label is silently clipped.
- Colours are brand tokens with \`dark:\` variants; there is no per-brand override API beyond \`className\`.
- Button self-heals its layout (icon/label on one line) by injecting a small fallback stylesheet for apps whose Tailwind build is missing the library's utilities. Under a strict CSP without \`style-src 'unsafe-inline'\` the injection is blocked and layout falls back to your app's generated CSS — configure \`@source\` (Tailwind 4) or the exported safelist (Tailwind 3) so the utilities exist. Display utilities on an SVG inside the label slot won't win over the fallback; conditionally render icons instead of hiding them with classes.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'composes with',
          target: 'actions-buttongroup',
          why: 'Two or more buttons, or one long/translated label, always go in a ButtonGroup so labels never truncate.',
        },
        {
          type: 'alternative to',
          target: 'actions-toggle',
          why: 'Toggle keeps a pressed state (aria-pressed); Button fires an action and forgets.',
        },
        {
          type: 'alternative to',
          target: 'actions-quickaction',
          why: 'QuickAction is a card-sized icon shortcut for dashboards; Button is the inline control.',
        },
      ],
    },
  },
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'outline', 'danger', 'link'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'icon'],
    },
    fullWidth: {
      control: 'boolean',
    },
    isLoading: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
    },
    leftIcon: {
      control: 'select',
      options: iconOptions,
      description: 'Icon to display before the button text',
      mapping: Object.fromEntries(
        iconOptions.map((name) => [name, renderIcon(name)])
      ),
    },
    rightIcon: {
      control: 'select',
      options: iconOptions,
      description: 'Icon to display after the button text',
      mapping: Object.fromEntries(
        iconOptions.map((name) => [name, renderIcon(name)])
      ),
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    children: 'Primary Button',
    variant: 'primary',
  },
};

export const Secondary: Story = {
  args: {
    children: 'Secondary Button',
    variant: 'secondary',
  },
};

export const Ghost: Story = {
  args: {
    children: 'Ghost Button',
    variant: 'ghost',
  },
};

export const Outline: Story = {
  args: {
    children: 'Outline Button',
    variant: 'outline',
  },
};

export const Danger: Story = {
  args: {
    children: 'Delete',
    variant: 'danger',
  },
};

export const Link: Story = {
  args: {
    children: 'Link Button',
    variant: 'link',
  },
};

export const Small: Story = {
  args: {
    children: 'Small Button',
    size: 'sm',
  },
};

export const Large: Story = {
  args: {
    children: 'Large Button',
    size: 'lg',
  },
};

export const Loading: Story = {
  args: {
    children: 'Submit',
    isLoading: true,
    loadingText: 'Submitting...',
  },
};

export const Disabled: Story = {
  args: {
    children: 'Disabled Button',
    disabled: true,
  },
};

export const FullWidth: Story = {
  args: {
    children: 'Full Width Button',
    fullWidth: true,
  },
  decorators: [
    (Story) => (
      <div style={{ width: '300px' }}>
        <Story />
      </div>
    ),
  ],
};

export const WithIcons: Story = {
  args: {
    children: 'Add Item',
    leftIcon: <Plus size={16} />,
  },
};

export const WithRightIcon: Story = {
  args: {
    children: 'Continue',
    rightIcon: <ChevronRight size={16} />,
  },
};

export const WithBothIcons: Story = {
  args: {
    children: 'Settings',
    leftIcon: <Settings size={16} />,
    rightIcon: <ChevronDown size={16} />,
  },
};

/**
 * Icons passed through `children` (instead of the leftIcon/rightIcon props)
 * land inside the truncating label span. The label keeps SVGs inline so the
 * icon, text, and trailing chevron always share one line — the pattern
 * DateRangePicker's trigger uses. The width-constrained example shows the
 * behavior when a (possibly translated, longer) label runs out of room:
 * the text truncates with an ellipsis on one line rather than wrapping.
 * Covered by visual regression tests.
 */
export const IconsInChildren: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <Button variant="primary">
        <Calendar aria-hidden="true" className="me-2 h-4 w-4" />
        Filter by Date
        <ChevronDown aria-hidden="true" className="ms-2 h-3 w-3" />
      </Button>
      <Button variant="outline">
        <Send aria-hidden="true" className="me-2 h-4 w-4" />
        Submit
      </Button>
      <div style={{ width: '180px' }}>
        <Button variant="secondary" fullWidth>
          <Calendar aria-hidden="true" className="me-2 h-4 w-4" />
          Filtrar por intervalo de fechas
          <ChevronDown aria-hidden="true" className="ms-2 h-3 w-3" />
        </Button>
      </div>
    </div>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="danger">Danger</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};
