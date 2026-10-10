import { expect, test, type Locator, type Page } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

const story =
  '/iframe.html?id=encounter-orders-encountervisit--anonymous-visit&viewMode=story';

async function showView(page: Page) {
  await page.getByRole('tab', { name: 'View', exact: true }).click();
  const preview = page.getByRole('region', { name: 'Visit note preview' });
  await expect(preview).toBeVisible();
  await expect(preview).toHaveAttribute('aria-busy', 'false');
  return preview;
}

async function continueAfterHeading(page: Page, heading: Locator) {
  await expect(heading).toBeVisible({ timeout: 30000 });
  await heading.click();
  // Native caret movement settles before ProseMirror handles the next key.
  await page.keyboard.press(
    process.platform === 'darwin' ? 'Meta+ArrowRight' : 'End',
    { delay: 80 }
  );
  await page.keyboard.press('Enter', { delay: 80 });
}

test('encounter visit on desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(story);
  await expect(
    page.getByRole('textbox', { name: 'History of present illness' })
  ).toContainText(/back pain/);
  await expect(page).toHaveScreenshot('encounter-desktop.png');
  await page
    .getByRole('combobox', { name: 'Go to section' })
    .selectOption('vitals');
  await page.getByRole('button', { name: 'Add measurement set' }).click();
  await page.getByLabel('Systolic', { exact: true }).fill('142');
  await page.getByLabel('Diastolic', { exact: true }).fill('88');
  await page.getByLabel('Pulse', { exact: true }).fill('76');
  await expect(await showView(page)).toContainText('142/88');
});

test('encounter visit on a phone with repeated coordinated BP', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(story);
  await expect(
    page.getByRole('combobox', { name: 'Go to section' })
  ).toBeVisible();
  await expect(page).toHaveScreenshot('encounter-mobile.png');
  await page
    .getByRole('combobox', { name: 'Go to section' })
    .selectOption('vitals');
  await expect(
    page.getByRole('navigation', { name: 'Visit sections' })
  ).toHaveCSS('position', 'sticky');
  await expect(
    page.getByRole('combobox', { name: 'Go to section' })
  ).toBeInViewport();
  await page.getByRole('button', { name: 'Add measurement set' }).click();
  await page.getByLabel('Systolic', { exact: true }).fill('142');
  await page.getByLabel('Diastolic', { exact: true }).fill('88');
  await page.getByRole('button', { name: 'Add measurement set' }).click();
  await expect(page.getByLabel('Systolic', { exact: true })).toHaveCount(2);
  await page.getByLabel('Systolic', { exact: true }).nth(1).fill('138');
  await page.getByLabel('Diastolic', { exact: true }).nth(1).fill('86');
  await expect(
    page.getByLabel('Systolic', { exact: true }).first()
  ).toHaveValue('142');
  await page
    .getByRole('combobox', { name: 'Go to section' })
    .selectOption('vitals');
  await expect(page).toHaveScreenshot('encounter-mobile-vitals.png');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth
    )
  ).toBe(true);
  await page
    .getByRole('combobox', { name: 'Go to section' })
    .selectOption('assessment');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth
    )
  ).toBe(true);
  for (const [sectionId, fieldType] of [
    ['medications', 'medicationList'],
    ['allergies', 'allergyList'],
  ]) {
    await page
      .getByRole('combobox', { name: 'Go to section' })
      .selectOption(sectionId);
    const clinicalList = page.locator(
      `[data-field-type=${fieldType}] > [data-slot=card]`
    );
    await expect(clinicalList).toHaveCSS('border-top-width', '0px');
    await expect(clinicalList.locator('[data-slot=card-content]')).toHaveCSS(
      'padding-inline-start',
      '0px'
    );
    expect((await clinicalList.boundingBox())!.x).toBeLessThanOrEqual(12);
  }
});

test('MCP updates the same encounter form', async ({ page }) => {
  await page.goto(
    '/iframe.html?id=encounter-orders-encountervisit--mcp-interaction&viewMode=story'
  );
  await page.getByRole('button', { name: 'Record demo BP via MCP' }).click();
  await expect(page.getByLabel('Systolic', { exact: true })).toHaveValue('142');
  await expect(page.getByLabel('Diastolic', { exact: true })).toHaveValue('88');
  await expect(page.getByLabel('MCP result')).toContainText('"success": true');
});

test('phone RichEdit preserves authored headings and free prose across modes', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(story);
  await page.getByRole('tab', { name: 'RichEdit', exact: true }).click();
  const editor = page.getByRole('textbox', { name: 'Encounter narrative' });
  const title = editor.getByRole('heading', {
    name: 'Encounter visit',
    exact: true,
  });
  await continueAfterHeading(page, title);
  await page.keyboard.type('## Additional discussion', { delay: 10 });
  const heading = editor.getByRole('heading', {
    name: 'Additional discussion',
    level: 2,
    exact: true,
  });
  await expect(heading).toBeVisible();
  await continueAfterHeading(page, heading);
  const prose = 'Reviewed the supplied symptoms and discussed follow-up.';
  await page.keyboard.type(prose);
  await expect(editor).toContainText(prose);
  await expect(title).toBeVisible();
  await page
    .getByRole('tab', { name: 'RichEdit', exact: true })
    .scrollIntoViewIfNeeded();
  await expect(page).toHaveScreenshot('encounter-mobile-rich-edit.png');

  const preview = await showView(page);
  await expect(
    preview.getByRole('heading', {
      name: 'Additional discussion',
      level: 2,
      exact: true,
    })
  ).toBeVisible();
  await expect(preview).toContainText(prose);
  await expect(page).toHaveScreenshot('encounter-mobile-view.png');
  await page.getByRole('tab', { name: 'eSheet', exact: true }).click();
  await expect(
    page.getByRole('textbox', { name: 'History of present illness' })
  ).toContainText(
    '45-year-old male with pre-diabetes, back pain and hypertension.'
  );
  await expect(page.getByLabel('Systolic', { exact: true })).toHaveCount(0);
  await page.getByRole('tab', { name: 'RichEdit', exact: true }).click();
  await expect(heading).toBeVisible();
  await expect(editor).toContainText(prose);
  await expect(await showView(page)).toContainText(prose);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth
    )
  ).toBe(true);
});

test('a linked field resolves to the same eSheet BP data on a phone', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(story);
  await page.getByRole('tab', { name: 'RichEdit', exact: true }).click();
  const editor = page.getByRole('textbox', { name: 'Encounter narrative' });
  await continueAfterHeading(
    page,
    editor.getByRole('heading', { name: 'Encounter visit', exact: true })
  );
  const prose = 'Narrative context stays during vital edits.';
  await page.keyboard.type(prose);
  const linkedVitals = editor
    .getByText('Vitals:', { exact: true })
    .locator('..')
    .getByRole('button', { name: /^Linked field/ });
  await expect(linkedVitals).toBeVisible({ timeout: 30000 });
  await linkedVitals.press('Enter');
  const resolver = page.getByRole('dialog', { name: 'Vitals', exact: true });
  await expect(resolver).toBeVisible();
  const addMeasurement = resolver.getByRole('button', {
    name: 'Add measurement set',
  });
  await expect(addMeasurement).toBeFocused();
  await expect(
    page.getByRole('textbox', { name: 'History of present illness' })
  ).toBeHidden();
  await addMeasurement.click();
  await resolver.getByLabel('Systolic', { exact: true }).fill('142');
  await resolver.getByLabel('Diastolic', { exact: true }).fill('88');
  await resolver.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(resolver).toHaveCount(0);
  await expect(editor).toBeFocused();
  await expect(linkedVitals).toContainText('142/88');
  await expect(editor).toContainText(prose);
  const preview = await showView(page);
  await expect(preview).toContainText('142/88');
  await expect(preview).toContainText(prose);
  await page.getByRole('tab', { name: 'eSheet', exact: true }).click();
  await expect(page.getByLabel('Systolic', { exact: true })).toHaveValue('142');
  await expect(page.getByLabel('Diastolic', { exact: true })).toHaveValue('88');
  await page.getByRole('tab', { name: 'RichEdit', exact: true }).click();
  await expect(linkedVitals).toContainText('142/88');
  await expect(editor).toContainText(prose);
});

test('read-only visits keep the report and RichEdit from capturing changes', async ({
  page,
}) => {
  await page.goto(
    '/iframe.html?id=encounter-orders-encountervisit--read-only&viewMode=story'
  );
  const preview = await showView(page);
  await expect(preview).toContainText('back pain');
  await expect(preview.getByRole('textbox')).toHaveCount(0);
  await expect(preview.getByRole('button')).toHaveCount(0);
  await expect(preview.locator('[contenteditable=true]')).toHaveCount(0);
  await page.getByRole('tab', { name: 'RichEdit', exact: true }).click();
  const editor = page.getByRole('textbox', { name: 'Encounter narrative' });
  await expect(editor).toContainText('back pain', { timeout: 30000 });
  await expect(editor).toHaveAttribute('contenteditable', 'false');
  const original = await editor.innerText();
  const title = editor.getByRole('heading', {
    name: 'Encounter visit',
    exact: true,
  });
  await title.scrollIntoViewIfNeeded();
  const titleBounds = await title.boundingBox();
  expect(titleBounds).not.toBeNull();
  await page.mouse.click(
    titleBounds!.x + titleBounds!.width / 2,
    titleBounds!.y + titleBounds!.height / 2
  );
  await page.keyboard.type('Attempted document change');
  await expect(editor).not.toContainText('Attempted document change');
  expect(await editor.innerText()).toBe(original);
  await expect(
    editor.getByRole('button', { name: /^Linked field/ }).first()
  ).toHaveAttribute('aria-disabled', 'true');
  await page.getByRole('tab', { name: 'eSheet', exact: true }).click();
  await expect(
    page.getByRole('textbox', { name: 'History of present illness' })
  ).toContainText(
    '45-year-old male with pre-diabetes, back pain and hypertension.'
  );
  await expect(await showView(page)).not.toContainText(
    'Attempted document change'
  );
  await expect(page.getByRole('button', { name: 'Save visit' })).toBeDisabled();
});

test('the Templit report safely renders malformed and executable Markdown from MCP', async ({
  page,
}) => {
  await page.goto(
    '/iframe.html?id=encounter-orders-encountervisit--mcp-interaction&viewMode=story'
  );
  let dialogs = 0;
  page.on('dialog', async (dialog) => {
    dialogs += 1;
    await dialog.dismiss();
  });
  const body = [
    '# Safe report',
    'Supplied free prose remains readable.',
    '<script>alert("mdy-xss")</script>',
    '<img src=x onerror="alert(\'mdy-xss\')">',
    '<iframe srcdoc="<script>alert(\'frame-xss\')</script>"></iframe>',
    '[Unsafe reference](javascript:alert("mdy-xss"))',
    '[Safe reference](https://example.test/reference)',
    '**Unclosed formatting [and malformed markup',
  ].join('\n\n');
  await page.getByLabel('Document Markdown body').fill(body);
  await page
    .getByRole('button', { name: 'Replace document body via MCP' })
    .click();
  await expect(page.getByLabel('MCP result')).toContainText('"success": true');
  const preview = await showView(page);
  await expect(
    preview.getByRole('heading', { name: 'Safe report' })
  ).toBeVisible();
  await expect(preview).toContainText('Supplied free prose remains readable.');
  await expect(
    preview.locator('script, iframe, img[onerror], a[href^="javascript:"]')
  ).toHaveCount(0);
  const safeLink = preview.getByRole('link', { name: 'Safe reference' });
  await expect(safeLink).toHaveAttribute(
    'href',
    'https://example.test/reference'
  );
  await expect(safeLink).toHaveAttribute('rel', 'noopener noreferrer');
  expect(dialogs).toBe(0);
  await page.getByRole('tab', { name: 'eSheet', exact: true }).click();
  await expect(
    page.getByRole('textbox', { name: 'History of present illness' })
  ).toContainText('back pain');
});

test('encounter visit mirrors its section navigation in RTL', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`${story}&globals=direction:rtl`);
  const navigation = page.getByRole('navigation', { name: 'Visit sections' });
  await expect(navigation).toHaveCSS('direction', 'rtl');
  await expect(navigation).toHaveCSS('border-left-width', '0px');
  await expect(navigation).toHaveCSS('border-right-width', '0px');
  const selectBounds = await navigation.getByRole('combobox').boundingBox();
  const labelBounds = await navigation.locator('label').boundingBox();
  expect(selectBounds!.x + selectBounds!.width).toBeLessThan(labelBounds!.x);
  await expect(page.locator('.section-field-preview').first()).toHaveCSS(
    'border-top-width',
    '0px'
  );
  await expect(page).toHaveScreenshot('encounter-desktop-rtl.png');
});

test('encounter visit follows the dark Enterprise Health theme', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${story}&globals=theme:dark;brand:enterprise-health`);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(
    page.getByRole('textbox', { name: 'History of present illness' })
  ).toContainText(/back pain/);
  await expect(page).toHaveScreenshot('encounter-mobile-dark.png');
});

test('narratives use the phone width and grow with entered content', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(story);
  const narrative = page.getByRole('textbox', {
    name: 'History of present illness',
  });
  const original = await narrative.boundingBox();
  expect(original!.x).toBeLessThanOrEqual(12);
  expect(original!.width).toBeGreaterThanOrEqual(366);
  expect(original!.height).toBeLessThan(100);
  await expect(
    page.getByRole('button', { name: 'Bold', exact: true })
  ).toBeHidden();
  const paragraphs = Array.from(
    { length: 12 },
    (_, index) =>
      `Narrative paragraph ${index + 1}: 45-year-old male with pre-diabetes, back pain and hypertension.`
  ).join('\n\n');
  await narrative.fill(paragraphs);
  const expanded = await narrative.boundingBox();
  expect(expanded!.height).toBeGreaterThan(original!.height * 3);
  expect(
    await narrative.evaluate(
      (element) => element.scrollHeight <= element.clientHeight + 1
    )
  ).toBe(true);
  await expect(
    page.getByRole('button', { name: 'Bold', exact: true })
  ).toBeVisible();
  await narrative.fill('Back pain');
  expect((await narrative.boundingBox())!.height).toBeLessThan(100);
  await narrative.press('ControlOrMeta+A');
  await page.getByRole('button', { name: 'Bold', exact: true }).click();
  await expect(narrative.locator('b,strong')).toContainText('Back pain');
  await page
    .getByRole('heading', { name: 'Encounter visit', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Bold', exact: true })
  ).toBeHidden();
  await expect(page).toHaveScreenshot('encounter-mobile-edited.png');
});

for (const variant of [
  'anonymous-visit',
  'mobile',
  'narrative-exam',
  'read-only',
  'mcp-interaction',
  'rich-edit',
  'final-view',
]) {
  test(`encounter ${variant} has accessible report markup`, async ({
    page,
  }) => {
    await page.goto(
      `/iframe.html?id=encounter-orders-encountervisit--${variant}&viewMode=story`
    );
    if (variant === 'rich-edit') {
      await expect(
        page.getByRole('textbox', { name: 'Encounter narrative' })
      ).toContainText(/back pain/, { timeout: 30000 });
    } else if (variant === 'final-view') {
      const preview = page.getByRole('region', { name: 'Visit note preview' });
      await expect(preview).toHaveAttribute('aria-busy', 'false');
      await expect(preview).toContainText(/back pain/);
    } else {
      await expect(
        page.getByRole('textbox', { name: 'History of present illness' })
      ).toContainText(/back pain/);
    }
    await injectAxe(page);
    await checkA11y(page, '#storybook-root', {
      detailedReport: true,
      detailedReportOptions: { html: true },
    });
  });
}
