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

var badgeVariants = classVarianceAuthority.cva(
  [
    "inline-flex items-center justify-center",
    "font-medium",
    "rounded-full",
    "transition-colors duration-150"
  ],
  {
    variants: {
      variant: {
        default: "bg-primary-100 text-primary-900 dark:bg-primary-900 dark:text-primary-100",
        secondary: "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100",
        success: "bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-100",
        warning: "bg-yellow-100 text-yellow-900 dark:bg-yellow-900 dark:text-yellow-100",
        danger: "bg-red-100 text-red-900 dark:bg-red-900 dark:text-red-100",
        outline: "border border-current bg-transparent"
      },
      size: {
        sm: "px-2 py-0.5 text-xs",
        md: "px-2.5 py-0.5 text-sm",
        lg: "px-3 py-1 text-base"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "md"
    }
  }
);
var Badge = React__namespace.forwardRef(
  ({ className, variant, size, icon, children, ...props }, ref) => {
    return /* @__PURE__ */ jsxRuntime.jsxs(
      "span",
      {
        ref,
        className: chunkOR5DRJCW_cjs.cn(badgeVariants({ variant, size }), className),
        ...props,
        children: [
          icon && /* @__PURE__ */ jsxRuntime.jsx("span", { className: "mr-1 shrink-0", children: icon }),
          children
        ]
      }
    );
  }
);
Badge.displayName = "Badge";

exports.Badge = Badge;
exports.badgeVariants = badgeVariants;
//# sourceMappingURL=chunk-EKIQE524.cjs.map
//# sourceMappingURL=chunk-EKIQE524.cjs.map