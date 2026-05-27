import { chromium } from '@playwright/test';

const STORIES = [
  { name: 'BUILDER DEFAULT', id: 'components-forms-inputs-esheet-builder--default', root: '.ms-builder-root' },
  { name: 'BUILDER EMPTY FORM', id: 'components-forms-inputs-esheet-builder--empty-form', root: '.ms-builder-root' },
  { name: 'RENDERER DEFAULT', id: 'components-forms-inputs-esheet-renderer--default', root: '.esheet-renderer-root' },
  { name: 'RENDERER PRE-FILLED', id: 'components-forms-inputs-esheet-renderer--pre-filled', root: '.esheet-renderer-root' },
];

const BRANDS = ['bluehive', 'default', 'enterprise-health', 'waggleline', 'webchart', 'mieweb'];
const THEMES = ['light', 'dark'];

const AXE_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.0/axe.min.js';

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  let totalViolations = 0;

  for (const brand of BRANDS) {
    for (const theme of THEMES) {
      for (const story of STORIES) {
        const url = `http://localhost:6006/iframe.html?id=${story.id}&viewMode=story&globals=brand:${brand};theme:${theme}`;
        await page.goto(url, { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
        await page.addScriptTag({ url: AXE_CDN });
        await page.waitForFunction(() => typeof window.axe !== 'undefined');

        const results = await page.evaluate(async (selector) => {
          const el = document.querySelector(selector);
          return await window.axe.run(el || document.body);
        }, story.root);

        if (results.violations.length === 0) continue;
        totalViolations += results.violations.length;

        console.log(`\n${'='.repeat(60)}`);
        console.log(`=== ${story.name} | ${brand} / ${theme} === (${results.violations.length} violations)`);
        console.log(`${'='.repeat(60)}`);

        for (const v of results.violations) {
          console.log(`\n  ❌ [${v.impact?.toUpperCase()}] ${v.id}`);
          console.log(`     ${v.help}`);
          console.log(`     ${v.helpUrl}`);
          for (const n of v.nodes) {
            console.log(`     ─ Target: ${JSON.stringify(n.target)}`);
            console.log(`       HTML: ${n.html.substring(0, 250)}`);
            if (n.failureSummary) {
              console.log(`       ${n.failureSummary.replace(/\n/g, '\n       ')}`);
            }
          }
        }
      }
    }
  }

  if (totalViolations === 0) {
    console.log('\n✅ All stories pass across all brands and themes!');
  } else {
    console.log(`\n❌ Total violation types: ${totalViolations}`);
  }

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
