const path = require('path');
const { chromium } = require(path.join(__dirname, '../node_modules/.pnpm/playwright@1.58.2/node_modules/playwright'));
const fs = require('fs');
const axeSource = fs.readFileSync(path.join(__dirname, '../node_modules/.pnpm/axe-core@4.11.3/node_modules/axe-core/axe.min.js'), 'utf8');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const stories = [
    'components-forms-inputs-providerselector--default',
    'components-images-media-audioplayer--waveform',
    'components-layout-structure-appheader--with-title',
    'components-layout-structure-card--complex-card',
    'components-messaging-messagebubble--full-thread',
    'components-navigation-tableofcontents--default',
    'components-text-data-display-patientheader--default',
    'foundations-text--all-variants',
    'product-feature-modules-ai-mcptoolcall--success',
    'product-feature-modules-ai-ozwellwidget--default',
    'product-provider-ordercard--active',
    'product-provider-providercard--default',
    'product-provider-providersearchbar--all-variants',
    'components-forms-inputs-dropzoneoverlay--disabled',
    'components-layout-structure-sitefooter--newsletter-demo',
    'product-feature-modules-employeeprofile-card--expanded',
    'product-feature-modules-orderlookupform--not-found',
    'product-provider-employerpricingcard--full-featured',
    'components-forms-inputs-claimproviderform--with-error',
    'components-text-data-display-stripebadge--dark-mode-showcase',
  ];
  
  const violations = {};
  for (const story of stories) {
    await page.goto('http://localhost:6006/iframe.html?id=' + story + '&viewMode=story');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await page.evaluate(axeSource);
    const results = await page.evaluate(() => window.axe.run());
    for (const v of results.violations) {
      if (!violations[v.id]) violations[v.id] = { help: v.help, impact: v.impact, stories: [] };
      violations[v.id].stories.push(story);
    }
  }
  
  console.log('\n=== VIOLATION SUMMARY ===\n');
  for (const [id, data] of Object.entries(violations).sort((a,b) => b[1].stories.length - a[1].stories.length)) {
    console.log(`[${data.impact}] ${id} (${data.stories.length} stories): ${data.help}`);
    for (const s of data.stories) {
      console.log(`    - ${s}`);
    }
  }
  await browser.close();
})();
