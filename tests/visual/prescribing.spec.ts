import { test, expect, type Page } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

async function openStory(page: Page, story: string, globals = '') {
  const search = new URLSearchParams({ id: story, viewMode: 'story' });
  if (globals) search.set('globals', globals);
  await page.goto(`/iframe.html?${search}`);
  await expect(page.locator('#storybook-root')).not.toBeEmpty();
  await expect(page.locator('.sb-errordisplay')).not.toBeVisible();
}

async function checkAccessibility(page: Page, context = '#storybook-root') {
  // Check settled colors after controls transition from disabled to enabled.
  await expect
    .poll(() =>
      page
        .locator('button:enabled')
        .evaluateAll((buttons) =>
          buttons.every(
            (button) => Number(getComputedStyle(button).opacity) === 1
          )
        )
    )
    .toBeTruthy();
  await injectAxe(page);
  await checkA11y(page, context, {
    detailedReport: true,
    detailedReportOptions: { html: true },
    axeOptions: { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa'] },
  });
}

test.describe('Prescription completion', () => {
  for (const viewport of [
    { width: 1280, height: 800 },
    { width: 390, height: 844 },
  ]) {
    test(`floating alerts stay compact while field alerts follow scrolling at ${viewport.width}px`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await openStory(
        page,
        'encounter-orders-prescribing-simulation--interactive',
        viewport.width < 600
          ? 'direction:rtl;theme:dark;brand:enterprise-health'
          : ''
      );
      const panel = page.locator(
        '[data-slot="prescription-issue-summary"][data-presentation="floating"]'
      );
      const expand = panel.getByRole('button', {
        name: /^Expand prescription issues:/,
      });
      await expect(expand).toHaveAttribute('aria-expanded', 'false');
      const assertCompact = async () => {
        await expect
          .poll(() =>
            panel.evaluate(
              (element) =>
                element.getBoundingClientRect().height <=
                window.innerHeight * 0.2 + 1
            )
          )
          .toBeTruthy();
      };
      await assertCompact();
      const initial = await panel.boundingBox();
      expect(initial!.x).toBeGreaterThanOrEqual(0);
      expect(initial!.x + initial!.width).toBeLessThanOrEqual(viewport.width);
      await checkAccessibility(page);
      await page
        .getByRole('heading', {
          name: 'Review, simulated signing and transmission',
        })
        .scrollIntoViewIfNeeded();
      const scrolled = await panel.boundingBox();
      expect(Math.abs(scrolled!.y - initial!.y)).toBeLessThanOrEqual(1);
      await expand.focus();
      await page.keyboard.press('Enter');
      await assertCompact();
      await expect(
        panel.getByRole('button', { name: /^Collapse prescription issues:/ })
      ).toHaveAttribute('aria-expanded', 'true');
      await panel
        .getByRole('button', {
          name: 'Resolve issue: Drug product is required to complete the prescription.',
          exact: true,
        })
        .click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      await expect(panel).toHaveCount(1);
      await expect(panel).toHaveAttribute('data-placement', 'container');
      await assertCompact();
      const lookup = dialog.getByRole('textbox', {
        name: 'Medication',
        exact: true,
      });
      await expect(lookup).toBeFocused();
      await expect(lookup).toHaveAttribute('aria-invalid', 'true');
      const lookupDescription = await lookup.getAttribute('aria-describedby');
      await expect(page.locator(`[id="${lookupDescription}"]`)).toContainText(
        'Drug product is required'
      );
      const quantity = dialog.getByRole('textbox', {
        name: 'Quantity',
        exact: true,
      });
      await quantity.fill('-1');
      await expect(quantity).toHaveAttribute('aria-invalid', 'true');
      const description = await quantity.getAttribute('aria-describedby');
      await expect(page.locator(`[id="${description}"]`)).toBeVisible();
      await expect(page.locator(`[id="${description}"]`)).toContainText(
        /greater than zero|positive/i
      );
      await expect(
        panel.getByRole('button', { name: /^Expand prescription issues:/ })
      ).toBeVisible();
      await expect(
        dialog.getByRole('button', { name: 'Save draft', exact: true })
      ).toBeVisible();
      await checkAccessibility(page, '[role="dialog"]');
      await panel
        .getByRole('button', { name: /^Expand prescription issues:/ })
        .click();
      await assertCompact();
      await panel
        .getByRole('button', { name: /^Collapse prescription issues:/ })
        .click();
      await expect(
        panel.getByRole('button', { name: /^Expand prescription issues:/ })
      ).toHaveAttribute('aria-expanded', 'false');
    });
  }
  test('explicit prescription details survive save and reopen without claiming transmission', async ({
    page,
  }) => {
    await openStory(
      page,
      'encounter-orders-prescriptionreadiness--interactive'
    );
    await page
      .locator('summary')
      .filter({ hasText: 'Needs prescription details' })
      .click();
    await page
      .getByRole('button', {
        name: 'Complete prescription: Lasix',
        exact: true,
      })
      .click();
    const dialog = page.getByRole('dialog');
    await dialog
      .getByRole('button', {
        name: 'Select SimDrug A 5 mg tablet',
        exact: true,
      })
      .click();
    const fields = {
      'Product strength': '5 mg',
      'Dose form': 'tablet',
      'Dose per administration': '5',
      'Dose unit': 'mg',
      Route: 'oral',
      Frequency: 'Once daily',
      'Sig (patient directions)': 'Synthetic demonstration directions.',
      Quantity: '30',
      'Dispensing unit': 'tablet',
      Refills: '0',
    };
    for (const [label, value] of Object.entries(fields)) {
      await dialog
        .getByRole('textbox', { name: label, exact: true })
        .fill(value);
    }
    await expect(
      dialog.getByRole('textbox', { name: 'Medication', exact: true })
    ).toHaveValue('SimDrug A');
    await dialog
      .getByRole('button', { name: 'Save draft', exact: true })
      .click();
    await expect(dialog).not.toBeVisible();
    await expect(
      page.getByText('Details complete', { exact: true })
    ).toBeVisible();
    await expect(page.getByText('Ready to send', { exact: true })).toHaveCount(
      0
    );
    await page
      .getByRole('button', {
        name: 'Complete prescription: SimDrug A',
        exact: true,
      })
      .click();
    for (const [label, value] of Object.entries(fields)) {
      await expect(
        page
          .getByRole('dialog')
          .getByRole('textbox', { name: label, exact: true })
      ).toHaveValue(value);
    }
    await expect(
      page
        .getByRole('dialog')
        .getByRole('textbox', { name: 'Medication', exact: true })
    ).toHaveValue('SimDrug A');
    await expect(
      page
        .getByRole('dialog')
        .getByRole('radio', { name: 'Substitution permitted', exact: true })
    ).toBeChecked();
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Cancel', exact: true })
      .click();
    await expect(
      page.getByRole('button', {
        name: 'Complete prescription: SimDrug A',
        exact: true,
      })
    ).toBeFocused();
  });

  test('a draft warning remains visible and can be completed with the keyboard', async ({
    page,
  }) => {
    await openStory(
      page,
      'encounter-orders-prescriptionreadiness--interactive'
    );
    const disclosure = page.locator('summary').filter({
      hasText: 'Needs prescription details',
    });
    await expect(disclosure).toBeVisible();
    await disclosure.focus();
    await page.keyboard.press('Enter');
    const complete = page.getByRole('button', {
      name: 'Complete prescription: Lasix',
      exact: true,
    });
    await expect(complete).toBeVisible();
    await complete.focus();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByRole('textbox', { name: 'Medication', exact: true })
    ).toBeFocused();
    await checkAccessibility(page, '[role="dialog"]');
    await dialog
      .getByRole('textbox', { name: 'Medication', exact: true })
      .evaluate((input) => {
        input.scrollIntoView({ block: 'center', behavior: 'instant' });
      });
    await expect(dialog).toHaveScreenshot('prescription-completion-editor.png');

    await dialog.getByLabel('Quantity', { exact: true }).fill('-1');
    await expect(
      dialog.getByRole('button', { name: 'Save draft' })
    ).toBeEnabled();
    await dialog.getByRole('button', { name: 'Save draft' }).click();
    await expect(dialog).not.toBeVisible();
    await expect(
      page.getByText('Prescription needs correction', { exact: true })
    ).toBeVisible();
    await expect(
      page.getByText(
        'Saved as draft. Prescription readiness has been refreshed.'
      )
    ).toBeVisible();

    await page
      .getByRole('button', {
        name: 'Complete prescription: Lasix',
        exact: true,
      })
      .click();
    await expect(
      page.getByRole('dialog').getByLabel('Quantity', { exact: true })
    ).toHaveValue('-1');
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Cancel', exact: true })
      .click();
    await expect(
      page.getByRole('button', {
        name: 'Complete prescription: Lasix',
        exact: true,
      })
    ).toBeFocused();
  });

  test('read-only users see actionable reasons without mutation controls', async ({
    page,
  }) => {
    await openStory(page, 'encounter-orders-prescriptionreadiness--read-only');
    await expect(
      page.getByText('Needs prescription details', { exact: true })
    ).toBeVisible();
    await expect(
      page.getByText(
        'An authorized team member can complete this prescription.'
      )
    ).toBeVisible();
    await expect(
      page.locator('#storybook-root').getByRole('button')
    ).toHaveCount(0);
    await checkAccessibility(page);
    await expect(page).toHaveScreenshot('prescription-read-only.png');
  });

  test('complete fields do not claim signing or transmission', async ({
    page,
  }) => {
    await openStory(
      page,
      'encounter-orders-prescriptionreadiness--details-complete'
    );
    await expect(
      page.getByText('Details complete', { exact: true })
    ).toBeVisible();
    await expect(page.getByText('Ready to send', { exact: true })).toHaveCount(
      0
    );
    await expect(page.getByText('Sent', { exact: true })).toHaveCount(0);
    await checkAccessibility(page);
  });

  test('a dark brand retains readable status and reasons', async ({ page }) => {
    await openStory(
      page,
      'encounter-orders-prescriptionreadiness--bare-lasix',
      'theme:dark;brand:mieweb'
    );
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(
      page.getByText('Needs prescription details', { exact: true })
    ).toBeVisible();
    await checkAccessibility(page);
    await expect(page).toHaveScreenshot('prescription-draft-dark.png');
  });

  test('mobile RTL preserves the warning and fits the viewport', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openStory(
      page,
      'encounter-orders-prescriptionreadiness--bare-lasix',
      'direction:rtl;locale:ar;brand:enterprise-health'
    );
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(
      page.getByText('Needs prescription details', { exact: true })
    ).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth
    );
    expect(overflow).toBeLessThanOrEqual(1);
    await checkAccessibility(page);
    await expect(page).toHaveScreenshot('prescription-draft-mobile-rtl.png');
  });
});

async function evaluateSimulation(page: Page, story = 'complete-demo') {
  await openStory(page, `encounter-orders-prescribing-simulation--${story}`);
  await page.getByRole('button', { name: 'Save draft', exact: true }).click();
  await page
    .getByRole('button', { name: 'Check readiness', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: /^interactions: / })
  ).not.toContainText('pending');
  await expect(
    page.getByRole('heading', { name: /^benefit: / })
  ).not.toContainText('pending');
}

async function reviewAndSignSimulation(page: Page) {
  await page
    .getByRole('checkbox', {
      name: 'I reviewed this prescription and select it as ready to sign',
    })
    .check();
  await page
    .getByRole('button', {
      name: 'Review and select ready to sign',
      exact: true,
    })
    .click();
  await page
    .getByRole('button', { name: 'Simulate signing', exact: true })
    .click();
  await expect(
    page.getByText('Simulated signing: completed', { exact: true })
  ).toBeVisible();
}

test.describe('Fake EHR prescribing workflow', () => {
  test('unsaved visible edits suppress eligibility from the previous saved prescription', async ({
    page,
  }) => {
    await evaluateSimulation(page);
    await page
      .getByRole('checkbox', {
        name: 'I reviewed this prescription and select it as ready to sign',
      })
      .check();
    await page
      .getByRole('button', {
        name: 'Review and select ready to sign',
        exact: true,
      })
      .click();
    await expect(
      page.getByRole('button', { name: 'Simulate signing', exact: true })
    ).toBeEnabled();
    await page
      .getByRole('textbox', { name: 'Medication name', exact: true })
      .fill('Pending free text draft');
    await expect(
      page.getByRole('button', { name: 'Check readiness', exact: true })
    ).toBeDisabled();
    await expect(
      page.getByRole('checkbox', {
        name: 'I reviewed this prescription and select it as ready to sign',
      })
    ).toBeDisabled();
    await expect(
      page.getByRole('button', { name: 'Simulate signing', exact: true })
    ).toBeDisabled();
    await expect(
      page.getByRole('button', { name: 'Simulate send', exact: true })
    ).toBeDisabled();
  });

  test('bare-name API draft can be completed through the catalog editor and reevaluated', async ({
    page,
  }) => {
    await evaluateSimulation(page, 'lasix-draft');
    await expect(
      page.getByRole('heading', { name: /^dosing: / })
    ).toContainText('partial');
    await page
      .getByRole('combobox', { name: 'Pharmacy', exact: true })
      .selectOption('sim-pharmacy-1');
    await page
      .getByRole('button', { name: 'Edit prescription', exact: true })
      .click();
    const dialog = page.getByRole('dialog');
    await dialog
      .getByRole('textbox', { name: 'Medication', exact: true })
      .fill('SimDrug');
    await dialog
      .getByRole('button', { name: 'Search synthetic catalog', exact: true })
      .click();
    await dialog
      .getByRole('button', {
        name: 'Select SimDrug A 5 mg tablet',
        exact: true,
      })
      .click();
    for (const [label, value] of Object.entries({
      'Dose per administration': '5',
      'Dose unit': 'mg',
      Route: 'oral',
      Frequency: 'daily',
      'Sig (patient directions)': 'Synthetic demonstration directions.',
      Quantity: '30',
      Refills: '0',
      Indication: 'Invented fixture indication',
    })) {
      await dialog
        .getByRole('textbox', { name: label, exact: true })
        .fill(value);
    }
    await dialog
      .getByRole('button', { name: 'Save draft', exact: true })
      .click();
    await expect(dialog).not.toBeVisible();
    await expect(page.getByText(/content revision 2/)).toBeVisible();
    await page
      .getByRole('button', { name: 'Check readiness', exact: true })
      .click();
    await expect(
      page.getByRole('checkbox', {
        name: 'I reviewed this prescription and select it as ready to sign',
      })
    ).toBeEnabled();
    await expect(
      page.getByRole('button', { name: 'Simulate send', exact: true })
    ).toBeDisabled();
  });

  test('an unavailable provider and a read-only session retain their separate restrictions', async ({
    page,
  }) => {
    await evaluateSimulation(page, 'provider-unavailable');
    await expect(
      page.getByRole('heading', { name: /^interactions: / })
    ).toContainText('unavailable');
    await expect(
      page.getByRole('checkbox', {
        name: 'I reviewed this prescription and select it as ready to sign',
      })
    ).toBeDisabled();
    await page
      .getByRole('combobox', { name: 'Scenario', exact: true })
      .selectOption('reset-readonly-permissions');
    await expect(
      page.getByRole('button', { name: 'Save draft', exact: true })
    ).toBeDisabled();
    await expect(
      page.getByRole('button', { name: 'Edit prescription', exact: true })
    ).toBeDisabled();
    await expect(
      page.getByRole('heading', { name: /^interactions: / })
    ).toHaveCount(0);
    await checkAccessibility(page);
  });

  test('simulation controls and results fit a mobile RTL dark view', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openStory(
      page,
      'encounter-orders-prescribing-simulation--complete-demo',
      'direction:rtl;theme:dark;brand:enterprise-health'
    );
    await page.getByRole('button', { name: 'Save draft', exact: true }).click();
    await page
      .getByRole('button', { name: 'Check readiness', exact: true })
      .click();
    await expect(
      page.getByRole('heading', { name: /^benefit: / })
    ).toContainText('complete');
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth
      )
    ).toBeLessThanOrEqual(1);
    await checkAccessibility(page);
  });

  test('typed HTTP workflow reaches simulated acknowledgement and resets without retained state', async ({
    page,
  }) => {
    await evaluateSimulation(page);
    for (const domain of [
      'interactions',
      'pregnancy',
      'dosing',
      'formulary',
      'benefit',
    ]) {
      await expect(
        page.getByRole('heading', { name: new RegExp(`^${domain}: `) })
      ).toContainText('complete · no-findings-within-coverage');
    }
    await expect(
      page.getByRole('button', { name: 'Simulate send', exact: true })
    ).toBeDisabled();
    await reviewAndSignSimulation(page);
    await page
      .getByRole('button', { name: 'Simulate send', exact: true })
      .click();
    await expect(
      page.getByText('Simulated transmission: acknowledged · 1 attempt(s)', {
        exact: true,
      })
    ).toBeVisible();
    await expect(
      page.getByText('Simulated destination acknowledgement; not dispensing', {
        exact: true,
      })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Simulate send', exact: true })
    ).toBeDisabled();
    await checkAccessibility(page);
    await page
      .getByRole('button', { name: 'Reset simulation', exact: true })
      .click();
    await expect(page.getByText(/Simulated transmission:/)).toHaveCount(0);
    await expect(page.getByText(/Simulated signing:/)).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: 'Check readiness', exact: true })
    ).toBeDisabled();
  });

  test('PDMP fetching requires a separate explicit review before signing', async ({
    page,
  }) => {
    await evaluateSimulation(page, 'pdmp-required');
    await page
      .getByRole('checkbox', {
        name: 'I reviewed this prescription and select it as ready to sign',
      })
      .check();
    await page
      .getByRole('button', {
        name: 'Review and select ready to sign',
        exact: true,
      })
      .click();
    await expect(
      page.getByRole('button', { name: 'Simulate signing', exact: true })
    ).toBeDisabled();
    await page
      .getByRole('button', { name: 'Query synthetic PDMP', exact: true })
      .click();
    await expect(
      page.getByText(/^PDMP: complete · identity matched/)
    ).toContainText('not reviewed');
    await expect(
      page.getByRole('button', { name: 'Simulate signing', exact: true })
    ).toBeDisabled();
    await page
      .getByRole('button', { name: 'Record PDMP review', exact: true })
      .click();
    await page
      .getByRole('button', { name: 'Simulate signing', exact: true })
      .click();
    await expect(
      page.getByText('Simulated signing: completed', { exact: true })
    ).toBeVisible();
    await checkAccessibility(page);
  });

  test('PA answers and approval clear only the configured transmission hold', async ({
    page,
  }) => {
    await evaluateSimulation(page, 'pa-approved');
    await reviewAndSignSimulation(page);
    await expect(
      page.getByRole('button', { name: 'Simulate send', exact: true })
    ).toBeDisabled();
    await page
      .getByRole('button', { name: 'Start synthetic PA', exact: true })
      .click();
    await expect(page.getByText(/^PA: questionnaire-needed/)).toBeVisible();
    await page
      .getByRole('textbox', {
        name: 'Synthetic indication for this request',
        exact: true,
      })
      .fill('Invented fixture indication');
    await page
      .getByRole('combobox', {
        name: 'Was the invented alternative tried?',
        exact: true,
      })
      .selectOption('false');
    await page
      .getByRole('button', { name: 'Save PA answers', exact: true })
      .click();
    await expect(page.getByText(/^PA: ready-to-submit/)).toBeVisible();
    await page
      .getByRole('button', { name: 'Submit synthetic PA', exact: true })
      .click();
    await expect(page.getByText(/^PA: approved/)).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Simulate send', exact: true })
    ).toBeEnabled();
    await checkAccessibility(page);
  });

  test('an interaction override retains the finding and cannot clear missing history', async ({
    page,
  }) => {
    await evaluateSimulation(page, 'interaction-history-missing');
    await expect(
      page.getByRole('heading', { name: /^interactions: / })
    ).toContainText('partial');
    await page
      .getByRole('button', { name: 'Override synthetic finding', exact: true })
      .click();
    await expect(
      page.getByText('Decision recorded; finding retained.', { exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole('checkbox', {
        name: 'I reviewed this prescription and select it as ready to sign',
      })
    ).toBeDisabled();
    await expect(
      page.getByRole('button', { name: 'Simulate send', exact: true })
    ).toBeDisabled();
  });

  test('a lost send response recovers one operation using the retained request key', async ({
    page,
  }) => {
    await evaluateSimulation(page, 'send-response-lost');
    await reviewAndSignSimulation(page);
    await page
      .getByRole('button', { name: 'Simulate send', exact: true })
      .click();
    await expect(page.getByRole('alert')).toContainText('response loss');
    await page
      .getByRole('button', { name: 'Recover send response', exact: true })
      .click();
    await expect(
      page.getByText('Simulated transmission: acknowledged · 1 attempt(s)', {
        exact: true,
      })
    ).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
  });

  test('unknown transmission reconciles the existing attempt without resending', async ({
    page,
  }) => {
    await evaluateSimulation(page, 'send-unknown-reconciliation');
    await reviewAndSignSimulation(page);
    await page
      .getByRole('button', { name: 'Simulate send', exact: true })
      .click();
    await expect(
      page.getByText('Simulated transmission: unknown-outcome · 1 attempt(s)', {
        exact: true,
      })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Retry known failed send', exact: true })
    ).toBeDisabled();
    await page
      .getByRole('button', { name: 'Reconcile unknown send', exact: true })
      .click();
    await expect(
      page.getByText('Simulated transmission: acknowledged · 1 attempt(s)', {
        exact: true,
      })
    ).toBeVisible();
  });
});
