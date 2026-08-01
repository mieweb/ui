import { describe, expect, it } from 'vitest';
import {
  act,
  render,
  renderHook,
  screen,
  waitFor,
} from '@testing-library/react';
import { CollabStatus } from './CollabStatus';
import { useYjsCollabStatus } from './useYjsCollabStatus';
import { LocalYjsRoom } from './storyData';

describe('CollabStatus', () => {
  it('renders the connection state and who else is editing', () => {
    render(
      <CollabStatus
        connected
        peers={[{ name: 'Ann' }, { name: 'Bo' }, { name: 'Bo' }]}
      />
    );

    expect(screen.getByRole('button')).toHaveTextContent('Live');
    // Two windows of the same person collapse into "Bo (2)".
    expect(screen.getByRole('button')).toHaveTextContent(
      'Ann, Bo (2) are editing'
    );
  });

  it('shows "Connecting…" before the initial sync', () => {
    render(<CollabStatus connected={false} />);
    expect(screen.getByRole('button')).toHaveTextContent('Connecting…');
  });
});

describe('useYjsCollabStatus', () => {
  it('reports sync, peers and remote updates from a Yjs room', async () => {
    const room = new LocalYjsRoom('case/4');
    const self = room.join(0);
    const peer = room.join(0);

    const { result } = renderHook(() =>
      useYjsCollabStatus({
        doc: self.doc,
        provider: self.provider,
        user: { name: 'Me' },
      })
    );

    await waitFor(() => expect(result.current.connected).toBe(true));

    act(() => peer.awareness.setLocalStateField('user', { name: 'Ann' }));
    await waitFor(() =>
      expect(result.current.peers).toEqual([{ name: 'Ann', color: undefined }])
    );

    act(() => LocalYjsRoom.type(peer, 'hello'));
    await waitFor(() =>
      expect(
        result.current.log.some(
          (e) => e.kind === 'doc' && e.origin === 'remote'
        )
      ).toBe(true)
    );

    expect(result.current.room?.name).toBe('case/4');

    act(() => {
      self.leave();
      peer.leave();
    });
  });

  it('stays inert without a doc or provider', () => {
    const { result } = renderHook(() =>
      useYjsCollabStatus({ doc: null, provider: null })
    );

    expect(result.current.connected).toBe(false);
    expect(result.current.room).toBeNull();
  });
});
