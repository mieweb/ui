# Testing Guide

This document outlines the comprehensive testing strategy for the MIE UI component library.

## Testing Stack

### Unit & Integration Testing
- **Vitest** - Fast unit test runner with Jest compatibility
- **React Testing Library** - Component testing utilities
- **Jest DOM** - Additional DOM testing matchers
- **User Events** - Realistic user interaction simulation

### Visual Regression Testing
- **Playwright** - Browser automation for visual testing
- **Chromatic** - Visual regression testing service integrated with Storybook
- **Storybook** - Component documentation and testing environment

### Code Quality
- **ESLint** - Code linting and best practices
- **TypeScript** - Type checking
- **Prettier** - Code formatting

## Test Organization

```
src/
├── components/
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.stories.tsx     # Storybook stories
│   │   └── Button.test.tsx        # Unit tests
│   └── ...
├── test/
│   ├── setup.ts                   # Test environment setup
│   └── test-utils.tsx             # Custom render utilities
tests/
├── visual/
│   ├── components.spec.ts         # Visual regression tests
│   └── comprehensive.spec.ts      # Comprehensive visual tests
└── tsconfig.json                  # TypeScript config for tests
```

## Running Tests

### Unit Tests
```bash
# Run all unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Visual Regression Tests
```bash
# Install Playwright browsers (one-time setup)
npm run playwright:install

# Run all visual tests
npm run test:visual

# Run visual tests with UI mode
npm run test:visual:ui

# Run specific test file
npx playwright test tests/visual/components.spec.ts

# Update visual baselines (when intentional changes are made)
npx playwright test --update-snapshots
```

### Storybook
```bash
# Start Storybook development server
npm run storybook

# Build static Storybook
npm run build-storybook
```

## Writing Tests

### Unit Tests

#### Basic Component Test
```typescript
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import { Button } from './Button';

describe('Button', () => {
  it('renders children correctly', () => {
    renderWithTheme(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    renderWithTheme(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

#### Testing with User Events
```typescript
import userEvent from '@testing-library/user-event';

it('handles user input', async () => {
  const user = userEvent.setup();
  const handleChange = vi.fn();
  
  renderWithTheme(<Input onChange={handleChange} />);
  
  const input = screen.getByRole('textbox');
  await user.type(input, 'Hello World');
  
  expect(input).toHaveValue('Hello World');
  expect(handleChange).toHaveBeenCalled();
});
```

### Visual Regression Tests

#### Basic Visual Test
```typescript
import { test, expect } from '@playwright/test';

test('Button - Default state', async ({ page }) => {
  await page.goto('/iframe.html?id=button--default&viewMode=story');
  await page.waitForLoadState('networkidle');
  
  await expect(page).toHaveScreenshot('button-default.png');
});
```

#### Interactive State Testing
```typescript
test('Button - Hover state', async ({ page }) => {
  await page.goto('/iframe.html?id=button--default&viewMode=story');
  
  const button = page.getByRole('button').first();
  await button.hover();
  
  await expect(page).toHaveScreenshot('button-hover.png');
});
```

#### Theme Testing
```typescript
test('Button - Dark theme', async ({ page }) => {
  await page.goto('/iframe.html?id=button--default&viewMode=story&globals=theme:dark');
  await page.waitForLoadState('networkidle');
  
  await expect(page).toHaveScreenshot('button-dark.png');
});
```

## Testing Best Practices

### Unit Tests
1. **Test behavior, not implementation** - Focus on what the component does, not how it does it
2. **Use descriptive test names** - Make it clear what is being tested
3. **Test accessibility** - Ensure components work with screen readers and keyboard navigation
4. **Mock external dependencies** - Use vi.fn() for callbacks and external services
5. **Test error states** - Verify components handle errors gracefully

### Visual Tests
1. **Wait for animations** - Use `waitForLoadState('networkidle')` or specific waits
2. **Test multiple states** - Default, hover, focus, disabled, etc.
3. **Test responsive design** - Different viewport sizes
4. **Test themes** - Light/dark modes and different brand themes
5. **Use meaningful names** - Screenshot names should be descriptive

### Storybook Stories
1. **Cover all variants** - Every prop combination should have a story
2. **Include interactive examples** - Show real usage patterns
3. **Document accessibility** - Use the a11y addon
4. **Add controls** - Allow users to interact with components

## Test Configuration

### Vitest Configuration
The project uses a custom Vitest configuration with:
- JSdom environment for DOM testing
- Jest DOM matchers for enhanced assertions
- Coverage reporting with thresholds
- Path aliases for clean imports

### Playwright Configuration  
The visual tests are configured to:
- Run against multiple browsers (Chrome, Firefox, Safari)
- Test desktop and mobile viewports
- Start Storybook automatically
- Generate HTML reports with screenshots

### Coverage Requirements
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

## Continuous Integration

The CI pipeline runs:
1. **Linting and type checking**
2. **Unit tests with coverage**
3. **Visual regression tests**
4. **Build verification**
5. **Chromatic visual reviews**
6. **Accessibility testing**
7. **Security auditing**

### Visual Review Process
1. **Automated tests** catch obvious regressions
2. **Chromatic reviews** for detailed visual changes
3. **Manual review** for complex interactions
4. **Approval process** for design system changes

## Troubleshooting

### Common Issues

#### Visual Tests Failing
- **Fonts not loading**: Add font loading waits
- **Animations**: Add specific wait times
- **Browser differences**: Check if it's browser-specific
- **Timing issues**: Use `waitForLoadState('networkidle')`

#### Unit Tests Failing
- **Missing mocks**: Ensure external dependencies are mocked
- **Async operations**: Use proper async/await patterns
- **DOM cleanup**: Tests should clean up after themselves
- **Theme context**: Use `renderWithTheme` for themed components

### Updating Visual Baselines
When components intentionally change:
```bash
# Update all snapshots
npx playwright test --update-snapshots

# Update specific test snapshots
npx playwright test components.spec.ts --update-snapshots
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/)
- [Storybook Testing](https://storybook.js.org/docs/react/writing-tests/introduction)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)