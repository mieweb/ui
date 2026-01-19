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

exports.useClickOutside = useClickOutside;
//# sourceMappingURL=chunk-SWMRCGL4.cjs.map
//# sourceMappingURL=chunk-SWMRCGL4.cjs.map