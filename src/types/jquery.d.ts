declare module 'jquery' {
  interface JQueryStatic {
    (...args: unknown[]): unknown;
    [key: string]: unknown;
  }

  const jQuery: JQueryStatic;
  export default jQuery;
}

interface Window {
  jQuery?: unknown;
  $?: unknown;
}
