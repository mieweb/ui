import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Toggle } from './Toggle';

const meta: Meta<typeof Toggle> = {
  title: 'Components/Forms & Inputs/Toggle',
  component: Toggle,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'outline'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    disabled: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Bold',
    'aria-label': 'Toggle bold',
  },
};

export const Pressed: Story = {
  args: {
    children: 'Italic',
    defaultPressed: true,
    'aria-label': 'Toggle italic',
  },
};

export const Outline: Story = {
  args: {
    children: 'Underline',
    variant: 'outline',
    'aria-label': 'Toggle underline',
  },
};

export const Disabled: Story = {
  args: {
    children: 'Disabled',
    disabled: true,
    'aria-label': 'Disabled toggle',
  },
};

export const Controlled: Story = {
  render: (args) => <ControlledToggle {...args} />,
};

function ControlledToggle(args: React.ComponentProps<typeof Toggle>) {
  const [pressed, setPressed] = useState(false);
  return (
    <Toggle
      {...args}
      pressed={pressed}
      onPressedChange={setPressed}
      aria-label="Toggle favorite"
    >
      {pressed ? 'On' : 'Off'}
    </Toggle>
  );
}
