'use strict';

var react = require('react');

// src/hooks/useTheme.ts
var THEME_STORAGE_KEY = "mieweb-ui-theme";
function getSystemTheme() {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
function getStoredTheme() {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }
  return null;
}
function applyTheme(theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(theme);
  root.setAttribute("data-theme", theme);
}
function useTheme(defaultTheme = "system") {
  const [theme, setThemeState] = react.useState(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = react.useState(
    defaultTheme === "system" ? "light" : defaultTheme === "dark" ? "dark" : "light"
  );
  react.useEffect(() => {
    const stored = getStoredTheme();
    const initial = stored ?? defaultTheme;
    setThemeState(initial);
    const resolved = initial === "system" ? getSystemTheme() : initial;
    setResolvedTheme(resolved);
    applyTheme(resolved);
  }, []);
  react.useEffect(() => {
    if (theme !== "system") return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e) => {
      const newTheme = e.matches ? "dark" : "light";
      setResolvedTheme(newTheme);
      applyTheme(newTheme);
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);
  const setTheme = react.useCallback((newTheme) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    const resolved = newTheme === "system" ? getSystemTheme() : newTheme;
    setResolvedTheme(resolved);
    applyTheme(resolved);
  }, []);
  return {
    theme,
    setTheme,
    resolvedTheme
  };
}

exports.useTheme = useTheme;
//# sourceMappingURL=chunk-JZIH3A2A.cjs.map
//# sourceMappingURL=chunk-JZIH3A2A.cjs.map