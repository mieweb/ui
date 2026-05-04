import { chromium } from '@playwright/test';

const stories = [
  'components-layout-structure-stepindicator--second-step',
  'components-forms-inputs-slider--default',
  'components-layout-structure-appheader--default',
  'components-messaging-messagebubble--full-thread',
  'components-forms-inputs-businesshourseditor--default',
  'components-text-data-display-timeline--default',
  'components-images-media-audioplayer--waveform',
  'components-navigation-tableofcontents--default',
  'product-feature-modules-ai-mcptoolcall--success',
  'components-forms-inputs-providerselector--default',
  'components-overlays-layering-rejectionmodal--reject-order',
  'product-feature-modules-onboardingwizard--default',
  'components-text-data-display-stripebadge--default',
  'product-feature-modules-dashboard--dashboard',
];

const browser = await chromium.launch();
const page = await browser.newPage();

// Inject axe-core once
await page.goto('http://localhost:6006/iframe.html?id=' + stories[0] + '&viewMode=story');
await page.addScriptTag({ url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.0/axe.min.js' });
await page.waitForTimeout(1000);

for (const id of stories) {
  await page.goto('http://localhost:6006/iframe.html?id=' + id + '&viewMode=story');
  await page.waitForTimeout(2000);
  await page.addScriptTag({ url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.0/axe.min.js' });
  await page.waitForTimeout(500);

  try {
    const results = await page.evaluate(() => window.axe.run());
    const rules = results.violations.map(
      (v) => v.id + ' (' + v.nodes.length + ')'
    );
    console.log(id + ': ' + (rules.length ? rules.join(', ') : 'CLEAN'));
  } catch (e) {
    console.log(id + ': ERROR - ' + e.message);
  }
}

await browser.close();
