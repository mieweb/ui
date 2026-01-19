'use strict';

var react = require('react');

// src/hooks/useEscapeKey.ts
function useEscapeKey(callback, enabled = true) {
  const handleKeyDown = react.useCallback(
    (event) => {
      if (event.key === "Escape") {
        callback();
      }
    },
    [callback]
  );
  react.useEffect(() => {
    if (!enabled) return;
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown, enabled]);
}

exports.useEscapeKey = useEscapeKey;
//# sourceMappingURL=chunk-FHY3K6PL.cjs.map
//# sourceMappingURL=chunk-FHY3K6PL.cjs.map