import { useState, useEffect } from 'react';

// src/hooks/usePrefersReducedMotion.ts
function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  useEffect(() => {
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

export { usePrefersReducedMotion };
//# sourceMappingURL=chunk-HB7C7NB5.js.map
//# sourceMappingURL=chunk-HB7C7NB5.js.map