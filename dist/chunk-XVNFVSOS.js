import { cn } from './chunk-F3SOEIN2.js';
import * as React from 'react';
import { cva } from 'class-variance-authority';
import { jsx } from 'react/jsx-runtime';

var cardVariants = cva(
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
var Card = React.forwardRef(
  ({ className, padding, interactive, as: Component = "div", ...props }, ref) => {
    return /* @__PURE__ */ jsx(
      Component,
      {
        ref,
        className: cn(cardVariants({ padding, interactive }), className),
        ...props
      }
    );
  }
);
Card.displayName = "Card";
var CardHeader = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  "div",
  {
    ref,
    className: cn("flex flex-col gap-1.5 pb-4", className),
    ...props
  }
));
CardHeader.displayName = "CardHeader";
var CardTitle = React.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsx(
  "h3",
  {
    ref,
    className: cn(
      "text-lg leading-none font-semibold tracking-tight",
      className
    ),
    ...props,
    children
  }
));
CardTitle.displayName = "CardTitle";
var CardDescription = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  "p",
  {
    ref,
    className: cn("text-muted-foreground text-sm", className),
    ...props
  }
));
CardDescription.displayName = "CardDescription";
var CardContent = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx("div", { ref, className: cn("", className), ...props }));
CardContent.displayName = "CardContent";
var CardFooter = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  "div",
  {
    ref,
    className: cn("flex items-center pt-4", className),
    ...props
  }
));
CardFooter.displayName = "CardFooter";

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, cardVariants };
//# sourceMappingURL=chunk-XVNFVSOS.js.map
//# sourceMappingURL=chunk-XVNFVSOS.js.map