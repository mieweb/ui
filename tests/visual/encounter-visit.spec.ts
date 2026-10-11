import { expect, test, type Locator, type Page } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';
import { parse } from 'yaml';

const story =
  '/iframe.html?id=encounter-orders-encountervisit--anonymous-visit&viewMode=story';

const mcpStory =
  '/iframe.html?id=encounter-orders-encountervisit--mcp-interaction&viewMode=story';

interface VisitData {
  definition: { sections: { id: string }[] };
  responses: Record<
    string,
    { answer?: string; attributes?: Record<string, string> }
  >;
  mdy: string;
}

async function readVisit(page: Page): Promise<VisitData> {
  await page.getByRole('button', { name: 'Read visit', exact: true }).click();
  const result = JSON.parse(await page.getByLabel('MCP result').innerText());
  expect(result.structuredContent.success).toBe(true);
  return result.structuredContent.data;
}

function nativeAnswer<T = Record<string, unknown>>(
  visit: VisitData,
  sectionId: string
): T {
  return JSON.parse(
    visit.responses[`encounter:${sectionId}:observation:value`].answer!
  );
}

async function readMdyData(
  page: Page
): Promise<{ response: VisitData['responses'] }> {
  await page.getByRole('button', { name: 'Read MDY', exact: true }).click();
  const result = JSON.parse(await page.getByLabel('MCP result').innerText());
  expect(result.structuredContent.success).toBe(true);
  const mdy = result.structuredContent.data.mdy as string;
  expect(mdy).toMatch(/^---\r?\n/);
  const opening = mdy.indexOf('\n') + 1;
  const closing = mdy.indexOf('\n---', opening);
  expect(closing).toBeGreaterThan(opening);
  return parse(mdy.slice(opening, closing));
}

async function showView(page: Page) {
  const tab = page.getByRole('tab', { name: 'View', exact: true });
  await tab.click();
  await expect(tab).toHaveAttribute('aria-selected', 'true');
  const preview = page.getByRole('region', { name: 'Visit note preview' });
  await expect(preview).toBeAttached();
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
    ['medications', 'encounterMedications'],
    ['allergies', 'encounterAllergies'],
  ]) {
    await page
      .getByRole('combobox', { name: 'Go to section' })
      .selectOption(sectionId);
    const clinicalList = page.locator(
      `[data-field-type=${fieldType}] [data-slot=card]`
    );
    await expect(clinicalList).toHaveCSS('border-top-width', '0px');
    await expect(clinicalList.locator('[data-slot=card-content]')).toHaveCSS(
      'padding-inline-start',
      '0px'
    );
    expect((await clinicalList.boundingBox())!.x).toBeLessThanOrEqual(12);
  }
});

test('coded healthcare capture survives mode changes, MCP edits and portable MDY', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(mcpStory);
  const navigation = page.getByRole('combobox', { name: 'Go to section' });
  await expect(navigation.locator('option')).toHaveCount(11);

  await navigation.selectOption('medications');
  const medications = page.locator('[data-field-type=encounterMedications]');
  await medications
    .locator('[data-slot=sample-clinical-catalog] input')
    .fill('lisinopril');
  await medications
    .getByRole('button', {
      name: 'Select lisinopril 10 mg tablet (FDB 244899)',
      exact: true,
    })
    .click();
  await expect(medications).toContainText('lisinopril 10 mg tablet');

  await navigation.selectOption('allergies');
  const allergies = page.locator('[data-field-type=encounterAllergies]');
  await allergies
    .getByRole('button', { name: 'Add allergy…', exact: true })
    .click();
  const allergyEditor = page.getByRole('dialog', {
    name: 'Add Allergy',
    exact: true,
  });
  await allergyEditor
    .getByRole('combobox', { name: 'Type', exact: true })
    .click();
  await page.getByRole('option', { name: 'Food', exact: true }).click();
  await allergyEditor
    .locator('[data-slot=sample-clinical-catalog] input')
    .fill('Peanut');
  await allergyEditor
    .getByRole('button', {
      name: 'Select Peanut substance (SNOMED US 762952008)',
      exact: true,
    })
    .click();
  await allergyEditor.getByLabel('Reaction', { exact: true }).fill('Hives');
  await allergyEditor
    .getByRole('button', { name: 'Save', exact: true })
    .click();
  await expect(allergies).toContainText('Peanut substance');

  await navigation.selectOption('conditions');
  const conditions = page.locator('[data-field-type=encounterConditions]');
  await conditions
    .getByRole('searchbox', { name: 'Add condition', exact: true })
    .fill('hypertension');
  await conditions
    .getByRole('button', {
      name: 'Select Essential hypertension (ICD10 I10)',
      exact: true,
    })
    .click();
  await expect(conditions).toContainText('I10');

  await navigation.selectOption('plan');
  const plan = page.locator('[data-field-type=encounterPlan]');
  const indicatedOrder = plan.getByRole('form', {
    name: 'Add order for Essential hypertension',
    exact: true,
  });
  await indicatedOrder
    .locator('[data-slot=sample-clinical-catalog] input')
    .fill('Hemoglobin');
  await indicatedOrder
    .getByRole('button', {
      name: 'Select Hemoglobin A1c (LOINC 4548-4)',
      exact: true,
    })
    .click();
  const generalOrder = plan.getByRole('form', {
    name: 'Add plan order',
    exact: true,
  });
  await generalOrder
    .locator('[data-slot=sample-clinical-catalog] input')
    .fill('hearing');
  await generalOrder
    .getByRole('button', {
      name: 'Select Pure tone hearing test, air (HCPCS 92551)',
      exact: true,
    })
    .click();
  const prose = 'Discussed the recorded plan with the patient.';
  await page
    .getByRole('textbox', { name: 'Plan narrative', exact: true })
    .fill(prose);

  const before = await readVisit(page);
  expect(nativeAnswer(before, 'medications')).toMatchObject({
    medications: [{ code: { system: 'FDB', code: '244899' } }],
  });
  expect(nativeAnswer(before, 'allergies')).toMatchObject({
    allergies: [
      { code: { system: 'SNOMED US', code: '762952008' }, reaction: 'Hives' },
    ],
  });
  expect(nativeAnswer(before, 'conditions')).toMatchObject({
    concerns: [
      { assertions: [{ coding: [{ system: 'ICD10', code: 'I10' }] }] },
    ],
  });
  const beforePlan = nativeAnswer<{
    orders: ({ orderId: string } & Record<string, unknown>)[];
  }>(before, 'plan');
  expect(beforePlan.orders).toMatchObject([
    { type: 'lab', code: { codetype: 'LOINC', fullcode: '4548-4' } },
    { type: 'procedure', code: { codetype: 'HCPCS', fullcode: '92551' } },
  ]);
  const nativeRecordIds = [
    ...nativeAnswer<{ medications: { id: string }[] }>(
      before,
      'medications'
    ).medications.map((medication) => medication.id),
    ...nativeAnswer<{ allergies: { id: string }[] }>(
      before,
      'allergies'
    ).allergies.map((allergy) => allergy.id),
    ...nativeAnswer<{ concerns: { concernId: string }[] }>(
      before,
      'conditions'
    ).concerns.map((concern) => concern.concernId),
    ...beforePlan.orders.map((order) => order.orderId),
  ];
  expect(nativeRecordIds).toHaveLength(5);
  for (const id of nativeRecordIds) expect(id).toEqual(expect.any(String));

  await page.getByRole('tab', { name: 'RichEdit', exact: true }).click();
  const editor = page.getByRole('textbox', { name: 'Encounter narrative' });
  for (const text of [
    'lisinopril 10 mg tablet',
    'Peanut substance',
    'Essential hypertension',
    'Hemoglobin A1c',
    'Pure tone hearing test, air',
    prose,
  ]) {
    await expect(editor).toContainText(text, { timeout: 30000 });
  }
  for (const id of nativeRecordIds) await expect(editor).not.toContainText(id);
  let preview = await showView(page);
  for (const text of [
    'lisinopril 10 mg tablet',
    'Peanut substance',
    'Essential hypertension',
    'Hemoglobin A1c',
    'Pure tone hearing test, air',
    prose,
  ]) {
    await expect(preview).toContainText(text);
  }
  await expect(preview).not.toContainText('—');
  for (const id of nativeRecordIds) await expect(preview).not.toContainText(id);
  await preview
    .getByRole('heading', { name: 'Plan', exact: true })
    .scrollIntoViewIfNeeded();
  await page.screenshot({
    path: test.info().outputPath('coded-visit-phone.png'),
  });
  await page.getByRole('tab', { name: 'eSheet', exact: true }).click();
  const afterModes = await readVisit(page);
  for (const [id, response] of Object.entries(before.responses)) {
    if (id.startsWith('encounter:'))
      expect(afterModes.responses[id]).toEqual(response);
  }

  const updatedPlan = {
    orders: beforePlan.orders.map((order, index) =>
      index === 0 ? { ...order, timing: 'in 3 months' } : order
    ),
  };
  await page
    .getByRole('combobox', { name: 'Coded section', exact: true })
    .selectOption('plan');
  await page
    .getByRole('textbox', { name: 'Coded section JSON', exact: true })
    .fill(JSON.stringify(updatedPlan));
  await page
    .getByRole('button', { name: 'Update coded section via MCP', exact: true })
    .click();
  await expect(page.getByLabel('MCP result')).toContainText('"success": true');
  preview = await showView(page);
  await expect(preview).toContainText('in 3 months');
  await expect(preview).toContainText(prose);
  for (const id of nativeRecordIds) await expect(preview).not.toContainText(id);
  const after = await readVisit(page);
  for (const sectionId of ['medications', 'allergies', 'conditions']) {
    expect(nativeAnswer(after, sectionId)).toEqual(
      nativeAnswer(before, sectionId)
    );
  }
  expect(nativeAnswer(after, 'plan')).toEqual(updatedPlan);
  const mdy = await readMdyData(page);
  expect(mdy.response).toMatchObject(
    Object.fromEntries(
      Object.entries(after.responses).filter(
        ([id]) => id !== '__encounter_document__'
      )
    )
  );
  expect(
    JSON.parse(mdy.response['encounter:plan:observation:value'].answer!)
  ).toEqual(updatedPlan);
  expect(mdy.response['encounter:plan:narrative'].answer).toBe(prose);
});

test('a selected common finding appends once and preserves authored narrative across modes and MDY', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(mcpStory);
  await page
    .getByRole('combobox', { name: 'Go to section' })
    .selectOption('hpi');
  const narrative = page.getByRole('textbox', {
    name: 'History of present illness',
    exact: true,
  });
  const authored =
    'Back pain is improving with rest. The patient describes stiffness on waking.';
  await narrative.fill(authored);
  const field = page
    .locator('[data-slot=encounter-narrative]')
    .filter({ has: narrative });
  await field.locator('summary').click();
  await page.screenshot({
    path: test.info().outputPath('common-findings-phone.png'),
  });
  await field
    .getByRole('button', { name: 'Add No fever', exact: true })
    .click();
  await expect(narrative).toContainText(authored);
  await expect(narrative).toContainText('Denies fever.');
  await expect(
    field.getByRole('button', { name: 'Added No fever', exact: true })
  ).toBeDisabled();
  expect((await narrative.innerText()).match(/Denies fever\./g)).toHaveLength(
    1
  );
  const before = await readVisit(page);
  const answer = before.responses['encounter:hpi:narrative'].answer;
  expect(answer).toContain(authored);
  expect(answer).toContain('Denies fever.');
  await page.getByRole('tab', { name: 'RichEdit', exact: true }).click();
  const editor = page.getByRole('textbox', { name: 'Encounter narrative' });
  await expect(editor).toContainText(authored, { timeout: 30000 });
  await expect(editor).toContainText('Denies fever.');
  const preview = await showView(page);
  await expect(preview).toContainText(authored);
  await expect(preview).toContainText('Denies fever.');
  const mdy = await readMdyData(page);
  expect(mdy.response['encounter:hpi:narrative'].answer).toBe(answer);
  await page.getByRole('tab', { name: 'eSheet', exact: true }).click();
  await expect(narrative).toContainText(authored);
  await expect(narrative).toContainText('Denies fever.');
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
  for (const name of ['Patient history', 'Review of systems', 'Vitals']) {
    await expect(
      editor.getByRole('heading', { name, exact: true })
    ).toBeVisible();
  }
  await expect(editor).toContainText('—');
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
  await expect(preview.getByRole('heading')).toHaveText([
    'Encounter visit',
    'Additional discussion',
    'History of present illness',
  ]);
  await expect(preview).not.toContainText('—');
  await expect(preview).not.toContainText('Medical history:');
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
  await expect(
    editor.getByRole('heading', { name: 'Patient history', exact: true })
  ).toBeVisible();
  await expect(editor).toContainText('—');
  await expect(await showView(page)).toContainText(prose);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth
    )
  ).toBe(true);
});

test('View omits uncaptured prompts and keeps a captured zero measurement', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(story);
  let preview = await showView(page);
  await expect(preview.getByRole('heading')).toHaveText([
    'Encounter visit',
    'History of present illness',
  ]);
  await expect(preview).toContainText('back pain');
  await expect(preview).not.toContainText('—');
  await expect(preview.getByRole('listitem')).toHaveCount(0);

  await page.getByRole('tab', { name: 'eSheet', exact: true }).click();
  const narrative = page.getByRole('textbox', {
    name: 'History of present illness',
  });
  await narrative.fill('');
  await expect(narrative).toHaveText('');
  preview = await showView(page);
  await expect(preview.getByRole('heading')).toHaveCount(0);
  await expect(preview.getByRole('listitem')).toHaveCount(0);
  await expect(preview).not.toContainText('back pain');
  await expect(preview).not.toContainText('—');

  await page.getByRole('tab', { name: 'eSheet', exact: true }).click();
  await page
    .getByRole('combobox', { name: 'Go to section' })
    .selectOption('vitals');
  await page.getByRole('button', { name: 'Add measurement set' }).click();
  preview = await showView(page);
  await expect(preview.getByRole('heading')).toHaveCount(0);
  await expect(preview.getByRole('listitem')).toHaveCount(0);
  await page.getByRole('tab', { name: 'eSheet', exact: true }).click();
  await page.getByLabel('Pain', { exact: true }).fill('0');
  preview = await showView(page);
  await expect(preview.getByRole('heading')).toHaveText([
    'Encounter visit',
    'Vitals',
  ]);
  await expect(preview).toContainText('Pain score: 0');
  await expect(preview).not.toContainText('—');
  await expect(preview).not.toContainText('History of present illness');
  await page.getByRole('tab', { name: 'eSheet', exact: true }).click();
  await expect(page.getByLabel('Pain', { exact: true })).toHaveValue('0');
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
