declare module 'jquery' {
  const jQuery: any;
  export default jQuery;
}
import jQuery from 'jquery';

if (typeof window !== 'undefined') {
  (window as any).jQuery = jQuery;
  (window as any).$ = jQuery;
}
(globalThis as any).jQuery = jQuery;
(globalThis as any).$ = jQuery;
