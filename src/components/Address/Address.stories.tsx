import type { Meta, StoryObj } from '@storybook/react';

import {
  Address,
  AddressCard,
  AddressCompact,
  type AddressData,
  AddressInline,
} from './Address';

const meta: Meta<typeof Address> = {
  id: 'text-inputs-address',
  title: 'Inputs/Text inputs/Address',
  component: Address,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `### What it's for

Read-only display of an \`AddressData\` record (\`street1\`, \`street2?\`, \`city\`, \`state\`, \`postalCode\`, \`country?\`) — the display half of the pair whose input half is \`AddressForm\`. \`format\` picks the shape: \`block\` (multi-line \`<address>\`), \`inline\` (one comma-separated line) or \`compact\` (city/state[/ZIP] only); \`size\` \`sm\` | \`md\` | \`lg\`; \`hideStreet\` / \`hidePostalCode\` trim it further; \`showIcon\` (+ custom \`icon\`) adds a map pin; \`linkToMaps\` (\`true\` | \`'directions'\` | \`'search'\`) turns the whole thing into a Google Maps link. The folder also exports \`AddressCard\` (bordered card with \`title\`, icon and an optional \`tel:\` \`phoneNumber\` / \`onPhoneClick\`), the \`AddressInline\` and \`AddressCompact\` shorthands, and the formatters \`formatAddressSingleLine\`, \`formatAddressLines\`, \`formatCityStateZip\`, \`formatCityState\`, \`getGoogleMapsUrl\`, \`getGoogleMapsSearchUrl\`.

### Use it when

- Showing a stored address on a detail page (\`block\`), in a table cell or list row (\`inline\` / \`AddressInline\`), or as a location hint where space is tight (\`compact\` / \`AddressCompact\`).
- The address should be one tap from directions — \`linkToMaps\`.
- You need the string formatters without any markup (e.g. for a CSV or a tooltip).

### Don't use it when

- The user edits the address — \`AddressForm\`, which shares the same \`AddressData\` shape.
- The data is not a postal address (a room, a bed, a coordinate) — plain \`Text\`.
- You need a card with more than title + address + phone — compose \`Card\` and put \`Address\` inside.

### Example

\`\`\`tsx
<AddressCard
  title="Main office"
  address={employer.address}
  phoneNumber={employer.phone}
  linkToMaps="directions"
  size="sm"
/>
\`\`\`

Stateless — pass the record you already hold; \`AddressCard\` forwards every \`Address\` prop and always sets \`showIcon\`.

### Limitations

- \`block\` without a link renders a semantic \`<address>\`; \`inline\` / \`compact\` render a \`<span>\`. With \`linkToMaps\` the wrapper is an \`<a target="_blank" rel="noopener noreferrer">\` with **no** "opens in new tab" hint — add \`aria-label\` or a \`title\` if that matters. Icons are \`aria-hidden\`.
- \`AddressCard\`'s \`title\` is a fixed \`<h4>\`, so heading order depends on where you place it; its phone link strips non-digits for \`href="tel:"\` and \`onPhoneClick\` cancels navigation.
- Formatting is US-shaped (\`City, ST 12345\`), \`country\` is never rendered, and there is no locale-aware address ordering. Text is left/right-neutral (no physical margin classes); the icon uses \`gap-2\` so it flips in RTL.
- Colours: body text \`text-muted-foreground\`, hover \`primary-800\` / \`dark:primary-400\`; \`AddressCard\` uses hard-coded \`gray-200/700\`, \`bg-white/gray-800\` rather than card tokens.
- No dependencies; Google Maps links are plain URLs, no API key.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'composes with',
          target: 'text-inputs-addressform',
          why: 'AddressForm collects the AddressData that Address displays; use them on the edit and read views of the same record.',
        },
      ],
    },
  },
  argTypes: {
    format: {
      control: 'select',
      options: ['block', 'inline', 'compact'],
      description:
        'block: multi-line <address>. inline: one line. compact: city/state only.',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    linkToMaps: {
      control: 'select',
      options: [false, true, 'directions', 'search'],
      description:
        'Wrap in a Google Maps link (true = directions) opened in a new tab.',
    },
    showIcon: { control: 'boolean' },
    hideStreet: { control: 'boolean' },
    hidePostalCode: { control: 'boolean' },
    icon: { control: false }, // ReactNode can't be controlled via Storybook
  },
};

export default meta;
type Story = StoryObj<typeof Address>;

const sampleAddress: AddressData = {
  street1: '123 Healthcare Way',
  street2: 'Suite 500',
  city: 'Indianapolis',
  state: 'Indiana',
  postalCode: '46220',
};

// Default story with controls for all props
export const Default: Story = {
  args: {
    address: sampleAddress,
    showIcon: true,
    linkToMaps: true,
  },
};

// All three formats side by side
export const AllFormats: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <p className="text-muted-foreground mb-2 text-sm">Block format</p>
        <Address address={sampleAddress} format="block" showIcon linkToMaps />
      </div>
      <div>
        <p className="text-muted-foreground mb-2 text-sm">Inline format</p>
        <Address address={sampleAddress} format="inline" showIcon />
      </div>
      <div>
        <p className="text-muted-foreground mb-2 text-sm">Compact format</p>
        <Address address={sampleAddress} format="compact" showIcon />
      </div>
    </div>
  ),
};

// Convenience components
export const ConvenienceComponents: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <p className="text-muted-foreground mb-2 text-sm">AddressInline</p>
        <AddressInline address={sampleAddress} showIcon />
      </div>
      <div>
        <p className="text-muted-foreground mb-2 text-sm">AddressCompact</p>
        <AddressCompact address={sampleAddress} showIcon />
      </div>
    </div>
  ),
};

// AddressCard with phone
export const Card: StoryObj<typeof AddressCard> = {
  render: () => (
    <AddressCard
      title="Main Office"
      address={sampleAddress}
      phoneNumber="(317) 555-1234"
      linkToMaps
    />
  ),
};

// Multiple cards grid
export const MultipleCards: Story = {
  render: () => (
    <div className="grid gap-4 md:grid-cols-2">
      <AddressCard
        title="Main Office"
        address={sampleAddress}
        phoneNumber="(317) 555-1234"
        linkToMaps
      />
      <AddressCard
        title="Billing Address"
        address={{
          street1: '456 Main Street',
          city: 'Chicago',
          state: 'IL',
          postalCode: '60601',
        }}
        phoneNumber="(312) 555-5678"
        linkToMaps
      />
    </div>
  ),
};
