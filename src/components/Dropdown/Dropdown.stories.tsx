import type { Meta, StoryObj } from '@storybook/react';
import {
  Dropdown,
  DropdownItem,
  DropdownSeparator,
  DropdownLabel,
} from './Dropdown';
import { Button } from '../Button';

const meta: Meta<typeof Dropdown> = {
  title: 'Components/Dropdown',
  component: Dropdown,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    placement: {
      control: 'select',
      options: ['bottom-start', 'bottom-end', 'bottom'],
    },
    disabled: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Dropdown trigger={<Button>Open Menu</Button>}>
      {}
      <DropdownItem onClick={() => console.warn('Edit clicked')}>
        Edit
      </DropdownItem>
      {}
      <DropdownItem onClick={() => console.warn('Duplicate clicked')}>
        Duplicate
      </DropdownItem>
      <DropdownSeparator />
      {}
      <DropdownItem
        variant="danger"
        onClick={() => console.warn('Delete clicked')}
      >
        Delete
      </DropdownItem>
    </Dropdown>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <Dropdown trigger={<Button>Actions</Button>}>
      <DropdownItem
        icon={
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
          </svg>
        }
      >
        Edit
      </DropdownItem>
      <DropdownItem
        icon={
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M15.988 3.012A2.25 2.25 0 0118 5.25v6.5A2.25 2.25 0 0115.75 14H13.5v2.25a2.25 2.25 0 01-2.25 2.25h-6.5A2.25 2.25 0 012.5 16.25v-6.5A2.25 2.25 0 014.75 7.5H7V5.25a2.25 2.25 0 012.25-2.25h6.5z" />
          </svg>
        }
      >
        Duplicate
      </DropdownItem>
      <DropdownSeparator />
      <DropdownItem
        variant="danger"
        icon={
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.519.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5z"
              clipRule="evenodd"
            />
          </svg>
        }
      >
        Delete
      </DropdownItem>
    </Dropdown>
  ),
};

export const WithLabels: Story = {
  render: () => (
    <Dropdown trigger={<Button>User Menu</Button>}>
      <DropdownLabel>Account</DropdownLabel>
      <DropdownItem>Profile</DropdownItem>
      <DropdownItem>Settings</DropdownItem>
      <DropdownSeparator />
      <DropdownLabel>Support</DropdownLabel>
      <DropdownItem>Help Center</DropdownItem>
      <DropdownItem>Contact Us</DropdownItem>
      <DropdownSeparator />
      <DropdownItem variant="danger">Sign Out</DropdownItem>
    </Dropdown>
  ),
};

export const Placements: Story = {
  render: () => (
    <div className="flex gap-4">
      <Dropdown
        trigger={<Button>Bottom Start</Button>}
        placement="bottom-start"
      >
        <DropdownItem>Item 1</DropdownItem>
        <DropdownItem>Item 2</DropdownItem>
      </Dropdown>
      <Dropdown trigger={<Button>Bottom</Button>} placement="bottom">
        <DropdownItem>Item 1</DropdownItem>
        <DropdownItem>Item 2</DropdownItem>
      </Dropdown>
      <Dropdown trigger={<Button>Bottom End</Button>} placement="bottom-end">
        <DropdownItem>Item 1</DropdownItem>
        <DropdownItem>Item 2</DropdownItem>
      </Dropdown>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Dropdown trigger={<Button>Disabled Menu</Button>} disabled>
      <DropdownItem>You cannot see me</DropdownItem>
    </Dropdown>
  ),
};
