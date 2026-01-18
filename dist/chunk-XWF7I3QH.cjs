'use strict';

var chunk2O7D6F67_cjs = require('./chunk-2O7D6F67.cjs');
var React = require('react');
var jsxRuntime = require('react/jsx-runtime');

function _interopNamespace(e) {
  if (e && e.__esModule) return e;
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var React__namespace = /*#__PURE__*/_interopNamespace(React);

var ThemeProviderContext = React__namespace.createContext(void 0);
function ThemeProvider({
  children,
  defaultTheme: _defaultTheme = "system"
}) {
  const { theme, setTheme, resolvedTheme } = chunk2O7D6F67_cjs.useTheme();
  const value = React__namespace.useMemo(
    () => ({ theme, setTheme, resolvedTheme }),
    [theme, setTheme, resolvedTheme]
  );
  return /* @__PURE__ */ jsxRuntime.jsx(ThemeProviderContext.Provider, { value, children });
}
ThemeProvider.displayName = "ThemeProvider";
function useThemeContext() {
  const context = React__namespace.useContext(ThemeProviderContext);
  if (!context) {
    throw new Error("useThemeContext must be used within a ThemeProvider");
  }
  return context;
}

exports.ThemeProvider = ThemeProvider;
exports.ThemeProviderContext = ThemeProviderContext;
exports.useThemeContext = useThemeContext;
//# sourceMappingURL=chunk-XWF7I3QH.cjs.map
//# sourceMappingURL=chunk-XWF7I3QH.cjs.map