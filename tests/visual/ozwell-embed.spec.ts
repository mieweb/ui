import { test, expect, type Page } from '@playwright/test';

/**
 * Functional (non-screenshot) checks for the Ozwell assistant embed that
 * lives in the Storybook manager shell (.storybook/manager-head.html).
 *
 * The live CDN endpoint is stubbed with route interception so these tests
 * are deterministic and never depend on ozwellapi.os.mieweb.org being up.
 * Catalog tools are exercised through the real `ozwell-tool-call` document
 * event contract, answered from the build's own static index.json.
 */

const OZWELL_HOST = 'https://ozwellapi.os.mieweb.org';

async function gotoManagerWithStubbedWidget(page: Page) {
  await page.route(`${OZWELL_HOST}/**`, (route) =>
    route.fulfill({
      contentType: 'application/javascript',
      body: '/* ozwell loader stubbed for tests */',
    })
  );
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
}

/** Dispatch an ozwell-tool-call and resolve with the handler's response. */
function callTool(page: Page, name: string, args: Record<string, unknown>) {
  return page.evaluate(
    ([toolName, toolArgs]) =>
      new Promise((resolve) => {
        document.dispatchEvent(
          new CustomEvent('ozwell-tool-call', {
            detail: { name: toolName, arguments: toolArgs, respond: resolve },
          })
        );
      }),
    [name, args] as const
  );
}

test.describe('Ozwell embed - manager shell', () => {
  test('declares OzwellChatConfig with the catalog tools and loads the widget', async ({
    page,
  }) => {
    await gotoManagerWithStubbedWidget(page);

    const config = await page.evaluate(() => {
      const cfg = (
        window as unknown as {
          OzwellChatConfig?: {
            apiKey?: string;
            tools?: { function: { name: string } }[];
          };
        }
      ).OzwellChatConfig;
      return {
        hasKey: Boolean(cfg?.apiKey),
        toolNames: (cfg?.tools ?? []).map((t) => t.function.name),
        widgetScript: Boolean(
          document.querySelector('script[src^="https://ozwellapi.os.mieweb.org/widget"]')
        ),
      };
    });

    expect(config.hasKey).toBe(true);
    expect(config.toolNames).toEqual([
      'list_components',
      'get_component_stories',
      'get_component_docs',
      'open_story',
    ]);
    expect(config.widgetScript).toBe(true);
  });

  test('answers catalog tool calls from the static index.json', async ({
    page,
  }) => {
    await gotoManagerWithStubbedWidget(page);

    const listed = (await callTool(page, 'list_components', {})) as {
      success: boolean;
      sections: Record<string, string[]>;
    };
    expect(listed.success).toBe(true);
    expect(Object.keys(listed.sections)).toContain('Inputs');

    const button = (await callTool(page, 'get_component_stories', {
      component: 'Button',
    })) as {
      success: boolean;
      component: string;
      storyCount: number;
      stories: { id: string; name: string }[];
    };
    expect(button.success).toBe(true);
    expect(button.component).toBe('Inputs/Actions/Button');
    expect(button.storyCount).toBe(button.stories.length);
    expect(button.stories.map((s) => s.name)).toContain('Danger');

    const unknown = (await callTool(page, 'bogus_tool', {})) as {
      isError: boolean;
    };
    expect(unknown.isError).toBe(true);
  });

  test('answers usage questions from the generated docs corpus', async ({
    page,
  }) => {
    await gotoManagerWithStubbedWidget(page);

    const docs = (await callTool(page, 'get_component_docs', {
      component: 'button',
    })) as {
      success: boolean;
      component: string;
      description: string;
      examples: string[];
      category: string;
      categoryGuidance: string;
      docsPageId: string;
    };
    expect(docs.success).toBe(true);
    expect(docs.component).toBe('Button');
    // Stories docs metadata (docs.description.component) is the primary
    // source; JSDoc supplies the code examples.
    expect(docs.description).toContain("What it's for");
    expect(docs.examples.length).toBeGreaterThan(0);
    expect(docs.examples[0]).toContain('<Button');
    expect(docs.category).toBe('Inputs/Actions');
    expect(docs.categoryGuidance).toContain('Which one?');
    expect(docs.docsPageId).toBe('actions-button--docs');

    // Story title → export mapping: the 'ReconciliationPanel' story
    // documents the `AIReconciliationPanel` export.
    const mapped = (await callTool(page, 'get_component_docs', {
      component: 'ReconciliationPanel',
    })) as { success: boolean; component: string; description: string };
    expect(mapped.success).toBe(true);
    expect(mapped.component).toBe('AIReconciliationPanel');
    expect(mapped.description).toBeTruthy();

    // Generator must scope meta extraction to the CSF default export:
    // these files contain sample data with their own `title:`/`component:`
    // fields ('Patient Intake Form', CodeLookup) before the real meta.
    for (const name of ['EsheetBuilder', 'EsheetRenderer']) {
      const esheet = (await callTool(page, 'get_component_docs', {
        component: name,
      })) as { success: boolean; component: string; category: string };
      expect(esheet.success).toBe(true);
      expect(esheet.component).toBe(name);
      expect(esheet.category).toBe('Inputs/Composite forms');
    }

    // Generator must skip default exports inside fenced doc examples:
    // LandingPage.stories.tsx has `export default function Page()` in an
    // example before the real `export default meta` at the end of file.
    const landing = (await callTool(page, 'get_component_docs', {
      component: 'LandingPage',
    })) as { success: boolean; component: string; category: string };
    expect(landing.success).toBe(true);
    expect(landing.component).toBe('LandingPage');
    expect(landing.category).toBe('Templates/Pages');

    const missing = (await callTool(page, 'get_component_docs', {
      component: 'NotARealThing',
    })) as { isError: boolean };
    expect(missing.isError).toBe(true);
  });

  test('does not restrict viewport zoom on non-iOS browsers (WCAG 1.4.4)', async ({
    page,
  }) => {
    await gotoManagerWithStubbedWidget(page);
    const restricted = await page.evaluate(() =>
      Boolean(document.querySelector('meta[name="viewport"][content*="maximum-scale"]'))
    );
    expect(restricted).toBe(false);
  });

  test('swaps the launcher favicon for the bundled Ozwell mark (ozwellai-api#296)', async ({
    page,
  }) => {
    await gotoManagerWithStubbedWidget(page);
    // The stub never mounts the real launcher, so simulate the loader's DOM.
    await page.evaluate(() => {
      const button = document.createElement('button');
      button.id = 'ozwell-chat-button';
      button.innerHTML = '<img src="/favicon.ico" alt="Chat" />';
      document.body.appendChild(button);
    });
    await expect(page.locator('#ozwell-chat-button img')).toHaveAttribute(
      'src',
      /\/ozwell\/icon\.svg$/
    );
  });
});

test.describe('Ozwell embed - iOS viewport shield', () => {
  test.use({
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  });

  test('injects maximum-scale=1 on iOS to suppress input focus auto-zoom', async ({
    page,
  }) => {
    await gotoManagerWithStubbedWidget(page);
    const content = await page.evaluate(
      () =>
        (
          document.querySelector(
            'meta[name="viewport"][content*="maximum-scale"]'
          ) as HTMLMetaElement | null
        )?.content ?? null
    );
    expect(content).toBe('width=device-width, initial-scale=1, maximum-scale=1');
  });
});
