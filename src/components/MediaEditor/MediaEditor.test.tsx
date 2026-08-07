import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

import { MediaEditor } from './MediaEditor';
import type { Transcript } from '../TranscriptView/transcript';

// jsdom does not implement media playback or scrollIntoView
beforeAll(() => {
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(
    async () => {}
  );
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
  Element.prototype.scrollIntoView = vi.fn();
});

const transcript: Transcript = {
  durationMs: 2000,
  words: [
    { text: 'Hello', startMs: 0, endMs: 500 },
    { text: 'brave', startMs: 500, endMs: 1000 },
    { text: 'world', startMs: 1000, endMs: 2000 },
  ],
};

describe('MediaEditor', () => {
  it('renders the media player and the transcript words', () => {
    render(<MediaEditor src="clip.mp3" kind="audio" transcript={transcript} />);

    expect(screen.getByLabelText('Media player')).toBeInTheDocument();
    expect(
      screen.getByRole('listbox', { name: 'Transcript words' })
    ).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('brave')).toBeInTheDocument();
    expect(screen.getByText('world')).toBeInTheDocument();
  });

  it('renders each word as a listbox option', () => {
    render(<MediaEditor src="clip.mp3" kind="audio" transcript={transcript} />);
    // Three spoken words, no gaps => no silence pseudo-words.
    expect(screen.getAllByRole('option')).toHaveLength(3);
  });

  it('emits the initial edited timeline via onEditedWordsRender', () => {
    const onEditedWordsRender = vi.fn();
    render(
      <MediaEditor
        src="clip.mp3"
        kind="audio"
        transcript={transcript}
        onEditedWordsRender={onEditedWordsRender}
      />
    );
    expect(onEditedWordsRender).toHaveBeenCalled();
    const [words] = onEditedWordsRender.mock.calls[0];
    expect(words).toHaveLength(3);
  });

  it('infers audio kind from the src extension when kind is omitted', () => {
    render(<MediaEditor src="clip.mp3" transcript={transcript} />);
    expect(screen.getByLabelText('Media player').tagName).toBe('AUDIO');
  });

  it('rehydrates speed state and reports it via onSpeedStateChange', () => {
    const onSpeedStateChange = vi.fn();
    const onHasEditsChange = vi.fn();
    render(
      <MediaEditor
        src="clip.mp3"
        kind="audio"
        transcript={transcript}
        initialSpeedMarkers={[{ wordIndex: 1, speed: 1.5 }]}
        initialDefaultSpeed={2}
        onSpeedStateChange={onSpeedStateChange}
        onHasEditsChange={onHasEditsChange}
      />
    );
    expect(onSpeedStateChange).toHaveBeenCalledWith(
      [{ wordIndex: 1, speed: 1.5 }],
      2
    );
    // Rehydrated speed counts as an edit, same as setting a marker live
    expect(onHasEditsChange).toHaveBeenCalledWith(true);
  });

  it('resets speed state when the transcript changes', () => {
    const onSpeedStateChange = vi.fn();
    const { rerender } = render(
      <MediaEditor
        src="clip.mp3"
        kind="audio"
        transcript={transcript}
        initialSpeedMarkers={[{ wordIndex: 1, speed: 1.5 }]}
        onSpeedStateChange={onSpeedStateChange}
      />
    );
    onSpeedStateChange.mockClear();

    const retranscribed: Transcript = {
      durationMs: 1000,
      words: [{ text: 'Different', startMs: 0, endMs: 1000 }],
    };
    rerender(
      <MediaEditor
        src="clip.mp3"
        kind="audio"
        transcript={retranscribed}
        initialSpeedMarkers={[{ wordIndex: 1, speed: 1.5 }]}
        onSpeedStateChange={onSpeedStateChange}
      />
    );
    // Markers indexed the old transcript's words: they must not survive
    expect(onSpeedStateChange).toHaveBeenCalledWith([], 1);
  });

  it('does not re-notify speed state when only the callback identity changes', () => {
    const first = vi.fn();
    const { rerender } = render(
      <MediaEditor
        src="clip.mp3"
        kind="audio"
        transcript={transcript}
        onSpeedStateChange={first}
      />
    );
    expect(first).toHaveBeenCalledTimes(1);

    // Hosts passing inline handlers re-create the callback every render;
    // unchanged speed state must not produce a duplicate notification
    const second = vi.fn();
    rerender(
      <MediaEditor
        src="clip.mp3"
        kind="audio"
        transcript={transcript}
        onSpeedStateChange={second}
      />
    );
    expect(second).not.toHaveBeenCalled();
  });
});

// Regression suite: dragging used to cancel on mouseleave and the selection
// stopped following once the pointer left the pane (no document tracking)
describe('MediaEditor drag selection beyond the pane', () => {
  it('keeps extending the selection while the pointer is outside the pane', () => {
    render(<MediaEditor src="clip.mp3" kind="audio" transcript={transcript} />);
    const options = screen.getAllByRole('option');

    // jsdom has no layout (all rects are zero-size); give the pane a real
    // shape so the visible-area clamping has something to clamp into
    const listbox = screen.getByRole('listbox', { name: 'Transcript words' });
    vi.spyOn(listbox, 'getBoundingClientRect').mockReturnValue({
      top: 0,
      bottom: 400,
      left: 0,
      right: 600,
      width: 600,
      height: 400,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as unknown as ReturnType<Element['getBoundingClientRect']>);

    fireEvent.mouseDown(options[0], { button: 0, clientX: 10, clientY: 10 });

    // Pointer far below the pane: document-level tracking clamps the point
    // back inside and resolves the word under it via elementFromPoint
    const originalFromPoint = document.elementFromPoint;
    document.elementFromPoint = vi.fn().mockReturnValue(options[2]);
    try {
      fireEvent.mouseMove(document, { clientX: 10, clientY: 999, buttons: 1 });

      expect(options[0]).toHaveAttribute('aria-selected', 'true');
      expect(options[1]).toHaveAttribute('aria-selected', 'true');
      expect(options[2]).toHaveAttribute('aria-selected', 'true');

      // Releasing ends the drag: later movement must not shrink the selection
      fireEvent.mouseUp(document);
      document.elementFromPoint = vi.fn().mockReturnValue(options[1]);
      fireEvent.mouseMove(document, { clientX: 10, clientY: 10, buttons: 1 });
      expect(options[2]).toHaveAttribute('aria-selected', 'true');
    } finally {
      document.elementFromPoint = originalFromPoint;
    }
  });

  it('does not cancel the drag when the pointer leaves the listbox', () => {
    render(<MediaEditor src="clip.mp3" kind="audio" transcript={transcript} />);
    const options = screen.getAllByRole('option');
    const listbox = screen.getByRole('listbox', { name: 'Transcript words' });

    fireEvent.mouseDown(options[0], { button: 0, clientX: 10, clientY: 10 });
    fireEvent.mouseLeave(listbox);
    fireEvent.mouseEnter(options[1]);

    expect(options[0]).toHaveAttribute('aria-selected', 'true');
    expect(options[1]).toHaveAttribute('aria-selected', 'true');

    fireEvent.mouseUp(document);
  });
});

describe('MediaEditor host-extensible undo', () => {
  /** The edit list for `transcript`, with one word optionally cut. */
  const words = (deletedIndex?: number) =>
    transcript.words.map((word, i) => ({
      originalIndex: i,
      word,
      deleted: i === deletedIndex,
    }));

  /** Props that give the editor exactly one word-level undo step of its own. */
  const withOneEditorStep = {
    initialEditedWords: words(1),
    initialUndoStack: [words()],
  };

  it('shows no Undo when neither the editor nor the host has one', () => {
    render(<MediaEditor src="clip.mp3" kind="audio" transcript={transcript} />);
    expect(
      screen.queryByRole('button', { name: /Undo/ })
    ).not.toBeInTheDocument();
  });

  it('keeps Undo and Redo together, disabling rather than removing either', () => {
    // A host that can redo but not undo: Undo must still be on screen, greyed,
    // rather than leaving a lone Redo that reads as a broken control.
    const { rerender } = render(
      <MediaEditor
        src="clip.mp3"
        kind="audio"
        transcript={transcript}
        canUndoBeyond={false}
        onUndoBeyond={vi.fn()}
        canRedo
        onRedo={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: 'Undo' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Redo' })).toBeEnabled();

    // And the mirror image at the other end of the history.
    rerender(
      <MediaEditor
        src="clip.mp3"
        kind="audio"
        transcript={transcript}
        canUndoBeyond
        onUndoBeyond={vi.fn()}
        canRedo={false}
        onRedo={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: 'Undo' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Redo' })).toBeDisabled();
  });

  it('redoes its own word-level step, the one Undo just took', () => {
    // The case that shipped broken: Undo (1) was live, Redo was grey, so a
    // word-level undo could not be taken back.
    render(
      <MediaEditor
        src="clip.mp3"
        kind="audio"
        transcript={transcript}
        {...withOneEditorStep}
      />
    );
    expect(screen.getByRole('button', { name: 'Redo' })).toBeDisabled();

    fireEvent.click(
      screen.getByRole('button', { name: /Undo \(1 available\)/ })
    );

    const redo = screen.getByRole('button', { name: 'Redo' });
    expect(redo).toBeEnabled();
    fireEvent.click(redo);
    // Back where we started: the step is on the undo stack again.
    expect(
      screen.getByRole('button', { name: /Undo \(1 available\)/ })
    ).toBeEnabled();
  });

  it('spends its own redo before the one a host offers, mirroring undo', () => {
    const onRedo = vi.fn();
    render(
      <MediaEditor
        src="clip.mp3"
        kind="audio"
        transcript={transcript}
        canRedo
        onRedo={onRedo}
        {...withOneEditorStep}
      />
    );
    fireEvent.click(
      screen.getByRole('button', { name: /Undo \(1 available\)/ })
    );

    // A word-level redo exists, so the host must not be called yet.
    fireEvent.click(screen.getByRole('button', { name: 'Redo' }));
    expect(onRedo).not.toHaveBeenCalled();

    // With that spent, the same control serves the host.
    fireEvent.click(screen.getByRole('button', { name: 'Redo' }));
    expect(onRedo).toHaveBeenCalledTimes(1);
  });

  it('does not offer an action it has no handler for', () => {
    // A host that sets the capability flag but forgets the handler would
    // otherwise get an enabled button that silently does nothing.
    render(
      <MediaEditor
        src="clip.mp3"
        kind="audio"
        transcript={transcript}
        canUndoBeyond
        canRedo
        onRedo={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: 'Undo' })).toBeDisabled();
  });

  it('handles the redo shortcut it advertises', () => {
    // The button shows a hint; the component has to honour it, or the hint is
    // a lie for anyone who is not the one host that wired up its own listener.
    const onRedo = vi.fn();
    render(
      <MediaEditor
        src="clip.mp3"
        kind="audio"
        transcript={transcript}
        canRedo
        onRedo={onRedo}
      />
    );
    const listbox = screen.getByRole('listbox', { name: 'Transcript words' });
    fireEvent.keyDown(listbox, { key: 'z', metaKey: true, shiftKey: true });
    expect(onRedo).toHaveBeenCalledTimes(1);
  });

  it('redoes its own word-level step from the keyboard before the host one', () => {
    const onRedo = vi.fn();
    render(
      <MediaEditor
        src="clip.mp3"
        kind="audio"
        transcript={transcript}
        canRedo
        onRedo={onRedo}
        {...withOneEditorStep}
      />
    );
    const listbox = screen.getByRole('listbox', { name: 'Transcript words' });
    fireEvent.keyDown(listbox, { key: 'z', metaKey: true });
    fireEvent.keyDown(listbox, { key: 'z', metaKey: true, shiftKey: true });
    expect(onRedo).not.toHaveBeenCalled();
    expect(
      screen.getByRole('button', { name: /Undo \(1 available\)/ })
    ).toBeEnabled();
  });

  it('explains a disabled Undo rather than claiming a target', () => {
    render(
      <MediaEditor
        src="clip.mp3"
        kind="audio"
        transcript={transcript}
        canUndoBeyond={false}
        undoBeyondLabel="Trim to 45 seconds"
        onRedo={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: 'Undo' })).toHaveAttribute(
      'title',
      'Nothing to undo'
    );
  });

  it('offers Undo for the host alone, before any edit has been made', () => {
    const onUndoBeyond = vi.fn();
    render(
      <MediaEditor
        src="clip.mp3"
        kind="audio"
        transcript={transcript}
        canUndoBeyond
        onUndoBeyond={onUndoBeyond}
        undoBeyondLabel="Trim to 45 seconds"
      />
    );
    const undo = screen.getByRole('button', {
      name: 'Undo: Trim to 45 seconds',
    });
    fireEvent.click(undo);
    expect(onUndoBeyond).toHaveBeenCalledTimes(1);
  });

  it('spends its own history before handing over to the host', () => {
    const onUndoBeyond = vi.fn();
    render(
      <MediaEditor
        src="clip.mp3"
        kind="audio"
        transcript={transcript}
        canUndoBeyond
        onUndoBeyond={onUndoBeyond}
        {...withOneEditorStep}
      />
    );
    // One word-level step exists, so Undo belongs to the editor.
    const undo = screen.getByRole('button', { name: /Undo \(1 available\)/ });
    fireEvent.click(undo);
    expect(onUndoBeyond).not.toHaveBeenCalled();

    // With that step spent, the same control now serves the host.
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(onUndoBeyond).toHaveBeenCalledTimes(1);
  });

  it('shows Redo alongside Undo, disabled until there is something to redo', () => {
    const onRedo = vi.fn();
    render(
      <MediaEditor
        src="clip.mp3"
        kind="audio"
        transcript={transcript}
        canRedo={false}
        onRedo={onRedo}
        redoLabel="Removed 8 words"
        {...withOneEditorStep}
      />
    );
    // Undo has a step; Redo is present but inert rather than missing.
    expect(
      screen.getByRole('button', { name: /Undo \(1 available\)/ })
    ).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Redo' })).toBeDisabled();
  });

  it('disables Redo when the host has nothing forward', () => {
    const onRedo = vi.fn();
    render(
      <MediaEditor
        src="clip.mp3"
        kind="audio"
        transcript={transcript}
        canRedo={false}
        onRedo={onRedo}
      />
    );
    const redo = screen.getByRole('button', { name: 'Redo' });
    expect(redo).toBeDisabled();
    fireEvent.click(redo);
    expect(onRedo).not.toHaveBeenCalled();
  });
});

// On a small screen the editor grows to its content instead of scrolling
// internally, so the transcript is no longer its own scrolling box. Anything
// that scrolls "the nearest scrollable ancestor" therefore moves the PAGE, and
// the player leaves the viewport. These pin the two places that happened.
describe('MediaEditor does not scroll the page on small screens', () => {
  it('focuses the transcript without scrolling it into view', () => {
    type ScrollOption = { preventScroll?: boolean };
    const calls: Array<{ el: HTMLElement; options?: ScrollOption }> = [];
    const focus = vi
      .spyOn(HTMLElement.prototype, 'focus')
      .mockImplementation(function (this: HTMLElement, options?: ScrollOption) {
        calls.push({ el: this, options });
      });

    render(<MediaEditor src="clip.mp3" kind="audio" transcript={transcript} />);

    const listbox = screen.getByRole('listbox', { name: 'Transcript words' });
    const call = calls.find((c) => c.el === listbox);

    // Without preventScroll the browser scrolls a below-the-fold transcript
    // into view, landing the reader past the player on every load.
    expect(call).toBeDefined();
    expect(call?.options).toEqual({ preventScroll: true });
    focus.mockRestore();
  });

  it('never reaches for scrollIntoView when moving the cursor', () => {
    render(<MediaEditor src="clip.mp3" kind="audio" transcript={transcript} />);
    const listbox = screen.getByRole('listbox', { name: 'Transcript words' });
    (Element.prototype.scrollIntoView as ReturnType<typeof vi.fn>).mockClear();

    fireEvent.keyDown(listbox, { key: 'ArrowRight' });
    fireEvent.keyDown(listbox, { key: 'ArrowRight' });

    // scrollIntoView walks up to the nearest scrollable ancestor — the document
    // in the small-screen layout. The transcript must scroll its own box or
    // nothing at all.
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
  });

  it('leaves scroll alone when the transcript is not its own scroller', () => {
    render(<MediaEditor src="clip.mp3" kind="audio" transcript={transcript} />);
    const listbox = screen.getByRole('listbox', { name: 'Transcript words' });

    // jsdom reports 0/0, i.e. scrollHeight <= clientHeight: exactly the
    // small-screen case, where the content defines the page height.
    const scrollTo = vi.fn();
    listbox.scrollTo = scrollTo as unknown as HTMLElement['scrollTo'];

    fireEvent.keyDown(listbox, { key: 'ArrowRight' });

    expect(scrollTo).not.toHaveBeenCalled();
  });

  it('still scrolls its own box when it does overflow (the desktop case)', () => {
    render(<MediaEditor src="clip.mp3" kind="audio" transcript={transcript} />);
    const listbox = screen.getByRole('listbox', { name: 'Transcript words' });

    // A transcript taller than its pane — the fixed-height desktop shell.
    Object.defineProperty(listbox, 'scrollHeight', { value: 900 });
    Object.defineProperty(listbox, 'clientHeight', { value: 300 });
    vi.spyOn(listbox, 'getBoundingClientRect').mockReturnValue({
      top: 0,
      bottom: 300,
      left: 0,
      right: 500,
      width: 500,
      height: 300,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    // Put the target word below the pane's bottom edge so `nearest` must move.
    const word = screen.getByText('brave');
    vi.spyOn(word, 'getBoundingClientRect').mockReturnValue({
      top: 400,
      bottom: 420,
      left: 0,
      right: 60,
      width: 60,
      height: 20,
      x: 0,
      y: 400,
      toJSON: () => ({}),
    });

    const scrollTo = vi.fn();
    listbox.scrollTo = scrollTo as unknown as HTMLElement['scrollTo'];

    fireEvent.keyDown(listbox, { key: 'ArrowRight' });

    // 420 - 300 = 120 past the bottom, which is what `block: 'nearest'` moves.
    expect(scrollTo).toHaveBeenCalledWith({ top: 120, behavior: 'smooth' });
  });
});
