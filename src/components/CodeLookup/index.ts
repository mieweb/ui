// NOTE: CodeLookup is intentionally NOT exported from src/index.ts yet — the
// module worker (new Worker(new URL(...))) needs bundler support that the tsup
// library build doesn't have configured. Storybook (Vite) handles it natively.
export {
  CodeLookup,
  type CodeLookupProps,
  type CodifyDomain,
  type CodetypeOption,
  type CodeLookupMemoryConfig,
} from './CodeLookup';
export {
  clearMemory,
  clearAllMemory,
  setMemoryStorage,
  getMemoryStorage,
  type MemoryEntry,
  type MemoryScope,
  type MemoryStorage,
} from './memoryStore';
export {
  exportMemoryYaml,
  importMemoryYaml,
  MEMORY_YAML_VERSION,
  type ImportMemoryOptions,
  type ImportMemoryResult,
} from './memoryYaml';
export {
  searchShards,
  parseShard,
  normalize,
  type CodifyResult,
  type CodifyShard,
} from './engine';
