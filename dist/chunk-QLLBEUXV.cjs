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

var alertVariants = classVarianceAuthority.cva(
  [
    "relative w-full rounded-lg border p-4",
    "[&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-current",
    "[&>svg+div]:translate-y-[-3px]",
    "[&:has(svg)]:pl-11"
  ],
  {
    variants: {
      variant: {
        default: "bg-background text-foreground border-border",
        info: "bg-primary-50 text-primary-900 border-primary-200 dark:bg-primary-950 dark:text-primary-100 dark:border-primary-800",
        success: "bg-green-50 text-green-900 border-green-200 dark:bg-green-950 dark:text-green-100 dark:border-green-800",
        warning: "bg-yellow-50 text-yellow-900 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-100 dark:border-yellow-800",
        danger: "bg-red-50 text-red-900 border-red-200 dark:bg-red-950 dark:text-red-100 dark:border-red-800"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);
var Alert = React__namespace.forwardRef(
  ({ className, variant, icon, children, ...props }, ref) => {
    return /* @__PURE__ */ jsxRuntime.jsxs(
      "div",
      {
        ref,
        role: "alert",
        className: chunkOR5DRJCW_cjs.cn(alertVariants({ variant }), className),
        ...props,
        children: [
          icon,
          /* @__PURE__ */ jsxRuntime.jsx("div", { children })
        ]
      }
    );
  }
);
Alert.displayName = "Alert";
var AlertTitle = React__namespace.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxRuntime.jsx(
  "h5",
  {
    ref,
    className: chunkOR5DRJCW_cjs.cn("mb-1 leading-none font-semibold tracking-tight", className),
    ...props,
    children
  }
));
AlertTitle.displayName = "AlertTitle";
var AlertDescription = React__namespace.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntime.jsx(
  "p",
  {
    ref,
    className: chunkOR5DRJCW_cjs.cn("text-sm [&_p]:leading-relaxed", className),
    ...props
  }
));
AlertDescription.displayName = "AlertDescription";

exports.Alert = Alert;
exports.AlertDescription = AlertDescription;
exports.AlertTitle = AlertTitle;
exports.alertVariants = alertVariants;
//# sourceMappingURL=chunk-QLLBEUXV.cjs.map
//# sourceMappingURL=chunk-QLLBEUXV.cjs.map