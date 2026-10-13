import DOMPurify from 'dompurify';
import type { EncounterMdyField } from './mdy';

const HEADINGS = 'h1,h2,h3,h4,h5,h6';
const MEDIA = 'img,video,audio';
const EMPTY_FIELD = 'data-encounter-empty-field';
const CAPTURED_HEADING = 'data-encounter-captured-heading';

function hasContent(node: Element | globalThis.DocumentFragment): boolean {
  return Boolean(node.textContent?.trim() || node.querySelector(MEDIA));
}

function promptText(text: string | null): string {
  return (text ?? '')
    .trim()
    .replace(/[:：]\s*$/, '')
    .trim();
}

function removeEmptyContainers(root: HTMLElement): void {
  const containers = root.querySelectorAll(
    'p,li,ul,ol,blockquote,div,table,dd,dt,dl'
  );
  Array.from(containers)
    .reverse()
    .forEach((node) => {
      if (!hasContent(node)) node.remove();
    });
}

/** Render-only cleanup: the MDY draft keeps its field prompts and headings. */
export function createEncounterReportHtml(
  html: string,
  fields: readonly EncounterMdyField[]
): string {
  const fieldIds = new Set(fields.map((field) => field.id));
  const emptyFields = new Map(
    fields.filter((field) => field.empty).map((field) => [field.id, field])
  );
  const document = new globalThis.DOMParser().parseFromString(
    html,
    'text/html'
  );
  document
    .querySelectorAll(`[${EMPTY_FIELD}],[${CAPTURED_HEADING}]`)
    .forEach((node) => {
      node.removeAttribute(EMPTY_FIELD);
      node.removeAttribute(CAPTURED_HEADING);
    });
  document.querySelectorAll<HTMLAnchorElement>('a').forEach((link) => {
    const href = link.getAttribute('href') ?? '';
    const id = href.startsWith('mdy:')
      ? href.slice(4)
      : href.startsWith('#')
        ? href.slice(1)
        : undefined;
    if (link.closest('pre,code')) return;
    if (id && emptyFields.has(id)) {
      // Keep a marker through sanitization so only known empty fields can
      // remove their labels. Unsafe markup must not keep a section alive.
      const marker = document.createElement('span');
      marker.setAttribute(EMPTY_FIELD, id);
      link.replaceWith(marker);
    } else if (href.startsWith('mdy:') || (id && fieldIds.has(id))) {
      if (id && fieldIds.has(id))
        link.closest(HEADINGS)?.setAttribute(CAPTURED_HEADING, '');
      link.replaceWith(...link.childNodes);
    } else {
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
    }
  });
  const sanitized = DOMPurify.sanitize(document.body.innerHTML, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: [
      'form',
      'input',
      'textarea',
      'select',
      'button',
      'iframe',
      'object',
      'embed',
      'style',
    ],
    ADD_ATTR: ['target', 'rel'],
  });
  const report = new globalThis.DOMParser().parseFromString(
    sanitized,
    'text/html'
  );
  const touchedTables = new Set<HTMLTableElement>();
  report.querySelectorAll(`[${EMPTY_FIELD}]`).forEach((marker) => {
    const field = emptyFields.get(marker.getAttribute(EMPTY_FIELD) ?? '');
    if (!field) return;
    const row = marker.closest('li,p,tr,dd,dt');
    const table = marker.closest('table');
    if (table) touchedTables.add(table);
    if (row) {
      const labels = new Set<string>();
      row.querySelectorAll(`[${EMPTY_FIELD}]`).forEach((node) => {
        const linked = emptyFields.get(node.getAttribute(EMPTY_FIELD) ?? '');
        if (linked) labels.add(promptText(linked.label));
      });
      const remaining = row.cloneNode(true) as Element;
      remaining.querySelectorAll(`[${EMPTY_FIELD}]`).forEach((node) => {
        if (emptyFields.has(node.getAttribute(EMPTY_FIELD) ?? ''))
          node.remove();
      });
      remaining.querySelectorAll('strong,b').forEach((label) => {
        if (labels.has(promptText(label.textContent))) label.remove();
      });
      // Delete a label-only prompt row; text in a populated authored row stays.
      if (
        (labels.has(promptText(remaining.textContent)) ||
          /^[\s:：;,|]*$/.test(remaining.textContent ?? '')) &&
        !remaining.querySelector(MEDIA)
      ) {
        if (row.tagName === 'TR' && table?.querySelector('[rowspan]')) {
          // A spanning cell depends on the number of rows beneath it. Keep
          // this prompt row's cells so its removal cannot regroup later data.
          Array.from(row.children).forEach((cell) => cell.replaceChildren());
        } else row.remove();
      }
    }
    marker.remove();
  });
  removeEmptyContainers(report.body);
  touchedTables.forEach((table) => {
    if (!Array.from(table.querySelectorAll('td')).some(hasContent))
      table.remove();
  });

  // Work upward: a parent survives whenever a child has report content.
  const headings = Array.from(report.body.querySelectorAll(HEADINGS));
  for (let index = headings.length - 1; index >= 0; index -= 1) {
    const heading = headings[index];
    if (!report.body.contains(heading)) continue;
    if (heading.hasAttribute(CAPTURED_HEADING)) continue;
    if (!hasContent(heading)) {
      heading.remove();
      continue;
    }
    const level = Number(heading.tagName.slice(1));
    const next = headings
      .slice(index + 1)
      .find(
        (candidate) =>
          report.body.contains(candidate) &&
          Number(candidate.tagName.slice(1)) <= level
      );
    const range = report.createRange();
    range.setStartAfter(heading);
    if (next) range.setEndBefore(next);
    else range.setEnd(report.body, report.body.childNodes.length);
    const contents = range.cloneContents();
    contents.querySelectorAll(HEADINGS).forEach((node) => {
      if (node.hasAttribute(CAPTURED_HEADING))
        node.replaceWith(...node.childNodes);
      else node.remove();
    });
    if (!hasContent(contents)) {
      range.deleteContents();
      heading.remove();
    }
  }
  report
    .querySelectorAll(`[${CAPTURED_HEADING}]`)
    .forEach((node) => node.removeAttribute(CAPTURED_HEADING));
  removeEmptyContainers(report.body);
  return report.body.innerHTML;
}
