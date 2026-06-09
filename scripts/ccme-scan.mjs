import { chromium } from '@playwright/test';

const browser = await chromium.launch();
const page = await browser.newPage();

const resp = await page.goto('http://localhost:6006/index.json');
const data = await resp.json();
const storyIds = Object.keys(data.entries).filter(k => data.entries[k].type === 'story');

const AXE = 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.0/axe.min.js';
const violations = [];

for (let i = 0; i < storyIds.length; i++) {
  const id = storyIds[i];
  try {
    await page.goto(`http://localhost:6006/iframe.html?id=${id}&viewMode=story&globals=brand:ccme`, { waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForTimeout(500);
    await page.addScriptTag({ url: AXE });
    await page.waitForFunction(() => typeof window.axe !== 'undefined');
    const results = await page.evaluate(async () => {
      return await window.axe.run(document.body, { runOnly: ['color-contrast'] });
    });
    if (results.violations.length > 0) {
      for (const v of results.violations) {
        for (const n of v.nodes) {
          violations.push({
            story: id,
            html: n.html.substring(0, 150),
            message: (n.any?.[0]?.message || '').substring(0, 250),
            target: n.target?.[0]
          });
        }
      }
    }
    if ((i + 1) % 100 === 0) process.stderr.write(`  ${i+1}/${storyIds.length}...\n`);
  } catch(e) {}
}

console.log(JSON.stringify(violations, null, 2));
process.stderr.write(`Total violations: ${violations.length} across ${storyIds.length} stories\n`);
await browser.close();
