import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

function parseArgs(argv) {
  const options = {};
  for (const raw of argv) {
    if (!raw.startsWith('--')) continue;
    const [key, value] = raw.slice(2).split('=');
    if (!key) continue;
    options[key] = value ?? 'true';
  }
  return options;
}

function printHelp() {
  console.log(`Usage: node scripts/sync-loco-pack.mjs [options]

Options:
  --server=<url>         Loco server URL (default: http://localhost:6101)
  --apiKey=<key>         Loco API key (or set LOCO_API_KEY)
  --out=<path>           Output file path (default: src/i18n/loco-sample-pack.json)
  --format=<name>        Export format (default: i18next-nested)
  --contextMode=<mode>   Context mode (default: ignore)
  --help                 Show this message

Environment variables:
  LOCO_SERVER_URL
  LOCO_API_KEY
`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help === 'true') {
    printHelp();
    return;
  }
  const server = (args.server || process.env.LOCO_SERVER_URL || 'http://localhost:6101').replace(/\/$/, '');
  const apiKey = args.apiKey || process.env.LOCO_API_KEY || '';
  const outPath = args.out || 'src/i18n/loco-sample-pack.json';
  const format = args.format || 'i18next-nested';
  const contextMode = args.contextMode || 'ignore';

  const exportUrl = new URL(`${server}/api/export`);
  exportUrl.searchParams.set('format', format);
  exportUrl.searchParams.set('contextMode', contextMode);

  const headers = {};
  if (apiKey) {
    headers['x-api-key'] = apiKey;
  }

  console.log(`[loco-sync] Fetching ${exportUrl.toString()}`);
  const response = await fetch(exportUrl, { headers });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Loco export failed (${response.status}): ${body}`);
  }

  const payload = await response.json();
  const output = `${JSON.stringify(payload, null, 2)}\n`;
  const absoluteOut = path.resolve(process.cwd(), outPath);
  await writeFile(absoluteOut, output, 'utf8');

  console.log(`[loco-sync] Wrote package to ${absoluteOut}`);
}

main().catch((error) => {
  console.error('[loco-sync] Failed:', error.message);
  process.exit(1);
});
