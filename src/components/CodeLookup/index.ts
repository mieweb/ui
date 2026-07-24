// NOTE: CodeLookup is intentionally NOT exported from src/index.ts yet — the
// module worker (new Worker(new URL(...))) needs bundler support that the tsup
// library build doesn't have configured. Storybook (Vite) handles it natively.
export {
  CodeLookup,
  type CodeLookupProps,
  type CodifyDomain,
  type CodeLookupMemoryConfig,
} from './CodeLookup';
export {
  clearMemory,
  type MemoryEntry,
  type MemoryScope,
} from './memoryStore';
export {
  searchShards,
  parseShard,
  normalize,
  type CodifyResult,
  type CodifyShard,
} from './engine';
