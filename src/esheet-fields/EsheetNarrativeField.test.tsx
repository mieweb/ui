import * as React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  createFormStore,
  createUIStore,
  type FieldComponentProps,
  type FieldDefinition,
  type FieldResponse,
} from '@esheet/core';
import { renderWithTheme } from '../test/test-utils';
import {
  EsheetNarrativeField,
  narrativeText,
  sanitizeNarrativeHtml,
} from './EsheetNarrativeField';
import { getNarrativeFindings } from './narrativeFindings';

// ProseMirror resists jsdom simulation; field logic runs on the legacy
// engine, which shares the TextAreaRichProps contract (see the stub).
vi.mock(
  '../components/TextAreaRich/TextAreaRichKerebron',
  () => import('../test/textAreaRichKerebronStub')
);

const finding = {
  id: 'no-fever',
  label: 'No fever',
  text: 'No fever reported.',
};

function props(
  overrides: Partial<FieldComponentProps> = {}
): FieldComponentProps {
  return {
    field: {
      definition: {
        id: 'narrative',
        fieldType: 'narrative',
        question: 'Summary',
        _sourceData: { narrativeFindings: [finding] },
      } as unknown as FieldDefinition,
      parentId: null,
      childIds: [],
      index: 0,
    },
    form: createFormStore(),
    ui: createUIStore(),
    isPreview: true,
    isEnabled: true,
    isReadOnly: false,
    isSelected: false,
    isRequired: false,
    isSoftRequired: false,
    response: undefined,
    onRemove: vi.fn(),
    onUpdate: vi.fn(),
    onResponse: vi.fn(),
    ...overrides,
  };
}

describe('EsheetNarrativeField', () => {
  it('publishes under the generic narrative* attribute namespace', () => {
    const onResponse = vi.fn();
    renderWithTheme(<EsheetNarrativeField {...props({ onResponse })} />);
    fireEvent.input(screen.getByRole('textbox', { name: 'Summary' }), {
      target: { innerHTML: '<p><b>Stable</b></p>' },
    });
    expect(onResponse).toHaveBeenLastCalledWith(
      expect.objectContaining({
        answer: 'Stable',
        attributes: expect.objectContaining({
          narrativeHtml: '<p><b>Stable</b></p>',
          narrativeText: 'Stable',
        }),
      })
    );
  });

  it('reads findings from the generic source key and records picks as provenance', () => {
    let latest: FieldResponse | undefined;
    function Harness() {
      const [response, setResponse] = React.useState<FieldResponse>();
      latest = response;
      return (
        <EsheetNarrativeField
          {...props()}
          response={response}
          onResponse={setResponse}
        />
      );
    }
    renderWithTheme(<Harness />);
    fireEvent.focus(screen.getByRole('textbox'));
    fireEvent.click(screen.getByRole('button', { name: /No fever/ }));
    expect(latest?.answer).toBe('No fever reported.');
    expect(latest?.attributes?.narrativeFindings).toBe(
      JSON.stringify([finding])
    );
    expect(getNarrativeFindings(latest)).toEqual([finding]);
  });
});

describe('sanitizeNarrativeHtml media opt-in (mieweb/ui#736)', () => {
  const img = (src: string) => `<p>Note</p><img src="${src}" alt="scan">`;

  it('keeps stripping images without the opt-in (regression)', () => {
    expect(sanitizeNarrativeHtml(img('https://cdn.example/scan.png'))).toBe(
      '<p>Note</p>'
    );
    expect(sanitizeNarrativeHtml(img('https://cdn.example/scan.png'), {})).toBe(
      '<p>Note</p>'
    );
  });

  it('keeps https and same-origin images, with src and alt only', () => {
    expect(
      sanitizeNarrativeHtml(
        '<p>Note</p><img src="https://cdn.example/scan.png" alt="scan" width="8" onerror="x()">',
        { media: true }
      )
    ).toBe('<p>Note</p><img src="https://cdn.example/scan.png" alt="scan">');
    expect(
      sanitizeNarrativeHtml(img('/uploads/scan.png'), { media: true })
    ).toBe('<p>Note</p><img src="/uploads/scan.png" alt="scan">');
    // Object URLs carry their creator's origin: same-origin blobs pass the
    // check (session-scoped; durable storage is the uploadHandler's job).
    const blob = `blob:${window.location.origin}/0f1e2d3c`;
    expect(sanitizeNarrativeHtml(img(blob), { media: true })).toBe(
      `<p>Note</p><img src="${blob}" alt="scan">`
    );
  });

  it.each([
    ['data URI', 'data:image/png;base64,iVBORw0KGgo='],
    ['cross-origin blob URL', 'blob:https://evil.example/1-2-3'],
    ['cross-origin http', 'http://evil.example/x.png'],
    ['javascript URL', 'javascript:alert(1)'],
  ])('strips %s images', (_name, src) => {
    expect(sanitizeNarrativeHtml(img(src), { media: true })).toBe(
      '<p>Note</p>'
    );
  });

  it('images never contribute narrative text, so the forgery gate holds', () => {
    const html = sanitizeNarrativeHtml(img('https://cdn.example/scan.png'), {
      media: true,
    });
    expect(narrativeText(html)).toBe('Note');
  });
});

describe('EsheetNarrativeField media capture opt-in (mieweb/ui#736)', () => {
  const uploadHandler = async () => 'https://cdn.example/uploaded.png';
  const imgEdit = {
    target: {
      innerHTML:
        '<p>Wound photo:</p><img src="https://cdn.example/scan.png" alt="scan">',
    },
  };

  it('publishes image URLs when opted in with an uploadHandler', () => {
    const onResponse = vi.fn();
    renderWithTheme(
      <EsheetNarrativeField
        {...props({ onResponse })}
        mediaCapture
        mediaUpload={{ uploadHandler }}
      />
    );
    expect(screen.getByTestId('capture-ribbon-stub')).toBeInTheDocument();
    fireEvent.input(screen.getByRole('textbox', { name: 'Summary' }), imgEdit);
    expect(onResponse).toHaveBeenLastCalledWith(
      expect.objectContaining({
        answer: 'Wound photo:',
        attributes: expect.objectContaining({
          narrativeHtml:
            '<p>Wound photo:</p><img src="https://cdn.example/scan.png" alt="scan">',
        }),
      })
    );
  });

  it('ignores the opt-in without an uploadHandler (base64 is impossible)', () => {
    const onResponse = vi.fn();
    renderWithTheme(
      <EsheetNarrativeField {...props({ onResponse })} mediaCapture />
    );
    expect(screen.queryByTestId('capture-ribbon-stub')).toBeNull();
    fireEvent.input(screen.getByRole('textbox', { name: 'Summary' }), imgEdit);
    expect(onResponse).toHaveBeenLastCalledWith(
      expect.objectContaining({
        answer: 'Wound photo:',
        attributes: expect.objectContaining({
          narrativeHtml: '<p>Wound photo:</p>',
        }),
      })
    );
  });

  it('restores stored image markup when the forgery gate passes', () => {
    const { container } = renderWithTheme(
      <EsheetNarrativeField
        {...props({
          response: {
            answer: 'Wound photo:',
            attributes: {
              narrativeText: 'Wound photo:',
              narrativeHtml:
                '<p>Wound photo:</p><img src="https://cdn.example/scan.png" alt="scan">',
            },
          } as unknown as FieldResponse,
        })}
        mediaCapture
        mediaUpload={{ uploadHandler }}
      />
    );
    expect(
      container.querySelector('img[src="https://cdn.example/scan.png"]')
    ).toBeInTheDocument();
  });

  it('keeps an image-only narrative when a common finding is picked', () => {
    // Images never contribute to the answer, so an image-only narrative has
    // an empty answer — the finding must append to the image, not replace it.
    let latest: FieldResponse | undefined;
    function Harness() {
      const [response, setResponse] = React.useState<FieldResponse>({
        answer: '',
        attributes: {
          narrativeText: '',
          narrativeHtml: '<img src="https://cdn.example/scan.png" alt="scan">',
        },
      } as unknown as FieldResponse);
      latest = response;
      return (
        <EsheetNarrativeField
          {...props()}
          response={response}
          onResponse={setResponse}
          mediaCapture
          mediaUpload={{ uploadHandler }}
        />
      );
    }
    renderWithTheme(<Harness />);
    fireEvent.focus(screen.getByRole('textbox'));
    fireEvent.click(screen.getByRole('button', { name: /No fever/ }));
    expect(latest?.answer).toBe('No fever reported.');
    expect(latest?.attributes?.narrativeHtml).toBe(
      '<img src="https://cdn.example/scan.png" alt="scan"><p>No fever reported.</p>'
    );
  });

  it('disables video uploads: the sanitizer would strip them after upload', () => {
    renderWithTheme(
      <EsheetNarrativeField
        {...props()}
        mediaCapture
        mediaUpload={{ uploadHandler, allowedVideoTypes: ['^video/'] }}
      />
    );
    expect(screen.getByTestId('capture-ribbon-stub')).toHaveAttribute(
      'data-videos-disabled',
      'true'
    );
  });

  it('keeps the capture dock mounted while read-only (no editor remount)', () => {
    renderWithTheme(
      <EsheetNarrativeField
        {...props({ isReadOnly: true })}
        mediaCapture
        mediaUpload={{ uploadHandler }}
      />
    );
    // The surface locks the dock itself; unmounting it would remount the
    // editor (losing undo history) on every save lock/unlock.
    expect(screen.getByTestId('capture-ribbon-stub')).toBeInTheDocument();
  });
});
