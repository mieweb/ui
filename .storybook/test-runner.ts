import type { TestRunnerConfig } from '@storybook/test-runner';
import { getStoryContext } from '@storybook/test-runner';
import { injectAxe, checkA11y, configureAxe } from 'axe-playwright';

/**
 * Runs axe-core against every story after it renders (and after its play
 * function completes), failing CI on violations. Honors the same `a11y`
 * story/preview parameters as the addon-a11y panel:
 *
 * - `a11y: { disable: true }` or `a11y: { test: 'off' }` skips the story
 * - `a11y.config.rules` (e.g. the global rule exclusions in preview.tsx)
 *   are applied to the axe run
 */
const config: TestRunnerConfig = {
  async preVisit(page) {
    await injectAxe(page);
  },
  async postVisit(page, context) {
    const storyContext = await getStoryContext(page, context);
    const a11y = storyContext.parameters?.a11y;
    if (a11y?.disable || a11y?.test === 'off') return;

    await configureAxe(page, { rules: a11y?.config?.rules ?? [] });
    await checkA11y(page, '#storybook-root', {
      detailedReport: true,
      detailedReportOptions: { html: true },
      axeOptions: a11y?.options,
    });
  },
};

export default config;
