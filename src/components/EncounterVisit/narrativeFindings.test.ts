import { describe, expect, it, vi } from 'vitest';
import type { FieldResponse } from '@esheet/core';
import {
  applyEncounterNarrativeFinding,
  getEncounterNarrativeFindings,
  validEncounterNarrativeFindings,
} from './narrativeFindings';
import {
  encounterNarrativeText,
  sanitizeEncounterNarrativeHtml,
} from './EncounterNarrativeField';

const finding = {
  id: 'finding',
  label: 'Selected finding',
  text: 'Explicitly selected finding.',
  code: { system: 'https://example.test/findings', code: 'explicit' },
};

describe('narrative finding provenance without a DOM', () => {
  it('appends text and explicit selection provenance while retaining native metadata', () => {
    const answer = 'Original history.\nExplicitly selected finding.';
    let response: FieldResponse;
    vi.stubGlobal('document', undefined);
    try {
      expect(typeof document).toBe('undefined');
      response = applyEncounterNarrativeFinding(
        {
          answer: 'Original history.',
          _ai: true,
          attributes: {
            host: 'retain',
            encounterNarrativeText: 'Original history.',
            encounterNarrativeHtml: '<b>Original history.</b>',
          },
        },
        finding
      );
    } finally {
      vi.unstubAllGlobals();
    }
    expect(response).toEqual({
      answer,
      _ai: false,
      attributes: {
        host: 'retain',
        encounterNarrativeText: answer,
        encounterNarrativeHtml:
          '<b>Original history.</b><p>Explicitly selected finding.</p>',
        encounterNarrativeFindings: JSON.stringify([finding]),
        encounterNarrativeFindingsText: answer,
      },
    });
    expect(getEncounterNarrativeFindings(response)).toEqual([finding]);
  });

  it('preserves paragraphs, bold text and lists while keeping the browser text gate valid', () => {
    const previous = 'History.\n• First item.\n• Second item.';
    const html =
      '<p><b>History.</b></p><ul><li>First item.</li><li>Second item.</li></ul>';
    const response = applyEncounterNarrativeFinding(
      {
        answer: previous,
        attributes: {
          encounterNarrativeText: previous,
          encounterNarrativeHtml: html,
        },
      },
      finding
    );
    expect(response.attributes?.encounterNarrativeHtml).toBe(
      `${html}<p>${finding.text}</p>`
    );
    expect(response.attributes?.encounterNarrativeText).toBe(response.answer);
    expect(
      encounterNarrativeText(
        sanitizeEncounterNarrativeHtml(
          response.attributes!.encounterNarrativeHtml
        )
      )
    ).toBe(response.answer);
  });

  it('keeps rich formatting aligned with the plain answer when it ends in blank lines', () => {
    // `<b>History.</b><br><br>` derives the plain answer `History.\n`; the
    // plain append reuses that newline as the separator, so the rich append
    // must drop one trailing break or the browser text gate rejects the html.
    for (const [previous, html, aligned] of [
      ['History.\n', '<b>History.</b><br><br>', '<b>History.</b><br>'],
      ['History.\n', '<p>History.</p><p><br></p>', '<p>History.</p><p></p>'],
      ['History.', '<b>History.</b>', '<b>History.</b>'],
    ]) {
      const response = applyEncounterNarrativeFinding(
        {
          answer: previous,
          attributes: {
            encounterNarrativeText: previous,
            encounterNarrativeHtml: html,
          },
        },
        finding
      );
      expect(response.answer).toBe(
        `${previous}${previous.endsWith('\n') ? '' : '\n'}${finding.text}`
      );
      expect(response.attributes?.encounterNarrativeHtml).toBe(
        `${aligned}<p>${finding.text}</p>`
      );
      expect(
        encounterNarrativeText(
          sanitizeEncounterNarrativeHtml(
            response.attributes!.encounterNarrativeHtml
          )
        )
      ).toBe(response.answer);
    }
  });

  it('does not promote a stale old rich baseline or imported tags and attributes', () => {
    for (const attributes of [
      {
        encounterNarrativeText: 'Stale history.',
        encounterNarrativeHtml: '<b>Stale history.</b>',
      },
      {
        encounterNarrativeText: 'History.',
        encounterNarrativeHtml: '<b onclick="alert(1)">History.</b>',
      },
      {
        encounterNarrativeText: 'History.',
        encounterNarrativeHtml: '<script>alert(1)</script><b>History.</b>',
      },
      {
        encounterNarrativeText: 'History.',
        encounterNarrativeHtml: '<div style="position:fixed">History.</div>',
      },
    ]) {
      const response = applyEncounterNarrativeFinding(
        { answer: 'History.', attributes },
        finding
      );
      expect(response.attributes).toMatchObject(attributes);
      expect(response.attributes?.encounterNarrativeText).not.toBe(
        response.answer
      );
    }
  });

  it('keeps the existing browser derived-text check as the last gate for forged markup', () => {
    const response = applyEncounterNarrativeFinding(
      {
        answer: 'History.',
        attributes: {
          encounterNarrativeText: 'History.',
          encounterNarrativeHtml: '<b>Different imported text.</b>',
        },
      },
      finding
    );
    expect(
      encounterNarrativeText(
        sanitizeEncounterNarrativeHtml(
          response.attributes!.encounterNarrativeHtml
        )
      )
    ).not.toBe(response.answer);
  });

  it('escapes unsafe finding text before appending it to retained rich HTML', () => {
    const literal = {
      ...finding,
      text: '<script>alert("test")</script> & <b>finding</b>\nAnother line.',
    };
    const response = applyEncounterNarrativeFinding(
      {
        answer: 'History.',
        attributes: {
          encounterNarrativeText: 'History.',
          encounterNarrativeHtml: '<b>History.</b>',
        },
      },
      literal
    );
    expect(response.attributes?.encounterNarrativeHtml).toBe(
      '<b>History.</b><p>&lt;script&gt;alert(&quot;test&quot;)&lt;/script&gt; &amp; &lt;b&gt;finding&lt;/b&gt;<br>Another line.</p>'
    );
    expect(
      encounterNarrativeText(
        sanitizeEncounterNarrativeHtml(
          response.attributes!.encounterNarrativeHtml
        )
      )
    ).toBe(`History.\n${literal.text}`);
    expect(response.answer).toBe(`History.\n${literal.text}`);
  });

  it('retains a valid rich baseline when selecting an already present complete line', () => {
    const answer = `History.\n${finding.text}`;
    const attributes = {
      encounterNarrativeText: answer,
      encounterNarrativeHtml: `<p><b>History.</b></p><p>${finding.text}</p>`,
    };
    const response = applyEncounterNarrativeFinding(
      { answer, attributes },
      finding
    );
    expect(response.answer).toBe(answer);
    expect(response.attributes).toMatchObject(attributes);
    expect(applyEncounterNarrativeFinding(response, finding)).toBe(response);
  });

  it('returns the same response for an already selected finding', () => {
    const response = applyEncounterNarrativeFinding(undefined, finding);
    expect(applyEncounterNarrativeFinding(response, finding)).toBe(response);
    expect(response.answer).toBe(finding.text);
  });

  it('does not duplicate a complete existing line, including a multiline finding', () => {
    const multiline = { ...finding, text: 'First finding.\nSecond finding.' };
    const response = applyEncounterNarrativeFinding(
      { answer: 'History.\nFirst finding.\nSecond finding.\nMore history.' },
      multiline
    );
    expect(response.answer).toBe(
      'History.\nFirst finding.\nSecond finding.\nMore history.'
    );
    expect(getEncounterNarrativeFindings(response)).toEqual([multiline]);
  });

  it('retains existing line breaks and replaces an empty whitespace-only draft', () => {
    expect(
      applyEncounterNarrativeFinding({ answer: 'History.\n\n' }, finding).answer
    ).toBe(`History.\n\n${finding.text}`);
    expect(
      applyEncounterNarrativeFinding({ answer: '  \n' }, finding).answer
    ).toBe(finding.text);
  });

  it('does not infer a selection or code from free text matching a configured finding', () => {
    expect(getEncounterNarrativeFindings({ answer: finding.text })).toEqual([]);
    const selected = applyEncounterNarrativeFinding(undefined, finding);
    expect(
      getEncounterNarrativeFindings({ ...selected, answer: 'Changed history.' })
    ).toEqual([]);
    expect(
      getEncounterNarrativeFindings({
        ...selected,
        answer: 'Changed history.',
        attributes: {
          ...selected.attributes,
          encounterNarrativeFindingsText: 'Changed history.',
        },
      })
    ).toEqual([]);
  });

  it('tolerates malformed persisted selection JSON without capturing a finding', () => {
    for (const value of ['{invalid', 'null', '"finding"', '{"id":"finding"}']) {
      expect(
        getEncounterNarrativeFindings({
          answer: finding.text,
          attributes: {
            encounterNarrativeFindingsText: finding.text,
            encounterNarrativeFindings: value,
          },
        })
      ).toEqual([]);
    }
  });

  it('whitelists valid provenance and ignores malformed, blank and duplicate records', () => {
    expect(
      validEncounterNarrativeFindings([
        finding,
        { ...finding, label: 'Repeated ID' },
        { id: 'blank', label: 'Blank', text: '  ' },
        null,
        {
          id: 'other',
          label: 'Other',
          text: 'Other finding.',
          code: { system: '', code: 'incomplete' },
          imported: 'discard',
        },
      ])
    ).toEqual([
      finding,
      { id: 'other', label: 'Other', text: 'Other finding.' },
    ]);
    const response: FieldResponse = { answer: 'History.' };
    expect(
      applyEncounterNarrativeFinding(response, {
        id: 'bad',
        label: 'Bad',
        text: ' ',
      })
    ).toBe(response);
  });
});
