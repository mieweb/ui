import { cn } from './chunk-F3SOEIN2.js';
import * as React from 'react';
import { cva } from 'class-variance-authority';
import { jsx, jsxs } from 'react/jsx-runtime';

var avatarVariants = cva(
  [
    "relative inline-flex items-center justify-center",
    "rounded-full overflow-hidden",
    "bg-primary-800 text-white font-semibold"
  ],
  {
    variants: {
      size: {
        xs: "h-6 w-6 text-xs",
        sm: "h-8 w-8 text-sm",
        md: "h-10 w-10 text-sm",
        lg: "h-12 w-12 text-base",
        xl: "h-16 w-16 text-lg"
      },
      ring: {
        true: "ring-2 ring-primary-400/30",
        false: ""
      }
    },
    defaultVariants: {
      size: "md",
      ring: false
    }
  }
);
function getInitials(name) {
  return name.split(" ").map((part) => part[0]).join("").toUpperCase().slice(0, 2);
}
var Avatar = React.forwardRef(
  ({ className, src, alt, name, fallback, size, ring, ...props }, ref) => {
    const [imageError, setImageError] = React.useState(false);
    React.useEffect(() => {
      setImageError(false);
    }, [src]);
    const showImage = src && !imageError;
    const initials = name ? getInitials(name) : null;
    return /* @__PURE__ */ jsx(
      "div",
      {
        ref,
        className: cn(avatarVariants({ size, ring }), className),
        ...props,
        children: showImage ? /* @__PURE__ */ jsx(
          "img",
          {
            src,
            alt: alt || name || "Avatar",
            className: "h-full w-full object-cover",
            onError: () => setImageError(true)
          }
        ) : React.isValidElement(fallback) ? fallback : initials ? initials : /* @__PURE__ */ jsx(
          "svg",
          {
            className: "h-[60%] w-[60%] text-white/80",
            fill: "currentColor",
            viewBox: "0 0 24 24",
            children: /* @__PURE__ */ jsx("path", { d: "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" })
          }
        )
      }
    );
  }
);
Avatar.displayName = "Avatar";
var AvatarGroup = React.forwardRef(
  ({ className, max, size = "md", children, ...props }, ref) => {
    const childrenArray = React.Children.toArray(children);
    const visibleChildren = max ? childrenArray.slice(0, max) : childrenArray;
    const remainingCount = max ? Math.max(0, childrenArray.length - max) : 0;
    return /* @__PURE__ */ jsxs("div", { ref, className: cn("flex -space-x-2", className), ...props, children: [
      visibleChildren.map((child, index) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(
            child,
            {
              key: index,
              size,
              className: cn(
                "ring-2 ring-white dark:ring-neutral-900",
                child.props.className
              )
            }
          );
        }
        return child;
      }),
      remainingCount > 0 && /* @__PURE__ */ jsxs(
        "div",
        {
          className: cn(
            avatarVariants({ size }),
            "bg-neutral-200 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300",
            "ring-2 ring-white dark:ring-neutral-900"
          ),
          children: [
            "+",
            remainingCount
          ]
        }
      )
    ] });
  }
);
AvatarGroup.displayName = "AvatarGroup";

export { Avatar, AvatarGroup, avatarVariants, getInitials };
//# sourceMappingURL=chunk-NIHESA7O.js.map
//# sourceMappingURL=chunk-NIHESA7O.js.map