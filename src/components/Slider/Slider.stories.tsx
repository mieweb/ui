import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Slider } from './Slider';

const meta: Meta<typeof Slider> = {
  id: 'choice-inputs-slider',
  title: 'Inputs/Choice inputs/Slider',
  component: Slider,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `### What it's for

A branded single-value range control: a pointer-draggable track (\`role="slider"\`) backed by a hidden native \`<input type="range">\` so the value still posts with a form (\`name\`, \`id\`). Controlled (\`value\` + \`onValueChange\`) or uncontrolled (\`defaultValue\`), with \`min\` / \`max\` / \`step\`, \`onValueCommit\` (fires on pointer release and after each key press), \`label\`, \`description\`, \`showValue\` + \`formatValue\`, \`minLabel\` / \`maxLabel\`, \`size\` \`sm\` | \`md\` | \`lg\` and colour \`variant\` \`default\` | \`success\` | \`warning\` | \`danger\` | \`neutral\`. The cva helpers \`sliderTrackVariants\`, \`sliderRangeVariants\`, \`sliderThumbVariants\` are exported.

### Use it when

- The value is a **number in a bounded range** where the approximate position matters more than the exact digits — volume, opacity, zoom, a 0–10 pain score, a threshold percentage.
- Live feedback while dragging is useful (\`onValueChange\` fires continuously; use \`onValueCommit\` for the expensive work).

### Don't use it when

- The user needs to type or read an exact number (dose, price, age) — \`Input type="number"\`.
- The choice is one of a few labelled steps — \`Radio\` or \`PillSelect\`.
- You need two thumbs (a range between two values) — not supported; pair two \`Slider\`s or another control.
- It's an on/off — \`Switch\`.

### Example

\`\`\`tsx
const [opacity, setOpacity] = useState(layer.opacity);

<Slider
  label="Layer opacity"
  min={0}
  max={100}
  step={5}
  value={opacity}
  onValueChange={setOpacity}              // live preview
  onValueCommit={(v) => saveLayer({ ...layer, opacity: v })}   // persist once
  showValue
  formatValue={(v) => \`\${v}%\`}
  minLabel="Transparent"
  maxLabel="Opaque"
/>
\`\`\`

### Limitations

- Accessibility: the focusable track wrapper carries \`role="slider"\`, \`tabIndex=0\`, \`aria-valuemin\` / \`aria-valuemax\` / \`aria-valuenow\`, \`aria-labelledby\` → the visible label (or \`aria-label\`, defaulting to the English string \`"Slider"\` when neither is given), \`aria-describedby\` → description, \`aria-disabled\`. Keyboard: ArrowRight/Up +step, ArrowLeft/Down −step, Home/End. **No \`aria-valuetext\`** — \`formatValue\` changes only the visible text, screen readers hear the raw number. The native range input is \`aria-hidden\` / \`tabIndex=-1\` and exists for form submission only; \`<label htmlFor>\` points at it, not at the slider role.
- Single thumb only; no ticks, no tooltip, no \`error\` / \`required\` props.
- **Not RTL-aware**: fill width and thumb use physical \`left\` / \`-translate-x-1/2\`, pointer math reads \`clientX - rect.left\`, ArrowRight always increases, and the value label uses \`ml-1\`; \`minLabel\` sits on the left in every direction.
- Theming: track \`bg-neutral-200 dark:bg-neutral-700\`, fill \`bg-primary-800\` (\`default\`) or hard-coded \`green-500\` / \`yellow-500\` / \`red-500\` / \`neutral-500\`; thumb \`bg-white\` with a variant-coloured border. Focus ring via \`group-focus-visible:ring-ring\`.
- Depends on \`class-variance-authority\` and Pointer Events (\`setPointerCapture\`).`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'alternative to',
          target: 'text-inputs-input',
          why: 'Slider for an approximate value in a bounded range; Input type="number" when the exact figure must be typed or read.',
        },
        {
          type: 'alternative to',
          target: 'choice-inputs-radio',
          why: 'Slider for a continuous numeric range; Radio when the choice is one of a few labelled steps.',
        },
      ],
    },
  },
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    variant: {
      control: 'select',
      options: ['default', 'success', 'warning', 'danger', 'neutral'],
    },
    disabled: {
      control: 'boolean',
    },
    showValue: {
      control: 'boolean',
    },
    min: { control: 'number' },
    max: { control: 'number' },
    step: { control: 'number' },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 320 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Volume',
    defaultValue: 50,
  },
};

export const WithValue: Story = {
  args: {
    label: 'Brightness',
    defaultValue: 75,
    showValue: true,
    formatValue: (v: number) => `${v}%`,
  },
};

export const WithMinMaxLabels: Story = {
  args: {
    label: 'Border Radius',
    defaultValue: 16,
    min: 0,
    max: 32,
    showValue: true,
    formatValue: (v: number) => `${v}px`,
    minLabel: 'Square',
    maxLabel: 'Rounded',
  },
};

export const WithDescription: Story = {
  args: {
    label: 'Widget Width',
    description: 'Set the width of the embedded widget.',
    defaultValue: 320,
    min: 260,
    max: 480,
    step: 10,
    showValue: true,
    formatValue: (v: number) => `${v}px`,
    minLabel: 'Compact',
    maxLabel: 'Wide',
  },
};

export const Small: Story = {
  args: {
    label: 'Small slider',
    size: 'sm',
    defaultValue: 30,
  },
};

export const Large: Story = {
  args: {
    label: 'Large slider',
    size: 'lg',
    defaultValue: 60,
    showValue: true,
  },
};

export const Disabled: Story = {
  args: {
    label: 'Disabled slider',
    defaultValue: 40,
    disabled: true,
  },
};

export const SuccessVariant: Story = {
  args: {
    label: 'Progress',
    variant: 'success',
    defaultValue: 80,
    showValue: true,
    formatValue: (v: number) => `${v}%`,
  },
};

export const WarningVariant: Story = {
  args: {
    label: 'Threshold',
    variant: 'warning',
    defaultValue: 65,
    showValue: true,
  },
};

export const DangerVariant: Story = {
  args: {
    label: 'Risk Level',
    variant: 'danger',
    defaultValue: 90,
    showValue: true,
  },
};

export const NeutralVariant: Story = {
  args: {
    label: 'Opacity',
    variant: 'neutral',
    defaultValue: 50,
    showValue: true,
    formatValue: (v: number) => `${v}%`,
  },
};

export const Controlled: Story = {
  render: function ControlledSlider() {
    const [value, setValue] = React.useState(25);
    return (
      <div className="space-y-4">
        <Slider
          label="Controlled"
          value={value}
          onValueChange={setValue}
          showValue
        />
        <div className="flex gap-2">
          <button
            onClick={() => setValue(0)}
            className="rounded bg-neutral-200 px-3 py-1 text-sm hover:bg-neutral-300 dark:bg-neutral-700 dark:hover:bg-neutral-600"
          >
            Reset
          </button>
          <button
            onClick={() => setValue(50)}
            className="bg-primary-800 hover:bg-primary-900 rounded px-3 py-1 text-sm text-white"
          >
            Set 50
          </button>
          <button
            onClick={() => setValue(100)}
            className="bg-primary-800 hover:bg-primary-900 rounded px-3 py-1 text-sm text-white"
          >
            Max
          </button>
        </div>
      </div>
    );
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className="space-y-6">
      <Slider label="Small" size="sm" defaultValue={30} />
      <Slider label="Medium (default)" size="md" defaultValue={50} />
      <Slider label="Large" size="lg" defaultValue={70} />
    </div>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-6">
      <Slider label="Default" variant="default" defaultValue={50} />
      <Slider label="Success" variant="success" defaultValue={50} />
      <Slider label="Warning" variant="warning" defaultValue={50} />
      <Slider label="Danger" variant="danger" defaultValue={50} />
      <Slider label="Neutral" variant="neutral" defaultValue={50} />
    </div>
  ),
};
