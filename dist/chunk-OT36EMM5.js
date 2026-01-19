import { useEffect } from 'react';

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

export { useClickOutside };
//# sourceMappingURL=chunk-OT36EMM5.js.map
//# sourceMappingURL=chunk-OT36EMM5.js.map