import type { Meta, StoryObj } from '@storybook/react-vite';
import { ThemeProvider, useThemeContext } from './ThemeProvider';
import { Button } from '../Button';

const meta: Meta<typeof ThemeProvider> = {
  title: 'Components/ThemeProvider',
  component: ThemeProvider,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
The ThemeProvider component enables theme switching (light/dark/system) throughout your application.
It provides context for managing and persisting theme preferences.

### Features
- 🌓 Light, dark, and system theme modes
- 💾 Automatic persistence to localStorage
- 🔄 Reactive updates across components
- 🎨 Integrates with brand theming system
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    defaultTheme: {
      control: 'select',
      options: ['light', 'dark', 'system'],
      description: 'The default theme to use on first load',
    },
    storageKey: {
      control: 'text',
      description: 'The localStorage key used to persist the theme preference',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Demo component that shows theme context usage
function ThemeSwitcherDemo() {
  const { theme, setTheme, resolvedTheme } = useThemeContext();

  return (
    <div className="space-y-6 rounded-lg border border-[var(--mieweb-border)] bg-[var(--mieweb-card)] p-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Theme Switcher Demo</h3>
        <p className="text-sm text-[var(--mieweb-muted-foreground)]">
          Use the buttons below to change the theme. The preference will be
          persisted.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant={theme === 'light' ? 'primary' : 'outline'}
          onClick={() => setTheme('light')}
          size="sm"
        >
          ☀️ Light
        </Button>
        <Button
          variant={theme === 'dark' ? 'primary' : 'outline'}
          onClick={() => setTheme('dark')}
          size="sm"
        >
          🌙 Dark
        </Button>
        <Button
          variant={theme === 'system' ? 'primary' : 'outline'}
          onClick={() => setTheme('system')}
          size="sm"
        >
          💻 System
        </Button>
      </div>

      <div className="space-y-2 rounded bg-[var(--mieweb-muted)] p-4">
        <div className="flex justify-between text-sm">
          <span className="font-medium">Current theme:</span>
          <code className="rounded bg-[var(--mieweb-background)] px-2 py-0.5">
            {theme}
          </code>
        </div>
        <div className="flex justify-between text-sm">
          <span className="font-medium">Resolved theme:</span>
          <code className="rounded bg-[var(--mieweb-background)] px-2 py-0.5">
            {resolvedTheme}
          </code>
        </div>
      </div>
    </div>
  );
}

export const Default: Story = {
  render: () => (
    <ThemeProvider>
      <ThemeSwitcherDemo />
    </ThemeProvider>
  ),
};

export const WithDefaultLight: Story = {
  name: 'Default Light Theme',
  render: () => (
    <ThemeProvider defaultTheme="light">
      <ThemeSwitcherDemo />
    </ThemeProvider>
  ),
};

export const WithDefaultDark: Story = {
  name: 'Default Dark Theme',
  render: () => (
    <ThemeProvider defaultTheme="dark">
      <ThemeSwitcherDemo />
    </ThemeProvider>
  ),
};

export const WithDefaultSystem: Story = {
  name: 'Default System Theme',
  render: () => (
    <ThemeProvider defaultTheme="system">
      <ThemeSwitcherDemo />
    </ThemeProvider>
  ),
};

// Example of themed content
function ThemedContentDemo() {
  const { resolvedTheme } = useThemeContext();

  return (
    <div className="space-y-4 rounded-lg border border-[var(--mieweb-border)] bg-[var(--mieweb-card)] p-6">
      <h3 className="text-lg font-semibold">Themed Content Example</h3>
      <p className="text-[var(--mieweb-muted-foreground)]">
        This content automatically adapts to the current theme. The resolved
        theme is: <strong>{resolvedTheme}</strong>
      </p>
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg bg-[var(--mieweb-primary-500)] p-4 text-white">
          Primary Color
        </div>
        <div className="rounded-lg bg-[var(--mieweb-muted)] p-4 text-[var(--mieweb-muted-foreground)]">
          Muted Color
        </div>
        <div className="rounded-lg bg-[var(--mieweb-success)] p-4 text-white">
          Success Color
        </div>
        <div className="rounded-lg bg-[var(--mieweb-destructive)] p-4 text-white">
          Destructive Color
        </div>
      </div>
    </div>
  );
}

export const ThemedContent: Story = {
  name: 'Themed Content',
  render: () => (
    <ThemeProvider>
      <ThemedContentDemo />
    </ThemeProvider>
  ),
};
