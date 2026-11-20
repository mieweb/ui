import { test, expect, type Locator, type Page } from '@playwright/test';
import { gotoStory, expectDocumentDirection } from './helpers';

/**
 * FileViewer and FileDocument: Markdown and code rendering, the View and Edit
 * states, and right-to-left behaviour. The RTL screenshot is paired with
 * computed-style and geometry assertions (CONTRIBUTING.md → "Testing in RTL");
 * FileDocument's toolbar mirroring is covered in rtl-matrix.spec.ts.
 */

const viewer = (page: Page) => page.locator('[data-slot="file-viewer"]');

const direction = (locator: Locator) =>
  locator.evaluate((el) => getComputedStyle(el).direction);

/** Gaps between `container`'s edges and its first run of text. */
const firstTextGaps = (container: Locator) =>
  container.evaluate((el) => {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const range = document.createRange();
    range.selectNodeContents(walker.nextNode()!);
    const text = range.getBoundingClientRect();
    const box = el.getBoundingClientRect();
    return { left: text.left - box.left, right: box.right - text.right };
  });

test.describe('FileViewer', () => {
  test('Markdown renders as a document', async ({ page }) => {
    await gotoStory(page, 'files-fileviewer--markdown');
    await expect(viewer(page).getByRole('table')).toBeVisible();
    await expect(viewer(page).locator('pre code.hljs')).toBeVisible();
    await expect(page).toHaveScreenshot('file-viewer-markdown.png', {
      animations: 'disabled',
    });
  });

  test('Code renders as one highlighted block', async ({ page }) => {
    await gotoStory(page, 'files-fileviewer--code');
    await expect(viewer(page)).toHaveAttribute('dir', 'ltr');
    await expect(
      viewer(page).locator('code.language-typescript [class*="hljs-"]').first()
    ).toBeVisible();
    await expect(page).toHaveScreenshot('file-viewer-code.png', {
      animations: 'disabled',
    });
  });

  test('Arabic Markdown keeps its fenced code left to right', async ({
    page,
  }) => {
    await gotoStory(page, 'files-fileviewer--right-to-left');
    await expectDocumentDirection(page, 'rtl');

    const view = viewer(page);
    const pre = view.locator('pre');
    expect(await direction(view)).toBe('rtl');
    expect(await direction(pre)).toBe('ltr');

    // Prose starts at the right edge; the code's first line at the left.
    const heading = await firstTextGaps(
      view.getByRole('heading', { level: 1 })
    );
    expect(heading.right).toBeLessThan(heading.left);
    const code = await firstTextGaps(pre);
    expect(code.left).toBeLessThan(code.right);

    await expect(page).toHaveScreenshot('file-viewer-rtl.png', {
      animations: 'disabled',
    });
  });
});

test.describe('FileDocument', () => {
  test('View state', async ({ page }) => {
    await gotoStory(page, 'files-filedocument--default');
    await expect(page.getByRole('button', { name: 'View' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    await expect(viewer(page)).toBeVisible();
    await expect(page).toHaveScreenshot('file-document-view.png', {
      animations: 'disabled',
    });
  });

  test('Edit state with unsaved changes', async ({ page }) => {
    await gotoStory(page, 'files-filedocument--default');
    await page.getByRole('button', { name: 'Edit' }).click();
    const editor = page.getByRole('textbox', {
      name: 'Contents of notes/plan.md',
    });
    await editor.press('ControlOrMeta+Home');
    await editor.pressSequentially('Draft: ');
    await expect(page.getByRole('status')).toHaveText('Unsaved changes');
    await expect(page.getByRole('button', { name: 'Save' })).toBeEnabled();
    await expect(page).toHaveScreenshot('file-document-edit.png', {
      animations: 'disabled',
    });
  });
});
