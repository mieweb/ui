import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import {
  ServicePricingManager,
  type ServicePrice,
} from './ServicePricingManager';

const services: ServicePrice[] = [
  {
    id: 's1',
    serviceName: 'DOT Physical',
    serviceCode: 'DOT-PHY',
    basePrice: 85,
    isActive: true,
    note: 'Walk-ins welcome',
  },
  {
    id: 's2',
    serviceName: 'Hearing Test',
    basePrice: 35,
    isActive: true,
    isCustom: true,
  },
];

describe('ServicePricingManager', () => {
  it('shows notes read-only and a Custom badge', () => {
    renderWithTheme(<ServicePricingManager services={services} />);
    expect(screen.getByText('Walk-ins welcome')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /note for/i })
    ).not.toBeInTheDocument();
    expect(screen.getByText('Custom')).toBeInTheDocument();
    expect(screen.getByText(': Not in the services catalog')).toHaveClass(
      'sr-only'
    );
  });

  it('edits a note inline and commits on Enter', async () => {
    const onNoteChange = vi.fn().mockResolvedValue(undefined);
    renderWithTheme(
      <ServicePricingManager services={services} onNoteChange={onNoteChange} />
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Note for Hearing Test: Add note' })
    );
    const input = screen.getByRole('textbox', {
      name: 'Note for Hearing Test',
    });
    expect(input).toHaveFocus();
    fireEvent.change(input, { target: { value: '  Booth B  ' } });
    await act(async () => {
      fireEvent.keyDown(input, { key: 'Enter' });
    });

    expect(onNoteChange).toHaveBeenCalledWith('s2', 'Booth B');
    expect(
      screen.getByRole('button', { name: 'Note for Hearing Test: Add note' })
    ).toHaveFocus();
  });

  it('cancels an edit on Escape', () => {
    const onNoteChange = vi.fn();
    renderWithTheme(
      <ServicePricingManager services={services} onNoteChange={onNoteChange} />
    );

    fireEvent.click(screen.getByRole('button', { name: /Walk-ins welcome/ }));
    const input = screen.getByRole('textbox', {
      name: 'Note for DOT Physical',
    });
    fireEvent.change(input, { target: { value: 'Changed' } });
    fireEvent.keyDown(input, { key: 'Escape' });

    expect(onNoteChange).not.toHaveBeenCalled();
    expect(screen.getByText('Walk-ins welcome')).toBeInTheDocument();
  });

  it('restores the previous note and alerts when saving fails', async () => {
    let reject: (e: Error) => void = () => {};
    const onNoteChange = vi.fn(() => new Promise<void>((_, r) => (reject = r)));
    renderWithTheme(
      <ServicePricingManager services={services} onNoteChange={onNoteChange} />
    );

    fireEvent.click(screen.getByRole('button', { name: /Walk-ins welcome/ }));
    const input = screen.getByRole('textbox', {
      name: 'Note for DOT Physical',
    });
    fireEvent.change(input, { target: { value: 'Closed Fridays' } });
    fireEvent.blur(input);

    // Optimistic while pending
    const pending = screen.getByRole('button', { name: /Closed Fridays/ });
    expect(pending).toHaveAttribute('aria-disabled', 'true');

    await act(async () => reject(new Error('offline')));
    expect(screen.getByText('Walk-ins welcome')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent("Couldn't save");
  });

  it('links to the catalog when getServiceHref returns a URL', () => {
    renderWithTheme(
      <ServicePricingManager
        services={services}
        getServiceHref={(s) => (s.isCustom ? undefined : `/catalog/${s.id}`)}
      />
    );
    expect(
      screen.getByRole('link', { name: 'View DOT Physical in the catalog' })
    ).toHaveAttribute('href', '/catalog/s1');
    expect(
      screen.queryByRole('link', { name: /Hearing Test/ })
    ).not.toBeInTheDocument();
  });

  it('expands a details region with aria-expanded/aria-controls', () => {
    const renderServiceDetails = vi.fn((s: ServicePrice) => (
      <p>Details for {s.serviceCode}</p>
    ));
    renderWithTheme(
      <ServicePricingManager
        services={services}
        renderServiceDetails={renderServiceDetails}
        labels={{ showDetails: (name) => `More about ${name}` }}
      />
    );

    const toggle = screen.getByRole('button', {
      name: 'More about DOT Physical',
    });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(renderServiceDetails).not.toHaveBeenCalled();

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(toggle).toHaveAccessibleName('Hide details for DOT Physical');
    const region = document.getElementById(
      toggle.getAttribute('aria-controls')!
    );
    expect(region).toBeVisible();
    expect(region).toHaveTextContent('Details for DOT-PHY');
  });
});
