import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, screen, fireEvent } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './Tabs';

function renderTabs(props: Partial<React.ComponentProps<typeof Tabs>> = {}) {
  return renderWithTheme(
    <Tabs defaultValue="one" {...props}>
      <TabsList aria-label="Sections">
        <TabsTrigger value="one">One</TabsTrigger>
        <TabsTrigger value="two">Two</TabsTrigger>
      </TabsList>
      <TabsContent value="one">Panel one</TabsContent>
      <TabsContent value="two">Panel two</TabsContent>
    </Tabs>
  );
}

describe('Tabs', () => {
  beforeEach(() => window.history.replaceState(null, '', '/'));

  it('selects the default tab and switches on click', () => {
    renderTabs();
    expect(screen.getByRole('tab', { name: 'One' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    fireEvent.click(screen.getByRole('tab', { name: 'Two' }));
    expect(screen.getByText('Panel two')).toBeInTheDocument();
    expect(screen.queryByText('Panel one')).not.toBeInTheDocument();
  });

  describe('urlParam', () => {
    it('reads the initial tab from the URL', () => {
      window.history.replaceState(null, '', '/?tab=two');
      renderTabs({ urlParam: 'tab' });
      expect(screen.getByText('Panel two')).toBeInTheDocument();
    });

    it('writes the selection and drops it at the default', () => {
      const onValueChange = vi.fn();
      renderTabs({ urlParam: 'tab', onValueChange });
      fireEvent.click(screen.getByRole('tab', { name: 'Two' }));
      expect(window.location.search).toBe('?tab=two');
      expect(onValueChange).toHaveBeenCalledWith('two');
      fireEvent.click(screen.getByRole('tab', { name: 'One' }));
      expect(window.location.search).toBe('');
      expect(screen.getByText('Panel one')).toBeInTheDocument();
    });

    it('falls back to the default for values outside urlValues', () => {
      window.history.replaceState(null, '', '/?tab=deleted');
      renderTabs({ urlParam: 'tab', urlValues: ['one', 'two'] });
      expect(screen.getByText('Panel one')).toBeInTheDocument();
    });

    it('follows back/forward navigation', () => {
      renderTabs({ urlParam: 'tab' });
      act(() => {
        window.history.replaceState(null, '', '/?tab=two');
        window.dispatchEvent(new globalThis.PopStateEvent('popstate'));
      });
      expect(screen.getByText('Panel two')).toBeInTheDocument();
    });

    it('is ignored when controlled', () => {
      window.history.replaceState(null, '', '/?tab=two');
      renderTabs({ urlParam: 'tab', value: 'one', onValueChange: vi.fn() });
      expect(screen.getByText('Panel one')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('tab', { name: 'Two' }));
      expect(window.location.search).toBe('?tab=two');
      expect(screen.getByText('Panel one')).toBeInTheDocument();
    });
  });
});
