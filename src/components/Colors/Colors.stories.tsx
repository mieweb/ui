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
  description?: string;
}

const primaryColors: ColorInfo[] = [
  {
    name: 'Primary 50',
    variable: '--mieweb-primary-50',
  },
  {
    name: 'Primary 100',
    variable: '--mieweb-primary-100',
  },
  {
    name: 'Primary 200',
    variable: '--mieweb-primary-200',
  },
  {
    name: 'Primary 300',
    variable: '--mieweb-primary-300',
  },
  {
    name: 'Primary 400',
    variable: '--mieweb-primary-400',
  },
  {
    name: 'Primary 500',
    variable: '--mieweb-primary-500',
    description: 'Main brand color',
  },
  {
    name: 'Primary 600',
    variable: '--mieweb-primary-600',
  },
  {
    name: 'Primary 700',
    variable: '--mieweb-primary-700',
  },
  {
    name: 'Primary 800',
    variable: '--mieweb-primary-800',
  },
  {
    name: 'Primary 900',
    variable: '--mieweb-primary-900',
  },
  {
    name: 'Primary 950',
    variable: '--mieweb-primary-950',
  },
];

const semanticColors: ColorInfo[] = [
  {
    name: 'Background',
    variable: '--mieweb-background',
    description: 'Page background',
  },
  {
    name: 'Foreground',
    variable: '--mieweb-foreground',
    description: 'Primary text color',
  },
  {
    name: 'Card',
    variable: '--mieweb-card',
    description: 'Card/panel background',
  },
  {
    name: 'Card Foreground',
    variable: '--mieweb-card-foreground',
    description: 'Card text color',
  },
  {
    name: 'Muted',
    variable: '--mieweb-muted',
    description: 'Subtle background',
  },
  {
    name: 'Muted Foreground',
    variable: '--mieweb-muted-foreground',
    description: 'Secondary text',
  },
  {
    name: 'Border',
    variable: '--mieweb-border',
    description: 'Border color',
  },
  {
    name: 'Input',
    variable: '--mieweb-input',
    description: 'Input border',
  },
  {
    name: 'Ring',
    variable: '--mieweb-ring',
    description: 'Focus ring color',
  },
];

const statusColors: ColorInfo[] = [
  {
    name: 'Destructive',
    variable: '--mieweb-destructive',
    description: 'Error/danger actions',
  },
  {
    name: 'Success',
    variable: '--mieweb-success',
    description: 'Success states',
  },
  {
    name: 'Warning',
    variable: '--mieweb-warning',
    description: 'Warning states',
  },
  {
    name: 'Info',
    variable: '--mieweb-info',
    description: 'Informational states',
  },
];

// Helper to generate a full color scale array
function makeScale(
  label: string,
  prefix: string,
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
    ...(step === '500' && opts?.description500
      ? { description: opts.description500 }
      : {}),
  }));
  if (opts?.hasForeground) {
    colors.push({
      name: `${label} Foreground`,
      variable: `--mieweb-${prefix}-foreground`,
      description: `Text on ${label.toLowerCase()} bg`,
    });
  }
  return colors;
}

const secondaryColors = makeScale('Secondary', 'secondary', {
  description500: 'Secondary brand / accent',
  hasForeground: true,
});

const neutralColors = makeScale('Neutral', 'neutral');

const destructiveScale = makeScale('Destructive', 'destructive', {
  description500: 'Error / danger',
  hasForeground: true,
});

const successScale = makeScale('Success', 'success', {
  description500: 'Success / positive',
  hasForeground: true,
});

const warningScale = makeScale('Warning', 'warning', {
  description500: 'Warning / caution',
  hasForeground: true,
});

const infoScale = makeScale('Info', 'info', {
  description500: 'Informational',
  hasForeground: true,
});

const chartColors: ColorInfo[] = [
  {
    name: 'Chart 1',
    variable: '--mieweb-chart-1',
    description: 'Primary data series',
  },
  {
    name: 'Chart 2',
    variable: '--mieweb-chart-2',
    description: 'Secondary data series',
  },
  {
    name: 'Chart 3',
    variable: '--mieweb-chart-3',
  },
  {
    name: 'Chart 4',
    variable: '--mieweb-chart-4',
  },
  {
    name: 'Chart 5',
    variable: '--mieweb-chart-5',
  },
];

// ============================================================================
// Theme version context — single observer shared by all swatches
// ============================================================================

const ThemeVersionContext = React.createContext(0);

function useThemeVersion() {
  return React.useContext(ThemeVersionContext);
}

function ThemeVersionProvider({ children }: { children: React.ReactNode }) {
  const [version, setVersion] = React.useState(0);

  React.useEffect(() => {
    let rafId = 0;
    const bump = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        setVersion((v) => v + 1);
      });
    };
    const observer = new window.MutationObserver(bump);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme', 'style'],
    });
    const headObserver = new window.MutationObserver(bump);
    headObserver.observe(document.head, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    return () => {
      observer.disconnect();
      headObserver.disconnect();
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <ThemeVersionContext.Provider value={version}>
      {children}
    </ThemeVersionContext.Provider>
  );
}

// ============================================================================
// Color Swatch Component
// ============================================================================

interface ColorSwatchProps {
  color: ColorInfo;
}

function ColorSwatch({ color }: ColorSwatchProps) {
  const [copied, setCopied] = React.useState<string | null>(null);
  const [computedHex, setComputedHex] = React.useState<string>('');
  const swatchRef = React.useRef<HTMLDivElement>(null);
  const themeVersion = useThemeVersion();

  React.useEffect(() => {
    const el = swatchRef.current;
    if (!el) return;
    const bg = getComputedStyle(el).backgroundColor;
    const match = bg.match(/\d+/g);
    if (match && match.length >= 3) {
      const hex =
        '#' +
        match
          .slice(0, 3)
          .map((n) => Number(n).toString(16).padStart(2, '0'))
          .join('');
      setComputedHex(hex);
    } else {
      setComputedHex('');
    }
  }, [color.variable, themeVersion]);

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="border-border hover:bg-muted/50 flex items-center gap-4 border-b px-4 py-3 transition-colors">
      {/* Color Block */}
      <div
        ref={swatchRef}
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

          {/* Live Hex Value */}
          {computedHex && (
            <button
              onClick={() => copyToClipboard(computedHex, 'hex')}
              className="text-muted-foreground hover:text-foreground cursor-pointer font-mono transition-colors"
              title="Click to copy"
            >
              {copied === 'hex' ? '✓ Copied!' : computedHex}
            </button>
          )}
        </div>
      </div>
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
    <ThemeVersionProvider>
      <div className="bg-background min-h-screen p-8">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-foreground mb-2 text-3xl font-bold">
              Color System
            </h1>
            <p className="text-muted-foreground">
              All colors are defined as CSS custom properties (variables) and
              can be overridden per brand. Click any value to copy it to your
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
    </ThemeVersionProvider>
  );
}

// ============================================================================
// Story
// ============================================================================

type Story = StoryObj<typeof meta>;

export const Colors: Story = {
  render: () => <ColorsPage />,
};
