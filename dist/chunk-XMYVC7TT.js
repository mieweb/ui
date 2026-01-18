import { useEffect, useCallback } from 'react';

// src/hooks/useClickOutside.ts
function useClickOutside(ref, callback) {
  useEffect(() => {
    const handleClick = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        callback();
      }
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("touchstart", handleClick);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("touchstart", handleClick);
    };
  }, [ref, callback]);
}
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

export { useClickOutside, useEscapeKey };
//# sourceMappingURL=chunk-XMYVC7TT.js.map
//# sourceMappingURL=chunk-XMYVC7TT.js.map