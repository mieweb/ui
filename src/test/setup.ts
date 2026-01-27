import '@testing-library/jest-dom/vitest';
import { afterEach, beforeAll } from 'vitest';
import { cleanup } from '@testing-library/react';

// Add missing browser globals for jsdom environment
beforeAll(() => {
  // matchMedia is not available in jsdom
  if (!window.matchMedia) {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    });
  }

  // DataTransfer is not available in jsdom
  if (typeof globalThis.DataTransfer === 'undefined') {
    class MockDataTransfer {
      private _files: File[] = [];
      private _items: {
        add: (file: File) => void;
        remove: (index: number) => void;
      };

      constructor() {
        this._items = {
          add: (file: File) => {
            this._files.push(file);
          },
          remove: (index: number) => {
            this._files.splice(index, 1);
          },
        };
      }

      get files(): FileList {
        const fileList = Object.create(FileList.prototype);
        Object.defineProperty(fileList, 'length', {
          get: () => this._files.length,
        });
        this._files.forEach((file, i) => {
          Object.defineProperty(fileList, i, {
            get: () => file,
            enumerable: true,
          });
        });
        fileList.item = (index: number) => this._files[index] || null;
        fileList[Symbol.iterator] = function* () {
          for (let i = 0; i < fileList.length; i++) {
            yield fileList[i];
          }
        };
        return fileList;
      }

      get items() {
        return this._items;
      }

      setData() {}
      getData() {
        return '';
      }
      clearData() {}
    }

    globalThis.DataTransfer =
      MockDataTransfer as unknown as typeof DataTransfer;
  }

  // URL methods
  if (!globalThis.URL.createObjectURL) {
    globalThis.URL.createObjectURL = () => 'blob:mock-url';
  }
  if (!globalThis.URL.revokeObjectURL) {
    globalThis.URL.revokeObjectURL = () => {};
  }
});

// Cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
});
