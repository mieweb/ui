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

var cardVariants = classVarianceAuthority.cva(
  [
    "rounded-xl bg-card text-card-foreground",
    "border border-border",
    "shadow-card"
  ],
  {
    variants: {
      padding: {
        none: "p-0",
        sm: "p-3",
        md: "p-4",
        lg: "p-6",
        xl: "p-8"
      },
      interactive: {
        true: [
          "transition-all duration-200",
          "hover:shadow-md hover:border-primary-200",
          "dark:hover:border-primary-800",
          "cursor-pointer"
        ],
        false: ""
      }
    },
    defaultVariants: {
      padding: "md",
      interactive: false
    }
  }
);
var Card = React__namespace.forwardRef(
  ({ className, padding, interactive, as: Component = "div", ...props }, ref) => {
    return /* @__PURE__ */ jsxRuntime.jsx(
      Component,
      {
        ref,
        className: chunkOR5DRJCW_cjs.cn(cardVariants({ padding, interactive }), className),
        ...props
      }
    );
  }
);
Card.displayName = "Card";
var CardHeader = React__namespace.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntime.jsx(
  "div",
  {
    ref,
    className: chunkOR5DRJCW_cjs.cn("flex flex-col gap-1.5 pb-4", className),
    ...props
  }
));
CardHeader.displayName = "CardHeader";
var CardTitle = React__namespace.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxRuntime.jsx(
  "h3",
  {
    ref,
    className: chunkOR5DRJCW_cjs.cn(
      "text-lg leading-none font-semibold tracking-tight",
      className
    ),
    ...props,
    children
  }
));
CardTitle.displayName = "CardTitle";
var CardDescription = React__namespace.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntime.jsx(
  "p",
  {
    ref,
    className: chunkOR5DRJCW_cjs.cn("text-muted-foreground text-sm", className),
    ...props
  }
));
CardDescription.displayName = "CardDescription";
var CardContent = React__namespace.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntime.jsx("div", { ref, className: chunkOR5DRJCW_cjs.cn("", className), ...props }));
CardContent.displayName = "CardContent";
var CardFooter = React__namespace.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntime.jsx(
  "div",
  {
    ref,
    className: chunkOR5DRJCW_cjs.cn("flex items-center pt-4", className),
    ...props
  }
));
CardFooter.displayName = "CardFooter";

exports.Card = Card;
exports.CardContent = CardContent;
exports.CardDescription = CardDescription;
exports.CardFooter = CardFooter;
exports.CardHeader = CardHeader;
exports.CardTitle = CardTitle;
exports.cardVariants = cardVariants;
//# sourceMappingURL=chunk-ZENVEUAE.cjs.map
//# sourceMappingURL=chunk-ZENVEUAE.cjs.map