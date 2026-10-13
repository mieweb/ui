import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Dropdown,
  DropdownItem,
  DropdownSubmenu,
  DropdownSeparator,
  DropdownLabel,
} from './Dropdown';
import { Button } from '../Button';
// Story-only import. Stories are not tsup entries, so this never reaches dist
// and `motion` stays an optional peer dependency for consumers.
import { MotionProvider } from '../../motion/MotionProvider';

function MultiSelectStoryDemo() {
  const [selectedValues, setSelectedValues] = React.useState(['schedule']);

  return (
    <Dropdown
      multiSelect
      showSelectAll
      width={280}
      selectedValues={selectedValues}
      onSelectedValuesChange={setSelectedValues}
      trigger={<Button>Multi-Select Menu</Button>}
    >
      <DropdownLabel>Patient Actions</DropdownLabel>
      <DropdownItem value="schedule">Schedule Visit</DropdownItem>
      <DropdownItem value="message">Message Patient</DropdownItem>
      <DropdownItem value="forms">Upload Forms</DropdownItem>
      <DropdownSeparator />
      <DropdownLabel>Billing</DropdownLabel>
      <DropdownItem value="claim">Create Claim</DropdownItem>
      <DropdownItem value="payment">Collect Payment</DropdownItem>
    </Dropdown>
  );
}

function SearchableMultiSelectStoryDemo() {
  const [selectedValues, setSelectedValues] = React.useState(['message']);

  return (
    <Dropdown
      searchable
      multiSelect
      showSelectAll
      width={300}
      searchPlaceholder="Search actions..."
      selectedValues={selectedValues}
      onSelectedValuesChange={setSelectedValues}
      trigger={<Button>Searchable Multi-Select</Button>}
    >
      <DropdownLabel>Patient Actions</DropdownLabel>
      <DropdownItem value="schedule" searchText="schedule appointment">
        Schedule Visit
      </DropdownItem>
      <DropdownItem value="message" searchText="send secure message">
        Message Patient
      </DropdownItem>
      <DropdownItem value="forms" searchText="upload intake form">
        Upload Forms
      </DropdownItem>
      <DropdownSeparator />
      <DropdownLabel>Billing</DropdownLabel>
      <DropdownItem value="claim" searchText="create insurance claim">
        Create Claim
      </DropdownItem>
      <DropdownItem value="payment" searchText="collect payment">
        Collect Payment
      </DropdownItem>
    </Dropdown>
  );
}

const meta: Meta<typeof Dropdown> = {
  id: 'choice-inputs-dropdown',
  title: 'Inputs/Choice inputs/Dropdown',
  component: Dropdown,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `### What it's for

An **action menu** anchored to any \`trigger\` element: the trigger is cloned with \`aria-haspopup="menu"\` / \`aria-expanded\` / \`aria-controls\`, and the panel (portaled, \`useAnchoredPosition\`, \`placement\`, \`width\` \`auto\` | \`trigger\` | px) renders a \`<div role="menu">\`. Children are the folder's building blocks: \`DropdownItem\` (\`<button role="menuitem">\`, \`icon\`, \`variant="danger"\`, \`onClick\`), \`DropdownSeparator\`, \`DropdownLabel\`, \`DropdownHeader\` (avatar/title/subtitle) and \`DropdownContent\` (padding wrapper). Open state is uncontrolled or controlled (\`open\` + \`onOpenChange\`). \`searchable\` adds a filter box over item text (\`searchText\` for extra keywords); \`multiSelect\` turns items with a \`value\` into \`role="menuitemcheckbox"\` rows driven by \`selectedValues\` / \`defaultSelectedValues\` / \`onSelectedValuesChange\`, with an optional \`showSelectAll\` row.

### Use it when

- The items **do something** — Edit, Duplicate, Delete, Sign out — or navigate; a user/account menu behind an avatar.
- Row-level "⋯" actions in tables and cards.
- A filter menu where several boxes can be ticked without leaving the page (\`multiSelect\`).

### Don't use it when

- The user is picking **a value** that a form will save — \`Select\` (labelled combobox/listbox, error/helper text, single or \`multiple\`).
- The user types to find an item in a large or remote list — \`Autocomplete\`.
- The user wants to search and run commands globally (⌘K) — \`CommandPalette\`.
- The menu has one item — just a \`Button\`.

### Example

\`\`\`tsx
const [open, setOpen] = useState(false);

<Dropdown open={open} onOpenChange={setOpen} placement="bottom-end"
  trigger={<Button variant="ghost" aria-label="Order actions">⋯</Button>}>
  <DropdownContent>
    <DropdownItem icon={<PencilIcon />} onClick={() => { setOpen(false); edit(order); }}>Edit</DropdownItem>
    <DropdownItem onClick={() => { setOpen(false); duplicate(order); }}>Duplicate</DropdownItem>
    <DropdownSeparator />
    <DropdownItem variant="danger" onClick={() => { setOpen(false); remove(order); }}>Delete</DropdownItem>
  </DropdownContent>
</Dropdown>
\`\`\`

Choosing an item does **not** close the menu by itself — close it from \`onClick\` (as above) or leave it open for \`multiSelect\`.

### Limitations

- Accessibility: \`role="menu"\` with \`role="menuitem"\` / \`role="menuitemcheckbox"\` (\`aria-checked\`, \`"mixed"\` for indeterminate) buttons; the trigger gets \`aria-haspopup="menu"\`, \`aria-expanded\`, \`aria-controls\`. **No arrow-key navigation, Home/End or typeahead** — items are reached with Tab; Escape and outside click close (via \`useEscapeKey\` / \`useClickOutside\`). Focus is not moved into the menu on open unless \`searchable\` (then the search input is focused) and is not returned to the trigger on close.
- Selecting an item does not close the menu; the consumer must call \`onOpenChange(false)\` or control \`open\`.
- \`searchable\` filtering inspects rendered children (\`getNodeText\` + \`searchText\`) — it only understands \`DropdownItem\`, \`DropdownContent\`, \`DropdownSeparator\`, \`DropdownLabel\`, \`DropdownHeader\` and fragments; arbitrary wrappers are filtered by their nested children.
- Not a form control: no \`name\`, nothing submits; \`multiSelect\` values live in state only.
- Strings default to English but are props: \`searchPlaceholder\` ("Search..."), \`searchAriaLabel\` ("Search dropdown items"), \`searchEmptyState\` ("No results found"), \`selectAllLabel\` ("Select all").
- RTL: \`placement\` uses logical \`start\` / \`end\`, item text uses \`text-start\`, and the submenu chevron mirrors (\`rtl:-scale-x-100\`). Theming: panel and items use hard-coded \`neutral-*\` / \`red-*\` palette classes with \`dark:\` variants, not semantic tokens; the checkbox glyph uses \`primary-*\`. Depends on \`Input\`'s \`inputVariants\` for the search box.

### Motion

The menu fades in by default. An app that opts into [\`@mieweb/ui/motion\`](?path=/docs/foundations-motion--docs) gets a spring that scales out of the trigger and a real **exit** animation — which the CSS path cannot do, because the menu unmounts on close and leaves nothing to transition. The scale is anchored to the side the menu actually landed on **after flipping**, not the requested \`placement\`, so a menu that flipped for want of room still grows out of its trigger rather than away from it. See the **Motion** story below; nothing changes at the call site either way.

Note for anyone auditing the diff: the previous fallback was \`animate-in fade-in zoom-in-95\`, which emitted no CSS at all — those are \`tailwindcss-animate\` utilities and that plugin is not installed. The menu had no enter animation before this. The fallback is now \`animate-fade-in\`, which this package's Tailwind preset actually defines.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'alternative to',
          target: 'choice-inputs-select',
          why: 'Dropdown runs actions from a menu (role="menu"); Select picks a value into a form (role="combobox"/listbox).',
        },
        {
          type: 'alternative to',
          target: 'navigation-commandpalette',
          why: 'Dropdown is a short anchored menu for one context; CommandPalette searches and runs commands app-wide from a keyboard shortcut.',
        },
        {
          type: 'uses',
          target: 'text-inputs-input',
          why: 'The searchable variant styles its filter box with inputVariants from Input.',
        },
        {
          type: 'alternative to',
          target: 'chat-composermodelselector',
          why: 'Dropdown holds arbitrary menu items; ComposerModelSelector adds provider grouping, a filter strip and an effort drill-down for LLM choice.',
        },
        {
          type: 'composes with',
          target: 'chat-chatcomposer',
          why: "ChatComposer's + menu and agent selector are Dropdown menus opening above the composer.",
        },
        {
          type: 'composes with',
          target: 'foundations-motion',
          why: 'MotionProvider scales the menu out of its trigger and gives it a real exit animation, which the CSS path cannot do because the menu unmounts on close.',
        },
      ],
    },
  },
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
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

export const WithSubmenu: Story = {
  render: () => (
    <Dropdown trigger={<Button>Export</Button>}>
      <DropdownItem onClick={() => console.warn('Copy clicked')}>
        Copy
      </DropdownItem>
      <DropdownSubmenu label="Copy as">
        <DropdownItem onClick={() => console.warn('Rich text clicked')}>
          Rich text
        </DropdownItem>
        <DropdownItem onClick={() => console.warn('Markdown clicked')}>
          Markdown
        </DropdownItem>
        <DropdownItem onClick={() => console.warn('Plain text clicked')}>
          Plain text
        </DropdownItem>
      </DropdownSubmenu>
      <DropdownSeparator />
      <DropdownItem
        variant="danger"
        onClick={() => console.warn('Delete clicked')}
      >
        Delete
      </DropdownItem>
    </Dropdown>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'A `DropdownSubmenu` opens a nested flyout on hover, click, or the arrow toward the inline-end (ArrowRight in LTR, ArrowLeft in RTL — the flyout and chevron flip sides too); the opposite arrow or Escape closes just the flyout.',
      },
    },
  },
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

export const Searchable: Story = {
  render: () => (
    <Dropdown
      searchable
      width={280}
      searchPlaceholder="Search actions..."
      trigger={<Button>Searchable Menu</Button>}
    >
      <DropdownLabel>Patient Actions</DropdownLabel>
      <DropdownItem searchText="schedule appointment">
        Schedule Visit
      </DropdownItem>
      <DropdownItem searchText="send secure message">
        Message Patient
      </DropdownItem>
      <DropdownItem searchText="upload intake form">Upload Forms</DropdownItem>
      <DropdownSeparator />
      <DropdownLabel>Billing</DropdownLabel>
      <DropdownItem searchText="create claim">Create Claim</DropdownItem>
      <DropdownItem searchText="collect payment">Collect Payment</DropdownItem>
    </Dropdown>
  ),
};

export const MultiSelect: Story = {
  render: () => <MultiSelectStoryDemo />,
};

export const SearchableMultiSelect: Story = {
  render: () => <SearchableMultiSelectStoryDemo />,
};

// ============================================================================
// Motion
// ============================================================================

/**
 * A/B harness for the motion opt-in.
 *
 * Two triggers with opposite placements, because the whole point of the preset
 * is that the scale is anchored to the side the menu lands on — a single
 * `bottom-start` menu would look identical to a plain fade and prove nothing.
 *
 * Flipping the switch remounts the `Animated` element (it swaps between a
 * motion component and a plain tag), so compare by repeating the gesture with
 * the switch set each way rather than flipping it mid-animation.
 */
function MotionDemo() {
  const [motionEnabled, setMotionEnabled] = React.useState(true);

  return (
    <MotionProvider disabled={!motionEnabled}>
      <div className="flex flex-col items-center gap-6">
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setMotionEnabled((enabled) => !enabled)}
            aria-pressed={motionEnabled}
          >
            Motion: {motionEnabled ? 'on' : 'off'}
          </Button>
          <p className="text-muted-foreground text-xs">
            Open and close each menu with the switch set each way.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Dropdown
            placement="bottom-start"
            trigger={<Button>Opens below</Button>}
          >
            <DropdownItem>Schedule Visit</DropdownItem>
            <DropdownItem>Message Patient</DropdownItem>
            <DropdownSeparator />
            <DropdownItem destructive>Cancel Visit</DropdownItem>
          </Dropdown>

          <Dropdown
            placement="top-start"
            trigger={<Button>Opens above</Button>}
          >
            <DropdownItem>Schedule Visit</DropdownItem>
            <DropdownItem>Message Patient</DropdownItem>
            <DropdownSeparator />
            <DropdownItem destructive>Cancel Visit</DropdownItem>
          </Dropdown>
        </div>
      </div>
    </MotionProvider>
  );
}

export const Motion: Story = {
  render: () => <MotionDemo />,
  parameters: {
    docs: {
      description: {
        story:
          'Dropdown under `@mieweb/ui/motion`. With motion on, each menu springs out of its trigger — the one placed above scales from its bottom edge, the one below from its top — and animates back on close. With it off both fade in and then disappear on the frame they close, because the menu unmounts and CSS has nothing left to transition. The origin follows the side the menu actually lands on, so a menu that flips near a viewport edge still grows out of its trigger. The provider is normally mounted once at the app root; it is local here so the comparison can be toggled.',
      },
    },
  },
};
