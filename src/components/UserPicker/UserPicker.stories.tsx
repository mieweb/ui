import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';
import { UserPicker, type UserPickerUser } from './UserPicker';

const team: UserPickerUser[] = [
  { id: 'u1', name: 'Ada Lovelace', email: 'ada@example.com' },
  { id: 'u2', name: 'Grace Hopper', email: 'grace@example.com' },
  { id: 'u3', name: 'Alan Turing', email: 'alan@example.com' },
  { id: 'u4', name: 'Katherine Johnson', email: 'katherine@example.com' },
  { id: 'u5', name: 'Margaret Hamilton', email: 'margaret@example.com' },
];

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

const meta: Meta<typeof UserPicker> = {
  id: 'composite-forms-userpicker',
  title: 'Inputs/Composite forms/UserPicker',
  component: UserPicker,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:experimental'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `### What it's for

Chooses an owner, assignee or set of watchers from a list of people. The trigger shows the selected user's avatar and name (or an avatar stack and count with \`multiple\`); the popover has a search box that matches name or email and a listbox of users with avatars.

### Use it when

- A record has an owner or assignee picked from your team.
- Several people can be attached (\`multiple\`), e.g. watchers or reviewers.
- "Nobody" is a valid answer — set \`allowUnassigned\`.

### Don't use it when

- The options are not people — use \`Select\` (fixed list) or \`Autocomplete\` (search-as-you-type over any record).
- You are inviting someone who is not yet a user — use \`InviteUserModal\`.

### Example

\`\`\`tsx
<UserPicker
  label="Owner"
  users={teamMembers}
  allowUnassigned
  value={deal.ownerId}
  onChange={(ownerId) => updateDeal({ ownerId })}
/>
\`\`\`

The caller owns \`value\` and \`users\`. For server-side search pass \`onQueryChange\` and toggle \`loading\`. \`onChange\` may return a promise: the new choice shows with a spinner, and a rejection puts the previous one back and announces the error.

### Limitations

- The trigger is a button with \`aria-haspopup="listbox"\`; the search input is a \`role="combobox"\` that drives the \`role="listbox"\` through \`aria-activedescendant\` (Arrow keys, Home, End, Enter, Escape, Tab). Focus moves to the search box on open and back to the trigger on Escape or a single selection.
- In \`multiple\` mode the list stays open and options toggle; the listbox is \`aria-multiselectable\`.
- Filtering is client-side over \`users\`; with \`onQueryChange\` the caller can replace \`users\` with server results.
- The popover is portalled to \`document.body\` and positioned with \`useAnchoredPosition\`.
- English defaults are overridable through \`labels\`.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'uses',
          target: 'data-display-avatar',
          why: 'Avatars identify users in the trigger and options.',
        },
      ],
    },
  },
  argTypes: {
    users: { description: 'People to choose from.' },
    value: { description: 'Selected id (single) or ids (`multiple`).' },
    onChange: {
      description: 'Receives the new value. May return a promise.',
      control: false,
    },
    multiple: { description: 'Allow several users.' },
    label: { description: 'Field label and trigger name.', control: 'text' },
    hideLabel: { description: 'Visually hide the label.' },
    allowUnassigned: { description: 'Offer an "Unassigned" option.' },
    loading: { description: 'Show a loading row instead of options.' },
    disabled: { description: 'Disable the trigger.' },
    onQueryChange: {
      description: 'Search text changes, for server-side search.',
      control: false,
    },
    size: {
      description: 'Trigger size.',
      control: 'radio',
      options: ['sm', 'md'],
    },
    labels: { description: 'Translatable strings.', control: false },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: function Render() {
    const [value, setValue] = React.useState<string | null>('u2');
    return (
      <div className="w-72">
        <UserPicker
          label="Owner"
          users={team}
          allowUnassigned
          value={value}
          onChange={async (v) => {
            await wait(600);
            setValue(v);
          }}
        />
      </div>
    );
  },
};

export const Multiple: Story = {
  render: function Render() {
    const [value, setValue] = React.useState<string[]>(['u1', 'u3']);
    return (
      <div className="w-72">
        <UserPicker
          label="Watchers"
          users={team}
          multiple
          value={value}
          onChange={setValue}
        />
      </div>
    );
  },
};

export const Loading: Story = {
  args: {
    label: 'Assignee',
    users: [],
    value: null,
    loading: true,
    onChange: () => undefined,
  },
  render: (args) => (
    <div className="w-72">
      <UserPicker {...args} />
    </div>
  ),
};

export const SaveFails: Story = {
  render: function Render() {
    const [value] = React.useState<string | null>('u1');
    return (
      <div className="w-72">
        <UserPicker
          label="Owner"
          users={team}
          value={value}
          onChange={async () => {
            await wait(600);
            throw new Error('You do not have permission to reassign.');
          }}
        />
      </div>
    );
  },
};
