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
  title: 'Components/Forms & Inputs/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    meta: {
      origin: {
        repo: 'mieweb/enterprise-health-frontdoor',
        note: 'The `effect` prop ports the `.btn--plum` sheen sweep and `.btn--outline` orbiting glint from app/globals.css.',
      },
    },
  },
  tags: ['autodocs'],
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
    effect: {
      control: 'select',
      options: ['none', 'sheen', 'orbit'],
      description:
        'Opt-in hover motion: `sheen` sweeps a light band across the face; `orbit` replaces the border with a brand ring and an orbiting accent glint.',
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

/**
 * Hover motion ported from the Enterprise Health frontdoor CTA system.
 * `sheen` suits filled primaries; `orbit` suits outlines. Both respect
 * `prefers-reduced-motion` and also fire on `:focus-visible`.
 */
export const HoverEffects: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <Button effect="sheen">Request a demo</Button>
      <Button variant="secondary" effect="sheen">
        Secondary sheen
      </Button>
      <Button variant="outline" effect="orbit">
        Watch the film
      </Button>
      <Button variant="ghost" effect="orbit">
        Ghost orbit
      </Button>
    </div>
  ),
};
