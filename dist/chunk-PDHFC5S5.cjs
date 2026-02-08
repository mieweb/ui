'use strict';

var chunkBXK5TNJE_cjs = require('./chunk-BXK5TNJE.cjs');
var chunkJZIH3A2A_cjs = require('./chunk-JZIH3A2A.cjs');
var chunkOR5DRJCW_cjs = require('./chunk-OR5DRJCW.cjs');
var React = require('react');
var jsxRuntime = require('react/jsx-runtime');
var classVarianceAuthority = require('class-variance-authority');

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
  defaultTheme = "system"
}) {
  const { theme, setTheme, resolvedTheme } = chunkJZIH3A2A_cjs.useTheme(defaultTheme);
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
var themeToggleVariants = classVarianceAuthority.cva(
  [
    "inline-flex items-center justify-center",
    "rounded-md border transition-colors",
    "focus:outline-none focus:ring-2 focus:ring-primary-500/40"
  ],
  {
    variants: {
      size: {
        sm: "h-7 w-7",
        md: "h-8 w-8",
        lg: "h-9 w-9"
      },
      variant: {
        default: [
          "border-neutral-300 bg-white text-neutral-600 shadow-sm",
          "hover:bg-neutral-100",
          "dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
        ],
        ghost: [
          "border-transparent bg-transparent text-neutral-600",
          "hover:bg-neutral-100",
          "dark:text-neutral-300 dark:hover:bg-neutral-700"
        ]
      }
    },
    defaultVariants: {
      size: "md",
      variant: "default"
    }
  }
);
var themeToggleIconVariants = classVarianceAuthority.cva("", {
  variants: {
    size: {
      sm: "h-3.5 w-3.5",
      md: "h-4 w-4",
      lg: "h-5 w-5"
    }
  },
  defaultVariants: {
    size: "md"
  }
});
var SunIcon = ({ className }) => /* @__PURE__ */ jsxRuntime.jsx(
  "svg",
  {
    className,
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor",
    strokeWidth: 2,
    "aria-hidden": "true",
    children: /* @__PURE__ */ jsxRuntime.jsx(
      "path",
      {
        strokeLinecap: "round",
        strokeLinejoin: "round",
        d: "M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
      }
    )
  }
);
var MoonIcon = ({ className }) => /* @__PURE__ */ jsxRuntime.jsx(
  "svg",
  {
    className,
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor",
    strokeWidth: 2,
    "aria-hidden": "true",
    children: /* @__PURE__ */ jsxRuntime.jsx(
      "path",
      {
        strokeLinecap: "round",
        strokeLinejoin: "round",
        d: "M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
      }
    )
  }
);
var SystemIcon = ({ className }) => /* @__PURE__ */ jsxRuntime.jsx(
  "svg",
  {
    className,
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor",
    strokeWidth: 2,
    "aria-hidden": "true",
    children: /* @__PURE__ */ jsxRuntime.jsx(
      "path",
      {
        strokeLinecap: "round",
        strokeLinejoin: "round",
        d: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      }
    )
  }
);
var ThemeToggle = React__namespace.forwardRef(
  ({
    className,
    size,
    variant,
    mode = "two-way",
    showTooltip = true,
    tooltipPlacement = "bottom",
    tooltipDelay = 140,
    lightIcon,
    darkIcon,
    systemIcon,
    ...props
  }, ref) => {
    const { theme, setTheme, resolvedTheme } = chunkJZIH3A2A_cjs.useTheme();
    const handleClick = React__namespace.useCallback(() => {
      if (mode === "two-way") {
        setTheme(resolvedTheme === "dark" ? "light" : "dark");
      } else {
        const nextTheme = {
          light: "dark",
          dark: "system",
          system: "light"
        };
        setTheme(nextTheme[theme]);
      }
    }, [mode, theme, resolvedTheme, setTheme]);
    const getLabel = () => {
      if (mode === "two-way") {
        return resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode";
      }
      const nextThemeLabels = {
        light: "Switch to dark mode",
        dark: "Switch to system theme",
        system: "Switch to light mode"
      };
      return nextThemeLabels[theme];
    };
    const getCurrentIcon = () => {
      if (mode === "three-way" && theme === "system") {
        return systemIcon || /* @__PURE__ */ jsxRuntime.jsx(SystemIcon, { className: themeToggleIconVariants({ size }) });
      }
      if (resolvedTheme === "dark") {
        return darkIcon || /* @__PURE__ */ jsxRuntime.jsx(SunIcon, { className: themeToggleIconVariants({ size }) });
      }
      return lightIcon || /* @__PURE__ */ jsxRuntime.jsx(MoonIcon, { className: themeToggleIconVariants({ size }) });
    };
    const label = getLabel();
    const button = /* @__PURE__ */ jsxRuntime.jsx(
      "button",
      {
        ref,
        type: "button",
        "aria-label": label,
        onClick: handleClick,
        className: chunkOR5DRJCW_cjs.cn(themeToggleVariants({ size, variant }), className),
        ...props,
        children: getCurrentIcon()
      }
    );
    if (showTooltip) {
      return /* @__PURE__ */ jsxRuntime.jsx(
        chunkBXK5TNJE_cjs.Tooltip,
        {
          content: label,
          placement: tooltipPlacement,
          delay: tooltipDelay,
          children: button
        }
      );
    }
    return button;
  }
);
ThemeToggle.displayName = "ThemeToggle";

exports.ThemeProvider = ThemeProvider;
exports.ThemeProviderContext = ThemeProviderContext;
exports.ThemeToggle = ThemeToggle;
exports.themeToggleIconVariants = themeToggleIconVariants;
exports.themeToggleVariants = themeToggleVariants;
exports.useThemeContext = useThemeContext;
//# sourceMappingURL=chunk-PDHFC5S5.cjs.map
//# sourceMappingURL=chunk-PDHFC5S5.cjs.map