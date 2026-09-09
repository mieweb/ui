import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import { VideoCard, PlayButton } from './VideoCard';

describe('VideoCard', () => {
  it('renders a link with an accessible "Watch:" name and YouTube thumbnail', () => {
    renderWithTheme(
      <VideoCard
        title="Platform tour"
        href="/videos/tour/"
        youtubeId="abc123"
      />
    );
    const link = screen.getByRole('link', { name: 'Watch: Platform tour' });
    expect(link).toHaveAttribute('href', '/videos/tour/');
    expect(screen.getByRole('img', { name: 'Platform tour' })).toHaveAttribute(
      'src',
      'https://i.ytimg.com/vi/abc123/hqdefault.jpg'
    );
  });

  it('renders a button when no href is given', () => {
    const onClick = vi.fn();
    renderWithTheme(<VideoCard title="Clip" onClick={onClick} />);
    fireEvent.click(screen.getByRole('button', { name: 'Watch: Clip' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('formats the duration pill with the prefix, or bare when prefix is null', () => {
    const { rerender } = renderWithTheme(
      <VideoCard title="A" href="#" duration="34 min" />
    );
    expect(screen.getByText('Watch · 34 min')).toBeInTheDocument();

    rerender(
      <VideoCard title="A" href="#" duration="2:44" durationPrefix={null} />
    );
    expect(screen.getByText('2:44')).toBeInTheDocument();
  });

  it('renders body copy only in the card variant', () => {
    const { rerender } = renderWithTheme(
      <VideoCard title="A" href="#" description="Body copy" />
    );
    expect(screen.getByText('Body copy')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('A');

    rerender(
      <VideoCard title="A" href="#" description="Body copy" variant="plate" />
    );
    expect(screen.queryByText('Body copy')).not.toBeInTheDocument();
  });

  it('starts idle and does not mount a player without a hover-capable pointer', () => {
    renderWithTheme(<VideoCard title="A" href="#" youtubeId="abc123" />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('data-preview', 'idle');
    fireEvent.mouseEnter(link);
    // jsdom's matchMedia (from test setup) reports no hover support, so the
    // preview must stay idle and no iframe script is injected.
    expect(link).toHaveAttribute('data-preview', 'idle');
    expect(
      document.querySelector('script[src*="youtube.com/iframe_api"]')
    ).toBeNull();
  });
});

describe('PlayButton', () => {
  it('is decorative and renders the ring only when requested', () => {
    const { container, rerender } = renderWithTheme(<PlayButton ring="none" />);
    const root = container.querySelector('[data-slot="play-button"]')!;
    expect(root).toHaveAttribute('aria-hidden', 'true');
    expect(root.children).toHaveLength(1);

    rerender(<PlayButton ring="always" />);
    expect(
      container.querySelector('[data-slot="play-button"]')!.children
    ).toHaveLength(2);
  });
});
