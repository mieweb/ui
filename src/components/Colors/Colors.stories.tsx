import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta = {
  title: 'Foundations/Colors',
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

// ============================================================================
// Color Data
// ============================================================================

interface ColorInfo {
  name: string;
  variable: string;
  lightValue: string;
  darkValue?: string;
  tailwindClass?: string;
  description?: string;
}

const primaryColors: ColorInfo[] = [
  {
    name: 'Primary 50',
    variable: '--mieweb-primary-50',
    lightValue: '#e6f7fc',
    tailwindClass: 'bg-primary-50',
  },
  {
    name: 'Primary 100',
    variable: '--mieweb-primary-100',
    lightValue: '#b3e6f6',
    tailwindClass: 'bg-primary-100',
  },
  {
    name: 'Primary 200',
    variable: '--mieweb-primary-200',
    lightValue: '#80d5f0',
    tailwindClass: 'bg-primary-200',
  },
  {
    name: 'Primary 300',
    variable: '--mieweb-primary-300',
    lightValue: '#4dc4ea',
    tailwindClass: 'bg-primary-300',
  },
  {
    name: 'Primary 400',
    variable: '--mieweb-primary-400',
    lightValue: '#27aae1',
    tailwindClass: 'bg-primary-400',
  },
  {
    name: 'Primary 500',
    variable: '--mieweb-primary-500',
    lightValue: '#27aae1',
    tailwindClass: 'bg-primary-500',
    description: 'Main brand color',
  },
  {
    name: 'Primary 600',
    variable: '--mieweb-primary-600',
    lightValue: '#1f98ca',
    tailwindClass: 'bg-primary-600',
  },
  {
    name: 'Primary 700',
    variable: '--mieweb-primary-700',
    lightValue: '#1786b3',
    tailwindClass: 'bg-primary-700',
  },
  {
    name: 'Primary 800',
    variable: '--mieweb-primary-800',
    lightValue: '#0f749c',
    tailwindClass: 'bg-primary-800',
  },
  {
    name: 'Primary 900',
    variable: '--mieweb-primary-900',
    lightValue: '#086285',
    tailwindClass: 'bg-primary-900',
  },
  {
    name: 'Primary 950',
    variable: '--mieweb-primary-950',
    lightValue: '#00506e',
    tailwindClass: 'bg-primary-950',
  },
];

const semanticColors: ColorInfo[] = [
  {
    name: 'Background',
    variable: '--mieweb-background',
    lightValue: '#ffffff',
    darkValue: '#171717',
    tailwindClass: 'bg-background',
    description: 'Page background',
  },
  {
    name: 'Foreground',
    variable: '--mieweb-foreground',
    lightValue: '#171717',
    darkValue: '#fafafa',
    tailwindClass: 'text-foreground',
    description: 'Primary text color',
  },
  {
    name: 'Card',
    variable: '--mieweb-card',
    lightValue: '#ffffff',
    darkValue: '#262626',
    tailwindClass: 'bg-card',
    description: 'Card/panel background',
  },
  {
    name: 'Card Foreground',
    variable: '--mieweb-card-foreground',
    lightValue: '#171717',
    darkValue: '#fafafa',
    tailwindClass: 'text-card-foreground',
    description: 'Card text color',
  },
  {
    name: 'Muted',
    variable: '--mieweb-muted',
    lightValue: '#f5f5f5',
    darkValue: '#404040',
    tailwindClass: 'bg-muted',
    description: 'Subtle background',
  },
  {
    name: 'Muted Foreground',
    variable: '--mieweb-muted-foreground',
    lightValue: '#737373',
    darkValue: '#a1a1aa',
    tailwindClass: 'text-muted-foreground',
    description: 'Secondary text',
  },
  {
    name: 'Border',
    variable: '--mieweb-border',
    lightValue: '#e5e7eb',
    darkValue: '#404040',
    tailwindClass: 'border-border',
    description: 'Border color',
  },
  {
    name: 'Input',
    variable: '--mieweb-input',
    lightValue: '#e5e7eb',
    darkValue: '#404040',
    tailwindClass: 'border-input',
    description: 'Input border',
  },
  {
    name: 'Ring',
    variable: '--mieweb-ring',
    lightValue: '#27aae1',
    darkValue: '#27aae1',
    tailwindClass: 'ring-ring',
    description: 'Focus ring color',
  },
];

const statusColors: ColorInfo[] = [
  {
    name: 'Destructive',
    variable: '--mieweb-destructive',
    lightValue: '#ef4444',
    darkValue: '#dc2626',
    tailwindClass: 'bg-destructive',
    description: 'Error/danger actions',
  },
  {
    name: 'Success',
    variable: '--mieweb-success',
    lightValue: '#22c55e',
    darkValue: '#16a34a',
    tailwindClass: 'bg-success',
    description: 'Success states',
  },
  {
    name: 'Warning',
    variable: '--mieweb-warning',
    lightValue: '#f59e0b',
    darkValue: '#d97706',
    tailwindClass: 'bg-warning',
    description: 'Warning states',
  },
  {
    name: 'Info',
    variable: '--mieweb-info',
    lightValue: '#0ea5e9',
    darkValue: '#0284c7',
    tailwindClass: 'bg-info',
    description: 'Informational states',
  },
];

// Helper to generate a full color scale array
function makeScale(
  label: string,
  prefix: string,
  values: Record<string, string>,
  opts?: { description500?: string; hasForeground?: boolean }
): ColorInfo[] {
  const steps = [
    '50',
    '100',
    '200',
    '300',
    '400',
    '500',
    '600',
    '700',
    '800',
    '900',
    '950',
  ];
  const colors: ColorInfo[] = steps.map((step) => ({
    name: `${label} ${step}`,
    variable: `--mieweb-${prefix}-${step}`,
    lightValue: values[step],
    tailwindClass: `bg-${prefix}-${step}`,
    ...(step === '500' && opts?.description500
      ? { description: opts.description500 }
      : {}),
  }));
  if (opts?.hasForeground) {
    colors.push({
      name: `${label} Foreground`,
      variable: `--mieweb-${prefix}-foreground`,
      lightValue: '#ffffff',
      darkValue: '#fafafa',
      tailwindClass: `text-${prefix}-foreground`,
      description: `Text on ${label.toLowerCase()} bg`,
    });
  }
  return colors;
}

const secondaryColors = makeScale(
  'Secondary',
  'secondary',
  {
    '50': '#eef2ff',
    '100': '#e0e7ff',
    '200': '#c7d2fe',
    '300': '#a5b4fc',
    '400': '#818cf8',
    '500': '#6366f1',
    '600': '#4f46e5',
    '700': '#4338ca',
    '800': '#3730a3',
    '900': '#312e81',
    '950': '#1e1b4b',
  },
  { description500: 'Secondary brand / accent', hasForeground: true }
);

const neutralColors = makeScale('Neutral', 'neutral', {
  '50': '#fafafa',
  '100': '#f5f5f5',
  '200': '#e5e5e5',
  '300': '#d4d4d4',
  '400': '#a3a3a3',
  '500': '#737373',
  '600': '#525252',
  '700': '#404040',
  '800': '#262626',
  '900': '#171717',
  '950': '#0a0a0a',
});

const destructiveScale = makeScale(
  'Destructive',
  'destructive',
  {
    '50': '#fef2f2',
    '100': '#fee2e2',
    '200': '#fecaca',
    '300': '#fca5a5',
    '400': '#f87171',
    '500': '#ef4444',
    '600': '#dc2626',
    '700': '#b91c1c',
    '800': '#991b1b',
    '900': '#7f1d1d',
    '950': '#450a0a',
  },
  { description500: 'Error / danger', hasForeground: true }
);

const successScale = makeScale(
  'Success',
  'success',
  {
    '50': '#f0fdf4',
    '100': '#dcfce7',
    '200': '#bbf7d0',
    '300': '#86efac',
    '400': '#4ade80',
    '500': '#22c55e',
    '600': '#16a34a',
    '700': '#15803d',
    '800': '#166534',
    '900': '#14532d',
    '950': '#052e16',
  },
  { description500: 'Success / positive', hasForeground: true }
);

const warningScale = makeScale(
  'Warning',
  'warning',
  {
    '50': '#fffbeb',
    '100': '#fef3c7',
    '200': '#fde68a',
    '300': '#fcd34d',
    '400': '#fbbf24',
    '500': '#f59e0b',
    '600': '#d97706',
    '700': '#b45309',
    '800': '#92400e',
    '900': '#78350f',
    '950': '#451a03',
  },
  { description500: 'Warning / caution', hasForeground: true }
);

const infoScale = makeScale(
  'Info',
  'info',
  {
    '50': '#f0f9ff',
    '100': '#e0f2fe',
    '200': '#bae6fd',
    '300': '#7dd3fc',
    '400': '#38bdf8',
    '500': '#0ea5e9',
    '600': '#0284c7',
    '700': '#0369a1',
    '800': '#075985',
    '900': '#0c4a6e',
    '950': '#082f49',
  },
  { description500: 'Informational', hasForeground: true }
);

const chartColors: ColorInfo[] = [
  {
    name: 'Chart 1',
    variable: '--mieweb-chart-1',
    lightValue: '#27aae1',
    darkValue: '#38bdf8',
    tailwindClass: 'bg-chart-1',
    description: 'Primary data series',
  },
  {
    name: 'Chart 2',
    variable: '--mieweb-chart-2',
    lightValue: '#22c55e',
    darkValue: '#4ade80',
    tailwindClass: 'bg-chart-2',
    description: 'Secondary data series',
  },
  {
    name: 'Chart 3',
    variable: '--mieweb-chart-3',
    lightValue: '#f59e0b',
    darkValue: '#fbbf24',
    tailwindClass: 'bg-chart-3',
  },
  {
    name: 'Chart 4',
    variable: '--mieweb-chart-4',
    lightValue: '#ef4444',
    darkValue: '#f87171',
    tailwindClass: 'bg-chart-4',
  },
  {
    name: 'Chart 5',
    variable: '--mieweb-chart-5',
    lightValue: '#6366f1',
    darkValue: '#818cf8',
    tailwindClass: 'bg-chart-5',
  },
];

// ============================================================================
// Color Swatch Component
// ============================================================================

interface ColorSwatchProps {
  color: ColorInfo;
}

function ColorSwatch({ color }: ColorSwatchProps) {
  const [copied, setCopied] = React.useState<string | null>(null);

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="border-border hover:bg-muted/50 flex items-center gap-4 border-b px-4 py-3 transition-colors">
      {/* Color Block */}
      <div
        className="border-border h-16 w-16 flex-shrink-0 rounded-lg border shadow-sm"
        style={{ backgroundColor: `var(${color.variable})` }}
      />

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-foreground font-semibold">{color.name}</span>
          {color.description && (
            <span className="text-muted-foreground text-xs">
              — {color.description}
            </span>
          )}
        </div>

        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {/* CSS Variable */}
          <button
            onClick={() => copyToClipboard(`var(${color.variable})`, 'var')}
            className="text-muted-foreground hover:text-foreground cursor-pointer font-mono transition-colors"
            title="Click to copy"
          >
            {copied === 'var' ? '✓ Copied!' : color.variable}
          </button>

          {/* Hex Value */}
          <button
            onClick={() => copyToClipboard(color.lightValue, 'hex')}
            className="text-muted-foreground hover:text-foreground cursor-pointer font-mono transition-colors"
            title="Click to copy"
          >
            {copied === 'hex' ? '✓ Copied!' : color.lightValue}
          </button>

          {/* Tailwind Class */}
          {color.tailwindClass && (
            <button
              onClick={() => copyToClipboard(color.tailwindClass!, 'tw')}
              className="text-primary-600 hover:text-primary-700 cursor-pointer font-mono transition-colors"
              title="Click to copy"
            >
              {copied === 'tw' ? '✓ Copied!' : color.tailwindClass}
            </button>
          )}
        </div>
      </div>

      {/* Dark mode value (if different) */}
      {color.darkValue && color.darkValue !== color.lightValue && (
        <div className="hidden text-right text-sm sm:block">
          <div className="text-muted-foreground text-xs">Dark mode</div>
          <button
            onClick={() => copyToClipboard(color.darkValue!, 'dark')}
            className="text-muted-foreground hover:text-foreground cursor-pointer font-mono transition-colors"
            title="Click to copy"
          >
            {copied === 'dark' ? '✓ Copied!' : color.darkValue}
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Color Section Component
// ============================================================================

interface ColorSectionProps {
  title: string;
  description?: string;
  colors: ColorInfo[];
}

function ColorSection({ title, description, colors }: ColorSectionProps) {
  return (
    <div className="mb-8">
      <div className="mb-4">
        <h2 className="text-foreground text-xl font-bold">{title}</h2>
        {description && (
          <p className="text-muted-foreground mt-1 text-sm">{description}</p>
        )}
      </div>
      <div className="bg-card border-border overflow-hidden rounded-xl border">
        {colors.map((color) => (
          <ColorSwatch key={color.variable} color={color} />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Main Colors Page
// ============================================================================

function ColorsPage() {
  return (
    <div className="bg-background min-h-screen p-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-foreground mb-2 text-3xl font-bold">
            Color System
          </h1>
          <p className="text-muted-foreground">
            All colors are defined as CSS custom properties (variables) and can
            be overridden per brand. Click any value to copy it to your
            clipboard.
          </p>
        </div>

        {/* Primary Colors */}
        <ColorSection
          title="Primary Colors"
          description="The primary brand color scale. Override these to match your brand."
          colors={primaryColors}
        />

        {/* Secondary Colors */}
        <ColorSection
          title="Secondary Colors"
          description="The secondary/accent color scale. Defaults to Indigo — can be overridden per brand."
          colors={secondaryColors}
        />

        {/* Neutral / Gray Scale */}
        <ColorSection
          title="Neutral / Gray Scale"
          description="A neutral gray scale for text, backgrounds, and structural elements."
          colors={neutralColors}
        />

        {/* Semantic Colors */}
        <ColorSection
          title="Layout Semantics"
          description="Context-aware colors that adapt to light and dark modes."
          colors={semanticColors}
        />

        {/* Status Overview */}
        <ColorSection
          title="Status Colors (Quick Reference)"
          description="Primary status values at a glance. See full scales below."
          colors={statusColors}
        />

        {/* Destructive Scale */}
        <ColorSection
          title="Destructive / Error Scale"
          description="Full red scale for error states, alerts, and destructive actions."
          colors={destructiveScale}
        />

        {/* Success Scale */}
        <ColorSection
          title="Success Scale"
          description="Full green scale for success states, confirmations, and positive feedback."
          colors={successScale}
        />

        {/* Warning Scale */}
        <ColorSection
          title="Warning Scale"
          description="Full amber scale for warnings, caution states, and pending actions."
          colors={warningScale}
        />

        {/* Info Scale */}
        <ColorSection
          title="Info Scale"
          description="Full sky blue scale for informational messages, tips, and highlights."
          colors={infoScale}
        />

        {/* Chart Colors */}
        <ColorSection
          title="Chart / Data Visualization"
          description="Five-color palette for charts, graphs, and data series. Adapts between light and dark modes."
          colors={chartColors}
        />

        {/* Usage Example */}
        <div className="bg-card border-border mt-12 rounded-xl border p-6">
          <h2 className="text-foreground mb-4 text-xl font-bold">Usage</h2>
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="text-foreground mb-2 font-semibold">In CSS:</h3>
              <pre className="bg-muted text-foreground overflow-x-auto rounded-lg p-4 font-mono">
                {`.my-component {
  background-color: var(--mieweb-primary-500);
  color: var(--mieweb-foreground);
  border: 1px solid var(--mieweb-border);
}

.alert-error {
  background-color: var(--mieweb-destructive-50);
  color: var(--mieweb-destructive-700);
  border: 1px solid var(--mieweb-destructive-200);
}`}
              </pre>
            </div>
            <div>
              <h3 className="text-foreground mb-2 font-semibold">
                With Tailwind:
              </h3>
              <pre className="bg-muted text-foreground overflow-x-auto rounded-lg p-4 font-mono">
                {`<!-- Semantic tokens -->
<div className="bg-primary-500 text-foreground border border-border">

<!-- Full status scales for subtle backgrounds -->
<div className="bg-destructive-50 text-destructive-700 border border-destructive-200">

<!-- Neutral scale -->
<div className="bg-neutral-100 text-neutral-700">

<!-- Chart colors -->
<div className="bg-chart-1 text-white">`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Story
// ============================================================================

type Story = StoryObj<typeof meta>;

export const Colors: Story = {
  render: () => <ColorsPage />,
};
