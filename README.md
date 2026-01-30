# @mieweb/ui

A themeable, accessible React component library built with Tailwind CSS 4.

## Features

- 🎨 **Fully Themeable** - Customize colors, fonts, border radius, and more using CSS variables
- 🏢 **Multi-Brand Support** - Pre-configured themes for BlueHive, Enterprise Health, WebChart, Waggleline, and MIE
- ♿ **Accessible** - Built with WCAG guidelines in mind, including proper ARIA attributes and keyboard navigation
- 🌳 **Tree-Shakeable** - Import only the components you need
- 🌙 **Dark Mode** - Built-in dark mode support with system preference detection
- 📦 **Dual Format** - ESM and CommonJS support
- 🎯 **TypeScript** - Full TypeScript support with comprehensive type definitions
- 📚 **Storybook** - Interactive documentation and component playground

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Development](#development)
- [Storybook](#storybook)
- [Using in Other Projects](#using-in-other-projects)
- [Brand System](#brand-system)
- [Theming](#theming)
- [Components](#components)
- [Hooks](#hooks)
- [Utilities](#utilities)
- [Releases](#releases)
- [Contributing](#contributing)

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

## Development

### Getting Started

1. **Clone the repository:**

```bash
git clone https://github.com/mieweb/ui.git
cd ui
```

2. **Install dependencies:**

```bash
npm install
```

3. **Start development mode:**

```bash
npm run dev
```

This will watch for changes and rebuild the library automatically.

### Available Scripts

| Script                    | Description                         |
| ------------------------- | ----------------------------------- |
| `npm run dev`             | Start development mode with watch   |
| `npm run build`           | Build the library for production    |
| `npm run storybook`       | Start Storybook development server  |
| `npm run build-storybook` | Build Storybook for static hosting  |
| `npm run typecheck`       | Run TypeScript type checking        |
| `npm run lint`            | Run ESLint                          |
| `npm run lint:fix`        | Run ESLint with auto-fix            |
| `npm run format`          | Check code formatting with Prettier |
| `npm run format:fix`      | Fix code formatting with Prettier   |
| `npm run test`            | Run tests                           |
| `npm run test:watch`      | Run tests in watch mode             |

## Storybook

Storybook provides interactive documentation and a component playground where you can explore all components with different props and themes.

### Running Storybook

```bash
npm run storybook
```

This starts the Storybook development server at [http://localhost:6006](http://localhost:6006).

### Features in Storybook

- **Component Explorer**: Browse all components with live examples
- **Props Documentation**: See all available props for each component
- **Theme Switcher**: Toggle between light and dark modes
- **Brand Switcher**: Preview components with different brand themes (BlueHive, Enterprise Health, WebChart, Waggleline, MIE)
- **Accessibility Panel**: Check accessibility compliance for each component
- **Controls**: Interactively modify component props

### Building Storybook

To build a static version of Storybook for deployment:

```bash
npm run build-storybook
```

The output will be in the `storybook-static` directory.

## Using in Other Projects

### Method 1: NPM Package (Recommended)

Once published, install the package in your project:

```bash
npm install @mieweb/ui
```

Then import components:

```tsx
import { Button, Card, Input, ThemeProvider } from '@mieweb/ui';
import '@mieweb/ui/styles.css'; // or use a brand CSS file

function App() {
  return (
    <ThemeProvider>
      <Card>
        <Card.Header>
          <Card.Title>Welcome</Card.Title>
        </Card.Header>
        <Card.Content>
          <Input label="Email" type="email" placeholder="you@example.com" />
          <Button className="mt-4">Submit</Button>
        </Card.Content>
      </Card>
    </ThemeProvider>
  );
}
```

### Method 2: Local Development (npm link)

For local development across projects:

1. **In the @mieweb/ui directory:**

```bash
cd /path/to/mieweb-ui
npm run build
npm link
```

2. **In your consuming project:**

```bash
cd /path/to/your-project
npm link @mieweb/ui
```

3. **Import and use components:**

```tsx
import { Button } from '@mieweb/ui';
import '@mieweb/ui/dist/styles.css';
```

### Method 3: Direct Path Import

For monorepo setups or when you want to reference the source directly:

```tsx
// In your consuming project's package.json
{
  "dependencies": {
    "@mieweb/ui": "file:../mieweb-ui"
  }
}
```

Then run `npm install` and import as usual.

### Using with Different Frameworks

#### Next.js

```tsx
// app/layout.tsx or pages/_app.tsx
import '@mieweb/ui/brands/bluehive.css';
import { ThemeProvider } from '@mieweb/ui';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
```

#### Vite

```tsx
// main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import '@mieweb/ui/brands/enterprise-health.css';
import { ThemeProvider } from '@mieweb/ui';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
```

#### Meteor

```tsx
// client/main.tsx
import { Meteor } from 'meteor/meteor';
import React from 'react';
import { createRoot } from 'react-dom/client';
import '@mieweb/ui/brands/bluehive.css';
import { ThemeProvider } from '@mieweb/ui';
import App from '/imports/ui/App';

Meteor.startup(() => {
  const container = document.getElementById('react-target');
  const root = createRoot(container!);
  root.render(
    <ThemeProvider>
      <App />
    </ThemeProvider>
  );
});
```

## Brand System

The library includes pre-configured themes for multiple brands. Each brand has its own design system with unique colors, typography, border radius, and shadows.

### Available Brands

| Brand                 | Primary Color        | Font   | Description                                       |
| --------------------- | -------------------- | ------ | ------------------------------------------------- |
| **BlueHive**          | `#27AAE1` (Blue)     | Nunito | DOT Physical scheduling and healthcare compliance |
| **Enterprise Health** | `#6E2B68` (Burgundy) | Jost   | Employee health and occupational medicine         |
| **WebChart**          | `#F5841F` (Orange)   | Inter  | Future-ready electronic health record system      |
| **Waggleline**        | `#17AEED` (Blue)     | Inter  | Experience visualization and orchestration        |
| **MIE**               | `#27AE60` (Green)    | Inter  | Healthcare software and services                  |

### Using a Brand Theme

#### Method 1: Import the brand CSS file

```tsx
// Import the brand's CSS file
import '@mieweb/ui/brands/enterprise-health.css';

import { Button, Card } from '@mieweb/ui';
```

#### Method 2: Use the ThemeProvider with brand

```tsx
import { ThemeProvider } from '@mieweb/ui';
import { enterpriseHealthBrand } from '@mieweb/ui/brands';

function App() {
  return (
    <ThemeProvider brand={enterpriseHealthBrand}>
      <YourApp />
    </ThemeProvider>
  );
}
```

#### Method 3: Tailwind CSS preset

```js
// tailwind.config.js
const { enterpriseHealthBrand } = require('@mieweb/ui/brands');
const { createBrandPreset } = require('@mieweb/ui/brands/types');

module.exports = {
  presets: [createBrandPreset(enterpriseHealthBrand)],
  // ...
};
```

### Brand Design Tokens

Each brand defines the following design tokens:

#### Enterprise Health

Extracted from [enterprisehealth.com](https://enterprisehealth.com):

```css
/* Primary: Burgundy/Purple */
--mieweb-primary-600: #6e2b68;

/* Secondary: Deep Teal Blue (for gradients) */
--mieweb-secondary: #00497a;

/* Accent: Gold/Yellow (logo) */
--mieweb-accent: #f8b700;

/* Brand Gradient */
--mieweb-gradient: linear-gradient(111.02deg, #00497a, #6e2b68);

/* Typography */
--mieweb-font-sans: 'Jost', ui-sans-serif, system-ui, sans-serif;

/* Border Radius (larger, more rounded) */
--mieweb-radius-sm: 0.375rem; /* 6px - badges */
--mieweb-radius-md: 0.625rem; /* 10px - buttons */
--mieweb-radius-lg: 0.75rem; /* 12px - inputs */
--mieweb-radius-2xl: 1.5rem; /* 24px - cards */

/* Shadows (subtle, layered) */
--mieweb-shadow-card:
  0 16px 32px 0 rgba(34, 35, 38, 0.05), 0 8px 16px 0 rgba(34, 35, 38, 0.05);
```

#### BlueHive

```css
/* Primary: Blue */
--mieweb-primary-500: #27aae1;

/* Typography */
--mieweb-font-sans: 'Nunito', ui-sans-serif, system-ui, sans-serif;
```

### Creating a Custom Brand

You can create your own brand configuration:

```ts
import type { BrandConfig } from '@mieweb/ui/brands/types';

export const myBrand: BrandConfig = {
  name: 'my-brand',
  displayName: 'My Brand',
  description: 'Custom brand for my application',

  colors: {
    primary: {
      50: '#f0f9ff',
      // ... full color scale 50-950
      600: '#0284c7', // Main brand color
      // ...
    },
    light: {
      background: '#ffffff',
      foreground: '#171717',
      // ... semantic colors
    },
    dark: {
      background: '#171717',
      foreground: '#fafafa',
      // ... semantic colors
    },
  },

  typography: {
    fontFamily: {
      sans: ['Your Font', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
    },
  },

  borderRadius: {
    none: '0',
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    '2xl': '1.5rem',
    full: '9999px',
  },

  boxShadow: {
    card: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
    dropdown: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    modal: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
  },
};
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
    <Button
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
    >
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

## Releases

This package uses automated releases via GitHub Actions. There are two release channels:

### Release Channels

| Channel | npm Tag | Install Command | Description |
| ------- | ------- | --------------- | ----------- |
| **Stable** | `latest` | `npm install @mieweb/ui` | Production-ready releases |
| **Prerelease** | `next` | `npm install @mieweb/ui@next` | Latest from `main` branch |

### Prerelease (Automatic)

Every push to the `main` branch automatically publishes a prerelease version to npm:

- **Version format:** `x.y.z-dev.{run_number}` (e.g., `0.1.0-dev.45`)
- **npm tag:** `next`
- **Install:** `npm install @mieweb/ui@next`

This allows consumers to test the latest changes before a stable release.

### Stable Release (Manual)

To create a stable release:

1. Go to the repository on GitHub
2. Navigate to **Actions** → **Create Stable Release**
3. Click **Run workflow**
4. Select the version bump type:
   - `patch` - Bug fixes (0.1.0 → 0.1.1)
   - `minor` - New features (0.1.0 → 0.2.0)
   - `major` - Breaking changes (0.1.0 → 1.0.0)
5. Click **Run workflow**

The workflow will:
1. Bump the version in `package.json`
2. Commit and push the change
3. Create a git tag (e.g., `v0.2.0`)
4. Trigger the release workflow which publishes to npm and creates a GitHub Release

### Manual Tag Release

You can also create a release by pushing a version tag directly:

```bash
# Create and push a tag
git tag v1.0.0
git push origin v1.0.0
```

The release workflow will automatically:
- Run tests and build
- Publish to npm with the appropriate tag (`latest` for stable, `next` for prereleases like `v1.0.0-beta.1`)
- Create a GitHub Release with auto-generated release notes

### Version Guidelines

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR** version for incompatible API changes
- **MINOR** version for backwards-compatible functionality additions
- **PATCH** version for backwards-compatible bug fixes

## Contributing

We welcome contributions! Here's how to get started:

### Development Workflow

1. **Fork and clone the repository**
2. **Install dependencies:** `npm install`
3. **Create a branch:** `git checkout -b feature/your-feature`
4. **Start Storybook:** `npm run storybook`
5. **Make your changes**
6. **Run checks:**
   ```bash
   npm run typecheck  # TypeScript
   npm run lint       # ESLint
   npm run format     # Prettier
   npm run test       # Tests
   ```
7. **Commit your changes** following [Conventional Commits](https://www.conventionalcommits.org/)
8. **Push and create a Pull Request**

### Adding a New Component

1. Create a new directory in `src/components/YourComponent/`
2. Add the component file: `YourComponent.tsx`
3. Add the index export: `index.ts`
4. Add Storybook stories: `YourComponent.stories.tsx`
5. Export from `src/components/index.ts`
6. Add to the README components list

### Adding a New Brand

1. Create `src/brands/your-brand.ts` with the `BrandConfig`
2. Create `src/brands/your-brand.css` with CSS variables
3. Export from `src/brands/index.ts`
4. Add to the README brands table

## License

MIT © MIE Web Team
