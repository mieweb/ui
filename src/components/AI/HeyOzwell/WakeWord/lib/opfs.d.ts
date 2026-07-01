/** Type declarations for opfs.js (OPFS-backed wake-model cache). */
export function getModelBytes(url: string): Promise<Uint8Array>;
export function clearModelCache(): Promise<void>;
