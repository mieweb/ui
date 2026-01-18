import { useTheme } from './chunk-KJZNEVYM.js';
import * as React from 'react';
import { jsx } from 'react/jsx-runtime';

var ThemeProviderContext = React.createContext(void 0);
function ThemeProvider({
  children,
  defaultTheme: _defaultTheme = "system"
}) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const value = React.useMemo(
    () => ({ theme, setTheme, resolvedTheme }),
    [theme, setTheme, resolvedTheme]
  );
  return /* @__PURE__ */ jsx(ThemeProviderContext.Provider, { value, children });
}
ThemeProvider.displayName = "ThemeProvider";
function useThemeContext() {
  const context = React.useContext(ThemeProviderContext);
  if (!context) {
    throw new Error("useThemeContext must be used within a ThemeProvider");
  }
  return context;
}

export { ThemeProvider, ThemeProviderContext, useThemeContext };
//# sourceMappingURL=chunk-JE462LFV.js.map
//# sourceMappingURL=chunk-JE462LFV.js.map