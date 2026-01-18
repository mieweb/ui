'use strict';

var react = require('react');

// src/hooks/usePrefersReducedMotion.ts
function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = react.useState(false);
  react.useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    const handleChange = (event) => {
      setPrefersReducedMotion(event.matches);
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);
  return prefersReducedMotion;
}

exports.usePrefersReducedMotion = usePrefersReducedMotion;
//# sourceMappingURL=chunk-6HFFWEM3.cjs.map
//# sourceMappingURL=chunk-6HFFWEM3.cjs.map