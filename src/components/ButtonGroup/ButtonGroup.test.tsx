import { describe, it, expect, afterEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import { ButtonGroup } from './ButtonGroup';
import { Button } from '../Button';

/**
 * jsdom has no layout engine, so scrollWidth/clientWidth are always 0 and the
 * auto-stacking measurement sees no truncation. Tests that exercise the
 * stacking decision mock those getters on the label spans.
 */
function mockLabelWidths(scrollWidth: number, clientWidth: number) {
  Object.defineProperty(HTMLElement.prototype, 'scrollWidth', {
    configurable: true,
    get() {
      return this.dataset.slot === 'button-label' ? scrollWidth : 0;
    },
  });
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
    configurable: true,
    get() {
      return this.dataset.slot === 'button-label' ? clientWidth : 0;
    },
  });
}

function restoreLabelWidths() {
  delete (HTMLElement.prototype as { scrollWidth?: unknown }).scrollWidth;
  delete (HTMLElement.prototype as { clientWidth?: unknown }).clientWidth;
}

function getGroup() {
  return document.querySelector<HTMLElement>('[data-slot="button-group"]')!;
}

describe('ButtonGroup', () => {
  afterEach(restoreLabelWidths);

  it('renders children in a horizontal row by default', () => {
    renderWithTheme(
      <ButtonGroup>
        <Button>Cancel</Button>
        <Button>Save</Button>
      </ButtonGroup>
    );
    const group = getGroup();
    expect(group).toHaveAttribute('data-orientation', 'horizontal');
    expect(group).toHaveClass('flex-row');
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  it('aligns buttons to the right by default (no split)', () => {
    renderWithTheme(
      <ButtonGroup>
        <Button>Save</Button>
      </ButtonGroup>
    );
    expect(getGroup()).toHaveClass('justify-end');
  });

  it('respects orientation="vertical"', () => {
    renderWithTheme(
      <ButtonGroup orientation="vertical">
        <Button>Cancel</Button>
        <Button>Save</Button>
      </ButtonGroup>
    );
    const group = getGroup();
    expect(group).toHaveAttribute('data-orientation', 'vertical');
    expect(group).toHaveClass('flex-col');
  });

  it('respects orientation="horizontal" and skips measuring', () => {
    // Labels report truncation, but forced horizontal must not stack
    mockLabelWidths(300, 100);
    renderWithTheme(
      <ButtonGroup orientation="horizontal">
        <Button>A very long label that would truncate</Button>
      </ButtonGroup>
    );
    expect(getGroup()).toHaveAttribute('data-orientation', 'horizontal');
  });

  it('auto-stacks when labels would truncate', () => {
    mockLabelWidths(300, 100); // truncated: scrollWidth > clientWidth
    renderWithTheme(
      <ButtonGroup orientation="auto">
        <Button>A very long label that would truncate</Button>
        <Button>Another long label</Button>
      </ButtonGroup>
    );
    expect(getGroup()).toHaveAttribute('data-orientation', 'vertical');
  });

  it('stays horizontal when labels fit', () => {
    mockLabelWidths(100, 100); // no truncation
    renderWithTheme(
      <ButtonGroup orientation="auto">
        <Button>Fits</Button>
        <Button>Also fits</Button>
      </ButtonGroup>
    );
    expect(getGroup()).toHaveAttribute('data-orientation', 'horizontal');
  });

  describe('split', () => {
    it('renders no spacer without split', () => {
      renderWithTheme(
        <ButtonGroup>
          <Button>Cancel</Button>
          <Button>Save</Button>
        </ButtonGroup>
      );
      expect(getGroup().querySelector('.flex-1')).toBeNull();
    });

    it('split places a spacer after the first button', () => {
      renderWithTheme(
        <ButtonGroup split>
          <Button>Back</Button>
          <Button>Cancel</Button>
          <Button>Save</Button>
        </ButtonGroup>
      );
      const children = Array.from(getGroup().children);
      expect(children).toHaveLength(4);
      expect(children[1]).toHaveClass('flex-1');
      expect(children[1]).toHaveAttribute('aria-hidden', 'true');
    });

    it('split={2} places the spacer after two buttons', () => {
      renderWithTheme(
        <ButtonGroup split={2}>
          <Button>Back</Button>
          <Button>Cancel</Button>
          <Button>Save</Button>
        </ButtonGroup>
      );
      const children = Array.from(getGroup().children);
      expect(children[2]).toHaveClass('flex-1');
    });

    it('ignores split when it would leave no buttons on the right', () => {
      renderWithTheme(
        <ButtonGroup split={2}>
          <Button>Cancel</Button>
          <Button>Save</Button>
        </ButtonGroup>
      );
      expect(getGroup().querySelector('.flex-1')).toBeNull();
    });

    it('ignores split while stacked', () => {
      mockLabelWidths(300, 100); // force stacking
      renderWithTheme(
        <ButtonGroup split>
          <Button>A very long label that would truncate</Button>
          <Button>Save</Button>
        </ButtonGroup>
      );
      const group = getGroup();
      expect(group).toHaveAttribute('data-orientation', 'vertical');
      expect(group.querySelector('.flex-1')).toBeNull();
    });
  });
});
