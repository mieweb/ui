import { useCallback, useEffect } from 'react';

// src/hooks/useEscapeKey.ts
function useEscapeKey(callback, enabled = true) {
  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === "Escape") {
        callback();
      }
    },
    [callback]
  );
  useEffect(() => {
    if (!enabled) return;
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown, enabled]);
}

export { useEscapeKey };
//# sourceMappingURL=chunk-T4ME7QCT.js.map
//# sourceMappingURL=chunk-T4ME7QCT.js.map