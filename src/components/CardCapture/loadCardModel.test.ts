import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as ort from 'onnxruntime-web';

import { loadCardModel } from './loadCardModel';

vi.mock('onnxruntime-web', () => ({
  env: {
    wasm: {
      wasmPaths: undefined,
    },
  },
  InferenceSession: {
    create: vi.fn(),
  },
}));

const mockCreateSession = vi.mocked(ort.InferenceSession.create);

function createMockSession(): ort.InferenceSession {
  return {
    inputNames: ['images'],
    outputNames: ['output0'],
  } as unknown as ort.InferenceSession;
}

describe('loadCardModel', () => {
  beforeEach(() => {
    mockCreateSession.mockReset();
    ort.env.wasm.wasmPaths = undefined;
  });

  it('loads the model with the WebAssembly execution provider', async () => {
    const session = createMockSession();

    mockCreateSession.mockResolvedValue(session);

    await expect(
      loadCardModel('/models/id-card-detector.onnx', {
        wasmPaths: 'https://assets.example.test/ort-wasm/',
      })
    ).resolves.toBe(session);

    expect(ort.env.wasm.wasmPaths).toBe(
      'https://assets.example.test/ort-wasm/'
    );

    expect(mockCreateSession).toHaveBeenCalledWith(
      '/models/id-card-detector.onnx',
      {
        executionProviders: ['wasm'],
      }
    );
  });

  it('trims whitespace from the model URL', async () => {
    const session = createMockSession();

    mockCreateSession.mockResolvedValue(session);

    await loadCardModel('  /models/id-card-detector.onnx  ', {
      wasmPaths: 'https://assets.example.test/ort-wasm/',
    });

    expect(mockCreateSession).toHaveBeenCalledWith(
      '/models/id-card-detector.onnx',
      {
        executionProviders: ['wasm'],
      }
    );
  });

  it('rejects an empty model URL before creating a session', async () => {
    await expect(loadCardModel('   ')).rejects.toThrow(
      'A model URL is required to load the card detector.'
    );

    expect(mockCreateSession).not.toHaveBeenCalled();
  });
});
