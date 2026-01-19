import { useRef, useEffect } from 'react';

// src/hooks/useFocusTrap.ts
function useFocusTrap(enabled = true) {
  const containerRef = useRef(null);
  useEffect(() => {
    if (!enabled || !containerRef.current) return;
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

export { useFocusTrap };
//# sourceMappingURL=chunk-CLNOI5J7.js.map
//# sourceMappingURL=chunk-CLNOI5J7.js.map