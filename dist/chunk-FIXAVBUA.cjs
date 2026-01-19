'use strict';

var chunkSWMRCGL4_cjs = require('./chunk-SWMRCGL4.cjs');
var chunkFHY3K6PL_cjs = require('./chunk-FHY3K6PL.cjs');
var chunkOR5DRJCW_cjs = require('./chunk-OR5DRJCW.cjs');
var React = require('react');
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

var placementStyles = {
  "bottom-start": "top-full left-0 mt-2",
  "bottom-end": "top-full right-0 mt-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2"
};
function Dropdown({
  trigger,
  children,
  open: controlledOpen,
  onOpenChange,
  placement = "bottom-start",
  className,
  width = "auto",
  disabled = false
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = React__namespace.useState(false);
  const containerRef = React__namespace.useRef(null);
  const menuId = React__namespace.useId();
  const isControlled = controlledOpen !== void 0;
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen;
  const setOpen = React__namespace.useCallback(
    (value) => {
      if (!isControlled) {
        setUncontrolledOpen(value);
      }
      onOpenChange?.(value);
    },
    [isControlled, onOpenChange]
  );
  const handleToggle = React__namespace.useCallback(() => {
    if (!disabled) {
      setOpen(!isOpen);
    }
  }, [disabled, isOpen, setOpen]);
  const handleClose = React__namespace.useCallback(() => {
    setOpen(false);
  }, [setOpen]);
  chunkSWMRCGL4_cjs.useClickOutside(containerRef, handleClose);
  chunkFHY3K6PL_cjs.useEscapeKey(handleClose, isOpen);
  const triggerElement = React__namespace.cloneElement(trigger, {
    onClick: handleToggle,
    "aria-haspopup": "menu",
    "aria-expanded": isOpen,
    "aria-controls": isOpen ? menuId : void 0,
    disabled: disabled || trigger.props.disabled
  });
  const widthStyle = typeof width === "number" ? { width: `${width}px` } : width === "trigger" ? { minWidth: "100%" } : {};
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { ref: containerRef, className: "relative inline-flex", children: [
    triggerElement,
    isOpen && /* @__PURE__ */ jsxRuntime.jsx(
      "div",
      {
        id: menuId,
        role: "menu",
        style: widthStyle,
        className: chunkOR5DRJCW_cjs.cn(
          "absolute z-50 min-w-[12rem]",
          "rounded-xl border border-neutral-200 bg-white shadow-lg",
          "dark:border-neutral-700 dark:bg-neutral-800",
          "animate-in fade-in zoom-in-95 duration-100",
          placementStyles[placement],
          className
        ),
        children
      }
    )
  ] });
}
Dropdown.displayName = "Dropdown";
var DropdownHeader = React__namespace.forwardRef(
  ({ className, avatar, title, subtitle, children, ...props }, ref) => {
    return /* @__PURE__ */ jsxRuntime.jsxs(
      "div",
      {
        ref,
        className: chunkOR5DRJCW_cjs.cn(
          "border-b border-neutral-200 p-4 dark:border-neutral-700",
          className
        ),
        ...props,
        children: [
          /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex items-center gap-3", children: [
            avatar,
            /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "min-w-0 flex-1", children: [
              /* @__PURE__ */ jsxRuntime.jsx("p", { className: "truncate text-sm font-semibold text-neutral-900 dark:text-white", children: title }),
              subtitle && /* @__PURE__ */ jsxRuntime.jsx("p", { className: "truncate text-xs text-neutral-500 dark:text-neutral-400", children: subtitle })
            ] })
          ] }),
          children
        ]
      }
    );
  }
);
DropdownHeader.displayName = "DropdownHeader";
var DropdownContent = React__namespace.forwardRef(
  ({ className, ...props }, ref) => {
    return /* @__PURE__ */ jsxRuntime.jsx("div", { ref, className: chunkOR5DRJCW_cjs.cn("p-2", className), ...props });
  }
);
DropdownContent.displayName = "DropdownContent";
var DropdownItem = React__namespace.forwardRef(
  ({ className, icon, variant = "default", children, ...props }, ref) => {
    return /* @__PURE__ */ jsxRuntime.jsxs(
      "button",
      {
        ref,
        role: "menuitem",
        className: chunkOR5DRJCW_cjs.cn(
          "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm",
          "transition-colors duration-150",
          "focus:outline-none",
          variant === "default" && [
            "text-neutral-700 dark:text-neutral-300",
            "hover:bg-neutral-100 dark:hover:bg-neutral-700",
            "focus:bg-neutral-100 dark:focus:bg-neutral-700"
          ],
          variant === "danger" && [
            "text-red-600 dark:text-red-400",
            "hover:bg-red-50 dark:hover:bg-red-900/20",
            "focus:bg-red-50 dark:focus:bg-red-900/20"
          ],
          className
        ),
        ...props,
        children: [
          icon && /* @__PURE__ */ jsxRuntime.jsx("span", { className: "h-4 w-4 shrink-0", children: icon }),
          /* @__PURE__ */ jsxRuntime.jsx("span", { className: "font-medium", children })
        ]
      }
    );
  }
);
DropdownItem.displayName = "DropdownItem";
function DropdownSeparator({ className }) {
  return /* @__PURE__ */ jsxRuntime.jsx(
    "hr",
    {
      className: chunkOR5DRJCW_cjs.cn(
        "border-t border-neutral-200 dark:border-neutral-700",
        className
      )
    }
  );
}
DropdownSeparator.displayName = "DropdownSeparator";
function DropdownLabel({
  className,
  children
}) {
  return /* @__PURE__ */ jsxRuntime.jsx(
    "div",
    {
      className: chunkOR5DRJCW_cjs.cn(
        "px-3 py-1.5 text-xs font-semibold tracking-wider uppercase",
        "text-neutral-500 dark:text-neutral-400",
        className
      ),
      children
    }
  );
}
DropdownLabel.displayName = "DropdownLabel";

exports.Dropdown = Dropdown;
exports.DropdownContent = DropdownContent;
exports.DropdownHeader = DropdownHeader;
exports.DropdownItem = DropdownItem;
exports.DropdownLabel = DropdownLabel;
exports.DropdownSeparator = DropdownSeparator;
//# sourceMappingURL=chunk-FIXAVBUA.cjs.map
//# sourceMappingURL=chunk-FIXAVBUA.cjs.map