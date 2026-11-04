import { render, RenderResult, waitFor } from '@testing-library/react';
import { ReactElement } from 'react';
import { ThemeProvider } from '../components/ThemeProvider';

/**
 * Custom render function that includes theme provider
 */
export const renderWithTheme = (
  ui: ReactElement,
  options = {}
): RenderResult => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <ThemeProvider defaultTheme="light">{children}</ThemeProvider>
  );

  return render(ui, { wrapper: Wrapper, ...options });
};

/**
 * Custom render function with dark mode
 */
export const renderWithDarkTheme = (
  ui: ReactElement,
  options = {}
): RenderResult => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <ThemeProvider defaultTheme="dark">{children}</ThemeProvider>
  );

  return render(ui, { wrapper: Wrapper, ...options });
};

/**
 * Loads the rich `Textarea`'s surface, which `Textarea` imports lazily (it
 * brings the Kerebron editor). React keeps a lazy component once it has
 * loaded, so after this every rich `Textarea` in the file renders its surface
 * synchronously. Call it from `beforeAll` in suites that query the field
 * right after rendering.
 */
export async function loadTextareaSurface(): Promise<void> {
  const { Textarea } = await import('../components/Textarea');
  const { container, unmount } = render(<Textarea aria-label="Preload" />);
  await waitFor(() => {
    if (container.querySelector('[data-slot="textarea-rich-loading"]')) {
      throw new Error('The Textarea surface has not loaded yet');
    }
  });
  unmount();
}
