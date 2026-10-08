import { describe, expect, it, vi } from 'vitest';

import { normalizeDesignSettings, renderEmailMjml } from './renderEmailMjml';
import {
  addBlockToColumn,
  duplicateEmailBlock,
  findEmailBlock,
  moveEmailBlock,
  removeEmailBlock,
  updateEmailBlock,
} from './tree';
import { EMAIL_BLOCK_TYPES } from './EmailEditor';
import {
  createEmailBlock,
  createEmptyEmailContentTree,
  type EmailBlock,
  type EmailContentTree,
} from './types';

const tree = (...blocks: EmailBlock[]): EmailContentTree => ({
  version: '1.0',
  blocks,
});

describe('renderEmailMjml', () => {
  it('renders every block type inside an mjml document', () => {
    const mjml = renderEmailMjml(
      tree(...EMAIL_BLOCK_TYPES.map((t) => createEmailBlock(t))),
      {
        design: { contentWidth: 640, bodyBackgroundColor: '#eeeeee' },
      }
    );
    expect(mjml).toMatch(/^<mjml>/);
    expect(mjml).toContain(
      '<mj-body background-color="#eeeeee" width="640px">'
    );
    for (const tag of [
      'mj-button',
      'mj-divider',
      'mj-spacer',
      'mj-social',
      'mj-raw',
      'mj-table',
    ]) {
      expect(mjml).toContain(`<${tag}`);
    }
  });

  it('escapes plain-text fields', () => {
    const heading = {
      ...createEmailBlock('heading'),
      text: '<script>alert(1)</script>',
    };
    const mjml = renderEmailMjml(tree(heading));
    expect(mjml).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(mjml).not.toContain('<script>');
  });

  it('neutralises unsafe URLs but keeps merge tokens', () => {
    const bad = { ...createEmailBlock('button'), url: 'javascript:alert(1)' };
    const merge = {
      ...createEmailBlock('button'),
      url: '{{provider_page_url}}',
    };
    const mjml = renderEmailMjml(tree(bad, merge));
    expect(mjml).toContain('href="#"');
    expect(mjml).toContain('href="{{provider_page_url}}"');
    expect(mjml).not.toContain('javascript:');
  });

  it('rejects colours that would inject CSS', () => {
    const divider = {
      ...createEmailBlock('divider'),
      color: 'red;background:url(x)',
    };
    const mjml = renderEmailMjml(tree(divider));
    expect(mjml).toContain('border-color="#e5e7eb"');
    expect(mjml).not.toContain('url(x)');
  });

  it('sanitises HTML with DOMPurify by default', () => {
    const html = {
      ...createEmailBlock('html'),
      html: '<img src="x" onerror="alert(1)"><p>ok</p>',
    };
    const mjml = renderEmailMjml(tree(html));
    expect(mjml).toContain('<p>ok</p>');
    expect(mjml).not.toContain('onerror');
  });

  it('keeps formatting styles but drops ones that can cover the page', () => {
    const html = {
      ...createEmailBlock('html'),
      html: '<div style="position:fixed;inset:0;z-index:2147483647;background:white;color:#111;margin:-40px;padding:8px;background-color:url(x)">hi</div><p style="position:absolute">p</p>',
    };
    const mjml = renderEmailMjml(tree(html));
    expect(mjml).toContain('style="color: #111; padding: 8px"');
    expect(mjml).toContain('<p>p</p>');
    expect(mjml).not.toMatch(
      /position|inset|z-index|-40px|url\(x\)|background: white/
    );
  });

  it('uses a caller-supplied sanitiser', () => {
    const sanitizeHtml = vi.fn(() => '<p>clean</p>');
    const mjml = renderEmailMjml(tree(createEmailBlock('text')), {
      sanitizeHtml,
    });
    expect(sanitizeHtml).toHaveBeenCalledWith(
      '<p>Write your message here.</p>'
    );
    expect(mjml).toContain('<p>clean</p>');
  });

  it('emits hero gradients only when they are plain CSS gradients', () => {
    const good = {
      ...createEmailBlock('hero'),
      id: 'h1',
      backgroundGradient: 'linear-gradient(135deg, rgb(1,2,3), #fff)',
    };
    const bad = {
      ...createEmailBlock('hero'),
      id: 'h2',
      backgroundGradient: 'linear-gradient(url(http://x))',
    };
    const mjml = renderEmailMjml(tree(good, bad));
    expect(mjml).toContain(
      '.hero-gradient-h1 { background: linear-gradient(135deg, rgb(1,2,3), #fff)'
    );
    expect(mjml).not.toContain('hero-gradient-h2');
  });

  it('converts image percentages to px because mj-image only accepts px', () => {
    const image = (width: string) => ({
      ...createEmailBlock('image'),
      src: 'https://x/a.png',
      width,
    });
    expect(renderEmailMjml(tree(image('50%')))).toContain('width="275px"');
    expect(renderEmailMjml(tree(image('50.5%')))).toContain('width="278px"');
    expect(renderEmailMjml(tree(image('.5%')))).toContain('width="3px"');
    expect(renderEmailMjml(tree(image('100%')))).not.toMatch(
      /<mj-image[^>]*width=/
    );
  });

  it('sizes headings inline so clients do not scale them again', () => {
    const mjml = renderEmailMjml(
      tree(createEmailBlock('heading'), createEmailBlock('hero'))
    );
    expect(mjml).toContain('<h2 style="font-size: 26px; line-height: 1.25;">');
    expect(mjml).toMatch(/<h1 style="[^"]*font-size: 32px;/);
  });

  it('strips class and id so host CSS cannot style stored HTML', () => {
    const html = {
      ...createEmailBlock('html'),
      html: '<div class="fixed inset-0 z-50" id="root">x</div>',
    };
    const mjml = renderEmailMjml(tree(html));
    expect(mjml).toContain('<div>x</div>');
    expect(mjml).not.toMatch(/fixed|id="root"/);
  });

  it('validates design colours, falling back to defaults', () => {
    const design = normalizeDesignSettings({
      bodyBackgroundColor: 'url(https://x/y.png)',
      buttonBackgroundColor: 'red;position:fixed',
      linkColor: '#123456',
    });
    expect(design).toMatchObject({
      bodyBackgroundColor: '#f4f4f5',
      buttonBackgroundColor: '#2563eb',
      linkColor: '#123456',
    });
  });

  it('resolves image percentages against the containing column', () => {
    const columns = createEmailBlock('columns');
    columns.columns[0].blocks.push({
      ...createEmailBlock('image'),
      src: 'https://x/a.png',
      width: '50%',
    });
    // 600px email, 50% column, 12px padding each side: 276px usable.
    expect(renderEmailMjml(tree(columns))).toContain('width="138px"');
    columns.columns[1].blocks.push({
      ...createEmailBlock('image'),
      src: 'https://x/b.png',
      width: '50.5%',
    });
    expect(renderEmailMjml(tree(columns))).toContain('width="139px"');
  });

  it('lets undefined design fields inherit their defaults', () => {
    const mjml = renderEmailMjml(tree(createEmailBlock('heading')), {
      design: { fontFamily: undefined, contentWidth: undefined },
    });
    expect(mjml).toContain('font-family="Arial, Helvetica, sans-serif"');
    expect(mjml).toContain('width="600px"');
  });

  it('points the footer unsubscribe link at the configured URL', () => {
    const mjml = renderEmailMjml(tree(createEmailBlock('footer')), {
      unsubscribeUrl: 'https://example.com/u',
    });
    expect(mjml).toContain('href="https://example.com/u"');
  });
});

describe('tree helpers', () => {
  const columns = createEmailBlock('columns');
  const child = createEmailBlock('heading');
  const blocks = addBlockToColumn(
    [createEmailBlock('text'), columns],
    columns.id,
    1,
    child
  );

  it('finds and updates blocks nested in columns', () => {
    expect(findEmailBlock(blocks, child.id)).toBe(child);
    const next = updateEmailBlock(blocks, child.id, { text: 'Nested' });
    expect(findEmailBlock(next, child.id)).toMatchObject({ text: 'Nested' });
    expect(next[0]).toBe(blocks[0]);
  });

  it('moves within the containing list and ignores out-of-range moves', () => {
    const moved = moveEmailBlock(blocks, columns.id, -1);
    expect(moved.map((b) => b.id)).toEqual([columns.id, blocks[0].id]);
    expect(moveEmailBlock(blocks, blocks[0].id, -1)).toEqual(blocks);
  });

  it('duplicates with fresh ids all the way down', () => {
    const { blocks: next, newId } = duplicateEmailBlock(blocks, columns.id);
    const copy = next[2];
    expect(copy.id).toBe(newId);
    expect(copy.type).toBe('columns');
    if (copy.type !== 'columns') return;
    expect(copy.columns[1].blocks[0].id).not.toBe(child.id);
  });

  it('removes nested blocks', () => {
    expect(
      findEmailBlock(removeEmailBlock(blocks, child.id), child.id)
    ).toBeUndefined();
  });

  it('starts new documents with a title, body and footer', () => {
    expect(createEmptyEmailContentTree().blocks.map((b) => b.type)).toEqual([
      'heading',
      'text',
      'footer',
    ]);
  });
});
