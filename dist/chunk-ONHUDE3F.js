import { Tooltip } from './chunk-UZUBLXVC.js';
import { useTheme } from './chunk-EF23XUV2.js';
import { cn } from './chunk-F3SOEIN2.js';
import * as React from 'react';
import { jsx } from 'react/jsx-runtime';
import { cva } from 'class-variance-authority';

var ThemeProviderContext = React.createContext(void 0);
function ThemeProvider({
  children,
  defaultTheme = "system"
}) {
  const { theme, setTheme, resolvedTheme } = useTheme(defaultTheme);
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
var themeToggleVariants = cva(
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
var themeToggleIconVariants = cva("", {
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
var SunIcon = ({ className }) => /* @__PURE__ */ jsx(
  "svg",
  {
    className,
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor",
    strokeWidth: 2,
    "aria-hidden": "true",
    children: /* @__PURE__ */ jsx(
      "path",
      {
        strokeLinecap: "round",
        strokeLinejoin: "round",
        d: "M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
      }
    )
  }
);
var MoonIcon = ({ className }) => /* @__PURE__ */ jsx(
  "svg",
  {
    className,
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor",
    strokeWidth: 2,
    "aria-hidden": "true",
    children: /* @__PURE__ */ jsx(
      "path",
      {
        strokeLinecap: "round",
        strokeLinejoin: "round",
        d: "M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
      }
    )
  }
);
var SystemIcon = ({ className }) => /* @__PURE__ */ jsx(
  "svg",
  {
    className,
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor",
    strokeWidth: 2,
    "aria-hidden": "true",
    children: /* @__PURE__ */ jsx(
      "path",
      {
        strokeLinecap: "round",
        strokeLinejoin: "round",
        d: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      }
    )
  }
);
var ThemeToggle = React.forwardRef(
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
    const { theme, setTheme, resolvedTheme } = useTheme();
    const handleClick = React.useCallback(() => {
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
        return systemIcon || /* @__PURE__ */ jsx(SystemIcon, { className: themeToggleIconVariants({ size }) });
      }
      if (resolvedTheme === "dark") {
        return darkIcon || /* @__PURE__ */ jsx(SunIcon, { className: themeToggleIconVariants({ size }) });
      }
      return lightIcon || /* @__PURE__ */ jsx(MoonIcon, { className: themeToggleIconVariants({ size }) });
    };
    const label = getLabel();
    const button = /* @__PURE__ */ jsx(
      "button",
      {
        ref,
        type: "button",
        "aria-label": label,
        onClick: handleClick,
        className: cn(themeToggleVariants({ size, variant }), className),
        ...props,
        children: getCurrentIcon()
      }
    );
    if (showTooltip) {
      return /* @__PURE__ */ jsx(
        Tooltip,
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

export { ThemeProvider, ThemeProviderContext, ThemeToggle, themeToggleIconVariants, themeToggleVariants, useThemeContext };
//# sourceMappingURL=chunk-ONHUDE3F.js.map
//# sourceMappingURL=chunk-ONHUDE3F.js.map