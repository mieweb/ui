'use strict';

var react = require('react');

// src/hooks/useClickOutside.ts
function useClickOutside(ref, callback) {
  react.useEffect(() => {
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

exports.useClickOutside = useClickOutside;
exports.useEscapeKey = useEscapeKey;
//# sourceMappingURL=chunk-J4XHETCY.cjs.map
//# sourceMappingURL=chunk-J4XHETCY.cjs.map