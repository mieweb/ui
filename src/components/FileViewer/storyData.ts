/** Shared fixtures for the FileViewer and FileDocument stories. */

export const planMarkdown = `# Release plan

Ship the Files panel's rendered view after the auto-refresh work lands.

| Step   | Owner  |
| ------ | ------ |
| Build  | Martin |
| Review | Aaron  |
| Ship   | Doug   |

- [x] Rendered view
- [ ] Code view

\`\`\`ts
const ready: boolean = true;
\`\`\`
`;

export const helperTypeScript = `export function greet(name: string): string {
  return \`Hello, \${name}\`;
}

export const DEFAULT_NAME = 'world';
`;

export const settingsJson = `{
  "theme": "dark",
  "language": "en-US",
  "notifications": { "email": true, "push": false }
}
`;

export const arabicMarkdown = `# خطة الإصدار

- مراجعة التصميم
- اختبار الواجهة باللغة العربية

\`\`\`ts
// تحية المستخدم
const greeting: string = 'مرحبا';
\`\`\`
`;
