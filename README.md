# @mieweb/ui

A themeable, accessible React component library built with Tailwind CSS 4.

## Features

- 🎨 **Fully Themeable** - Customize colors, fonts, border radius, and more using CSS variables
- ♿ **Accessible** - Built with WCAG guidelines in mind, including proper ARIA attributes and keyboard navigation
- 🌳 **Tree-Shakeable** - Import only the components you need
- 🌙 **Dark Mode** - Built-in dark mode support with system preference detection
- 📦 **Dual Format** - ESM and CommonJS support
- 🎯 **TypeScript** - Full TypeScript support with comprehensive type definitions
- 📚 **Storybook** - Interactive documentation and component playground

## Installation

```bash
npm install @mieweb/ui
# or
yarn add @mieweb/ui
# or
pnpm add @mieweb/ui
```

### Peer Dependencies

This library requires React 18+ and React DOM 18+:

```bash
npm install react react-dom
```

## Quick Start

### Option 1: With Tailwind CSS (Recommended)

If your project uses Tailwind CSS 4, you can use the library's Tailwind preset for the best experience:

1. Add the preset to your `tailwind.config.js`:

```js
// tailwind.config.js
module.exports = {
  presets: [require('@mieweb/ui/tailwind-preset')],
  content: [
    // ... your content
    './node_modules/@mieweb/ui/dist/**/*.js',
  ],
  // Override theme values to match your brand
  theme: {
    extend: {
      colors: {
        primary: {
          500: '#your-brand-color',
        },
      },
    },
  },
};
```

2. Import and use components:

```tsx
import { Button, Card, Input } from '@mieweb/ui';

function App() {
  return (
    <Card>
      <Input label="Email" type="email" />
      <Button>Submit</Button>
    </Card>
  );
}
```

### Option 2: Pre-compiled CSS

If you're not using Tailwind CSS, you can import the pre-compiled stylesheet:

```tsx
import '@mieweb/ui/styles.css';
import { Button } from '@mieweb/ui';
```

## Theming

The library uses CSS custom properties for theming. Override these variables to customize the appearance:

```css
:root {
  /* Primary color scale */
  --mieweb-primary-500: #27aae1;
  
  /* Semantic colors */
  --mieweb-background: hsl(0 0% 100%);
  --mieweb-foreground: hsl(222.2 84% 4.9%);
  
  /* Border radius */
  --mieweb-radius-md: 0.5rem;
  
  /* Font */
  --mieweb-font-sans: 'Your Font', sans-serif;
}
```

### Dark Mode

The library supports dark mode via the `.dark` class or `data-theme="dark"` attribute on a parent element:

```tsx
import { ThemeProvider, useThemeContext, Button } from '@mieweb/ui';

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useThemeContext();
  return (
    <Button onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}>
      Toggle Theme
    </Button>
  );
}

function App() {
  return (
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>
  );
}
```

## Components

### Primitives
- `Button` - Multi-variant button with loading state
- `Input` - Text input with label, error, and helper text
- `Card` - Container component with header, content, and footer
- `Text` - Typography component with variants
- `Badge` - Status indicators and labels
- `Alert` - Feedback messages

### Specialized Inputs
- `PhoneInput` - US phone number formatting
- `DateInput` - Date input with validation modes (DOB, expiration, etc.)

### Overlays
- `Tooltip` - Accessible tooltip with multiple placements
- `Dropdown` - Dropdown menu with items, separators, and labels

### Utilities
- `VisuallyHidden` - Screen reader only content
- `ThemeProvider` - Theme context provider

## Hooks

- `useTheme()` - Theme state management
- `useClickOutside()` - Detect clicks outside an element
- `useEscapeKey()` - Handle escape key press
- `useFocusTrap()` - Trap focus within a container
- `usePrefersReducedMotion()` - Detect reduced motion preference

## Utilities

### Class Names

```tsx
import { cn } from '@mieweb/ui/utils';

// Merge classes with Tailwind conflict resolution
cn('px-4 py-2', isActive && 'bg-primary-500', className);
```

### Phone Utilities

```tsx
import { formatPhoneNumber, isValidPhoneNumber } from '@mieweb/ui/utils';

formatPhoneNumber('5551234567'); // "(555) 123-4567"
isValidPhoneNumber('5551234567'); // true
```

### Date Utilities

```tsx
import { formatDateValue, calculateAge, isValidDate } from '@mieweb/ui/utils';

formatDateValue('01152024'); // "01/15/2024"
calculateAge('01/15/1990'); // 34
isValidDate('01/15/2024'); // true
```

## Tree-Shaking

Import components directly for optimal bundle size:

```tsx
// Import only what you need
import { Button } from '@mieweb/ui/components/Button';
import { useTheme } from '@mieweb/ui/hooks';
import { cn } from '@mieweb/ui/utils';
```

## TypeScript

All components are fully typed. Import types as needed:

```tsx
import type { ButtonProps, InputProps, Theme } from '@mieweb/ui';
```

## Contributing

Contributions are welcome! Please read our contributing guide for details.

## License

MIT © MIE Web Team
