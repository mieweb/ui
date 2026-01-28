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

var avatarVariants = classVarianceAuthority.cva(
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
var Avatar = React__namespace.forwardRef(
  ({ className, src, alt, name, fallback, size, ring, ...props }, ref) => {
    const [imageError, setImageError] = React__namespace.useState(false);
    React__namespace.useEffect(() => {
      setImageError(false);
    }, [src]);
    const showImage = src && !imageError;
    const initials = name ? getInitials(name) : null;
    return /* @__PURE__ */ jsxRuntime.jsx(
      "div",
      {
        ref,
        className: chunkOR5DRJCW_cjs.cn(avatarVariants({ size, ring }), className),
        ...props,
        children: showImage ? /* @__PURE__ */ jsxRuntime.jsx(
          "img",
          {
            src,
            alt: alt || name || "Avatar",
            className: "h-full w-full object-cover",
            onError: () => setImageError(true)
          }
        ) : React__namespace.isValidElement(fallback) ? fallback : initials ? initials : /* @__PURE__ */ jsxRuntime.jsx(
          "svg",
          {
            className: "h-[60%] w-[60%] text-white/80",
            fill: "currentColor",
            viewBox: "0 0 24 24",
            children: /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" })
          }
        )
      }
    );
  }
);
Avatar.displayName = "Avatar";
var AvatarGroup = React__namespace.forwardRef(
  ({ className, max, size = "md", children, ...props }, ref) => {
    const childrenArray = React__namespace.Children.toArray(children);
    const visibleChildren = max ? childrenArray.slice(0, max) : childrenArray;
    const remainingCount = max ? Math.max(0, childrenArray.length - max) : 0;
    return /* @__PURE__ */ jsxRuntime.jsxs("div", { ref, className: chunkOR5DRJCW_cjs.cn("flex -space-x-2", className), ...props, children: [
      visibleChildren.map((child, index) => {
        if (React__namespace.isValidElement(child)) {
          return React__namespace.cloneElement(
            child,
            {
              key: index,
              size,
              className: chunkOR5DRJCW_cjs.cn(
                "ring-2 ring-white dark:ring-neutral-900",
                child.props.className
              )
            }
          );
        }
        return child;
      }),
      remainingCount > 0 && /* @__PURE__ */ jsxRuntime.jsxs(
        "div",
        {
          className: chunkOR5DRJCW_cjs.cn(
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

exports.Avatar = Avatar;
exports.AvatarGroup = AvatarGroup;
exports.avatarVariants = avatarVariants;
exports.getInitials = getInitials;
//# sourceMappingURL=chunk-2J2V4TMJ.cjs.map
//# sourceMappingURL=chunk-2J2V4TMJ.cjs.map