// Vite's inline module worker import; tsup.config.ts builds the same syntax for the library.
declare module '*?worker&inline' {
  const InlineWorker: new () => Worker;
  export default InlineWorker;
}
