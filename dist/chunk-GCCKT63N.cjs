'use strict';

var chunkOR5DRJCW_cjs = require('./chunk-OR5DRJCW.cjs');
var React = require('react');
var classVarianceAuthority = require('class-variance-authority');
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

var buttonVariants = classVarianceAuthority.cva(
  // Base styles
  [
    "inline-flex items-center justify-center gap-2",
    "font-semibold transition-all duration-200",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "active:scale-[0.98]"
  ],
  {
    variants: {
      variant: {
        primary: [
          "bg-primary-800 text-white",
          "hover:bg-primary-700",
          "active:bg-primary-900"
        ],
        secondary: [
          "bg-neutral-200 text-neutral-900",
          "hover:bg-neutral-300",
          "active:bg-neutral-400",
          "dark:bg-neutral-700 dark:text-neutral-100",
          "dark:hover:bg-neutral-600",
          "dark:active:bg-neutral-500"
        ],
        ghost: [
          "bg-transparent text-neutral-600",
          "hover:bg-neutral-100",
          "active:bg-neutral-200",
          "dark:text-neutral-400",
          "dark:hover:bg-neutral-800",
          "dark:active:bg-neutral-700"
        ],
        outline: [
          "border-2 border-primary-800 text-primary-800 bg-transparent",
          "hover:bg-primary-50 hover:text-primary-900",
          "active:bg-primary-100",
          "dark:border-primary-400 dark:text-primary-400",
          "dark:hover:bg-primary-950",
          "dark:active:bg-primary-900"
        ],
        danger: [
          "bg-red-600 text-white",
          "hover:bg-red-700",
          "active:bg-red-800"
        ],
        link: [
          "text-primary-800 underline-offset-4",
          "hover:underline hover:text-primary-900",
          "active:text-primary-950",
          "dark:text-primary-400"
        ]
      },
      size: {
        sm: "h-8 px-3 text-sm rounded-md",
        md: "h-10 px-4 text-base rounded-lg",
        lg: "h-12 px-6 text-lg rounded-xl",
        icon: "h-10 w-10 rounded-lg"
      },
      fullWidth: {
        true: "w-full",
        false: ""
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      fullWidth: false
    }
  }
);
var Button = React__namespace.forwardRef(
  ({
    className,
    variant,
    size,
    fullWidth,
    leftIcon,
    rightIcon,
    isLoading,
    loadingText,
    disabled,
    children,
    ...props
  }, ref) => {
    return /* @__PURE__ */ jsxRuntime.jsx(
      "button",
      {
        className: chunkOR5DRJCW_cjs.cn(buttonVariants({ variant, size, fullWidth }), className),
        ref,
        disabled: disabled || isLoading,
        "aria-busy": isLoading,
        ...props,
        children: isLoading ? /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
          /* @__PURE__ */ jsxRuntime.jsx(LoadingSpinner, {}),
          loadingText || children
        ] }) : /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
          leftIcon && /* @__PURE__ */ jsxRuntime.jsx("span", { className: "shrink-0", children: leftIcon }),
          children,
          rightIcon && /* @__PURE__ */ jsxRuntime.jsx("span", { className: "shrink-0", children: rightIcon })
        ] })
      }
    );
  }
);
Button.displayName = "Button";
function LoadingSpinner() {
  return /* @__PURE__ */ jsxRuntime.jsxs(
    "svg",
    {
      className: "h-4 w-4 animate-spin",
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      "aria-hidden": "true",
      children: [
        /* @__PURE__ */ jsxRuntime.jsx(
          "circle",
          {
            className: "opacity-25",
            cx: "12",
            cy: "12",
            r: "10",
            stroke: "currentColor",
            strokeWidth: "4"
          }
        ),
        /* @__PURE__ */ jsxRuntime.jsx(
          "path",
          {
            className: "opacity-75",
            fill: "currentColor",
            d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          }
        )
      ]
    }
  );
}

exports.Button = Button;
exports.buttonVariants = buttonVariants;
//# sourceMappingURL=chunk-GCCKT63N.cjs.map
//# sourceMappingURL=chunk-GCCKT63N.cjs.map