import { render } from '@testing-library/react';
import { ReactElement } from 'react';
import { ThemeProvider } from '../components/ThemeProvider';

/**
 * Custom render function that includes theme provider
 */
export const renderWithTheme = (ui: ReactElement, options = {}) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <ThemeProvider theme="mieweb" darkMode={false}>
      {children}
    </ThemeProvider>
  );

  return render(ui, { wrapper: Wrapper, ...options });
};

/**
 * Custom render function with dark mode
 */
export const renderWithDarkTheme = (ui: ReactElement, options = {}) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <ThemeProvider theme="mieweb" darkMode={true}>
      {children}
    </ThemeProvider>
  );

  return render(ui, { wrapper: Wrapper, ...options });
};
