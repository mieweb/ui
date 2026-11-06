import { describe, expect, it } from 'vitest';
import { fileViewLanguage, isMarkdownPath, toCodeFence } from './fileView';

describe('isMarkdownPath', () => {
  it('matches Markdown extensions case-insensitively', () => {
    expect(isMarkdownPath('README.md')).toBe(true);
    expect(isMarkdownPath('docs/Guide.MARKDOWN')).toBe(true);
    expect(isMarkdownPath('notes.txt')).toBe(false);
    expect(isMarkdownPath('md')).toBe(false);
  });
});

describe('fileViewLanguage', () => {
  it('maps known extensions and file names to highlight languages', () => {
    expect(fileViewLanguage('src/app.tsx')).toBe('typescript');
    expect(fileViewLanguage('config/settings.yml')).toBe('yaml');
    expect(fileViewLanguage('build/Makefile')).toBe('makefile');
  });

  it('leaves unknown and extensionless files as plain text', () => {
    expect(fileViewLanguage('notes.txt')).toBeUndefined();
    expect(fileViewLanguage('LICENSE')).toBeUndefined();
    expect(fileViewLanguage('.env')).toBeUndefined();
  });

  it('ignores names inherited from Object.prototype', () => {
    expect(fileViewLanguage('constructor')).toBeUndefined();
    expect(fileViewLanguage('file.__proto__')).toBeUndefined();
    expect(fileViewLanguage('a.toString')).toBeUndefined();
  });
});

describe('toCodeFence', () => {
  it('tags the fence with the language and drops one trailing newline', () => {
    expect(toCodeFence('const a = 1;\n', 'typescript')).toBe(
      '```typescript\nconst a = 1;\n```'
    );
  });

  it('uses a fence longer than any backtick run so embedded fences stay inside', () => {
    const text = 'before\n````\ninner\n````\nafter';
    expect(toCodeFence(text)).toBe(`\`\`\`\`\`\n${text}\n\`\`\`\`\``);
  });
});
