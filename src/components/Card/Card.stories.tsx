import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardMedia,
  CardBadge,
  CardActions,
  CardDivider,
  CardCollapsible,
  CardStat,
} from './Card';
import { Button } from '../Button';

const meta: Meta<typeof Card> = {
  title: 'Components/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'elevated', 'outlined', 'ghost', 'filled'],
    },
    padding: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg', 'xl'],
    },
    interactive: {
      control: 'boolean',
    },
    selected: {
      control: 'boolean',
    },
    accent: {
      control: 'select',
      options: [
        undefined,
        'primary',
        'success',
        'warning',
        'destructive',
        'info',
      ],
    },
    loading: {
      control: 'boolean',
    },
    orientation: {
      control: 'select',
      options: ['vertical', 'horizontal'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    orientation: 'vertical',
  },
  render: (args) => (
    <div style={{ width: args.orientation === 'horizontal' ? '500px' : '350px' }}>
      <Card {...args}>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card description goes here.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>This is the main content area of the card.</p>
        </CardContent>
        <CardFooter className="gap-2">
          <Button variant="outline" size="sm">
            Cancel
          </Button>
          <Button size="sm">Submit</Button>
        </CardFooter>
      </Card>
    </div>
  ),
};

export const WithHeaderAndContent: Story = {
  render: () => (
    <Card style={{ width: '350px' }}>
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card description goes here.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>This is the main content area of the card.</p>
      </CardContent>
    </Card>
  ),
};

export const WithFooter: Story = {
  render: () => (
    <Card style={{ width: '350px' }}>
      <CardHeader>
        <CardTitle>Subscription</CardTitle>
        <CardDescription>Manage your subscription plan.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>
          Your current plan is <strong>Pro</strong>.
        </p>
      </CardContent>
      <CardFooter className="justify-between">
        <Button variant="ghost">Cancel</Button>
        <Button>Upgrade</Button>
      </CardFooter>
    </Card>
  ),
};

export const Interactive: Story = {
  args: {
    interactive: true,
    children: "Click me! I'm an interactive card.",

    onClick: () => console.warn('Card clicked!'),
  },
  decorators: [
    (Story) => (
      <div style={{ width: '350px' }}>
        <Story />
      </div>
    ),
  ],
};

export const NoPadding: Story = {
  render: () => (
    <Card padding="none" style={{ width: '350px' }}>
      <img
        src="https://placehold.co/350x200/27aae1/white?text=Image"
        alt="Placeholder"
        className="w-full rounded-t-xl"
      />
      <div className="p-4">
        <h3 className="font-semibold">Image Card</h3>
        <p className="text-muted-foreground text-sm">
          Card with no padding and an image.
        </p>
      </div>
    </Card>
  ),
};

export const LargePadding: Story = {
  args: {
    padding: 'xl',
    children: 'This card has extra large padding.',
  },
  decorators: [
    (Story) => (
      <div style={{ width: '350px' }}>
        <Story />
      </div>
    ),
  ],
};

// New Stories for expanded features

export const Variants: Story = {
  name: 'Card Variants',
  render: () => (
    <div className="flex flex-wrap gap-4" style={{ maxWidth: '800px' }}>
      <Card variant="default" style={{ width: '180px' }}>
        <CardContent>
          <p className="font-medium">Default</p>
          <p className="text-muted-foreground text-sm">With shadow</p>
        </CardContent>
      </Card>
      <Card variant="elevated" style={{ width: '180px' }}>
        <CardContent>
          <p className="font-medium">Elevated</p>
          <p className="text-muted-foreground text-sm">Larger shadow</p>
        </CardContent>
      </Card>
      <Card variant="outlined" style={{ width: '180px' }}>
        <CardContent>
          <p className="font-medium">Outlined</p>
          <p className="text-muted-foreground text-sm">Thicker border</p>
        </CardContent>
      </Card>
      <Card variant="ghost" style={{ width: '180px' }}>
        <CardContent>
          <p className="font-medium">Ghost</p>
          <p className="text-muted-foreground text-sm">No background</p>
        </CardContent>
      </Card>
      <Card variant="filled" style={{ width: '180px' }}>
        <CardContent>
          <p className="font-medium">Filled</p>
          <p className="text-muted-foreground text-sm">Muted background</p>
        </CardContent>
      </Card>
    </div>
  ),
};

export const WithAccent: Story = {
  name: 'Accent Colors',
  render: () => (
    <div className="flex flex-wrap gap-4" style={{ maxWidth: '600px' }}>
      <Card accent="primary" style={{ width: '170px' }}>
        <CardContent>
          <p className="font-medium">Primary</p>
          <p className="text-muted-foreground text-sm">Brand color accent</p>
        </CardContent>
      </Card>
      <Card accent="success" style={{ width: '170px' }}>
        <CardContent>
          <p className="font-medium">Success</p>
          <p className="text-muted-foreground text-sm">Positive status</p>
        </CardContent>
      </Card>
      <Card accent="warning" style={{ width: '170px' }}>
        <CardContent>
          <p className="font-medium">Warning</p>
          <p className="text-muted-foreground text-sm">Caution needed</p>
        </CardContent>
      </Card>
      <Card accent="destructive" style={{ width: '170px' }}>
        <CardContent>
          <p className="font-medium">Destructive</p>
          <p className="text-muted-foreground text-sm">Critical alert</p>
        </CardContent>
      </Card>
      <Card accent="info" style={{ width: '170px' }}>
        <CardContent>
          <p className="font-medium">Info</p>
          <p className="text-muted-foreground text-sm">Informational</p>
        </CardContent>
      </Card>
    </div>
  ),
};

export const WithMedia: Story = {
  name: 'With Media',
  render: () => (
    <Card padding="md" style={{ width: '350px' }}>
      <CardMedia
        src="https://placehold.co/350x200/27aae1/white?text=Featured+Image"
        alt="Featured content"
        aspectRatio="video"
      />
      <CardHeader className="mt-4">
        <CardTitle>Beautiful Destination</CardTitle>
        <CardDescription>Explore the wonders of nature</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm">
          Discover breathtaking landscapes and create unforgettable memories on
          your next adventure.
        </p>
      </CardContent>
      <CardActions>
        <Button variant="ghost" size="sm">
          Learn More
        </Button>
        <Button size="sm">Book Now</Button>
      </CardActions>
    </Card>
  ),
};

export const WithMediaOverlay: Story = {
  name: 'Media with Overlay',
  render: () => (
    <Card padding="none" style={{ width: '350px' }}>
      <CardBadge variant="primary">Featured</CardBadge>
      <CardMedia
        src="https://placehold.co/350x250/1a1a2e/white?text=Night+Sky"
        alt="Night sky"
        aspectRatio="video"
        overlay={
          <div className="text-white">
            <h3 className="text-xl font-bold">Stargazing Tour</h3>
            <p className="text-sm opacity-90">Experience the cosmos</p>
          </div>
        }
      />
      <div className="p-4">
        <p className="text-muted-foreground text-sm">
          Join our guided night tour and witness the beauty of the stars.
        </p>
        <CardActions align="between" className="mt-2">
          <span className="text-lg font-bold">$49</span>
          <Button size="sm">Reserve</Button>
        </CardActions>
      </div>
    </Card>
  ),
};

export const WithBadges: Story = {
  name: 'With Badges',
  render: () => (
    <div className="flex gap-4">
      <Card style={{ width: '200px' }}>
        <CardBadge variant="success" position="top-right">
          New
        </CardBadge>
        <CardContent className="pt-8">
          <p className="font-medium">Product Card</p>
          <p className="text-muted-foreground text-sm">With success badge</p>
        </CardContent>
      </Card>
      <Card style={{ width: '200px' }}>
        <CardBadge variant="destructive" position="top-left">
          Sale
        </CardBadge>
        <CardContent className="pt-8">
          <p className="font-medium">Product Card</p>
          <p className="text-muted-foreground text-sm">
            With destructive badge
          </p>
        </CardContent>
      </Card>
      <Card style={{ width: '200px' }}>
        <CardBadge variant="warning" position="top-right">
          Limited
        </CardBadge>
        <CardContent className="pt-8">
          <p className="font-medium">Product Card</p>
          <p className="text-muted-foreground text-sm">With warning badge</p>
        </CardContent>
      </Card>
    </div>
  ),
};

export const Selectable: Story = {
  name: 'Selectable Cards',
  render: function SelectableCards() {
    const [selected, setSelected] = useState<number | null>(null);

    return (
      <div className="flex gap-4">
        {[1, 2, 3].map((id) => (
          <Card
            key={id}
            interactive
            selected={selected === id}
            onClick={() => setSelected(id)}
            style={{ width: '160px' }}
            role="button"
            aria-pressed={selected === id}
          >
            <CardContent>
              <p className="font-medium">Option {id}</p>
              <p className="text-muted-foreground text-sm">
                {selected === id ? 'Selected' : 'Click to select'}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  },
};

export const LoadingState: Story = {
  name: 'Loading State',
  render: () => (
    <div className="flex gap-4">
      <Card loading style={{ width: '250px', minHeight: '150px' }}>
        <CardHeader>
          <CardTitle>Loading Card</CardTitle>
          <CardDescription>This card is loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Content is being fetched from the server.</p>
        </CardContent>
      </Card>
      <Card style={{ width: '250px' }}>
        <CardHeader>
          <CardTitle>Normal Card</CardTitle>
          <CardDescription>This card is ready</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Content is fully loaded.</p>
        </CardContent>
      </Card>
    </div>
  ),
};

export const WithDivider: Story = {
  name: 'With Divider',
  render: () => (
    <Card style={{ width: '350px' }}>
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>$99.00</span>
        </div>
        <div className="mt-2 flex justify-between">
          <span>Shipping</span>
          <span>$5.00</span>
        </div>
        <CardDivider />
        <div className="flex justify-between font-bold">
          <span>Total</span>
          <span>$104.00</span>
        </div>
      </CardContent>
      <CardActions>
        <Button className="w-full">Checkout</Button>
      </CardActions>
    </Card>
  ),
};

export const Collapsible: Story = {
  name: 'Collapsible Content',
  render: () => (
    <Card style={{ width: '350px' }}>
      <CardHeader>
        <CardTitle>FAQ Item</CardTitle>
        <CardDescription>Click below to expand</CardDescription>
      </CardHeader>
      <CardContent>
        <p>This is the always-visible content of the card.</p>
        <CardCollapsible trigger="Read more details" className="mt-3">
          <p className="text-muted-foreground">
            Here is the additional content that was hidden. It can contain any
            React components, including lists, images, or nested cards. This
            helps keep the UI clean while still providing access to detailed
            information when needed.
          </p>
        </CardCollapsible>
      </CardContent>
    </Card>
  ),
};

export const StatCard: Story = {
  name: 'Stat Cards',
  render: () => (
    <div className="flex flex-wrap gap-4" style={{ maxWidth: '800px' }}>
      <Card style={{ width: '240px' }}>
        <CardContent>
          <CardStat
            value="$12,450"
            label="Total Revenue"
            trend={{ value: 12.5, label: 'vs last month' }}
            icon={
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
          />
        </CardContent>
      </Card>
      <Card style={{ width: '240px' }}>
        <CardContent>
          <CardStat
            value="1,234"
            label="Active Users"
            trend={{ value: 8.2, label: 'this week' }}
            icon={
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            }
          />
        </CardContent>
      </Card>
      <Card style={{ width: '240px' }}>
        <CardContent>
          <CardStat
            value="23"
            label="Pending Tasks"
            trend={{ value: -5.3, label: 'resolved' }}
            icon={
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
            }
          />
        </CardContent>
      </Card>
    </div>
  ),
};

export const HorizontalCard: Story = {
  name: 'Horizontal Layout',
  render: () => (
    <Card orientation="horizontal" padding="none" style={{ width: '500px' }}>
      <img
        src="https://placehold.co/200x200/27aae1/white?text=Photo"
        alt="Product"
        className="h-48 w-48 rounded-l-xl object-cover"
      />
      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          <CardTitle>Horizontal Card</CardTitle>
          <CardDescription className="mt-1">
            Perfect for list views and featured content
          </CardDescription>
          <p className="mt-2 text-sm">
            This layout works great for product listings, article previews, or
            any content that benefits from a side-by-side arrangement.
          </p>
        </div>
        <CardActions align="right" className="pt-2">
          <Button variant="ghost" size="sm">
            Details
          </Button>
          <Button size="sm">Action</Button>
        </CardActions>
      </div>
    </Card>
  ),
};

export const ComplexCard: Story = {
  name: 'Complex Example',
  render: () => (
    <Card variant="elevated" style={{ width: '380px' }}>
      <CardBadge variant="success">Best Seller</CardBadge>
      <CardMedia
        src="https://placehold.co/380x200/6366f1/white?text=Premium+Course"
        alt="Course thumbnail"
        aspectRatio="video"
      />
      <CardHeader className="mt-4">
        <div className="flex items-center gap-2">
          <CardTitle>Advanced React Patterns</CardTitle>
        </div>
        <CardDescription>Master modern React development</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-muted-foreground flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1">
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            12 hours
          </span>
          <span className="flex items-center gap-1">
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            2.5k students
          </span>
        </div>
        <CardDivider />
        <CardCollapsible trigger="View curriculum">
          <ul className="text-muted-foreground space-y-2 text-sm">
            <li>• Introduction to Advanced Patterns</li>
            <li>• Compound Components</li>
            <li>• Render Props & HOCs</li>
            <li>• Custom Hooks Deep Dive</li>
            <li>• Performance Optimization</li>
          </ul>
        </CardCollapsible>
      </CardContent>
      <CardFooter className="justify-between">
        <div>
          <span className="text-2xl font-bold">$79</span>
          <span className="text-muted-foreground ml-2 text-sm line-through">
            $129
          </span>
        </div>
        <Button>Enroll Now</Button>
      </CardFooter>
    </Card>
  ),
};
