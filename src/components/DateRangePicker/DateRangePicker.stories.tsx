import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { DateRangePicker, DateRangeFilter, DateRange } from './DateRangePicker';

// ============================================================================
// DateRangePicker Stories
// ============================================================================

const meta: Meta<typeof DateRangePicker> = {
  title: 'Components/DateRangePicker',
  component: DateRangePicker,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    placeholder: {
      control: 'text',
      description: 'Placeholder text for the trigger button',
    },
    className: {
      control: 'text',
      description: 'Custom className',
    },
    value: {
      control: false,
      table: { disable: true },
      description: 'Current date range value',
    },
    activePreset: {
      control: false,
      table: { disable: true },
      description: 'Currently active preset key',
    },
    presets: {
      control: false,
      table: { disable: true },
      description: 'Custom presets (uses default if not provided)',
    },
    labels: {
      control: false,
      table: { disable: true },
      description: 'Labels for i18n',
    },
    onChange: { action: 'onChange' },
    showPresets: {
      control: 'boolean',
      description: 'Show the preset sidebar in the calendar popup',
    },
    showPrint: { table: { disable: true } },
    onPrint: { table: { disable: true } },
    showExport: { table: { disable: true } },
    onExport: { table: { disable: true } },
  },
  args: {
    placeholder: 'Pick a date range',
  },
};

export default meta;
type Story = StoryObj<typeof DateRangePicker>;

// ============================================================================
// Playground Story (for Controls)
// ============================================================================

interface PlaygroundProps {
  placeholder?: string;
  className?: string;
  showPresets?: boolean;
  onChange?: (range: DateRange, presetKey?: string) => void;
}

function PlaygroundDemo({
  placeholder,
  className,
  showPresets,
  onChange,
}: PlaygroundProps) {
  const [range, setRange] = useState<DateRange>({ start: null, end: null });
  const [preset, setPreset] = useState<string>();

  return (
    <div className="relative min-h-[500px]">
      <DateRangePicker
        value={range}
        onChange={(newRange, presetKey) => {
          setRange(newRange);
          setPreset(presetKey);
          onChange?.(newRange, presetKey);
        }}
        activePreset={preset}
        placeholder={placeholder}
        className={className}
        showPresets={showPresets}
      />
    </div>
  );
}

/**
 * Interactive playground with all controls available.
 * Click the button to open the two-month calendar and select a date range.
 */
export const Playground: Story = {
  render: (args) => <PlaygroundDemo {...args} />,
};

// ============================================================================
// Demo Stories
// ============================================================================

/**
 * Default date range picker. Click the button to open the calendar
 * and select a start and end date.
 */
export const Default: Story = {
  render: function Render() {
    const [range, setRange] = useState<DateRange>({ start: null, end: null });

    return (
      <div className="relative min-h-[500px]">
        <DateRangePicker
          value={range}
          onChange={(newRange) => setRange(newRange)}
        />
      </div>
    );
  },
};

/**
 * Date range picker with a preset already selected ("This Month").
 */
export const Preselected: Story = {
  render: function Render() {
    const [range, setRange] = useState<DateRange>({
      start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      end: new Date(),
    });
    const [preset, setPreset] = useState<string | undefined>('this-month');

    return (
      <div className="relative min-h-[500px]">
        <DateRangePicker
          value={range}
          onChange={(newRange, presetKey) => {
            setRange(newRange);
            setPreset(presetKey);
          }}
          activePreset={preset}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Date range picker with "This Month" preset already selected.',
      },
    },
  },
};

/**
 * Date range picker with Spanish labels for internationalization.
 */
export const CustomLabels: Story = {
  render: function Render() {
    const [range, setRange] = useState<DateRange>({ start: null, end: null });
    const [preset, setPreset] = useState<string>();

    return (
      <div className="relative min-h-[500px]">
        <DateRangePicker
          value={range}
          onChange={(newRange, presetKey) => {
            setRange(newRange);
            setPreset(presetKey);
          }}
          activePreset={preset}
          placeholder="Seleccionar período"
          labels={{
            today: 'Hoy',
            thisWeek: 'Esta Semana',
            thisMonth: 'Este Mes',
            lastMonth: 'Mes Pasado',
            last7Days: 'Últimos 7 Días',
            last30Days: 'Últimos 30 Días',
            thisYear: 'Este Año',
            lastYear: 'Año Pasado',
          }}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Date range picker with Spanish labels for internationalization.',
      },
    },
  },
};

// ============================================================================
// DateRangeFilter Stories
// ============================================================================

export const FilterDropdown: StoryObj<typeof DateRangeFilter> = {
  render: function Render() {
    const [range, setRange] = useState<DateRange>({ start: null, end: null });
    const [preset, setPreset] = useState<string>();

    return (
      <div className="space-y-4">
        <DateRangeFilter
          value={range}
          onChange={(newRange, presetKey) => {
            setRange(newRange);
            setPreset(presetKey);
          }}
          activePreset={preset}
        />
        {preset && (
          <p className="text-muted-foreground text-sm">
            Selected: {preset}
            {range.start &&
              ` (${range.start.toLocaleDateString()} - ${range.end?.toLocaleDateString()})`}
          </p>
        )}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Standalone filter dropdown for simpler date filtering.',
      },
    },
  },
};

export const FilterVariants: StoryObj<typeof DateRangeFilter> = {
  render: function Render() {
    const [range, setRange] = useState<DateRange>({ start: null, end: null });
    const [preset, setPreset] = useState<string>();

    return (
      <div className="flex gap-4">
        <DateRangeFilter
          value={range}
          onChange={(newRange, presetKey) => {
            setRange(newRange);
            setPreset(presetKey);
          }}
          activePreset={preset}
          variant="primary"
        />
        <DateRangeFilter
          value={range}
          onChange={(newRange, presetKey) => {
            setRange(newRange);
            setPreset(presetKey);
          }}
          activePreset={preset}
          variant="outline"
        />
        <DateRangeFilter
          value={range}
          onChange={(newRange, presetKey) => {
            setRange(newRange);
            setPreset(presetKey);
          }}
          activePreset={preset}
          variant="ghost"
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Filter dropdown in different button variants.',
      },
    },
  },
};
