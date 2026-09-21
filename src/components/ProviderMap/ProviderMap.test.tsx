import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithTheme } from '../../test/test-utils';
import { ProviderMap } from './ProviderMap';

const mock = vi.hoisted(() => ({ events: {} as Record<string, () => void>, addControl: vi.fn(), setStyle: vi.fn(), remove: vi.fn(), popup: vi.fn() }));
vi.mock('mapbox-gl', () => ({ default: {
  Map: class { addControl = mock.addControl; setStyle = mock.setStyle; remove = mock.remove; on(event: string, callback: () => void) { mock.events[event] = callback; } },
  Marker: class { setLngLat() { return this; } setPopup() { return this; } addTo() { return this; } },
  Popup: class { setDOMContent(node: HTMLElement) { mock.popup(node); return this; } },
  NavigationControl: class {}, FullscreenControl: class {}, GeolocateControl: class {},
} }));
const props = { coordinates: { latitude: 41, longitude: -85 }, providerName: '<img src=x onerror=alert(1)>', address: '101 Main St', directionsUrl: 'https://example.test/directions' };
describe('ProviderMap', () => {
  beforeEach(() => { mock.events = {}; vi.clearAllMocks(); });
  it('shows an accessible map frame without a token', () => {
    renderWithTheme(<ProviderMap {...props} />);
    expect(screen.getByTitle(`Map showing ${props.providerName}, ${props.address}`)).toHaveAttribute('src', expect.stringContaining('openstreetmap.org'));
    expect(screen.getByRole('link', { name: /directions/i })).toHaveAttribute('href', props.directionsUrl);
  });
  it('loads controls, switches styles and treats provider names as text', async () => {
    const view = renderWithTheme(<ProviderMap {...props} mapboxToken="public-test-token" />);
    expect(screen.getByRole('status', { name: 'Loading map' })).toBeInTheDocument();
    await waitFor(() => expect(mock.events.load).toBeTypeOf('function'));
    expect(mock.addControl).toHaveBeenCalledTimes(3);
    const popup = mock.popup.mock.calls[0][0] as HTMLElement;
    expect(popup.querySelector('img')).toBeNull();
    expect(popup.textContent).toContain(props.providerName);
    act(() => mock.events.load());
    fireEvent.click(screen.getByRole('button', { name: 'Satellite view' }));
    expect(mock.setStyle).toHaveBeenLastCalledWith('mapbox://styles/mapbox/satellite-streets-v12');
    view.unmount();
    expect(mock.remove).toHaveBeenCalledOnce();
  });
  it('exposes a fallback after an asynchronous provider error', async () => {
    renderWithTheme(<ProviderMap {...props} mapboxToken="public-test-token" />);
    await waitFor(() => expect(mock.events.error).toBeTypeOf('function'));
    act(() => mock.events.error());
    expect(screen.getByRole('alert')).toHaveTextContent('Map unavailable');
    expect(screen.getByRole('link', { name: /directions/i })).toBeInTheDocument();
  });
});
