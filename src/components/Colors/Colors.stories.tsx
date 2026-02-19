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
    name: 'Destructive Foreground',
    variable: '--mieweb-destructive-foreground',
    lightValue: '#ffffff',
    darkValue: '#fafafa',
    tailwindClass: 'text-destructive-foreground',
    description: 'Text on destructive',
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
    name: 'Success Foreground',
    variable: '--mieweb-success-foreground',
    lightValue: '#ffffff',
    darkValue: '#fafafa',
    tailwindClass: 'text-success-foreground',
    description: 'Text on success',
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
    name: 'Warning Foreground',
    variable: '--mieweb-warning-foreground',
    lightValue: '#ffffff',
    darkValue: '#fafafa',
    tailwindClass: 'text-warning-foreground',
    description: 'Text on warning',
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

        {/* Semantic Colors */}
        <ColorSection
          title="Semantic Colors"
          description="Context-aware colors that adapt to light and dark modes."
          colors={semanticColors}
        />

        {/* Status Colors */}
        <ColorSection
          title="Status Colors"
          description="Colors for communicating success, warning, and error states."
          colors={statusColors}
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
}`}
              </pre>
            </div>
            <div>
              <h3 className="text-foreground mb-2 font-semibold">
                With Tailwind:
              </h3>
              <pre className="bg-muted text-foreground overflow-x-auto rounded-lg p-4 font-mono">
                {`<div className="bg-primary-500 text-foreground border border-border">
  ...
</div>`}
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
