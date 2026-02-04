'use strict';

var chunkSCV7C55E_cjs = require('./chunk-SCV7C55E.cjs');
var react = require('react');

function useFocusTrap(enabled = true) {
  const containerRef = react.useRef(null);
  react.useEffect(() => {
    if (!enabled || !containerRef.current || chunkSCV7C55E_cjs.isStorybookDocsMode()) return;
    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (focusableElements.length === 0) return;
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    firstElement.focus();
    const handleKeyDown = (event) => {
      if (event.key !== "Tab") return;
      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };
    container.addEventListener("keydown", handleKeyDown);
    return () => container.removeEventListener("keydown", handleKeyDown);
  }, [enabled]);
  return containerRef;
}

exports.useFocusTrap = useFocusTrap;
//# sourceMappingURL=chunk-NNEFAUHV.cjs.map
//# sourceMappingURL=chunk-NNEFAUHV.cjs.map