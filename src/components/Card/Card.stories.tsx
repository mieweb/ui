import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
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
    padding: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg', 'xl'],
    },
    interactive: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'This is a basic card with default padding.',
  },
  decorators: [
    (Story) => (
      <div style={{ width: '350px' }}>
        <Story />
      </div>
    ),
  ],
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
