const path = require('path');
const { chromium } = require(path.join(__dirname, '../node_modules/.pnpm/playwright@1.58.2/node_modules/playwright'));
const fs = require('fs');
const axeSource = fs.readFileSync(path.join(__dirname, '../node_modules/.pnpm/axe-core@4.11.3/node_modules/axe-core/axe.min.js'), 'utf8');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Stories with color-contrast violations from previous scan
  const stories = [
    'components-forms-inputs-providerselector--default',
    'components-layout-structure-card--complex-card',
    'components-navigation-tableofcontents--default',
    'components-text-data-display-patientheader--default',
    'foundations-text--all-variants',
    'product-feature-modules-ai-mcptoolcall--success',
    'product-feature-modules-ai-ozwellwidget--default',
    'product-provider-ordercard--active',
    'components-forms-inputs-dropzoneoverlay--disabled',
    'components-layout-structure-sitefooter--newsletter-demo',
    'product-feature-modules-employeeprofile-card--expanded',
    'product-feature-modules-orderlookupform--not-found',
    'product-provider-employerpricingcard--full-featured',
    'components-forms-inputs-claimproviderform--with-error',
    'components-text-data-display-stripebadge--dark-mode-showcase',
  ];
  
  // Collect all unique failing CSS patterns
  const patterns = {};
  
  for (const story of stories) {
    await page.goto('http://localhost:6006/iframe.html?id=' + story + '&viewMode=story');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await page.evaluate(axeSource);
    const results = await page.evaluate(() => {
      return window.axe.run(document.body, { runOnly: ['color-contrast'] });
    });
    for (const v of results.violations) {
      for (const node of v.nodes) {
        const target = node.target[0];
        const fg = node.any[0]?.data?.fgColor || 'unknown';
        const bg = node.any[0]?.data?.bgColor || 'unknown';
        const ratio = node.any[0]?.data?.contrastRatio || '?';
        const text = node.any[0]?.data?.nodeInfo || node.html?.substring(0, 80) || '';
        const key = `${fg} on ${bg} (${ratio})`;
        if (!patterns[key]) patterns[key] = { count: 0, examples: [] };
        patterns[key].count++;
        if (patterns[key].examples.length < 2) {
          patterns[key].examples.push({ story: story.split('--')[0].split('-').pop(), target, text: text.substring(0, 60) });
        }
      }
    }
  }
  
  console.log('\n=== COLOR CONTRAST PATTERNS ===\n');
  for (const [key, data] of Object.entries(patterns).sort((a,b) => b[1].count - a[1].count)) {
    console.log(`${key} — ${data.count} nodes`);
    for (const ex of data.examples) {
      console.log(`    ${ex.story}: ${ex.target}`);
      console.log(`    text: ${ex.text}`);
    }
  }
  await browser.close();
})();
