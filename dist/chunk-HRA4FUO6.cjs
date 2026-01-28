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
    "relative overflow-hidden"
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
      variant: {
        default: "shadow-card",
        elevated: "shadow-lg border-0",
        outlined: "shadow-none border-2",
        ghost: "shadow-none border-0 bg-transparent",
        filled: "shadow-none border-0 bg-muted"
      },
      interactive: {
        true: [
          "transition-all duration-200",
          "hover:shadow-md hover:border-primary-200",
          "dark:hover:border-primary-800",
          "cursor-pointer",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
        ],
        false: ""
      },
      selected: {
        true: "ring-2 ring-primary-500 border-primary-500",
        false: ""
      },
      orientation: {
        vertical: "flex flex-col",
        horizontal: "flex flex-row"
      }
    },
    defaultVariants: {
      padding: "md",
      variant: "default",
      interactive: false,
      selected: false,
      orientation: "vertical"
    }
  }
);
var cardAccentVariants = classVarianceAuthority.cva("absolute left-0 top-0 bottom-0 w-1", {
  variants: {
    color: {
      primary: "bg-primary-500",
      success: "bg-success",
      warning: "bg-warning",
      destructive: "bg-destructive",
      info: "bg-primary-200"
    }
  }
});
var Card = React__namespace.forwardRef(
  ({
    className,
    padding,
    variant,
    interactive,
    selected,
    orientation,
    accent,
    loading,
    as: Component = "div",
    children,
    ...props
  }, ref) => {
    return /* @__PURE__ */ jsxRuntime.jsxs(
      Component,
      {
        ref,
        className: chunkOR5DRJCW_cjs.cn(
          cardVariants({
            padding,
            variant,
            interactive,
            selected,
            orientation
          }),
          accent && "pl-4",
          className
        ),
        "data-loading": loading || void 0,
        "aria-busy": loading || void 0,
        ...props,
        children: [
          accent && /* @__PURE__ */ jsxRuntime.jsx(
            "div",
            {
              className: chunkOR5DRJCW_cjs.cn(cardAccentVariants({ color: accent })),
              "aria-hidden": "true"
            }
          ),
          loading && /* @__PURE__ */ jsxRuntime.jsx("div", { className: "bg-card/80 absolute inset-0 z-10 flex items-center justify-center backdrop-blur-sm", children: /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex gap-1", children: [
            /* @__PURE__ */ jsxRuntime.jsx("div", { className: "bg-primary-500 h-2 w-2 animate-bounce rounded-full [animation-delay:-0.3s]" }),
            /* @__PURE__ */ jsxRuntime.jsx("div", { className: "bg-primary-500 h-2 w-2 animate-bounce rounded-full [animation-delay:-0.15s]" }),
            /* @__PURE__ */ jsxRuntime.jsx("div", { className: "bg-primary-500 h-2 w-2 animate-bounce rounded-full" })
          ] }) }),
          children
        ]
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
var CardMedia = React__namespace.forwardRef(
  ({ className, aspectRatio = "video", overlay, src, alt, ...props }, ref) => {
    const aspectClasses = {
      video: "aspect-video",
      square: "aspect-square",
      wide: "aspect-[21/9]",
      auto: ""
    };
    return /* @__PURE__ */ jsxRuntime.jsxs(
      "div",
      {
        ref,
        className: chunkOR5DRJCW_cjs.cn(
          "relative -mx-4 -mt-4 overflow-hidden first:rounded-t-xl",
          className
        ),
        children: [
          /* @__PURE__ */ jsxRuntime.jsx(
            "img",
            {
              src,
              alt,
              className: chunkOR5DRJCW_cjs.cn("w-full object-cover", aspectClasses[aspectRatio]),
              ...props
            }
          ),
          overlay && /* @__PURE__ */ jsxRuntime.jsx("div", { className: "absolute inset-0 flex items-end bg-gradient-to-t from-neutral-900/60 to-transparent p-4", children: overlay })
        ]
      }
    );
  }
);
CardMedia.displayName = "CardMedia";
var CardBadge = React__namespace.forwardRef(
  ({
    className,
    variant = "default",
    position = "top-right",
    children,
    ...props
  }, ref) => {
    const variantClasses = {
      default: "bg-muted text-muted-foreground",
      primary: "bg-primary-500 text-white",
      success: "bg-success text-success-foreground",
      warning: "bg-warning text-warning-foreground",
      destructive: "bg-destructive text-destructive-foreground"
    };
    const positionClasses = {
      "top-left": "top-2 left-2",
      "top-right": "top-2 right-2",
      "bottom-left": "bottom-2 left-2",
      "bottom-right": "bottom-2 right-2"
    };
    return /* @__PURE__ */ jsxRuntime.jsx(
      "span",
      {
        ref,
        className: chunkOR5DRJCW_cjs.cn(
          "absolute z-10 rounded-md px-2 py-1 text-xs font-medium",
          variantClasses[variant],
          positionClasses[position],
          className
        ),
        ...props,
        children
      }
    );
  }
);
CardBadge.displayName = "CardBadge";
var CardActions = React__namespace.forwardRef(
  ({ className, align = "right", children, ...props }, ref) => {
    const alignClasses = {
      left: "justify-start",
      center: "justify-center",
      right: "justify-end",
      between: "justify-between",
      around: "justify-around"
    };
    return /* @__PURE__ */ jsxRuntime.jsx(
      "div",
      {
        ref,
        className: chunkOR5DRJCW_cjs.cn(
          "flex items-center gap-2 pt-4",
          alignClasses[align],
          className
        ),
        ...props,
        children
      }
    );
  }
);
CardActions.displayName = "CardActions";
var CardDivider = React__namespace.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntime.jsx(
  "hr",
  {
    ref,
    className: chunkOR5DRJCW_cjs.cn("border-border -mx-4 my-4", className),
    ...props
  }
));
CardDivider.displayName = "CardDivider";
var CardCollapsible = React__namespace.forwardRef(
  ({
    className,
    expanded: controlledExpanded,
    onExpandChange,
    trigger = "Show more",
    children,
    ...props
  }, ref) => {
    const [internalExpanded, setInternalExpanded] = React__namespace.useState(false);
    const isControlled = controlledExpanded !== void 0;
    const expanded = isControlled ? controlledExpanded : internalExpanded;
    const handleToggle = () => {
      if (isControlled) {
        onExpandChange?.(!expanded);
      } else {
        setInternalExpanded(!expanded);
      }
    };
    return /* @__PURE__ */ jsxRuntime.jsxs("div", { ref, className: chunkOR5DRJCW_cjs.cn("", className), ...props, children: [
      /* @__PURE__ */ jsxRuntime.jsx(
        "button",
        {
          type: "button",
          onClick: handleToggle,
          className: "text-primary-600 focus-visible:ring-primary-500 flex items-center gap-1 rounded text-sm hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          "aria-expanded": expanded,
          children: typeof trigger === "string" ? /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
            expanded ? "Show less" : trigger,
            /* @__PURE__ */ jsxRuntime.jsx(
              "svg",
              {
                className: chunkOR5DRJCW_cjs.cn(
                  "h-4 w-4 transition-transform",
                  expanded && "rotate-180"
                ),
                fill: "none",
                stroke: "currentColor",
                viewBox: "0 0 24 24",
                children: /* @__PURE__ */ jsxRuntime.jsx(
                  "path",
                  {
                    strokeLinecap: "round",
                    strokeLinejoin: "round",
                    strokeWidth: 2,
                    d: "M19 9l-7 7-7-7"
                  }
                )
              }
            )
          ] }) : trigger
        }
      ),
      /* @__PURE__ */ jsxRuntime.jsx(
        "div",
        {
          className: chunkOR5DRJCW_cjs.cn(
            "grid transition-all duration-300 ease-in-out",
            expanded ? "mt-3 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          ),
          children: /* @__PURE__ */ jsxRuntime.jsx("div", { className: "overflow-hidden", children })
        }
      )
    ] });
  }
);
CardCollapsible.displayName = "CardCollapsible";
var CardStat = React__namespace.forwardRef(
  ({ className, value, label, trend, icon, ...props }, ref) => {
    return /* @__PURE__ */ jsxRuntime.jsxs(
      "div",
      {
        ref,
        className: chunkOR5DRJCW_cjs.cn("flex items-start gap-3", className),
        ...props,
        children: [
          icon && /* @__PURE__ */ jsxRuntime.jsx("div", { className: "bg-primary-500/10 text-primary-600 rounded-lg p-2", children: icon }),
          /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "min-w-0 flex-1", children: [
            /* @__PURE__ */ jsxRuntime.jsx("div", { className: "text-2xl font-bold tracking-tight", children: value }),
            /* @__PURE__ */ jsxRuntime.jsx("div", { className: "text-muted-foreground text-sm", children: label }),
            trend && /* @__PURE__ */ jsxRuntime.jsxs(
              "div",
              {
                className: chunkOR5DRJCW_cjs.cn(
                  "mt-1 flex items-center gap-1 text-sm",
                  trend.value >= 0 ? "text-success" : "text-destructive"
                ),
                children: [
                  /* @__PURE__ */ jsxRuntime.jsx(
                    "svg",
                    {
                      className: chunkOR5DRJCW_cjs.cn("h-4 w-4", trend.value < 0 && "rotate-180"),
                      fill: "none",
                      stroke: "currentColor",
                      viewBox: "0 0 24 24",
                      children: /* @__PURE__ */ jsxRuntime.jsx(
                        "path",
                        {
                          strokeLinecap: "round",
                          strokeLinejoin: "round",
                          strokeWidth: 2,
                          d: "M5 10l7-7m0 0l7 7m-7-7v18"
                        }
                      )
                    }
                  ),
                  /* @__PURE__ */ jsxRuntime.jsxs("span", { children: [
                    Math.abs(trend.value),
                    "%"
                  ] }),
                  trend.label && /* @__PURE__ */ jsxRuntime.jsx("span", { className: "text-muted-foreground", children: trend.label })
                ]
              }
            )
          ] })
        ]
      }
    );
  }
);
CardStat.displayName = "CardStat";

exports.Card = Card;
exports.CardActions = CardActions;
exports.CardBadge = CardBadge;
exports.CardCollapsible = CardCollapsible;
exports.CardContent = CardContent;
exports.CardDescription = CardDescription;
exports.CardDivider = CardDivider;
exports.CardFooter = CardFooter;
exports.CardHeader = CardHeader;
exports.CardMedia = CardMedia;
exports.CardStat = CardStat;
exports.CardTitle = CardTitle;
exports.cardAccentVariants = cardAccentVariants;
exports.cardVariants = cardVariants;
//# sourceMappingURL=chunk-HRA4FUO6.cjs.map
//# sourceMappingURL=chunk-HRA4FUO6.cjs.map