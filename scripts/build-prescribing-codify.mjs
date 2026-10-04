/** Build the simulation-only Codify fixtures; this does not rebuild real catalogs. */
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { Buffer } from 'node:buffer';
import { URL } from 'node:url';

const source = await readFile(
  new URL('../src/demo/prescribing/fixtures/codify.json', import.meta.url),
  'utf8'
);
const fixtures = JSON.parse(source);
const output = new URL(
  '../.storybook/public/prescribing-codify/en/',
  import.meta.url
);
await mkdir(output, { recursive: true });
const shards = [];

for (const [domain, docs] of Object.entries(fixtures)) {
  const codetypes = [...new Set(docs.map((doc) => doc.codetype))];
  const normalize = (label) =>
    label
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  const postingsByToken = new Map();
  const tokensByDoc = docs.map((doc) =>
    normalize(doc.label).split(' ').filter(Boolean)
  );
  tokensByDoc.forEach((tokens, docId) => {
    for (const token of new Set(tokens)) {
      if (!postingsByToken.has(token)) postingsByToken.set(token, []);
      postingsByToken.get(token).push(docId << 1);
    }
  });
  const tokens = [...postingsByToken.keys()].sort();
  const sections = {};
  const blob = (name, strings) => {
    const bytes = strings.map((value) => Buffer.from(value));
    const offsets = [0];
    for (const value of bytes) offsets.push(offsets.at(-1) + value.length);
    sections[`${name}Blob`] = Buffer.concat(bytes);
    sections[`${name}Offsets`] = u32(offsets);
  };
  const postStart = [0];
  const postings = [];
  for (const token of tokens) {
    postings.push(...postingsByToken.get(token));
    postStart.push(postings.length);
  }
  blob('token', tokens);
  blob(
    'label',
    docs.map((doc) => doc.label)
  );
  blob(
    'code',
    docs.map((doc) => doc.fullcode)
  );
  blob(
    'fullid',
    docs.map((doc) => doc.fullid)
  );
  sections.postStart = u32(postStart);
  sections.postings = u32(postings);
  sections.docCodetype = Buffer.from(
    docs.map((doc) => codetypes.indexOf(doc.codetype))
  );
  sections.docLen = Buffer.from(
    tokensByDoc.map((values) => new Set(values).size)
  );
  sections.docFirstTok = u32(
    tokensByDoc.map((values) => tokens.indexOf(values[0]))
  );

  const metadata = {
    domain,
    locale: 'en',
    docCount: docs.length,
    tokenCount: tokens.length,
    codetypes,
    sections: {},
  };
  let metadataBytes = Buffer.from(JSON.stringify(metadata));
  // Offsets include metadata. Iterate until its byte length stops changing.
  for (;;) {
    let offset = align(12 + metadataBytes.length);
    for (const [name, bytes] of Object.entries(sections)) {
      metadata.sections[name] = [offset, bytes.length];
      offset = align(offset + bytes.length);
    }
    const next = Buffer.from(JSON.stringify(metadata));
    if (next.length === metadataBytes.length) {
      metadataBytes = next;
      break;
    }
    metadataBytes = next;
  }
  const bytes = Buffer.alloc(
    Math.max(
      ...Object.values(metadata.sections).map(([offset, length]) =>
        align(offset + length)
      )
    )
  );
  bytes.writeUInt32LE(0x4d434458, 0);
  bytes.writeUInt32LE(1, 4);
  bytes.writeUInt32LE(metadataBytes.length, 8);
  metadataBytes.copy(bytes, 12);
  for (const [name, value] of Object.entries(sections))
    value.copy(bytes, metadata.sections[name][0]);
  const file = `${domain}.mcdx`;
  await writeFile(new URL(file, output), bytes);
  shards.push({
    domain,
    file,
    bytes: bytes.length,
    docCount: docs.length,
    tokenCount: tokens.length,
  });
}
await writeFile(
  new URL('manifest.json', output),
  `${JSON.stringify({ version: 1, locale: 'en', builtAt: `simulation:${createHash('sha256').update(source).digest('hex')}`, shards }, null, 2)}\n`
);

function align(value) {
  return Math.ceil(value / 4) * 4;
}
function u32(values) {
  const result = Buffer.alloc(values.length * 4);
  values.forEach((value, i) => result.writeUInt32LE(value, i * 4));
  return result;
}
