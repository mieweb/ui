import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from './Collapsible';

function renderCollapsible(props = {}) {
  return renderWithTheme(
    <Collapsible {...props}>
      <CollapsibleTrigger>Toggle</CollapsibleTrigger>
      <CollapsibleContent>Hidden content</CollapsibleContent>
    </Collapsible>
  );
}

describe('Collapsible', () => {
  it('hides content by default', () => {
    renderCollapsible();
    expect(screen.queryByText('Hidden content')).not.toBeInTheDocument();
  });

  it('shows content when defaultOpen', () => {
    renderCollapsible({ defaultOpen: true });
    expect(screen.getByText('Hidden content')).toBeInTheDocument();
  });

  it('toggles content when the trigger is clicked', () => {
    renderCollapsible();
    const trigger = screen.getByRole('button', { name: /toggle/i });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Hidden content')).toBeInTheDocument();
  });

  it('wires aria-controls to the content region', () => {
    renderCollapsible({ defaultOpen: true });
    const trigger = screen.getByRole('button');
    const region = screen.getByRole('region');
    expect(trigger.getAttribute('aria-controls')).toBe(region.id);
    expect(region.getAttribute('aria-labelledby')).toBe(trigger.id);
  });

  it('calls onOpenChange with the next state', () => {
    const onOpenChange = vi.fn();
    renderCollapsible({ onOpenChange });
    fireEvent.click(screen.getByRole('button'));
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it('does not toggle when disabled', () => {
    const onOpenChange = vi.fn();
    renderCollapsible({ disabled: true, onOpenChange });
    fireEvent.click(screen.getByRole('button'));
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.queryByText('Hidden content')).not.toBeInTheDocument();
  });

  it('keeps content mounted when forceMount is set', () => {
    renderWithTheme(
      <Collapsible>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent forceMount>Always mounted</CollapsibleContent>
      </Collapsible>
    );
    const region = screen.getByText('Always mounted');
    expect(region).toBeInTheDocument();
    expect(region).toHaveAttribute('hidden');
  });

  describe('storageKey', () => {
    beforeEach(() => window.localStorage.clear());

    it('restores and persists the open state', () => {
      window.localStorage.setItem('advanced', 'true');
      const { unmount } = renderCollapsible({ storageKey: 'advanced' });
      expect(screen.getByText('Hidden content')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button'));
      expect(window.localStorage.getItem('advanced')).toBe('false');
      unmount();
      renderCollapsible({ storageKey: 'advanced', defaultOpen: true });
      expect(screen.queryByText('Hidden content')).not.toBeInTheDocument();
    });

    it('ignores storage when controlled', () => {
      window.localStorage.setItem('advanced', 'true');
      renderCollapsible({
        storageKey: 'advanced',
        open: false,
        onOpenChange: vi.fn(),
      });
      expect(screen.queryByText('Hidden content')).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole('button'));
      expect(window.localStorage.getItem('advanced')).toBe('true');
    });

    it('swallows storage errors', () => {
      // Only block this key: other effects (e.g. useTheme) read storage too.
      const proto = globalThis.Storage.prototype;
      const realGet = proto.getItem;
      const realSet = proto.setItem;
      const spy = vi.spyOn(proto, 'getItem').mockImplementation(function (
        this: typeof proto,
        key: string
      ) {
        if (key === 'advanced') throw new Error('blocked');
        return realGet.call(this, key);
      });
      const setSpy = vi.spyOn(proto, 'setItem').mockImplementation(function (
        this: typeof proto,
        key,
        value
      ) {
        if (key === 'advanced') throw new Error('blocked');
        realSet.call(this, key, value);
      });
      renderCollapsible({ storageKey: 'advanced' });
      fireEvent.click(screen.getByRole('button'));
      expect(screen.getByText('Hidden content')).toBeInTheDocument();
      spy.mockRestore();
      setSpy.mockRestore();
    });
  });
});
