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

var textVariants = classVarianceAuthority.cva("", {
  variants: {
    variant: {
      default: "text-foreground",
      muted: "text-muted-foreground",
      primary: "text-primary-600 dark:text-primary-400",
      destructive: "text-destructive",
      success: "text-success",
      warning: "text-warning"
    },
    size: {
      xs: "text-xs",
      sm: "text-sm",
      base: "text-base",
      lg: "text-lg",
      xl: "text-xl",
      "2xl": "text-2xl",
      "3xl": "text-3xl"
    },
    weight: {
      normal: "font-normal",
      medium: "font-medium",
      semibold: "font-semibold",
      bold: "font-bold"
    },
    align: {
      left: "text-left",
      center: "text-center",
      right: "text-right"
    }
  },
  defaultVariants: {
    variant: "default",
    size: "base",
    weight: "normal",
    align: "left"
  }
});
var Text = React__namespace.forwardRef(
  ({
    className,
    variant,
    size,
    weight,
    align,
    as: Component = "p",
    truncate,
    ...props
  }, ref) => {
    return /* @__PURE__ */ jsxRuntime.jsx(
      Component,
      {
        ref,
        className: chunkOR5DRJCW_cjs.cn(
          textVariants({ variant, size, weight, align }),
          truncate && "truncate",
          className
        ),
        ...props
      }
    );
  }
);
Text.displayName = "Text";
var SmallMuted = React__namespace.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntime.jsx(Text, { ref, variant: "muted", size: "sm", className, ...props }));
SmallMuted.displayName = "SmallMuted";

exports.SmallMuted = SmallMuted;
exports.Text = Text;
exports.textVariants = textVariants;
//# sourceMappingURL=chunk-QDGZBDBI.cjs.map
//# sourceMappingURL=chunk-QDGZBDBI.cjs.map